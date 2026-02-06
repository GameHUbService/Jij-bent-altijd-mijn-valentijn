// --- CONFIGURACIÓN DE IMÁGENES ---
const puzzleImages = [
    'images/ft1.jpg',
    'images/ft2.jpg',
    'images/ft3.jpg',
    'images/ft4.jpg'
];

// --- CONFIGURACIÓN DE AUDIO (NUEVO) ---
// Ruta relativa a la carpeta 'sound'
const bgMusic = new Audio('sound/Pausa Y Guardo.mp3'); 
bgMusic.loop = true; // Para que se repita infinitamente
bgMusic.volume = 0.6; // Volumen al 60% para que no aturda

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

// Globales para botones HTML
window.restartGame = function() {
    clearAllPieces(); 
    startGame();
    // Nota: No detenemos la música aquí para que siga fluyendo si reinicia
};

window.exitGame = function() {
    clearAllPieces();
    showScreen('canvas-1');
    setBlur(false);
    clearInterval(timerInterval);
    
    // --- DETENER MÚSICA AL SALIR ---
    bgMusic.pause();
    bgMusic.currentTime = 0; // Reiniciar canción al principio
};

// --- FUNCIÓN DE LIMPIEZA TOTAL ---
function clearAllPieces() {
    const allPieces = document.querySelectorAll('.piece');
    allPieces.forEach(piece => piece.remove());
    
    if(puzzleBoard) puzzleBoard.innerHTML = '';
    if(piecesContainer) piecesContainer.innerHTML = '';
}

// --- FLUJO DEL JUEGO ---

btnPlay.addEventListener('click', () => {
    // --- INICIAR MÚSICA AL JUGAR ---
    // Los navegadores requieren interacción del usuario (click) para sonar
    bgMusic.play().catch(error => {
        console.log("El navegador bloqueó el autoplay, revisa permisos: ", error);
    });

    showScreen('canvas-2');
    setBlur(true);
    
    setTimeout(() => {
        startGame();
    }, 5000);
});

function startGame() {
    showScreen('canvas-3');
    resetGameVariables();
    clearAllPieces(); 
    
    // Elegir foto random
    const randomIndex = Math.floor(Math.random() * puzzleImages.length);
    currentImage = puzzleImages[randomIndex];
    
    // Configurar Preview
    previewOverlay.style.backgroundImage = `url('${currentImage}')`;
    previewOverlay.style.backgroundSize = '450px 450px';
    previewOverlay.style.display = 'block';
    
    // 3 segundos viendo la imagen
    setTimeout(() => {
        previewOverlay.style.display = 'none';
        createPuzzle();
        startTimer();
    }, 3000);
}

function resetGameVariables() {
    moves = 0;
    timeRemaining = 30;
    correctPieces = 0;
    updateStats();
    clearInterval(timerInterval);
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

// --- ARRASTRE ---

function makeDraggable(el) {
    const startDrag = (e) => {
        if (el.classList.contains('snapped')) return;
        e.preventDefault();
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const rect = el.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        const offsetY = clientY - rect.top;
        
        document.body.appendChild(el);
        el.style.position = 'fixed';
        el.style.zIndex = 1000;
        
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
            
            el.style.zIndex = 100;
            moves++;
            updateStats();
            
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
    
    if (slot) {
        const pRect = piece.getBoundingClientRect();
        const sRect = slot.getBoundingClientRect();
        const dist = Math.hypot(pRect.left - sRect.left, pRect.top - sRect.top);
        
        if (dist < 60) {
            slot.appendChild(piece);
            piece.style.position = 'absolute';
            piece.style.left = '0';
            piece.style.top = '0';
            piece.classList.add('snapped');
            
            correctPieces++;
            if (correctPieces === 9) gameWin();
        }
    }
}