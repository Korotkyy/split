let image, canvas, ctx;
let grid = [];
let selectedCells = new Set();
let grayscaleImage; // Сохраним результат градации серого
let selectedCellsCount = 0; // Счётчик выбранных клеток
const WORKSPACE_WIDTH = 700; // Ширина рабочей зоны
const WORKSPACE_HEIGHT = 500; // Высота рабочей зоны
let scaledDimensions = {}; // Для сохранения масштабированных размеров изображения

document.addEventListener('DOMContentLoaded', () => {
    const goalList = document.getElementById('goalList');
    if (goalList) {
        goalList.addEventListener('click', (event) => {
            const target = event.target.closest('li'); // Ищем кликнутый элемент li

            // Проверяем, что это действительно элемент списка
            if (target && target.tagName === 'LI') {
                const inputField = target.querySelector('input'); // Ищем поле input внутри цели
                const goalText = target.querySelector('span').textContent.trim(); // Текст цели
                const goalCount = parseInt(inputField.value, 10); // Текущее значение

                // Если поле ввода валидно
                if (!isNaN(goalCount) && goalCount > 0) {
                    // Уменьшаем значение в input
                    inputField.value = goalCount - 1;

                    // Закрашиваем случайное поле
                    paintRandomCell();

                    // Если цель выполнена
                    if (goalCount - 1 === 0) {
                        target.style.textDecoration = 'line-through'; // Зачёркиваем текст
                    }
                } else {
                    alert('Все действия для этой цели уже выполнены!');
                }
            }
        });
    } else {
        console.error("Элемент с id='goalList' не найден.");
    }
}); // <-- Закрытие основного обработчика DOMContentLoaded



function paintRandomCell() {
    const unselectedCells = Array.from(grid).filter((cell) => !selectedCells.has(cell)); // Неиспользованные клетки
    if (unselectedCells.length > 0) {
        const randomCell = unselectedCells[Math.floor(Math.random() * unselectedCells.length)];
        toggleCellColor(randomCell); // Закрашиваем клетку
        updateProgress(); // Обновляем прогресс
    } else {
        alert('Нет доступных клеток для закрашивания!');
    }
}


function addNewGoal() {
    const goalText = document.getElementById('goalInput').value.trim(); // Получаем текст цели
    const goalNumber = parseInt(document.getElementById('goalNumber').value, 10); // Получаем число

    // Проверка корректности ввода
    if (goalText && !isNaN(goalNumber) && goalNumber > 0) {
        const goalList = document.getElementById('goalList'); // Получаем список целей

        // Создаём новый элемент списка
        const li = document.createElement('li');
        li.classList.add('goal-item');
        li.innerHTML = `
            <span>${goalText}</span>
            <input type="number" value="${goalNumber}" min="0" readonly />
        `;

        // Создаём плавающую кнопку
        const floatButton = document.createElement('button');
        floatButton.textContent = '▼';
        floatButton.className = 'floating-btn';
        floatButton.onclick = () => toggleDropdown(li); // Привязываем функцию

        // Добавляем кнопку в элемент списка
        li.appendChild(floatButton);

        // Добавляем новый элемент в список
        goalList.appendChild(li);

        // Очищаем поля ввода
        document.getElementById('goalInput').value = '';
        document.getElementById('goalNumber').value = '';
    } else {
        alert('Please enter a valid goal and a number greater than 0.');
    }
}

// Обработка dropdown для каждой цели
function toggleDropdown(goalElement) {
    // Если dropdown уже существует, удаляем его
    let dropdown = goalElement.querySelector('.dropdown-container');
    if (dropdown) {
        dropdown.remove();
        return;
    }

    // Создаём контейнер для dropdown
    dropdown = document.createElement('div');
    dropdown.className = 'dropdown-container';

    // Добавляем поле ввода и кнопку
    const input = document.createElement('input');
    input.type = 'number';
    input.placeholder = 'Enter cubes to color';
    input.className = 'dropdown-input';

    const button = document.createElement('button');
    button.textContent = 'Paint';
    button.className = 'dropdown-button';
    button.onclick = () => paintMultipleCells(goalElement, input.value);

    // Добавляем элементы в dropdown
    dropdown.appendChild(input);
    dropdown.appendChild(button);

    // Добавляем dropdown к цели
    goalElement.appendChild(dropdown);
}

// Закрашивание нескольких клеток
function paintMultipleCells(goalElement, count) {
    const inputField = goalElement.querySelector('input[type="number"]');
    const remainingCells = parseInt(inputField.value, 10);
    const cellsToPaint = parseInt(count, 10);

    // Проверяем корректность ввода
    if (isNaN(cellsToPaint) || cellsToPaint <= 0) {
        alert('Please enter a valid number greater than 0.');
        return;
    }

    if (cellsToPaint > remainingCells) {
        alert(`You can only paint up to ${remainingCells} cells.`);
        return;
    }

    // Закрашиваем клетки
    for (let i = 0; i < cellsToPaint; i++) {
        paintRandomCell();
    }

    // Обновляем значение цели
    inputField.value = remainingCells - cellsToPaint;

    // Если цель выполнена
    if (remainingCells - cellsToPaint === 0) {
        goalElement.style.textDecoration = 'line-through';
    }
}




