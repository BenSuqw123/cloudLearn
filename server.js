const fs = require('fs')
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const https = require('https');
const cors = require('cors');
const router = require('./routes/web.js');
const errorHandler = require('./middleware/errorHandler');


const app = express();
const PORT = 3000;


// Cấu hình HTTPS
const options = {
  key: fs.readFileSync('./ssl/server.key'),
  cert: fs.readFileSync('./ssl/server.cert')
};

app.use(cors());
app.use(helmet());
app.use(express.static(path.join(__dirname, 'public')));



// Cung cấp file tĩnh từ public/
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 


// Route upload
app.use('/',router);

// Middleware xử lý lỗi
app.use(errorHandler);

// Lắng nghe server
https.createServer(options,app).listen(3000, '0.0.0.0', () => {
    console.log('Server đang chạy trên https://0.0.0.0:3000');
});
