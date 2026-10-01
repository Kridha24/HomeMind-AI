import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { objectStorage, LocalStorageProvider } from './objectStorageService';
import { AuthenticatedRequest } from '../../middleware/auth';

const router = Router();

// ==========================================
// SIGNED OBJECT STORAGE API ENDPOINTS
// ==========================================

/**
 * 1. Request Signed Upload URL
 * Body: { fileName, contentType, fileSizeBytes, category }
 */
router.post('/upload-url', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fileName, contentType, fileSizeBytes, category } = req.body;
    const householdId = req.user?.householdId;
    const userId = req.user?.userId;

    if (!householdId || !userId) {
      return res.status(401).json({ error: 'Authenticated household context required' });
    }

    if (!fileName || !contentType || !fileSizeBytes || !category) {
      return res.status(400).json({
        error: 'Missing required parameters: fileName, contentType, fileSizeBytes, category',
      });
    }

    const descriptor = await objectStorage.requestUploadUrl({
      householdId,
      userId,
      category,
      fileName,
      contentType,
      fileSizeBytes: Number(fileSizeBytes),
    });

    res.json({
      success: true,
      uploadUrl: descriptor.uploadUrl,
      method: descriptor.method,
      headers: descriptor.headers,
      objectKey: descriptor.objectKey,
      expiresInSec: descriptor.expiresInSec,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * 2. Request Signed Download URL
 * Query: ?objectKey=...
 */
router.get('/download-url', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const objectKey = req.query.objectKey as string;
    const householdId = req.user?.householdId;

    if (!objectKey) {
      return res.status(400).json({ error: 'Query parameter objectKey is required' });
    }

    // Tenant Isolation check: Verify objectKey belongs to user's household
    if (!objectKey.startsWith(`household/${householdId}/`)) {
      return res.status(403).json({ error: 'Access forbidden: unauthorized object access' });
    }

    const downloadUrl = await objectStorage.getDownloadUrl(objectKey);
    res.json({ success: true, downloadUrl });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// LOCAL DEVELOPMENT UPLOAD / DOWNLOAD ENDPOINTS
// Used when operating with LocalStorageProvider
// ==========================================

router.put('/local-upload', (req: Request, res: Response) => {
  const provider = objectStorage.getProvider();
  if (!(provider instanceof LocalStorageProvider)) {
    return res.status(400).json({ error: 'Local upload endpoint inactive in cloud mode' });
  }

  const key = req.query.key as string;
  const expires = parseInt(req.query.expires as string, 10);
  const sig = req.query.sig as string;

  if (!key || !expires || !sig || !provider.verifySignature(key, expires, sig)) {
    return res.status(403).json({ error: 'Invalid or expired upload signature' });
  }

  const targetPath = provider.getFilePath(key);
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const writeStream = fs.createWriteStream(targetPath);
  req.pipe(writeStream);

  writeStream.on('finish', () => {
    res.status(200).json({ success: true, key });
  });

  writeStream.on('error', (err) => {
    res.status(500).json({ error: err.message });
  });
});

router.get('/local-download', (req: Request, res: Response) => {
  const provider = objectStorage.getProvider();
  if (!(provider instanceof LocalStorageProvider)) {
    return res.status(400).json({ error: 'Local download endpoint inactive in cloud mode' });
  }

  const key = req.query.key as string;
  const expires = parseInt(req.query.expires as string, 10);
  const sig = req.query.sig as string;

  if (!key || !expires || !sig || !provider.verifySignature(key, expires, sig)) {
    return res.status(403).json({ error: 'Invalid or expired download signature' });
  }

  const targetPath = provider.getFilePath(key);
  if (!fs.existsSync(targetPath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.sendFile(targetPath);
});

export default router;