function calculateTotalDivisions() {
    const inputs = document.querySelectorAll('#goalList input[type="number"]');
    let totalDivisions = 0;

    inputs.forEach(input => {
        const value = parseInt(input.value, 10);
        if (!isNaN(value) && value > 0) { // Проверяем, что значение является числом и больше нуля
            totalDivisions += value;
        }
    });

    return totalDivisions;
}




function triggerFileUpload() {
    document.getElementById('fileInput').click(); // Открыть окно выбора файла
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            // Сбрасываем цели
            resetGoals();

            // Создаём объект изображения
            image = new Image();
            image.src = e.target.result;
            image.alt = file.name;
            image.onload = function () {
                // Создаём холст и добавляем изображение
                createCanvas();
                fitImageToCanvas();
                convertToGrayscale(); // Преобразуем в градации серого

                // Перемещаем кнопку Upload Image под изображение
                const uploadButton = document.getElementById('uploadButton');
                uploadButton.classList.add('below-image');

                // Добавляем кнопку Divide, если её ещё нет
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

// Функция для сброса целей
function resetGoals() {
    const goalList = document.getElementById('goalList');
    goalList.innerHTML = ''; // Очищаем список целей

    const goalInput = document.getElementById('goalInput');
    const goalNumber = document.getElementById('goalNumber');
    goalInput.value = ''; // Очищаем текстовое поле
    goalNumber.value = ''; // Очищаем числовое поле
}

function addNewGoal() {
    const goalText = document.getElementById('goalInput').value.trim(); // Получаем текст цели
    const goalNumber = parseInt(document.getElementById('goalNumber').value, 10); // Получаем число

    // Проверка корректности ввода
    if (goalText && !isNaN(goalNumber) && goalNumber > 0) {
        const goalList = document.getElementById('goalList'); // Получаем список целей

        // Создаём новый элемент списка
        const li = document.createElement('li');
        li.classList.add('goal-item');
        li.innerHTML = `
            <span>${goalText}</span>
            <input type="number" value="${goalNumber}" min="0" readonly />
        `;

        // Создаём плавающую кнопку
        const floatButton = document.createElement('button');
        floatButton.textContent = '▼';
        floatButton.className = 'floating-btn';
        floatButton.onclick = () => toggleDropdownForGoal(li);

        // Добавляем кнопку в элемент списка
        li.appendChild(floatButton);

        // Добавляем новый элемент в список
        goalList.appendChild(li);

        // Очищаем поля ввода
        document.getElementById('goalInput').value = '';
        document.getElementById('goalNumber').value = '';
    } else {
        alert('Please enter a valid goal and a number greater than 0.');
    }
}

function toggleDropdownForGoal(goalElement) {
    // Если dropdown уже существует, удаляем его
    let dropdown = goalElement.querySelector('.dropdown-container');
    if (dropdown) {
        dropdown.remove();
        return;
    }

    // Создаём контейнер для dropdown
    dropdown = document.createElement('div');
    dropdown.className = 'dropdown-container';

    // Создаём поле ввода и кнопку
    const input = document.createElement('input');
    input.type = 'number';
    input.placeholder = 'Enter cubes to color';
    input.className = 'dropdown-input';

    const button = document.createElement('button');
    button.textContent = 'Paint';
    button.className = 'dropdown-button';
    button.onclick = () => {
        const count = parseInt(input.value, 10);
        if (!isNaN(count) && count > 0) {
            paintMultipleCells(goalElement, count);
            dropdown.remove(); // Убираем dropdown после применения
        } else {
            alert('Please enter a valid number greater than 0.');
        }
    };

    // Добавляем элементы в dropdown
    dropdown.appendChild(input);
    dropdown.appendChild(button);

    // Вставляем dropdown в цель
    goalElement.appendChild(dropdown);
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

window.onclick = function (event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        closeModal();
    }
}

function divideImage() {
    const totalDivisions = calculateTotalDivisions();
    if (totalDivisions > 0) {
        drawGrid(totalDivisions);
    } else {
        alert('Please specify valid numbers for all goals.');
    }
}
console.log(`Total cells required: ${calculateTotalDivisions()}`);



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

document.addEventListener('DOMContentLoaded', () => {
    const divideButton = document.querySelector('.divide-button');
    if (divideButton) {
        divideButton.addEventListener('click', () => {
            const totalDivisions = calculateTotalDivisions();
            if (totalDivisions > 0) {
                drawGrid(totalDivisions);
            } else {
                alert('Please specify valid numbers for all goals.');
            }
        });
    }
});

function resizeCanvas() {
    const canvas = document.querySelector('canvas'); // Найти canvas
    if (canvas) {
        // Устанавливаем размеры холста равными текущим размерам элемента
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // При необходимости можно обновить содержимое
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Очищаем холст

        // Пример: Добавьте сюда код для перерисовки изображения
        if (image) {
            const scale = Math.min(
                canvas.width / image.width,
                canvas.height / image.height
            );
            const scaledWidth = image.width * scale;
            const scaledHeight = image.height * scale;
            const xOffset = (canvas.width - scaledWidth) / 2;
            const yOffset = (canvas.height - scaledHeight) / 2;

            ctx.drawImage(image, 0, 0, image.width, image.height, xOffset, yOffset, scaledWidth, scaledHeight);
        }
    }
}

// Вызываем при загрузке страницы и изменении размера окна
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);




