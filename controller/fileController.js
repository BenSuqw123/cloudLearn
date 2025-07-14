

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Đảm bảo thư mục data tồn tại
const dataDir = '/home/quocnhan/Desktop/cloudLearn/data';
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Cấu hình multer để lưu file vào thư mục data
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, dataDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

// Route upload file vào thư mục data
router.post('/upload-data', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Không có file được upload!' });
    }
    res.json({
        message: 'File đã được upload vào data thành công!',
        file: {
            originalName: req.file.originalname,
            filename: req.file.filename,
            size: req.file.size,
            path: req.file.path
        }
    });
});

// Route upload nhiều file vào thư mục data
router.post('/upload-multiple-data', upload.array('files', 10), (req, res) => {
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
        message: `${req.files.length} file(s) đã được upload vào data thành công!`,
        files: uploadedFiles
    });
});

router.get('/api/list-data', (req, res) => {
    const dataDir = path.join(__dirname, '../data');
    fs.readdir(dataDir, { withFileTypes: true }, async (err, items) => {
        if (err) return res.status(500).json({ error: 'Không đọc được thư mục' });
        const result = await Promise.all(items.map(async item => {
            const fullPath = path.join(dataDir, item.name);
            const stat = fs.statSync(fullPath);
            let ext = path.extname(item.name).toLowerCase();
            let size = item.isDirectory() ? null : stat.size; // byte
            let count = item.isDirectory() ? fs.readdirSync(fullPath).length : null;
            return {
                name: item.name,
                isDirectory: item.isDirectory(),
                ext,
                size,
                count
            };
        }));
        res.json(result);
    });
});

// Route download file từ thư mục data
router.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('File không tồn tại!');
    }
    res.download(filePath, filename, err => {
        if (err) {
            res.status(500).send('Lỗi khi tải file!');
        }
    });
});

module.exports = router;