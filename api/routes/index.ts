import { Router } from 'express';
import { upload, uploadFile } from '../controllers/upload';
import { compressFiles } from '../controllers/compress';
import { extractFile } from '../controllers/extract';
import { getFiles, deleteFile, downloadFile } from '../controllers/files';

const router = Router();

router.post('/upload', upload.single('file'), uploadFile);
router.post('/compress', compressFiles);
router.post('/extract', extractFile);
router.get('/files', getFiles);
router.delete('/files/:filename', deleteFile);
router.get('/download/:filename', downloadFile);

export default router;