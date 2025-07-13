const express = require('express');
const router = express.Router();

// GET hoặc POST cũng được, tuỳ bạn gọi từ đâu
router.get('/', (req, res) => {
    res.render('homepage'); // Render file views/homepage.ejs (hoặc pug, tùy engine bạn dùng)
});

module.exports = router;
