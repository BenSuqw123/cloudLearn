document.addEventListener('DOMContentLoaded', function () {
    const selectBtns = document.getElementsByClassName('selectbtn');
    Array.from(selectBtns).forEach(selectBtn => {
        selectBtn.addEventListener('click', function () {
            // Tạo input file ẩn
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.jpeg,.jpg,.png,.gif,.pdf,.doc,.docx,.txt';
            input.style.display = 'none';
            document.body.appendChild(input);
            input.click();

            input.addEventListener('change', function () {
                if (input.files.length > 0) {
                    const file = input.files[0];
                    const formData = new FormData();
                    formData.append('file', file);

                    fetch('/upload-data', {
                        method: 'POST',
                        body: formData
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.error) {
                                alert('Lỗi: ' + data.error);
                            } else {
                                alert('Upload thành công!\nTên file: ' + data.file.originalName);
                                reloadFilesGrid();
                            }
                        })
                        .catch(() => {
                            alert('Lỗi kết nối server!');
                        });
                }
                document.body.removeChild(input);
            });
        });
    });

    // Thêm chức năng kéo thả nhiều file vào uploadarea
    const uploadArea = document.getElementById('uploadarea');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', function (e) {
            e.preventDefault();
            uploadArea.classList.add('bg-blue-100');
        });
        uploadArea.addEventListener('dragleave', function (e) {
            e.preventDefault();
            uploadArea.classList.remove('bg-blue-100');
        });
        uploadArea.addEventListener('drop', function (e) {
            e.preventDefault();
            uploadArea.classList.remove('bg-blue-100');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const formData = new FormData();
                for (let i = 0; i < files.length; i++) {
                    formData.append('files', files[i]);
                }
                fetch('/upload-multiple-data', {
                    method: 'POST',
                    body: formData
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) {
                            alert('Lỗi: ' + data.error);
                        } else {
                            alert('Upload nhiều file thành công!\n' + data.files.map(f => f.originalName).join(', '));
                            reloadFilesGrid();
                        }
                    })
                    .catch(() => {
                        alert('Lỗi kết nối server!');
                    });
            }
        });
    }
    // });

    // ocument.addEventListener('DOMContentLoaded', function() {
    //     // ...existing code...

    // Tự động load danh sách file/folder và render vào Files Grid
    function renderFilesGrid(items) {
        const grid = document.querySelector('.grid');
        if (!grid) return;
        grid.innerHTML = '';
        items.forEach(item => {
            let iconHtml = '';
            if (item.isDirectory) {
                iconHtml = '<i class="fas fa-folder text-yellow-500"></i>';
            } else if (item.ext === '.pdf') {
                iconHtml = '<i class="fas fa-file-pdf text-red-500"></i>';
            } else if (item.ext === '.doc' || item.ext === '.docx') {
                iconHtml = '<i class="fas fa-file-word text-blue-500"></i>';
            } else if (item.ext === '.xlsx' || item.ext === '.xls') {
                iconHtml = '<i class="fas fa-file-excel text-green-500"></i>';
            } else if (item.ext === '.zip' || item.ext === '.rar') {
                iconHtml = '<i class="fas fa-file-archive text-gray-500"></i>';
            } else if (item.ext === '.jpg' || item.ext === '.png') {
                iconHtml = '<i class="fas fa-file-image text-pink-500"></i>';
            } else {
                iconHtml = '<i class="fas fa-file text-gray-500"></i>';
            }
            let downloadIcon = '';
            if (!item.isDirectory) {
                downloadIcon = `<button class='download-btn absolute top-2 right-2 text-gray-400 hover:text-blue-600' title='Download' style='background:none;border:none;cursor:pointer;'>
                    <i class='fas fa-download'></i>
                </button>`;
            }
            // Hiển thị dung lượng file
            let sizeText = '';
            if (!item.isDirectory && typeof item.size === 'number') {
                if (item.size < 1024) {
                    sizeText = item.size + ' B';
                } else if (item.size < 1024 * 1024) {
                    sizeText = (item.size / 1024).toFixed(1) + ' KB';
                } else {
                    sizeText = (item.size / (1024 * 1024)).toFixed(2) + ' MB';
                }
            }
            grid.innerHTML += `
                <div class="file-card bg-white rounded-lg p-4 cursor-pointer border border-gray-100 hover:border-blue-200 relative">
                    ${downloadIcon}
                    <div class="flex justify-center text-4xl mb-3">
                        ${iconHtml}
                    </div>
                    <div class="text-center font-medium truncate">${item.name}</div>
                    <div class="text-center text-xs text-gray-500">
                        ${item.isDirectory ? (item.count + ' items') : sizeText}
                    </div>
                </div>
            `;
        });

        // Thêm sự kiện cho nút download
        setTimeout(() => {
            const cards = grid.querySelectorAll('.file-card');
            items.forEach((item, idx) => {
                if (!item.isDirectory) {
                    const btn = cards[idx].querySelector('.download-btn');
                    if (btn) {
                        btn.addEventListener('click', function(e) {
                            e.stopPropagation();
                            const link = document.createElement('a');
                            link.href = `/download/${encodeURIComponent(item.name)}`;
                            link.download = item.name;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        });
                    }
                }
            });
        }, 0);
    }

    function reloadFilesGrid() {
        fetch('/api/list-data')
            .then(res => res.json())
            .then(data => renderFilesGrid(data))
            .catch(() => {
                // Có thể hiển thị thông báo lỗi nếu cần
            });
    }

    // Lần đầu load
    reloadFilesGrid();
});