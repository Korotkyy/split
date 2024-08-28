let image, canvas, ctx;
let grid = [];
let selectedCells = new Set();

function triggerFileUpload() {
    document.getElementById('fileInput').click();
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            image = new Image();
            image.src = e.target.result;
            image.alt = file.name;
            image.onload = function() {
                createCanvas();
                convertToGrayscale();
                drawGrid(0);

                if (!document.querySelector('.divide-button')) {
                    const divideButton = document.createElement('button');
                    divideButton.textContent = 'DIVIDE';
                    divideButton.className = 'divide-button';
                    divideButton.onclick = function() {
                        openModal();
                    };
                    const buttonContainer = document.getElementById('buttonContainer');
                    buttonContainer.appendChild(divideButton);
                }
            };
        };
        reader.readAsDataURL(file);
    }
}

function createCanvas() {
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    const imageContainer = document.getElementById('imageContainer');
    imageContainer.innerHTML = '';
    imageContainer.appendChild(canvas);
}

function convertToGrayscale() {
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i + 1] = data[i + 2] = avg;
    }
    ctx.putImageData(imageData, 0, 0);
}

function openModal() {
    document.getElementById('modal').style.display = "block";
}

function closeModal() {
    document.getElementById('modal').style.display = "none";
}

window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

function divideImage() {
    const divideNumber = parseInt(document.getElementById('divideNumber').value);
    if (divideNumber && divideNumber > 0) {
        drawGrid(divideNumber);
        closeModal();
    } else {
        alert('Пожалуйста, введите корректное число.');
    }
}

function drawGrid(divideNumber) {
    if (divideNumber > 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        convertToGrayscale();
    }
    
    grid = [];
    selectedCells.clear();

    if (divideNumber > 0) {
        const cols = Math.floor(Math.random() * (divideNumber - 1)) + 1;
        const rows = Math.ceil(divideNumber / cols);
        const colWidth = canvas.width / cols;
        const rowHeight = canvas.height / rows;

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                grid.push({ x: i * colWidth, y: j * rowHeight, width: colWidth, height: rowHeight });
            }
        }

        grid.forEach(cell => {
            ctx.strokeRect(cell.x, cell.y, cell.width, cell.height);
        });

        canvas.addEventListener('click', handleCanvasClick);
    } else {
        canvas.removeEventListener('click', handleCanvasClick);
    }
}

function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const cell = grid.find(cell => x >= cell.x && x < cell.x + cell.width && y >= cell.y && y < cell.y + cell.height);
    if (cell) {
        toggleCellColor(cell);
    }
}

function toggleCellColor(cell) {
    if (selectedCells.has(cell)) {
        return;
    }

    selectedCells.add(cell);
    ctx.drawImage(image, cell.x, cell.y, cell.width, cell.height, cell.x, cell.y, cell.width, cell.height);
}
