let image, canvas, ctx;
let grid = [];
let selectedCells = new Set();
let grayscaleImage; // Сохраним результат градации серого
let selectedCellsCount = 0; // Счётчик выбранных клеток
const WORKSPACE_WIDTH = 700; // Ширина рабочей зоны
const WORKSPACE_HEIGHT = 500; // Высота рабочей зоны
let scaledDimensions = {}; // Для сохранения масштабированных размеров изображения

function addNewGoal() {
    const goal = prompt("Enter your new goal:");
    if (goal) {
        const goalList = document.getElementById('goalList');
        const listItem = document.createElement('li');
        listItem.textContent = goal;
        goalList.appendChild(listItem);
    }
}


function triggerFileUpload() {
    document.getElementById('fileInput').click();
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            image = new Image();
            image.src = e.target.result;
            image.alt = file.name;
            image.onload = function () {
                createCanvas();
                fitImageToCanvas();
                convertToGrayscale(); // Преобразуем в градации серого

                if (!document.querySelector('.divide-button')) {
                    const divideButton = document.createElement('button');
                    divideButton.textContent = 'DIVIDE';
                    divideButton.className = 'divide-button';
                    divideButton.onclick = function () {
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
    canvas.width = WORKSPACE_WIDTH;
    canvas.height = WORKSPACE_HEIGHT;

    const imageContainer = document.getElementById('imageContainer');
    imageContainer.innerHTML = '';
    imageContainer.appendChild(canvas);
}

function fitImageToCanvas() {
    const scale = Math.min(
        WORKSPACE_WIDTH / image.width,
        WORKSPACE_HEIGHT / image.height
    );

    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;

    const xOffset = (WORKSPACE_WIDTH - scaledWidth) / 2;
    const yOffset = (WORKSPACE_HEIGHT - scaledHeight) / 2;

    scaledDimensions = { xOffset, yOffset, scaledWidth, scaledHeight }; // Сохраняем масштабированные размеры

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, image.width, image.height, xOffset, yOffset, scaledWidth, scaledHeight);
}

function convertToGrayscale() {
    if (!ctx) return;

    const { xOffset, yOffset, scaledWidth, scaledHeight } = scaledDimensions;
    const imageData = ctx.getImageData(xOffset, yOffset, scaledWidth, scaledHeight);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i + 1] = data[i + 2] = avg; // Устанавливаем среднее значение
    }
    grayscaleImage = imageData; // Сохраняем преобразованное изображение
    ctx.putImageData(grayscaleImage, xOffset, yOffset);
}

function openModal() {
    const modal = document.getElementById('modal');
    if (modal) modal.style.display = "block";
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) modal.style.display = "none";
}

window.onclick = function (event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        closeModal();
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
    const { xOffset, yOffset, scaledWidth, scaledHeight } = scaledDimensions;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(grayscaleImage, xOffset, yOffset);

    grid = [];
    selectedCells.clear();
    selectedCellsCount = 0; // Сбрасываем выбранные клетки

    const aspectRatio = scaledWidth / scaledHeight;
    let cols = Math.round(Math.sqrt(divideNumber * aspectRatio));
    let rows = Math.round(divideNumber / cols);

    while (cols * rows < divideNumber) {
        cols++;
        rows = Math.ceil(divideNumber / cols);
    }

    const colWidth = scaledWidth / cols;
    const rowHeight = scaledHeight / rows;

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            if (grid.length >= divideNumber) break;

            const cell = {
                x: xOffset + i * colWidth,
                y: yOffset + j * rowHeight,
                width: colWidth,
                height: rowHeight
            };
            grid.push(cell);
            ctx.strokeRect(cell.x, cell.y, cell.width, cell.height);
        }
    }

    updateProgress(); // Обновляем прогресс после построения сетки

    canvas.addEventListener('click', handleCanvasClick);
}

function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const cell = grid.find(cell => x >= cell.x && x < cell.x + cell.width && y >= cell.y && y < cell.y + cell.height);
    if (cell) {
        toggleCellColor(cell);
        updateProgress(); // Обновляем прогресс после выбора клетки
    }
}

function toggleCellColor(cell) {
    if (selectedCells.has(cell)) return;

    selectedCells.add(cell);
    selectedCellsCount++;
    ctx.drawImage(
        image,
        (cell.x - scaledDimensions.xOffset) * (image.width / scaledDimensions.scaledWidth),
        (cell.y - scaledDimensions.yOffset) * (image.height / scaledDimensions.scaledHeight),
        cell.width * (image.width / scaledDimensions.scaledWidth),
        cell.height * (image.height / scaledDimensions.scaledHeight),
        cell.x,
        cell.y,
        cell.width,
        cell.height
    );
}

function updateProgress() {
    const totalCells = grid.length;
    const progressPercentage = Math.round((selectedCellsCount / totalCells) * 100);
    document.getElementById('progressText').textContent = `Progress: ${progressPercentage}%`;
}

function toggleCalculator() {
    const calculator = document.getElementById('calculator');
    if (calculator.style.display === 'none') {
        calculator.style.display = 'block';
    } else {
        calculator.style.display = 'none';
    }
}


