// --- DATOS DEL JUEGO ---
// Solo incluimos 4 hermanos en la lista total.
// Uno será el jugador y los otros 3 serán la IA.
const HERMANOS = [
    // ¡Asegúrate de que el nombre del archivo en 'image' coincida con tu carpeta 'images'!
    { id: 'h1', name: 'Monchi', color: '#10b981', image: 'images/monchi.png' },
    { id: 'h2', name: 'Yimmy', color: '#ef4444', image: 'images/yimi.png' },
    { id: 'h3', name: 'Willy', color: '#f59e0b', image: 'images/wili.png' },
    { id: 'h4', name: 'Gaby', color: '#a855f7', image: 'images/gaby.png' },
];

let selectedPlayerId = null;
const RACERS_COUNT = 4; // Cambiado a 4 corredores en total (1 Jugador + 3 IA)
const TRACK_LENGTH = 100; // La meta está en 100
let racersData = [];
let gameInterval;
let isGameRunning = false;

// --- ELEMENTOS DEL DOM ---
const $selectionScreen = document.getElementById('selection-screen');
const $gameScreen = document.getElementById('game-screen');
const $resultScreen = document.getElementById('result-screen');
const $characterSelector = document.getElementById('character-selector');
const $startButton = document.getElementById('start-button');
const $runButton = document.getElementById('run-button');
const $raceTrack = document.getElementById('race-track');
const $resultMessage = document.getElementById('result-message');
const $restartButton = document.getElementById('restart-button');

// --- FUNCIÓN DE INICIO ---
document.addEventListener('DOMContentLoaded', () => {
    renderCharacterSelection();
    setupEventListeners();
});

// --- RENDERIZADO ---

function renderCharacterSelection() {
    $characterSelector.innerHTML = '';
    HERMANOS.forEach(brother => {
        const card = document.createElement('div');
        card.className = 'char-card';
        card.setAttribute('data-id', brother.id);
        card.innerHTML = `
            <img src="${brother.image}" alt="${brother.name}" style="background-color: ${brother.color};">
            <h3>${brother.name}</h3>
        `;
        
        card.addEventListener('click', () => {
            selectCharacter(brother.id);
        });
        
        $characterSelector.appendChild(card);
    });
}

function renderRacers() {
    $raceTrack.innerHTML = '';
    
    // El ancho de la pista en píxeles (para cálculos de posición)
    const trackWidth = $raceTrack.offsetWidth - 80; // 80px es el ancho de la meta

    racersData.forEach(racer => {
        const racerElement = document.createElement('div');
        racerElement.className = `racer ${racer.isPlayer ? 'player-racer' : 'ia-racer'}`;
        racerElement.setAttribute('data-id', racer.id);
        racerElement.style.top = `${racer.index * 35}px`; // Espaciado vertical

        // Calcular la posición horizontal
        const positionX = (racer.position / TRACK_LENGTH) * trackWidth;

        racerElement.innerHTML = `
            <span class="racer-name" style="left: ${positionX}px;">${racer.name}</span>
            <div class="racer-icon" style="transform: translateX(${positionX}px);" data-face-state="right">
                <img src="${racer.image}" alt="${racer.name}" style="background-color: ${racer.color};">
                <div class="mamadera-icon"></div>
            </div>
        `;
        $raceTrack.appendChild(racerElement);
    });
}

function updateRacersUI() {
    // El ancho de la pista en píxeles (para cálculos de posición)
    const trackWidth = $raceTrack.offsetWidth - 80; // 80px es el ancho de la meta
    
    racersData.forEach(racer => {
        const $racerElement = $raceTrack.querySelector(`[data-id="${racer.id}"]`);
        if ($racerElement) {
            const positionX = Math.min(racer.position, TRACK_LENGTH) / TRACK_LENGTH * trackWidth;
            const $icon = $racerElement.querySelector('.racer-icon');
            const $name = $racerElement.querySelector('.racer-name');
            
            $icon.style.transform = `translateX(${positionX}px)`;
            $name.style.left = `${positionX}px`;

            // Lógica para rotar la cara (dinamismo)
            if (Math.random() > 0.8) {
                const isRight = $icon.getAttribute('data-face-state') === 'right';
                $icon.setAttribute('data-face-state', isRight ? 'left' : 'right');
                $icon.classList.toggle('mirando-izquierda', isRight);
            }
        }
    });
}

// --- LÓGICA DEL JUEGO ---

