document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  fetch('http://localhost:3000/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.token) {
      localStorage.setItem('token', data.token); // Lưu token vào localStorage
      alert('Login successful!');
      window.location.href = '/upload.html'; // Chuyển hướng đến trang upload
    } else {
      alert('Login failed');
    }
  })
  .catch(error => alert('Error: ' + error));
});
