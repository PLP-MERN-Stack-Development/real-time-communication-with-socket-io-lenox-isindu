import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File expiration time (2 days )
const FILE_EXPIRY_MS = 2 * 24 * 60 * 60 * 1000;


const fileMetadata = new Map();

//  multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = './uploads';
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp4|mp3/;
    
    //  allowed MIME types
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'text/plain',
      'video/mp4',
      'audio/mpeg',
      'audio/mp3'
    ];

    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.includes(file.mimetype);

    console.log('File upload check:', {
      originalName: file.originalname,
      mimetype: file.mimetype,
      extname: path.extname(file.originalname),
      extnameValid: extname,
      mimetypeValid: mimetype
    });

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      console.error('File type rejected:', {
        filename: file.originalname,
        mimetype: file.mimetype,
        allowedMimeTypes: allowedMimeTypes
      });
      cb(new Error(`File type not allowed: ${file.mimetype}. Supported types: ${allowedMimeTypes.join(', ')}`));
    }
  }
});

// Upload file
export const uploadFile = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/api/files/${req.file.filename}`;
    const expiresAt = new Date(Date.now() + FILE_EXPIRY_MS);
    
    // Store file metadata
    fileMetadata.set(req.file.filename, {
      originalName: req.file.originalname,
      uploadedBy: req.body.userId || 'unknown',
      uploadedAt: new Date(),
      expiresAt: expiresAt,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: fileUrl,
      room: req.body.room || 'global'
    });

    console.log('File uploaded successfully:', {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.body.userId
    });

    res.json({
      success: true,
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
        expiresAt: expiresAt.toISOString(),
        uploadedBy: req.body.userId || 'unknown',
        room: req.body.room || 'global'
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
};

// Download file with expiration check
export const downloadFile = (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Check file metadata
  const metadata = fileMetadata.get(filename);
  if (!metadata) {
    return res.status(404).json({ error: 'File metadata not found' });
  }

  // Check if file is expired
  if (new Date() > metadata.expiresAt) {
    return res.json({
      expired: true,
      originalName: metadata.originalName,
      uploadedBy: metadata.uploadedBy,
      expiresAt: metadata.expiresAt
    });
  }

  // Serve the file
  res.setHeader('Content-Disposition', `attachment; filename="${metadata.originalName}"`);
  res.setHeader('Content-Type', metadata.mimetype);
  res.sendFile(filePath);
};

// Get file info
export const getFileInfo = (req, res) => {
  const filename = req.params.filename;
  const metadata = fileMetadata.get(filename);
  
  if (!metadata) {
    return res.status(404).json({ error: 'File not found' });
  }

  const isExpired = new Date() > metadata.expiresAt;
  
  res.json({
    filename,
    originalName: metadata.originalName,
    uploadedBy: metadata.uploadedBy,
    uploadedAt: metadata.uploadedAt,
    expiresAt: metadata.expiresAt,
    isExpired: isExpired,
    size: metadata.size,
    mimetype: metadata.mimetype,
    room: metadata.room,
    url: metadata.url
  });
};


export const getAllFiles = (req, res) => {
  const files = Array.from(fileMetadata.entries()).map(([filename, metadata]) => ({
    filename,
    ...metadata
  }));
  
  res.json(files);
};

// Delete file
export const deleteFile = (req, res) => {
  const filename = req.params.filename;
  const metadata = fileMetadata.get(filename);
  
  if (!metadata) {
    return res.status(404).json({ error: 'File not found' });
  }

  const filePath = path.join(__dirname, '../uploads', filename);
  
  // Delete file from filesystem
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  
 
  fileMetadata.delete(filename);
  
  res.json({ message: 'File deleted successfully' });
};

// Cleanup expired files
export const cleanupExpiredFiles = () => {
  console.log(' Starting expired file cleanup...');
  const now = new Date();
  let deletedCount = 0;

  fileMetadata.forEach((metadata, filename) => {
    if (now > metadata.expiresAt) {
      const filePath = path.join(__dirname, '../uploads', filename);
      
      // Delete file from filesystem
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted expired file: ${filename}`);
      }
      
      
      fileMetadata.delete(filename);
      deletedCount++;
    }
  });

  console.log(`Cleanup completed. Deleted ${deletedCount} files.`);
};

// Schedule cleanup every hour
setInterval(cleanupExpiredFiles, 60 * 60 * 1000);

export { upload, fileMetadata };