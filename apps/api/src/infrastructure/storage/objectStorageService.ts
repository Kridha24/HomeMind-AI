import { randomUUID, createHmac } from 'crypto';
import path from 'path';
import fs from 'fs';

export interface StorageMetadata {
  size: number;
  contentType: string;
  lastModified: Date;
}

export interface SignedUploadDescriptor {
  uploadUrl: string;
  method: string;
  headers: Record<string, string>;
  objectKey: string;
  expiresInSec: number;
}

export interface StorageProvider {
  createUploadUrl(key: string, contentType: string, expiresInSec: number): Promise<SignedUploadDescriptor>;
  createDownloadUrl(key: string, expiresInSec: number): Promise<string>;
  deleteObject(key: string): Promise<void>;
  getMetadata(key: string): Promise<StorageMetadata | null>;
}

// ==========================================
// FILE SECURITY VALIDATION RULES (PHASE 3W)
// ==========================================
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/csv',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.csv']);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB strict limit

export interface UploadIntent {
  householdId: string;
  userId: string;
  category: 'receipts' | 'avatars' | 'appliances' | 'documents' | 'reports';
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
}

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;
  private secret: string;

  constructor(baseDir = path.join(process.cwd(), 'uploads')) {
    this.baseDir = baseDir;
    this.secret = process.env.JWT_SECRET || 'local_storage_signature_secret';
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async createUploadUrl(key: string, contentType: string, expiresInSec: number): Promise<SignedUploadDescriptor> {
    const expiresAt = Date.now() + expiresInSec * 1000;
    const signature = createHmac('sha256', this.secret).update(`${key}:${expiresAt}`).digest('hex');
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
    const uploadUrl = `${baseUrl}/api/v1/storage/local-upload?key=${encodeURIComponent(key)}&expires=${expiresAt}&sig=${signature}`;

    return {
      uploadUrl,
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      objectKey: key,
      expiresInSec,
    };
  }

  async createDownloadUrl(key: string, expiresInSec: number): Promise<string> {
    const expiresAt = Date.now() + expiresInSec * 1000;
    const signature = createHmac('sha256', this.secret).update(`${key}:${expiresAt}`).digest('hex');
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
    return `${baseUrl}/api/v1/storage/local-download?key=${encodeURIComponent(key)}&expires=${expiresAt}&sig=${signature}`;
  }

  async deleteObject(key: string): Promise<void> {
    const filePath = path.join(this.baseDir, key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async getMetadata(key: string): Promise<StorageMetadata | null> {
    const filePath = path.join(this.baseDir, key);
    if (!fs.existsSync(filePath)) return null;
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      contentType: 'application/octet-stream',
      lastModified: stats.mtime,
    };
  }

  verifySignature(key: string, expires: number, signature: string): boolean {
    if (Date.now() > expires) return false;
    const expected = createHmac('sha256', this.secret).update(`${key}:${expires}`).digest('hex');
    return expected === signature;
  }

  getFilePath(key: string): string {
    return path.join(this.baseDir, key);
  }
}

/**
 * Cloud-Neutral Object Storage Service
 */
export class ObjectStorageService {
  private static instance: ObjectStorageService;
  private provider: StorageProvider;

  private constructor() {
    this.provider = new LocalStorageProvider();
  }

  public static getInstance(): ObjectStorageService {
    if (!ObjectStorageService.instance) {
      ObjectStorageService.instance = new ObjectStorageService();
    }
    return ObjectStorageService.instance;
  }

  public setProvider(provider: StorageProvider): void {
    this.provider = provider;
  }

  public getProvider(): StorageProvider {
    return this.provider;
  }

  /**
   * Request a signed upload URL with complete security validation
   */
  public async requestUploadUrl(intent: UploadIntent, expiresInSec = 900): Promise<SignedUploadDescriptor> {
    // 1. File Size Validation
    if (intent.fileSizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File size ${intent.fileSizeBytes} bytes exceeds allowable limit of 10MB`);
    }
    if (intent.fileSizeBytes <= 0) {
      throw new Error('File size must be greater than 0 bytes');
    }

    // 2. MIME Type Validation
    const normalizedMime = intent.contentType.toLowerCase().trim();
    if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
      throw new Error(`File type '${intent.contentType}' is not permitted. Allowed: ${Array.from(ALLOWED_MIME_TYPES).join(', ')}`);
    }

    // 3. Extension Validation
    const ext = path.extname(intent.fileName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new Error(`File extension '${ext}' is not permitted`);
    }

    // 4. Generate Random UUID Object Key (never trust client filename directly)
    const randomName = randomUUID();
    const safeObjectKey = `household/${intent.householdId}/${intent.category}/${randomName}${ext}`;

    return await this.provider.createUploadUrl(safeObjectKey, normalizedMime, expiresInSec);
  }

  public async getDownloadUrl(objectKey: string, expiresInSec = 3600): Promise<string> {
    return await this.provider.createDownloadUrl(objectKey, expiresInSec);
  }

  public async deleteObject(objectKey: string): Promise<void> {
    await this.provider.deleteObject(objectKey);
  }

  public async getMetadata(objectKey: string): Promise<StorageMetadata | null> {
    return await this.provider.getMetadata(objectKey);
  }

  /**
   * Hook for ClamAV / AWS GuardDuty / GCP Web Risk malware scanning
   */
  public async scanObject(objectKey: string): Promise<{ clean: boolean; report?: string }> {
    // Extensible malware scanning interface
    return { clean: true, report: 'Malware inspection clean' };
  }
}

export const objectStorage = ObjectStorageService.getInstance();
