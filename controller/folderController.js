const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// API tạo thư mục mới
router.post('/create-folder', (req, res) => {
    const { folderName, parentPath } = req.body;
    if (!folderName) {
        return res.status(400).json({ error: 'Thiếu tên thư mục!' });
    }
    // Đường dẫn cha, mặc định là ./data
    const baseDir = parentPath ? parentPath : path.join(__dirname, '../data');
    const newFolderPath = path.join(baseDir, folderName);
    if (fs.existsSync(newFolderPath)) {
        return res.status(400).json({ error: 'Thư mục đã tồn tại!' });
    }
    try {
        fs.mkdirSync(newFolderPath, { recursive: true });
        res.json({ message: 'Tạo thư mục thành công!', folder: newFolderPath });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi tạo thư mục!' });
    }
});

// API xóa thư mục
router.delete('/delete-folder/:folderName', (req, res) => {
    const folderName = req.params.folderName;
    const folderPath = path.join(__dirname, '../data', folderName);
    if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
        return res.status(404).json({ error: 'Thư mục không tồn tại!' });
    }
    try {
        // Xóa thư mục và toàn bộ nội dung bên trong
        fs.rmSync(folderPath, { recursive: true, force: true });
        res.json({ message: 'Xóa thư mục thành công!' });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi xóa thư mục!' });
    }
});

// API tải thư mục dưới dạng zip
const archiver = require('archiver');
router.get('/download-folder/:folderName', (req, res) => {
    const folderName = req.params.folderName;
    const folderPath = path.join(__dirname, '../data', folderName);
    if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
        return res.status(404).send('Thư mục không tồn tại!');
    }
    res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${folderName}.zip"`
    });
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.directory(folderPath, false);
    archive.on('error', err => res.status(500).send('Lỗi nén thư mục!'));
    archive.pipe(res);
    archive.finalize();
});

// Multer cấu hình upload vào thư mục con
const multer = require('multer');
const uploadToFolder = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            const folderName = req.params.folderName;
            const targetDir = path.join(__dirname, '../data', folderName);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
            cb(null, targetDir);
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        }
    })
});

// API upload file vào thư mục cụ thể
router.post('/upload-to-folder/:folderName', uploadToFolder.array('files', 10), (req, res) => {
    const folderName = req.params.folderName;
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Không có file nào được upload!' });
    }
    const uploadedFiles = req.files.map(file => ({
        originalName: file.originalname,
        filename: file.filename,
        size: file.size,
        path: file.path
    }));
    res.json({
        message: `${req.files.length} file(s) đã được upload vào thư mục ${folderName} thành công!`,
        files: uploadedFiles
    });
});

module.exports = router;
