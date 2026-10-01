import { registerPlugin, Capacitor, PluginListenerHandle } from '@capacitor/core';
import { ParsedSmsTransaction, SmsPermissionStatus, SmsScanResult } from './types';
import { BankSmsParser } from './bankSmsParser';

export interface HomeMindSmsPluginInterface {
  requestSmsPermissions(): Promise<SmsPermissionStatus>;
  getSmsPermissionStatus(): Promise<SmsPermissionStatus>;
  scanFinancialSms(options?: { sinceTimestamp?: number; limit?: number }): Promise<SmsScanResult>;
  startTransactionMonitoring(): Promise<{ success: boolean; monitoring: boolean }>;
  stopTransactionMonitoring(): Promise<{ success: boolean; monitoring: boolean }>;
  parseRawSms(options: { body: string; sender?: string; timestamp?: number }): Promise<{ success: boolean; transaction?: ParsedSmsTransaction; error?: string }>;
  getPendingTransactions(): Promise<{ pending: ParsedSmsTransaction[]; count: number }>;
  clearPendingTransactions(): Promise<{ success: boolean }>;
  addListener(
    eventName: 'onNewSmsTransaction',
    listenerFunc: (data: { transaction: ParsedSmsTransaction }) => void
  ): Promise<PluginListenerHandle>;
}

// Register the native Capacitor plugin
const NativeSmsPlugin = registerPlugin<HomeMindSmsPluginInterface>('HomeMindSms');

export class SmsPluginBridge {
  static isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  static async getPermissionStatus(): Promise<SmsPermissionStatus> {
    if (this.isNative()) {
      try {
        return await NativeSmsPlugin.getSmsPermissionStatus();
      } catch (e) {
        console.warn('Native getSmsPermissionStatus failed:', e);
        return { granted: false, status: 'DENIED' };
      }
    }
    // Web fallback simulator
    const granted = localStorage.getItem('homemind_web_sms_permission') === 'true';
    return {
      granted,
      status: granted ? 'GRANTED' : 'NOT_REQUESTED'
    };
  }

  static async requestPermissions(): Promise<SmsPermissionStatus> {
    if (this.isNative()) {
      try {
        return await NativeSmsPlugin.requestSmsPermissions();
      } catch (e) {
        console.error('Native requestSmsPermissions failed:', e);
        return { granted: false, status: 'DENIED' };
      }
    }
    // Web fallback simulator
    localStorage.setItem('homemind_web_sms_permission', 'true');
    return { granted: true, status: 'GRANTED' };
  }

  static async scanInbox(sinceTimestamp: number = 0, limit: number = 50): Promise<SmsScanResult> {
    if (this.isNative()) {
      return await NativeSmsPlugin.scanFinancialSms({ sinceTimestamp, limit });
    }
    // Web mock scanner returns empty or sample transactions
    return { transactions: [], count: 0 };
  }

  static async parseRawMessage(body: string, sender: string = 'HDFCBK'): Promise<ParsedSmsTransaction | null> {
    if (this.isNative()) {
      try {
        const res = await NativeSmsPlugin.parseRawSms({ body, sender });
        if (res.success && res.transaction) {
          return res.transaction;
        }
      } catch (e) {
        console.warn('Native parseRawSms error, falling back to TS parser:', e);
      }
    }
    // Universal parser fallback
    return await BankSmsParser.parse(sender, body);
  }

  static async startMonitoring(): Promise<boolean> {
    if (this.isNative()) {
      const res = await NativeSmsPlugin.startTransactionMonitoring();
      return res.success;
    }
    return true;
  }

  static async stopMonitoring(): Promise<boolean> {
    if (this.isNative()) {
      const res = await NativeSmsPlugin.stopTransactionMonitoring();
      return res.success;
    }
    return true;
  }

  static async getPendingNativeQueue(): Promise<ParsedSmsTransaction[]> {
    if (this.isNative()) {
      try {
        const res = await NativeSmsPlugin.getPendingTransactions();
        return res.pending || [];
      } catch (e) {
        console.warn('Failed to get native pending queue:', e);
      }
    }
    return [];
  }

  static async clearPendingNativeQueue(): Promise<void> {
    if (this.isNative()) {
      try {
        await NativeSmsPlugin.clearPendingTransactions();
      } catch (e) {
        console.warn('Failed to clear native pending queue:', e);
      }
    }
  }

  static async addTransactionListener(
    callback: (tx: ParsedSmsTransaction) => void
  ): Promise<PluginListenerHandle | null> {
    if (this.isNative()) {
      try {
        return await NativeSmsPlugin.addListener('onNewSmsTransaction', (data) => {
          if (data && data.transaction) {
            callback(data.transaction);
          }
        });
      } catch (e) {
        console.warn('Could not register native onNewSmsTransaction listener:', e);
      }
    }
    return null;
  }
}
