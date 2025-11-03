import express from 'express';
import { uploadFile, downloadFile, getFileInfo, getAllFiles, deleteFile, upload } from '../controllers/fileController.js';

const router = express.Router();

// File upload route
router.post('/upload', upload.single('file'), uploadFile);

// File download route
router.get('/:filename', downloadFile);

// File info route
router.get('/info/:filename', getFileInfo);

// Get all files (admin)
router.get('/', getAllFiles);

// Delete file route
router.delete('/:filename', deleteFile);

export default router;