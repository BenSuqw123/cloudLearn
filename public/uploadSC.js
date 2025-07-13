document.getElementById('uploadForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', document.getElementById('file').files[0]);

  fetch('http://localhost:3000/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message);
  })
  .catch(error => alert('Error: ' + error));
});
