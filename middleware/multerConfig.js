const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Hàm kiểm tra và tạo thư mục nếu chưa tồn tại
function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
    }
}

// Đảm bảo thư mục lưu trữ tồn tại
const uploadDir = path.join(__dirname, '../home/cloud-files/');
ensureDirectoryExistence(uploadDir);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Sử dụng thư mục đã kiểm tra ở trên
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Tạo tên file với timestamp và một vài ký tự ngẫu nhiên để tránh trùng lặp
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        cb(null, `${timestamp}-${randomString}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Giới hạn 10MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ cho phép tải lên các file ảnh (jpg, jpeg, png, gif).'));
        }
    }
});

// Cấu hình upload cho thư mục mục tiêu tùy chỉnh
const uploadToFolder = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            const folderName = req.params.folderName;
            const targetDir = path.join(__dirname, '../data', folderName);

            // Kiểm tra và tạo thư mục nếu chưa tồn tại
            ensureDirectoryExistence(targetDir);
            cb(null, targetDir);
        },
        filename: function (req, file, cb) {
            // Đặt tên file như tên gốc
            cb(null, file.originalname);
        }
    })
});

module.exports = { upload, uploadToFolder };
