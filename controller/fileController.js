


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

// API xóa file
router.delete('/delete-file/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File không tồn tại!' });
    }
    try {
        fs.unlinkSync(filePath);
        res.json({ message: 'Xóa file thành công!' });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi xóa file!' });
    }
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

// Route preview file khi truy cập link chia sẻ
router.get('/preview/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('File không tồn tại!');
    }
    const stat = fs.statSync(filePath);
    const ext = path.extname(filename).toLowerCase();
    let previewContent = '';
    if ([".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"].includes(ext)) {
        // Hiển thị ảnh trực tiếp
        previewContent = `<img src="/download/${encodeURIComponent(filename)}" alt="${filename}" style="max-width:100%;max-height:320px;border-radius:8px;box-shadow:0 2px 12px #0001;" />`;
    } else if (ext === ".pdf") {
        // Hiển thị PDF trực tiếp
        previewContent = `<iframe src="/download/${encodeURIComponent(filename)}" width="100%" height="400px" style="border-radius:8px;border:1px solid #eee;"></iframe>`;
    } else if ([".txt", ".md", ".json", ".js", ".css", ".html"].includes(ext)) {
        // Hiển thị nội dung văn bản
        const fileText = fs.readFileSync(filePath, "utf8");
        previewContent = `<pre style="text-align:left;background:#f4f4f4;padding:16px;border-radius:8px;max-height:320px;overflow:auto;font-size:1rem;">${fileText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
    } else {
        previewContent = `<div style="color:#888;font-size:1rem;">Không thể xem trước loại file này.</div>`;
    }
    res.send(`
        <html>
        <head>
            <title>Preview: ${filename}</title>
            <meta charset="utf-8" />
            <style>
                body { font-family: Arial; background: #f7f7f7; padding: 40px; }
                .preview-box { background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); padding: 32px; max-width: 520px; margin: auto; text-align: center; }
                .icon { font-size: 48px; margin-bottom: 16px; }
                .btn-download { display:inline-block; margin-top:24px; padding:10px 24px; background:#0082c9; color:#fff; border:none; border-radius:6px; font-size:1rem; text-decoration:none; }
            </style>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        </head>
        <body>
            <div class="preview-box">
                <div class="icon">
                    ${ext === '.pdf' ? '<i class="fas fa-file-pdf text-red-500"></i>' :
                      ext === '.doc' || ext === '.docx' ? '<i class="fas fa-file-word text-blue-500"></i>' :
                      ext === '.xlsx' || ext === '.xls' ? '<i class="fas fa-file-excel text-green-500"></i>' :
                      ext === '.zip' || ext === '.rar' ? '<i class="fas fa-file-archive text-gray-500"></i>' :
                      [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"].includes(ext) ? '<i class="fas fa-file-image text-pink-500"></i>' :
                      '<i class="fas fa-file text-gray-500"></i>'}
                </div>
                <h2>${filename}</h2>
                <div style="color:#888;font-size:0.95rem;margin:12px 0;">Dung lượng: ${stat.size < 1024 ? stat.size + ' B' : stat.size < 1024*1024 ? (stat.size/1024).toFixed(1)+' KB' : (stat.size/1024/1024).toFixed(2)+' MB'}</div>
                <div style="margin:18px 0;">${previewContent}</div>
                <a class="btn-download" href="/download/${encodeURIComponent(filename)}" download>Download</a>
            </div>
        </body>
        </html>
    `);
});
// API tạo link chia sẻ file
router.post('/api/share-link', (req, res) => {
    const { filename } = req.body;
    if (!filename) {
        return res.status(400).json({ error: 'Thiếu tên file!' });
    }
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File không tồn tại!' });
    }
    // Tạo link preview thay vì link download trực tiếp
    const shareLink = `/preview/${encodeURIComponent(filename)}`;

    res.json({ link: shareLink });
});



module.exports = router;