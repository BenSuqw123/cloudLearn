// /utils/fileUtils.js
const fs = require('fs');
const path = require('path');

// Kiểm tra xem file có tồn tại hay không
const checkFileExists = (filePath) => {
    return fs.existsSync(filePath);
};

// Lấy thông tin về file
const getFileStats = (filePath) => {
    try {
        const stat = fs.statSync(filePath);
        return stat;
    } catch (err) {
        return null;
    }
};

// Đọc file nội dung văn bản (dành cho các file như .txt, .json, v.v.)
const readFileContent = (filePath) => {
    return fs.readFileSync(filePath, 'utf8');
};
const checkFolderExists = (folderPath) => {
    return fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory();
};

// Tạo thư mục mới
const createFolder = (folderPath) => {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        return true;
    }
    return false;
};

// Xóa thư mục và toàn bộ nội dung bên trong
const deleteFolder = (folderPath) => {
    if (checkFolderExists(folderPath)) {
        fs.rmSync(folderPath, { recursive: true, force: true });
        return true;
    }
    return false;
};


module.exports = { checkFileExists, getFileStats, readFileContent ,checkFolderExists, createFolder, deleteFolder };
