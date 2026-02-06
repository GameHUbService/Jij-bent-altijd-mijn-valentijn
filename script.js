// --- CONFIGURACIÓN DE IMÁGENES ---
const puzzleImages = [
    'images/ft1.jpg',
    'images/ft2.jpg',
    'images/ft3.jpg',
    'images/ft4.jpg'
];

// --- CONFIGURACIÓN DE AUDIO ---
// IMPORTANTE: Asegúrate de subir la carpeta "sound" a GitHub para que esto funcione.
const bgMusic = new Audio('sound/Pausa Y Guardo.mp3'); 
bgMusic.loop = true; 
bgMusic.volume = 0.6; 

// Variables del juego
let currentImage = '';
let moves = 0;
let timeRemaining = 30; 
let timerInterval;
let correctPieces = 0;

// Referencias HTML
const bgLayer = document.getElementById('bg-layer');
const btnPlay = document.getElementById('btn-play');
const movesDisplay = document.getElementById('moves');
const timeDisplay = document.getElementById('timer');
const puzzleBoard = document.getElementById('puzzle-board');
const piecesContainer = document.getElementById('pieces-container');
const previewOverlay = document.getElementById('preview-overlay');

// --- FUNCIONES DE NAVEGACIÓN ---

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

function setBlur(active) {
    active ? bgLayer.classList.add('blur-effect') : bgLayer.classList.remove('blur-effect');
}

window.restartGame = function() {
    clearAllPieces(); 
    startGame();
};

window.exitGame = function() {
    clearAllPieces();
    showScreen('canvas-1');
    setBlur(false);
    clearInterval(timerInterval);
    bgMusic.pause();
    bgMusic.currentTime = 0; 
};

function clearAllPieces() {
    const allPieces = document.querySelectorAll('.piece');
    allPieces.forEach(piece => piece.remove());
    if(puzzleBoard) puzzleBoard.innerHTML = '';
    if(piecesContainer) piecesContainer.innerHTML = '';
}

// --- FLUJO DEL JUEGO ---

btnPlay.addEventListener('click', () => {
    // Intentar reproducir audio al interactuar
    bgMusic.play().catch(error => {
        console.log("Audio esperando interacción: ", error);
    });

    showScreen('canvas-2');
    setBlur(true);
    
    setTimeout(() => {
        startGame();
    }, 4000);
});

function startGame() {
    showScreen('canvas-3');
    resetGameVariables();
    clearAllPieces(); 
    
    const randomIndex = Math.floor(Math.random() * puzzleImages.length);
    currentImage = puzzleImages[randomIndex];
    
    previewOverlay.style.backgroundImage = `url('${currentImage}')`;
    previewOverlay.style.backgroundSize = '450px 450px';
    previewOverlay.style.display = 'block';
    
    setTimeout(() => {
        previewOverlay.style.display = 'none';
        createPuzzle();
        startTimer();
    }, 3000);
}

function resetGameVariables() {
    moves = 0; timeRemaining = 30; correctPieces = 0;
    updateStats(); clearInterval(timerInterval);
}

function updateStats() {
    movesDisplay.innerText = `Movimientos: ${moves}`;
    let sec = timeRemaining % 60;
    timeDisplay.innerText = `Tiempo: 00:${sec < 10 ? '0'+sec : sec}`;
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateStats();
        if (timeRemaining <= 0) gameOver();
    }, 1000);
}

function gameOver() {
    clearInterval(timerInterval);
    clearAllPieces(); 
    showScreen('canvas-4');
}

function gameWin() {
    clearInterval(timerInterval);
    setTimeout(() => {
        showScreen('canvas-5');
    }, 500);
}

// --- LÓGICA DEL PUZZLE ---

function createPuzzle() {
    for (let i = 0; i < 9; i++) {
        const slot = document.createElement('div');
        slot.classList.add('slot');
        slot.dataset.index = i;
        puzzleBoard.appendChild(slot);
    }

    let pieces = [];
    for (let i = 0; i < 9; i++) {
        const piece = document.createElement('div');
        piece.classList.add('piece');
        piece.style.backgroundImage = `url('${currentImage}')`;
        piece.style.backgroundSize = '450px 450px';
        
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = col * -150; 
        const y = row * -150;
        piece.style.backgroundPosition = `${x}px ${y}px`;
        
        piece.dataset.correctIndex = i;
        pieces.push(piece);
    }

    pieces.sort(() => Math.random() - 0.5);
    
    pieces.forEach(p => {
        const randX = Math.random() * 200; 
        const randY = Math.random() * 30;
        p.style.left = randX + 'px';
        p.style.top = randY + 'px';
        
        piecesContainer.appendChild(p);
        makeDraggable(p);
    });
}

// --- ARRASTRE CORREGIDO (Sin saltos) ---

function makeDraggable(el) {
    const startDrag = (e) => {
        if (el.classList.contains('snapped')) return;
        e.preventDefault();
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const rect = el.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        const offsetY = clientY - rect.top;
        
        // Mover al body
        document.body.appendChild(el);
        el.style.position = 'fixed';
        el.style.zIndex = 1000;
        
        // CORRECCIÓN CLAVE: Fijar la posición INMEDIATAMENTE para que no salte
        el.style.left = (clientX - offsetX) + 'px';
        el.style.top = (clientY - offsetY) + 'px';
        // Mantener tamaño visual exacto
        el.style.width = rect.width + 'px';
        el.style.height = rect.height + 'px';
        
        const move = (e) => {
            const cx = e.touches ? e.touches[0].clientX : e.clientX;
            const cy = e.touches ? e.touches[0].clientY : e.clientY;
            el.style.left = (cx - offsetX) + 'px';
            el.style.top = (cy - offsetY) + 'px';
        };
        
        const end = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', end);
            document.removeEventListener('touchmove', move);
            document.removeEventListener('touchend', end);
            
            checkMagnet(el);
        };
        
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', end);
        document.addEventListener('touchmove', move, {passive: false});
        document.addEventListener('touchend', end);
    };
    
    el.addEventListener('mousedown', startDrag);
    el.addEventListener('touchstart', startDrag, {passive: false});
}

function checkMagnet(piece) {
    const correctIndex = piece.dataset.correctIndex;
    const slot = document.querySelector(`.slot[data-index='${correctIndex}']`);
    
    let snapped = false;

    if (slot) {
        const pRect = piece.getBoundingClientRect();
        const sRect = slot.getBoundingClientRect();
        
        const pCenterX = pRect.left + pRect.width / 2;
        const pCenterY = pRect.top + pRect.height / 2;
        const sCenterX = sRect.left + sRect.width / 2;
        const sCenterY = sRect.top + sRect.height / 2;

        const dist = Math.hypot(pCenterX - sCenterX, pCenterY - sCenterY);
        
        if (dist < 60) {
            slot.appendChild(piece);
            // Resetear estilos para encajar en el slot
            piece.style.position = 'absolute';
            piece.style.left = '0';
            piece.style.top = '0';
            piece.style.width = '100%';
            piece.style.height = '100%';
            piece.classList.add('snapped');
            
            correctPieces++;
            snapped = true;
            if (correctPieces === 9) gameWin();
        }
    }
    
    if (!snapped) {
        // Regresar a la caja si no encaja
        piecesContainer.appendChild(piece);
        piece.style.position = 'absolute';
        piece.style.width = '150px'; 
        piece.style.height = '150px';
        piece.style.zIndex = 100;
        piece.style.left = Math.random() * 200 + 'px';
        piece.style.top = Math.random() * 30 + 'px';
        moves++;
        updateStats();
    }
}
