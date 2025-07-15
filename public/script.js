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
            // Đã bỏ icon download góc phải trên cùng
            let downloadIcon = '';
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
                <div class="file-card bg-white rounded-lg p-4 cursor-pointer border border-gray-100 hover:border-blue-200 relative" data-name="${item.name}" data-isdir="${item.isDirectory}" ${item.isDirectory ? 'ondragover="event.preventDefault();"' : ''} draggable="true">
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
                // Kéo thả file vào folder để upload vào thư mục đó
                if (item.isDirectory) {
                    // Ngăn kéo thả file-card sang nhau
                    cards[idx].addEventListener('dragstart', function(e) {
                        e.preventDefault();
                    });
                    cards[idx].addEventListener('dragover', function(e) {
                        e.preventDefault();
                        cards[idx].classList.add('bg-blue-100');
                    });
                    cards[idx].addEventListener('dragleave', function(e) {
                        e.preventDefault();
                        cards[idx].classList.remove('bg-blue-100');
                    });
                    cards[idx].addEventListener('drop', function(e) {
                        e.preventDefault();
                        cards[idx].classList.remove('bg-blue-100');
                        // Chỉ xử lý nếu kéo file từ ngoài vào
                        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            const files = e.dataTransfer.files;
                            const formData = new FormData();
                            for (let i = 0; i < files.length; i++) {
                                formData.append('files', files[i]);
                            }
                            fetch(`/upload-to-folder/${encodeURIComponent(item.name)}`, {
                                method: 'POST',
                                body: formData
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.error) {
                                    alert('Lỗi: ' + data.error);
                                } else {
                                    alert('Upload vào thư mục thành công!\n' + data.files.map(f => f.originalName).join(', '));
                                    reloadFilesGrid();
                                }
                            })
                            .catch(() => {
                                alert('Lỗi kết nối server!');
                            });
                        }
                    });
                }
                // ...existing code for download button...
                if (!item.isDirectory) {
                    const btn = cards[idx].querySelector('.download-btn');
                    if (btn) {
                        btn.addEventListener('click', function (e) {
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
            // Thêm menu chuột phải cho file/folder
            cards.forEach((card, idx) => {
                card.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                    // Xóa menu cũ nếu có
                    const oldMenu = document.getElementById('context-menu');
                    if (oldMenu) oldMenu.remove();
                    // Tạo menu mới
                    const menu = document.createElement('div');
                    menu.id = 'context-menu';
                    menu.style.position = 'fixed';
                    menu.style.top = e.clientY + 'px';
                    menu.style.left = e.clientX + 'px';
                    menu.style.background = '#fff';
                    menu.style.border = '1px solid #ccc';
                    menu.style.borderRadius = '8px';
                    menu.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
                    menu.style.zIndex = '99999';
                    menu.style.minWidth = '140px';
                    menu.innerHTML = `
                        <div style="padding:10px 16px;cursor:pointer;" id="menu-download"><i class='fas fa-download mr-2'></i>Tải xuống</div>
                        <div style="padding:10px 16px;cursor:pointer;" id="menu-share"><i class='fas fa-share-alt mr-2'></i>Chia sẻ</div>
                        <div style="padding:10px 16px;cursor:pointer;" id="menu-delete"><i class='fas fa-trash mr-2'></i>Xóa</div>
                    `;
                    document.body.appendChild(menu);
                    // Đóng menu khi click ra ngoài
                    setTimeout(() => {
                        document.addEventListener('click', function handler(ev) {
                            if (!menu.contains(ev.target)) {
                                menu.remove();
                                document.removeEventListener('click', handler);
                            }
                        });
                    }, 10);
                    // Xử lý các chức năng menu
                    document.getElementById('menu-download').onclick = function() {
                        let link;
                        if (items[idx].isDirectory) {
                            link = document.createElement('a');
                            link.href = `/download-folder/${encodeURIComponent(items[idx].name)}`;
                            link.download = items[idx].name + '.zip';
                        } else {
                            link = document.createElement('a');
                            link.href = `/download/${encodeURIComponent(items[idx].name)}`;
                            link.download = items[idx].name;
                        }
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        menu.remove();
                    };
                    document.getElementById('menu-share').onclick = function() {
                        fetch('/api/share-link', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ filename: items[idx].name })
                        })
                        .then(res => res.json())
                        .then(data => {
                            if (data.link) {
                                // Tạo modal hiển thị link chia sẻ với icon copy
                                const modal = document.createElement('div');
                                modal.id = 'share-link-modal';
                                modal.style.position = 'fixed';
                                modal.style.top = '0';
                                modal.style.left = '0';
                                modal.style.width = '100vw';
                                modal.style.height = '100vh';
                                modal.style.background = 'rgba(0,0,0,0.3)';
                                modal.style.display = 'flex';
                                modal.style.alignItems = 'center';
                                modal.style.justifyContent = 'center';
                                modal.style.zIndex = '99999';
                                modal.innerHTML = `
                                    <div style="background:#fff;padding:32px 24px;border-radius:12px;min-width:420px;max-width:520px;box-shadow:0 8px 32px rgba(0,0,0,0.15);position:relative;text-align:center;">
                                        <h2 style="font-size:1.15rem;font-weight:600;margin-bottom:16px;">Link chia sẻ file</h2>
                                        <div style="display:flex;align-items:center;gap:12px;justify-content:center;">
                                            <input id="sharelinkinput" type="text" value="${window.location.origin + data.link}" readonly style="width:340px;padding:8px 12px;border:1px solid #ccc;border-radius:6px;font-size:1rem;">
                                            <span id="copyicon" style="cursor:pointer;font-size:1.5rem;color:#0082c9;" title="Copy"><i class="fas fa-copy"></i></span>
                                        </div>
                                        <div id="copiedmsg" style="color:green;font-size:0.95rem;margin-top:8px;display:none;">Đã copy!</div>
                                        <button id="closeShareModal" style="margin-top:18px;background:#eee;border:none;border-radius:6px;padding:6px 18px;cursor:pointer;">Đóng</button>
                                    </div>
                                `;
                                document.body.appendChild(modal);
                                document.getElementById('closeShareModal').onclick = function() {
                                    document.body.removeChild(modal);
                                };
                                document.getElementById('copyicon').onclick = function() {
                                    const input = document.getElementById('sharelinkinput');
                                    navigator.clipboard.writeText(input.value);
                                    const msg = document.getElementById('copiedmsg');
                                    msg.style.display = 'block';
                                    setTimeout(()=>msg.style.display='none',1200);
                                };
                                // Đóng modal khi click ra ngoài
                                modal.addEventListener('click', function(ev) {
                                    if (ev.target === modal) document.body.removeChild(modal);
                                });
                            } else {
                                alert('Lỗi chia sẻ: ' + (data.error || 'Không thể tạo link!'));
                            }
                            menu.remove();
                        })
                        .catch(() => {
                            alert('Lỗi kết nối server!');
                            menu.remove();
                        });
                    };
                    document.getElementById('menu-delete').onclick = function() {
                        if (items[idx].isDirectory) {
                            // Xóa thư mục
                            if (confirm('Bạn có chắc muốn xóa thư mục này và toàn bộ nội dung bên trong?')) {
                                fetch(`/delete-folder/${encodeURIComponent(items[idx].name)}`, {
                                    method: 'DELETE'
                                })
                                .then(res => res.json())
                                .then(data => {
                                    if (data.message) {
                                        alert('Đã xóa thư mục!');
                                        reloadFilesGrid();
                                    } else {
                                        alert('Lỗi xóa: ' + (data.error || 'Không thể xóa thư mục!'));
                                    }
                                    menu.remove();
                                })
                                .catch(() => {
                                    alert('Lỗi kết nối server!');
                                    menu.remove();
                                });
                            } else {
                                menu.remove();
                            }
                        } else {
                            // Xóa file
                            if (confirm('Bạn có chắc muốn xóa file này?')) {
                                fetch(`/delete-file/${encodeURIComponent(items[idx].name)}`, {
                                    method: 'DELETE'
                                })
                                .then(res => res.json())
                                .then(data => {
                                    if (data.message) {
                                        alert('Đã xóa file!');
                                        reloadFilesGrid();
                                    } else {
                                        alert('Lỗi xóa: ' + (data.error || 'Không thể xóa file!'));
                                    }
                                    menu.remove();
                                })
                                .catch(() => {
                                    alert('Lỗi kết nối server!');
                                    menu.remove();
                                });
                            } else {
                                menu.remove();
                            }
                        }
                    };
                });
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

    // Thêm chức năng tạo thư mục khi nhấn nút #newbtn
    const newBtn = document.getElementById('newbtn');
    if (newBtn) {
        newBtn.addEventListener('click', function (e) {
            // Tạo modal
            const modal = document.createElement('div');
            modal.id = 'create-folder-modal';
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100vw';
            modal.style.height = '100vh';
            modal.style.background = 'rgba(0,0,0,0.3)';
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            modal.style.zIndex = '9999';
            modal.innerHTML = `
            <div style="background:#fff;padding:32px 24px;border-radius:12px;min-width:320px;box-shadow:0 8px 32px rgba(0,0,0,0.15);position:relative;">
                <h2 style="font-size:1.25rem;font-weight:600;margin-bottom:16px;">Tạo thư mục</h2>
                <input type="text" id="folderNameInput" placeholder="Nhập tên thư mục" style="width:100%;padding:8px 12px;border:1px solid #ccc;border-radius:6px;margin-bottom:20px;font-size:1rem;">
                <div style="display:flex;justify-content:flex-end;gap:8px;">
                    <button id="cancelCreateFolder" style="padding:8px 16px;background:#eee;border:none;border-radius:6px;font-size:1rem;cursor:pointer;">Hủy</button>
                    <button id="confirmCreateFolder" style="padding:8px 16px;background:#0082c9;color:#fff;border:none;border-radius:6px;font-size:1rem;cursor:pointer;">Tạo</button>
                </div>
            </div>
        `;
            document.body.appendChild(modal);

            // Đóng modal khi nhấn Hủy hoặc ngoài modal
            modal.addEventListener('click', function (ev) {
                if (ev.target === modal) {
                    document.body.removeChild(modal);
                }
            });
            document.getElementById('cancelCreateFolder').onclick = function () {
                document.body.removeChild(modal);
            };
            // Xử lý tạo thư mục
            document.getElementById('confirmCreateFolder').onclick = function () {
                const folderName = document.getElementById('folderNameInput').value.trim();
                if (!folderName) {
                    alert('Vui lòng nhập tên thư mục!');
                    return;
                }
                fetch('/create-folder', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ folderName })
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.message) {
                            alert('Tạo thư mục thành công!');
                            reloadFilesGrid();
                        } else {
                            alert('Lỗi: ' + (data.error || 'Không thể tạo thư mục!'));
                        }
                        document.body.removeChild(modal);
                    })
                    .catch(() => {
                        alert('Lỗi kết nối server!');
                        document.body.removeChild(modal);
                    });
            };
            // Tự động focus vào ô nhập
            setTimeout(() => {
                const input = document.getElementById('folderNameInput');
                input.focus();
                input.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        document.getElementById('confirmCreateFolder').click();
                    }
                });
            }, 100);
        });
    }

    // Lần đầu load
    reloadFilesGrid();
});