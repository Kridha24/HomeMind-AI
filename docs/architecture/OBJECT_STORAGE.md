# Object Storage Architecture & Signed Upload Flow

## 1. Overview

HomeMind requires object storage for user receipts, profile avatars, appliance manuals, documents, and exported PDF reports. Large binary assets must **NEVER be stored in PostgreSQL** (which causes database bloat, inefficient caching, and slow backups).

We introduce a cloud-neutral `ObjectStorageService` supporting AWS S3, Google Cloud Storage (GCS), Cloudflare R2, MinIO, or local disk storage.

---

## 2. Signed Upload Flow (Direct-to-Storage)

To minimize backend server bandwidth, clients upload files directly to object storage using short-lived signed URLs:

```
Client (Web / Android)
        │
        ▼ 1. POST /api/v1/storage/upload-url (fileName, contentType, fileSizeBytes, category)
API Authorization & Validation
        │
        ▼ 2. Generate signed PUT URL with cryptographic signature (15m expiry)
Return Signed Upload Descriptor
        │
        ▼ 3. PUT file binary directly to signed URL
Object Storage (S3 / R2 / GCS / Local Storage)
        │
        ▼ 4. POST /api/v1/expenses or /appliances (saves objectKey metadata in PostgreSQL)
PostgreSQL Database
```

Permanent public write access is strictly forbidden.

---

## 3. File Security & Validation Rules (Phase 3W)

Before issuing a signed upload URL, the API validates:
1. **Allowed MIME Types:** Only verified formats are accepted:
   - `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf`, `text/csv`
2. **Allowed Extensions:**
   - `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.pdf`, `.csv`
3. **File Size Limit:**
   - Strict maximum of 10MB (`10 * 1024 * 1024` bytes).
4. **Key Generation:**
   - Client filenames are untrusted. Keys are randomly generated UUIDs scoped by tenant:
     `household/{householdId}/{category}/{randomUUID()}.{ext}`
5. **Malware Inspection Hook:**
   - Asynchronous hook (`scanObject`) ready for integration with ClamAV, AWS GuardDuty, or GCP Web Risk.