function selectCharacter(id) {
    selectedPlayerId = id;
    
    // Quita la selección de todos
    document.querySelectorAll('.char-card').forEach(card => card.classList.remove('selected'));
    
    // Selecciona el elegido
    const $selectedCard = document.querySelector(`.char-card[data-id="${id}"]`);
    if ($selectedCard) {
        $selectedCard.classList.add('selected');
        $startButton.disabled = false;
    }
}

function startGame() {
    if (!selectedPlayerId) return;

    // 1. Inicializar datos de corredores
    const selectedBrother = HERMANOS.find(h => h.id === selectedPlayerId);
    
    // Los corredores IA son todos excepto el jugador
    let aiRacers = HERMANOS.filter(h => h.id !== selectedPlayerId).slice(0, RACERS_COUNT - 1);

    // Añadir al jugador a la lista de corredores
    racersData = [
        { ...selectedBrother, position: 0, isPlayer: true, index: 0 },
        ...aiRacers.map((r, i) => ({ 
            ...r, 
            position: 0, 
            isPlayer: false, 
            index: i + 1 
        }))
    ];

    // 2. Transicionar vistas
    $selectionScreen.classList.add('hidden');
    $gameScreen.classList.remove('hidden');
    $resultScreen.classList.add('hidden');
    
    isGameRunning = true;
    
    // 3. Renderizar y comenzar la carrera
    renderRacers();
    gameInterval = setInterval(updateGame, 100); // 10 veces por segundo
}

function updateGame() {
    if (!isGameRunning) return;

    // Movimiento de la IA (todos excepto el jugador)
    racersData.filter(r => !r.isPlayer).forEach(racer => {
        // Velocidad de la IA (Ajustado para que sea un buen reto)
        // Se mueve entre 1.0 y 3.5 por tick
        const speed = Math.random() * (4.0 - 2.5) + 1.5; 
        racer.position += speed;
    });

    // 4. Actualizar la interfaz gráfica
    updateRacersUI();

    // 5. Comprobar la meta
    const winner = racersData.find(racer => racer.position >= TRACK_LENGTH);
    if (winner) {
        endGame(winner);
    }
}

function movePlayer() {
    if (!isGameRunning) return;

    const player = racersData.find(r => r.isPlayer);
    if (player) {
        // El jugador avanza un número fijo por toque
        const playerSpeed = 3.5; 
        player.position += playerSpeed;

        // Actualizar la UI inmediatamente
        updateRacersUI();

        // Comprobar la meta inmediatamente después de mover
        if (player.position >= TRACK_LENGTH) {
            endGame(player);
        }
    }
}

function endGame(winner) {
    isGameRunning = false;
    clearInterval(gameInterval);

    // Transicionar a la pantalla de resultados
    $gameScreen.classList.add('hidden');
    $resultScreen.classList.remove('hidden');

    let message;
    if (winner.isPlayer) {
        message = `¡🎉 FELICIDADES ${winner.name}! ¡Ganaste la carrera y Consti ta felí!`;
    } else {
        message = `¡Derrota! 😢 ${winner.name} fue más rápido y le dio la mamadera a Consti primero.`;
    }
    
    $resultMessage.textContent = message;
}

function restartGame() {
    selectedPlayerId = null;
    $startButton.disabled = true;
    
    // Mostrar pantalla de selección
    $resultScreen.classList.add('hidden');
    $selectionScreen.classList.remove('hidden');
    
    // Limpiar selección visual
    document.querySelectorAll('.char-card').forEach(card => card.classList.remove('selected'));
    
    // Resetear datos
    racersData = [];
    $raceTrack.innerHTML = '';
}

// --- EVENT LISTENERS ---

function setupEventListeners() {
    $startButton.addEventListener('click', startGame);
    
    // Control para correr (diseñado para toques rápidos/clics)
    $runButton.addEventListener('click', movePlayer);
    
    // Esto también permite tocar cualquier parte del área de juego
    $gameScreen.addEventListener('click', (e) => {
        // Solo si el click NO fue en el botón, ignóralo.
        if (e.target.id !== 'run-button') {
            movePlayer();
        }
    });

    $restartButton.addEventListener('click', restartGame);
    
    // Ajustar la pista si la ventana cambia de tamaño (para el responsive)
    window.addEventListener('resize', () => {
        if (!isGameRunning && $gameScreen.classList.contains('hidden')) return;
        renderRacers(); // Un re-render simple para recalcular el ancho
        updateRacersUI();
    });
}