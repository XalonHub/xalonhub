const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// POST /api/upload — Upload a new file
router.post('/', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const protocol = req.protocol;
        const host = req.get('host');
        const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

        res.json({
            url: fileUrl,
            message: "File uploaded successfully",
            filename: req.file.filename
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Failed to upload file" });
    }
});

// DELETE /api/upload — Delete an existing uploaded file
// Body: { url: "http://host/uploads/filename.jpg" }
// Returns 200 even if the file is already gone (idempotent).
// Returns 400 if the URL is missing or unsafe (e.g. path traversal attempt).
router.delete('/', (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: "No URL provided" });

        // Extract just the filename (last path segment)
        const filename = path.basename(url);

        // Security: reject any filename that tries to escape the uploads directory
        if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({ error: "Invalid filename" });
        }

        const uploadsDir = path.resolve(path.join(__dirname, '../../uploads'));
        const filePath = path.resolve(path.join(uploadsDir, filename));

        // Double-check resolved path is still inside uploads/
        if (!filePath.startsWith(uploadsDir)) {
            return res.status(400).json({ error: "Invalid file path" });
        }

        if (!fs.existsSync(filePath)) {
            // Already gone — treat as success
            return res.json({ message: "File not found, nothing to delete" });
        }

        fs.unlinkSync(filePath);
        console.log(`[Upload] Deleted orphaned file: ${filename}`);
        res.json({ message: "File deleted successfully" });
    } catch (error) {
        console.error("Delete file error:", error);
        res.status(500).json({ error: "Failed to delete file" });
    }
});

module.exports = router;
