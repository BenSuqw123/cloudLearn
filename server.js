const express = require('express');
const multer = require('multer');
const path = require('path');
const helmet = require('helmet'); // Thư viện helmet để bảo mật

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html')); // Đảm bảo bạn có index.html trong thư mục public
});
// Cấu hình nơi lưu file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/home/cloud-files/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Cấu hình Multer với các hạn chế
const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Giới hạn dung lượng file 10MB
    fileFilter: (req, file, cb) => {
        // Chỉ cho phép upload các định dạng hình ảnh
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Chỉ cho phép tải lên các file ảnh (jpg, jpeg, png, gif).'));
        }
    }
});

// Cung cấp các file tĩnh (favicon, CSS, JS) từ thư mục public/
app.use(express.static(path.join(__dirname, 'public')));

// Trang upload
app.get('/upload', (req, res) => {
    res.sendFile(path.join(__dirname, 'upload.html'));
});

// Xử lý upload file
app.post('/upload', upload.single('file'), (req, res) => {
    res.send('Đã upload file: ' + req.file.filename);
});

// Xử lý lỗi Multer
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Lỗi từ Multer (ví dụ: file quá lớn)
        res.status(400).send('Lỗi khi tải file: ' + err.message);
    } else if (err) {
        // Lỗi khác (ví dụ: lỗi file type không hợp lệ)
        res.status(400).send('Lỗi: ' + err.message);
    }
});

// Lắng nghe kết nối trên cổng 3000
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server chạy tại http://0.0.0.0:${PORT}`);
});



// mật khẩu đã hash: "password123"