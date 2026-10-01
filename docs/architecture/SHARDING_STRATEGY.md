# HomeMind AI — Multi-Tenant Database Sharding Strategy

**Document Version:** 2.0.0  
**Status:** Approved  
**Author:** HomeMind Data Architecture Team  
**Last Updated:** October 2026  

---

## 1. Context & Sharding Rationale

In HomeMind AI, household operations are inherently isolated:
- A user querying their expense ledger, bill schedule, grocery inventory, or AI recommendations strictly accesses records belonging to their assigned `household_id`.
- Inter-household queries (e.g., joining Household A's transactions with Household B's bills) **never occur**.

This natural domain boundary makes **Tenant-Based Partitioning on `household_id`** the optimal scaling pattern. It allows horizontal scaling across multiple independent database nodes while retaining strict transactional consistency (ACID) within every individual household.

---

## 2. Multi-Stage Sharding Evolution

```mermaid
graph LR
    subgraph Stage1 ["Stage 1: Monolithic DB<br/>(< 50K Households)"]
        SingleDB["Primary PostgreSQL + Read Replicas"]
    end

    subgraph Stage2 ["Stage 2: Declarative Table Partitioning<br/>(50K - 250K Households)"]
        PartDB["Single PostgreSQL Instance<br/>Partitioned by HASH(household_id)"]
    end

    subgraph Stage3 ["Stage 3: Distributed Multi-Node Cluster<br/>(250K - 5M+ Households)"]
        Router["Application Shard Router / Citus Coordinator"]
        Shard1["Shard 01 (Postgres Node)"]
        Shard2["Shard 02 (Postgres Node)"]
        ShardN["Shard N (Postgres Node)"]
    end

    Stage1 --> Stage2
    Stage2 --> Stage3
    Router --> Shard1
    Router --> Shard2
    Router --> ShardN
```

---

## 3. Shard Key & Entity Co-Location

To guarantee that queries never span multiple physical nodes, all child entities inherit and index the shard key:

$$\text{Shard Key} = \text{household\_id} \quad (\text{UUIDv4})$$

### Co-Located Entities (Colocated on the Same Physical Shard)
- `Household`
- `Transaction`
- `Expense` & `ExpenseCategory`
- `Income`
- `Bill` & `BillCategory`
- `GroceryItem` & `InventoryHistory`
- `Appliance` & `MaintenanceLog`
- `Medicine` & `MedicineDose`
- `Task`
- `Notification`
- `AIMemory` & `AIThread`

### Global (Non-Sharded / Replicated) Entities
- `User`: Stored in a central **Global Catalog Database** to permit cross-household member invites and global authentication lookups via email or phone number.
- `OTPVerification`: Ephemeral, stored in fast Redis key-value store.
- `GlobalCurrencies` & `SystemConfigs`: Cached in Redis and replicated across all shards.

---

## 4. Tenant Routing Strategies

### 4.1. Consistent Hashing via Virtual Buckets (Selected Strategy)

To decouple physical server nodes from tenant assignments and allow rebalancing with minimal data relocation, HomeMind uses **Consistent Hashing with 1,024 Virtual Buckets**:

$$\text{Bucket ID} = \text{CRC32}(\text{household\_id}) \pmod{1024}$$

```mermaid
graph TD
    UserReq["Incoming API Request (JWT: household_id)"]
    Router["Shard Router (packages/database)"]
    Hash["CRC32(household_id) % 1024"]
    LookupMap["In-Memory Shard Bucket Map"]
    
    ShardA["Node A (Buckets 0 - 255)"]
    ShardB["Node B (Buckets 256 - 511)"]
    ShardC["Node C (Buckets 512 - 767)"]
    ShardD["Node D (Buckets 768 - 1023)"]

    UserReq --> Router
    Router --> Hash
    Hash --> LookupMap
    LookupMap -->|Bucket 112| ShardA
    LookupMap -->|Bucket 340| ShardB
    LookupMap -->|Bucket 620| ShardC
    LookupMap -->|Bucket 910| ShardD
```

