const fs = require('fs');
const path = require('path');

const usersPath = path.join(__dirname, 'users.json');

const readUsers = () => {
  try {
    if (!fs.existsSync(usersPath)) {
      // Nếu file không tồn tại, tạo file với mảng rỗng
      fs.writeFileSync(usersPath, '[]', 'utf8');
      return [];
    }
    const data = fs.readFileSync(usersPath, 'utf8').trim();
    if (!data) {
      // Nếu file rỗng, trả về mảng rỗng
      return [];
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading users.json:', err);
    throw err;
  }
};

const writeUsers = (users) => {
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), 'utf8');
};

module.exports = { readUsers, writeUsers };
