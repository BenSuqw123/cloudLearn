const express = require('express');
const router = express.Router();
const fileController = require('../controller/fileController');
const folderController = require('../controller/folderController');

// GET hoặc POST cũng được, tuỳ bạn gọi từ đâu
router.get('/', (req, res) => {
    res.render('homepage'); // Render file views/homepage.ejs (hoặc pug, tùy engine bạn dùng)
});


router.use(fileController);
router.use(folderController);

module.exports = router;