### 4.2. Shard Router Implementation Pattern

```typescript
// packages/database/src/sharding/router.ts
import { crc32 } from 'zlib';
import { PrismaClient } from '@prisma/client';

export interface ShardNodeConfig {
  id: string;
  connectionUrl: string;
  assignedBuckets: [number, number]; // [min, max] inclusive
}

export class ShardManager {
  private static shardNodes: Map<string, PrismaClient> = new Map();
  private static bucketMap: ShardNodeConfig[] = [];

  public static initialize(configs: ShardNodeConfig[]) {
    this.bucketMap = configs;
    for (const config of configs) {
      this.shardNodes.set(config.id, new PrismaClient({ datasourceUrl: config.connectionUrl }));
    }
  }

  public static getClientForTenant(householdId: string): PrismaClient {
    const hash = crc32(householdId);
    const bucket = hash % 1024;

    const matchedConfig = this.bucketMap.find(
      (node) => bucket >= node.assignedBuckets[0] && bucket <= node.assignedBuckets[1]
    );

    if (!matchedConfig) {
      throw new Error(`No shard assigned for bucket ${bucket}`);
    }

    return this.shardNodes.get(matchedConfig.id)!;
  }
}
```

---

## 5. PostgreSQL Native Declarative Partitioning Blueprint

During Stage 2 (50K - 250K households), native PostgreSQL declarative table partitioning is implemented:

```sql
-- Create Partitioned Transaction Table
CREATE TABLE transactions (
    id UUID NOT NULL,
    household_id UUID NOT NULL,
    user_id UUID,
    amount NUMERIC(12, 2) NOT NULL,
    type VARCHAR(16) NOT NULL,
    source VARCHAR(32) NOT NULL,
    raw_text TEXT,
    reference_id VARCHAR(64),
    merchant VARCHAR(128),
    category VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'AUTO_IMPORTED',
    idempotency_hash VARCHAR(64) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, household_id)
) PARTITION BY HASH (household_id);

-- Create 16 Hash Partitions
CREATE TABLE transactions_part_00 PARTITION OF transactions FOR VALUES WITH (MODULUS 16, REMAINDER 0);
CREATE TABLE transactions_part_01 PARTITION OF transactions FOR VALUES WITH (MODULUS 16, REMAINDER 1);
-- ... (partitions 02 through 14)
CREATE TABLE transactions_part_15 PARTITION OF transactions FOR VALUES WITH (MODULUS 16, REMAINDER 15);

-- Fast Indexing on Partitioned Tables
CREATE INDEX idx_trans_hh_time ON transactions (household_id, timestamp DESC);
CREATE UNIQUE INDEX uq_trans_idem ON transactions (household_id, idempotency_hash);
```

---

## 6. Zero-Downtime Shard Migration & Rebalancing

When a physical shard reaches 80% IOPS or storage thresholds, buckets are migrated to a newly provisioned node using **Dual-Writing and CDC (Change Data Capture)**:

```mermaid
sequenceDiagram
    autonumber
    participant App as API Application
    participant OldShard as Source Shard
    participant CDC as Debezium / Kafka CDC
    participant NewShard as Target Shard
    participant Redis as Shard Map

    Note over OldShard,NewShard: Phase 1: Background Snapshot Copy
    NewShard->>OldShard: Dump initial records for Buckets [256-383]
    
    Note over App,NewShard: Phase 2: Live CDC Replication
    OldShard->>CDC: Stream WAL changes for Buckets [256-383]
    CDC->>NewShard: Replay inserts, updates, deletes (Lag < 100ms)

    Note over App,Redis: Phase 3: Atomic Shard Map Cutover
    Redis->>Redis: Update Bucket Map (Buckets 256-383 -> NewShard)
    App->>App: Refresh local ShardManager routing cache (< 1s)

    Note over App,NewShard: Phase 4: Direct Reads & Writes to New Shard
    App->>NewShard: Route all traffic for Buckets [256-383]
    OldShard->>OldShard: Purge migrated buckets after 48h soak
```
