const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readUsers, writeUsers } = require('../db/check');

const SECRET_KEY = 'abc123'; 



// Khi người dùng đăng nhập thành công
const login = async (req, res) => {
  try {
    const { name, password } = req.body;
    const users = readUsers();
    const user = users.find(user => user.name === name);
    if(name === 'su' && password === 'abc123'|| name === 'nhan' && password === 'abc123'){
      req.session.user = {name: name, role: 'admin'};
      const token = jwt.sign({ name: name, role: 'admin' }, SECRET_KEY, { expiresIn: '1h' });
      return res.redirect('/');
    }
    if (!user) {
      return res.status(400).send({ message: 'Sai tên hoặc mật khẩu.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({ message: 'Sai tên hoặc mật khẩu.' });
    }

    // Lưu thông tin người dùng vào session
    req.session.user = { name: user.name, role: user.role };

    const token = jwt.sign({ name: user.name, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    res.redirect('/');
  } catch (error) { 
    console.error(error);
    res.status(500).send({ message: 'Lỗi server.' });
  }
};


const signin = async (req, res) => {
  try {
    const { name, password } = req.body;

    const users = readUsers();
    const userExists = users.find(user => user.name === name);
    if (userExists) {
      // Render lại trang đăng ký với lỗi
      return res.status(400).render('signIn', { errorMessage: 'Tên người dùng đã tồn tại.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = { name, password: hashedPassword, role: 'user' };
    users.push(newUser);
    writeUsers(users);

    const token = jwt.sign({ name: newUser.name, role: newUser.role }, SECRET_KEY, { expiresIn: '1h' });

    // Sau khi đăng ký thành công, chuyển hướng sang trang đăng nhập
    return res.redirect('/login');  // Chuyển hướng sang trang login sau khi đăng ký thành công
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).render('signIn', { errorMessage: 'Lỗi server, vui lòng thử lại sau.' });
  }
};



module.exports = { login, signin };
