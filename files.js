const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow images, documents, and other common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|csv|mp4|avi|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, documents, and videos are allowed.'));
    }
  }
});

// Upload single file
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please select a file to upload'
      });
    }

    const fileInfo = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/uploads/${req.file.filename}`
    };

    res.status(201).json({
      message: 'File uploaded successfully',
      file: fileInfo
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: 'An error occurred while uploading the file'
    });
  }
});

// Upload multiple files
router.post('/upload-multiple', authenticate, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
        message: 'Please select files to upload'
      });
    }

    const filesInfo = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      url: `/uploads/${file.filename}`
    }));

    res.status(201).json({
      message: 'Files uploaded successfully',
      files: filesInfo
    });

  } catch (error) {
    console.error('Multiple files upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: 'An error occurred while uploading the files'
    });
  }
});

// Get file information
router.get('/:filename', authenticate, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../uploads', filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The requested file does not exist'
      });
    }

    const stats = await fs.stat(filePath);
    const fileInfo = {
      filename: filename,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      url: `/uploads/${filename}`
    };

    res.json({ file: fileInfo });

  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while retrieving file information'
    });
  }
});

// Delete file
router.delete('/:filename', authenticate, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../uploads', filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The requested file does not exist'
      });
    }

    // Delete the file
    await fs.unlink(filePath);

    res.json({
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while deleting the file'
    });
  }
});

// List all uploaded files
router.get('/', authenticate, async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../../uploads');

    // Check if uploads directory exists
    try {
      await fs.access(uploadsDir);
    } catch (error) {
      return res.json({ files: [] });
    }

    const files = await fs.readdir(uploadsDir);
    const fileStats = await Promise.all(
      files.map(async (filename) => {
        const filePath = path.join(uploadsDir, filename);
        const stats = await fs.stat(filePath);

        return {
          filename: filename,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          url: `/uploads/${filename}`
        };
      })
    );

    res.json({ files: fileStats });

  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while listing files'
    });
  }
});

// Test endpoint (matches FastAPI test endpoints)
router.get('/test', (req, res) => {
  res.json({
    message: 'File route working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
