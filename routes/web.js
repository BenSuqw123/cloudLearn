const express = require('express');
const {login, signin} = require('../controllers/homecontroller')
const path = require('path');
const archiver = require('archiver');
const router = express.Router();
const { checkFolderExists, createFolder, deleteFolder,getFileStats,checkFileExists,readFileContent } = require('../utils/utils');
const {upload, uploadToFolder} = require('../middleware/multerConfig');  // Import cấu hình multer
const fs = require('fs');
const dataDir = path.join(__dirname, '../home/cloud-files');


router.get('/', (req, res) => {
    if (req.session.user) {
    res.render('homepage', { user: req.session.user });
  } else {
    res.redirect('/login');
  }
});


router.get('/recent', (req, res) => {
    res.render('recent'); 
});
router.get('/login', (req, res) => {
    res.render('logIn'); 
});
router.get('/signin', (req, res) => {
   res.render('signIn', { errorMessage: null });
});
router.get('/sharewithme', (req, res) => {
    res.render('sharewithme'); 
});

router.get('/starred', (req, res) => {
    res.render('starred'); 
});
router.post('/login', login);
router.post('/signin',signin);


// Route upload file vào thư mục data
router.post('/upload-data', (req, res) => {
    upload.single('file')(req, res, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
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

// API lấy danh sách file trong thư mục data
router.get('/api/list-data', (req, res) => {
    fs.readdir(dataDir, { withFileTypes: true }, async (err, items) => {
        if (err) return res.status(500).json({ error: 'Không thể đọc thư mục.' });
        const result = await Promise.all(items.map(async item => {
            const fullPath = path.join(dataDir, item.name);
            const stat = getFileStats(fullPath);
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
    if (!checkFileExists(filePath)) {
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
    if (!checkFileExists(filePath)) {
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
    if (!checkFileExists(filePath)) {
        return res.status(404).send('File không tồn tại!');
    }
    const stat = getFileStats(filePath);
    const ext = path.extname(filename).toLowerCase();
    let previewContent = '';
    if ([".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"].includes(ext)) {
        previewContent = `<img src="/download/${encodeURIComponent(filename)}" alt="${filename}" style="max-width:100%;max-height:320px;border-radius:8px;box-shadow:0 2px 12px #0001;" />`;
    } else if (ext === ".pdf") {
        previewContent = `<iframe src="/download/${encodeURIComponent(filename)}" width="100%" height="400px" style="border-radius:8px;border:1px solid #eee;"></iframe>`;
    } else if ([".txt", ".md", ".json", ".js", ".css", ".html"].includes(ext)) {
        const fileText = readFileContent(filePath);
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
        </head>
        <body>
            <div class="preview-box">
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
    if (!checkFileExists(filePath)) {
        return res.status(404).json({ error: 'File không tồn tại!' });
    }
    const shareLink = `/preview/${encodeURIComponent(filename)}`;
    res.json({ link: shareLink });
});

// API tạo thư mục mới
router.post('/create-folder', (req, res) => {
    const { folderName, parentPath } = req.body;
    if (!folderName) {
        return res.status(400).json({ error: 'Thiếu tên thư mục!' });
    }

    // Đường dẫn cha, mặc định là ./data
    const baseDir = parentPath ? parentPath : path.join(__dirname, '../data');
    const newFolderPath = path.join(baseDir, folderName);

    if (checkFolderExists(newFolderPath)) {
        return res.status(400).json({ error: 'Thư mục đã tồn tại!' });
    }

    if (createFolder(newFolderPath)) {
        return res.json({ message: 'Tạo thư mục thành công!', folder: newFolderPath });
    } else {
        return res.status(500).json({ error: 'Lỗi khi tạo thư mục!' });
    }
});

// API xóa thư mục
router.delete('/delete-folder/:folderName', (req, res) => {
    const folderName = req.params.folderName;
    const folderPath = path.join(__dirname, '../data', folderName);

    if (!checkFolderExists(folderPath)) {
        return res.status(404).json({ error: 'Thư mục không tồn tại!' });
    }

    if (deleteFolder(folderPath)) {
        return res.json({ message: 'Xóa thư mục thành công!' });
    } else {
        return res.status(500).json({ error: 'Lỗi khi xóa thư mục!' });
    }
});

// API tải thư mục dưới dạng zip
router.get('/download-folder/:folderName', (req, res) => {
    const folderName = req.params.folderName;
    const folderPath = path.join(__dirname, '../data', folderName);

    if (!checkFolderExists(folderPath)) {
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

    return res.json({
        message: `${req.files.length} file(s) đã được upload vào thư mục ${folderName} thành công!`,
        files: uploadedFiles
    });
});
module.exports = router;
