const multer = require('multer');

function errorHandler(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        res.status(400).send('Lỗi Multer: ' + err.message);
    } else if (err) {
        res.status(400).send('Lỗi: ' + err.message);
    } else {
        next();
    }
}

module.exports = errorHandler;