import apiClient from '../apiClient';
import { ParsedSmsTransaction, PendingSmsTransaction } from './types';
import { SmsPluginBridge } from './smsPluginBridge';
import { TransactionCategorizer } from './transactionCategorizer';

const STORAGE_KEYS = {
  TRACKING_ENABLED: 'homemind_sms_tracking_enabled',
  AUTO_IMPORT: 'homemind_sms_auto_import',
  LAST_SCAN_TIMESTAMP: 'homemind_last_sms_scan_timestamp',
  PENDING_QUEUE: 'homemind_pending_sms_queue',
};

export class SmsSyncManager {
  private static isSyncing = false;
  private static listenerHandle: any = null;

  static isTrackingEnabled(): boolean {
    return localStorage.getItem(STORAGE_KEYS.TRACKING_ENABLED) === 'true';
  }

  static setTrackingEnabled(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEYS.TRACKING_ENABLED, enabled ? 'true' : 'false');
    if (enabled) {
      SmsPluginBridge.startMonitoring().catch(() => {});
      this.initRealtimeListener();
    } else {
      SmsPluginBridge.stopMonitoring().catch(() => {});
    }
  }

  static isAutoImportEnabled(): boolean {
    const val = localStorage.getItem(STORAGE_KEYS.AUTO_IMPORT);
    return val === null ? true : val === 'true';
  }

  static setAutoImportEnabled(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEYS.AUTO_IMPORT, enabled ? 'true' : 'false');
  }

  static getLastScanTimestamp(): number {
    const val = localStorage.getItem(STORAGE_KEYS.LAST_SCAN_TIMESTAMP);
    return val ? parseInt(val, 10) : 0;
  }

  static setLastScanTimestamp(timestamp: number): void {
    localStorage.setItem(STORAGE_KEYS.LAST_SCAN_TIMESTAMP, timestamp.toString());
  }

  static getPendingQueue(): PendingSmsTransaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PENDING_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static savePendingQueue(queue: PendingSmsTransaction[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PENDING_QUEUE, JSON.stringify(queue));
    } catch (e) {
      console.error('Failed to save pending SMS queue:', e);
    }
  }

  /**
   * Initializes real-time listener for incoming bank SMS
   */
  static async initRealtimeListener(onTransactionImported?: (tx: any) => void): Promise<void> {
    if (this.listenerHandle) return;

    this.listenerHandle = await SmsPluginBridge.addTransactionListener(async (tx) => {
      if (!this.isTrackingEnabled()) return;
      try {
        const result = await this.importSingleTransaction(tx);
        if (onTransactionImported) {
          onTransactionImported(result);
        }
      } catch (e) {
        console.warn('Real-time SMS import failed, queued for retry:', e);
        this.enqueuePending(tx);
      }
    });
  }

  /**
   * Scans Android SMS inbox for financial messages and imports them to HomeMind
   */
  static async scanAndSync(): Promise<{
    detected: number;
    imported: number;
    duplicates: number;
    reviewRequired: number;
    errors: number;
  }> {
    if (this.isSyncing) {
      return { detected: 0, imported: 0, duplicates: 0, reviewRequired: 0, errors: 0 };
    }

    this.isSyncing = true;
    let detected = 0;
    let imported = 0;
    let duplicates = 0;
    let reviewRequired = 0;
    let errors = 0;

    try {
      // 1. Drain any pending messages from native SharedPreferences queue
      await this.drainNativeQueue();

      // 2. Read recent inbox messages newer than lastScanTimestamp
      const lastScan = this.getLastScanTimestamp();
      const scanResult = await SmsPluginBridge.scanInbox(lastScan, 50);

      detected = scanResult.transactions.length;

      let maxTimestamp = lastScan;

      for (const tx of scanResult.transactions) {
        const txTime = new Date(tx.occurredAt).getTime();
        if (txTime > maxTimestamp) {
          maxTimestamp = txTime;
        }

        try {
          const res = await this.importSingleTransaction(tx);
          if (res.duplicate) {
            duplicates++;
          } else {
            if (tx.parserConfidence < 0.85 || !this.isAutoImportEnabled()) {
              reviewRequired++;
            } else {
              imported++;
            }
          }
        } catch (e) {
          errors++;
          this.enqueuePending(tx);
        }
      }

      // Update scan watermark
      if (maxTimestamp > lastScan) {
        this.setLastScanTimestamp(maxTimestamp);
      } else if (scanResult.transactions.length === 0 && lastScan === 0) {
        this.setLastScanTimestamp(Date.now());
      }

      // 3. Retry any older pending offline transactions
      await this.processOfflineQueue();
    } finally {
      this.isSyncing = false;
    }

    return { detected, imported, duplicates, reviewRequired, errors };
  }

  /**
   * Import a single transaction to backend
   */
  static async importSingleTransaction(tx: ParsedSmsTransaction): Promise<any> {
    const autoImport = this.isAutoImportEnabled();
    const finalCategory = tx.category || TransactionCategorizer.categorize(
      tx.merchant,
      tx.paymentMethod,
      tx.type
    );

    const initialStatus = (autoImport && tx.parserConfidence >= 0.85)
      ? 'CONFIRMED'
      : 'NEEDS_REVIEW';

    const payload = {
      ...tx,
      category: finalCategory,
      status: initialStatus
    };

    const res = await apiClient.post('/transactions/import/sms', payload);
    return res.data;
  }

  /**
   * Add transaction to offline pending queue
   */
  private static enqueuePending(tx: ParsedSmsTransaction): void {
    const queue = this.getPendingQueue();
    const exists = queue.some(item => item.sourceHash === tx.sourceHash);
    if (!exists) {
      queue.push({
        localId: `pending_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        transaction: tx,
        sourceHash: tx.sourceHash || `temp_${Date.now()}`,
        createdAt: Date.now(),
        syncStatus: 'PENDING',
        retryCount: 0
      });
      this.savePendingQueue(queue);
    }
  }

  /**
   * Retries syncing pending offline transactions
   */
  static async processOfflineQueue(): Promise<void> {
    const queue = this.getPendingQueue();
    if (queue.length === 0) return;

    const remaining: PendingSmsTransaction[] = [];

    for (const item of queue) {
      try {
        await this.importSingleTransaction(item.transaction);
      } catch (err: any) {
        if (item.retryCount < 5) {
          remaining.push({
            ...item,
            retryCount: item.retryCount + 1,
            errorMessage: err.message
          });
        }
      }
    }

    this.savePendingQueue(remaining);
  }

  private static async drainNativeQueue(): Promise<void> {
    try {
      const nativeItems = await SmsPluginBridge.getPendingNativeQueue();
      if (nativeItems.length > 0) {
        for (const tx of nativeItems) {
          try {
            await this.importSingleTransaction(tx);
          } catch {
            this.enqueuePending(tx);
          }
        }
        await SmsPluginBridge.clearPendingNativeQueue();
      }
    } catch (e) {
      console.warn('Failed to drain native SMS queue:', e);
    }
  }
}
