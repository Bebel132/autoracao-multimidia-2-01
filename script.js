/**
 * ==========================================
 * PARTE 1: DADOS E ESTRUTURA (MODEL)
 * Tema 1 deve focar aqui para adicionar novos locais.
 * ==========================================
 */

const roads = [
    "Alice's House-Bob's House", "Alice's House-Cabin",
    "Alice's House-Post Office", "Bob's House-Town Hall",
    "Daria's House-Ernie's House", "Daria's House-Town Hall",
    "Ernie's House-Grete's House", "Grete's House-Farm",
    "Grete's House-Shop", "Marketplace-Farm",
    "Marketplace-Post Office", "Marketplace-Shop",
    "Marketplace-Town Hall", "Shop-Town Hall"
];

// Coordenadas visuais para desenhar no Canvas (X, Y)
const locations = {
    "Alice's House": {x: 50, y: 100},
    "Bob's House":   {x: 200, y: 50},
    "Cabin":         {x: 50, y: 300},
    "Post Office":   {x: 200, y: 200},
    "Town Hall":     {x: 350, y: 100},
    "Daria's House": {x: 500, y: 100},
    "Ernie's House": {x: 650, y: 250},
    "Grete's House": {x: 550, y: 400},
    "Farm":          {x: 350, y: 450},
    "Shop":          {x: 350, y: 300},
    "Marketplace":   {x: 200, y: 350}
};

function buildGraph(edges) {
    let graph = Object.create(null);
    function addEdge(from, to) {
        if (graph[from] == null) {
            graph[from] = [to];
        } else {
            graph[from].push(to);
        }
    }
    for (let [from, to] of edges.map(r => r.split("-"))) {
        addEdge(from, to);
        addEdge(to, from);
    }
    return graph;
}

const roadGraph = buildGraph(roads);

/**
 * ==========================================
 * PARTE 2: ESTADO DO MUNDO (STATE)
 * Tema 2 deve entender a imutabilidade aqui.
 * ==========================================
 */

class VillageState {
    constructor(place, parcels) {
        this.place = place;
        this.parcels = parcels;
    }

    move(destination) {
        if (!roadGraph[this.place].includes(destination)) {
            return this; // Movimento inválido, retorna o mesmo estado
        } else {
            let parcels = this.parcels.map(p => {
                if (p.place != this.place) return p;
                return {place: destination, address: p.address};
            }).filter(p => p.place != p.address);
            return new VillageState(destination, parcels);
        }
    }
}

// Gera um estado aleatório com 5 encomendas
VillageState.random = function(parcelCount = 5) {
    let parcels = [];
    for (let i = 0; i < parcelCount; i++) {
        let address = randomPick(Object.keys(roadGraph));
        let place;
        do {
            place = randomPick(Object.keys(roadGraph));
        } while (place == address);
        parcels.push({place, address});
    }
    return new VillageState("Post Office", parcels);
};

/**
 * ==========================================
 * PARTE 3: ALGORITMOS DOS ROBÔS (AI)
 * Temas 3, 4, 5 e 6 analisam esta parte.
 * ==========================================
 */

function randomPick(array) {
    let choice = Math.floor(Math.random() * array.length);
    return array[choice];
}

// --- ROBÔ 1: ALEATÓRIO (Tema 3) ---
function randomRobot(state) {
    return {direction: randomPick(roadGraph[state.place]), memory: []};
}

// --- ROBÔ 2: ROTA FIXA (Tema 4) ---
const mailRoute = [
    "Alice's House", "Cabin", "Alice's House", "Bob's House",
    "Town Hall", "Daria's House", "Ernie's House",
    "Grete's House", "Shop", "Grete's House", "Farm",
    "Marketplace", "Post Office"
];

function routeRobot(state, memory) {
    if (memory.length == 0) {
        memory = mailRoute;
    }
    return {direction: memory[0], memory: memory.slice(1)};
}

// --- ROBÔ 3: INTELIGENTE / PATHFINDER (Tema 5 e 6) ---
function findRoute(graph, from, to) {
    let work = [{at: from, route: []}];
    for (let i = 0; i < work.length; i++) {
        let {at, route} = work[i];
        for (let place of graph[at]) {
            if (place == to) return route.concat(place);
            if (!work.some(w => w.at == place)) {
                work.push({at: place, route: route.concat(place)});
            }
        }
    }
}

function goalOrientedRobot({place, parcels}, route) {
    if (!route || !place || !parcels || parcels.length === 0) return {direction: null, memory: []};
    if (route.length == 0) {
        let parcel = parcels[0];
        // Se a encomenda não está comigo, vou buscar. Se está, vou entregar.
        if (parcel.place != place) {
            route = findRoute(roadGraph, place, parcel.place);
        } else {
            route = findRoute(roadGraph, place, parcel.address);
        }
    }
    // a variável route mostra a rota mais eficiente para a próxima encomenda, 
    // mas como é para mostrar apenas a próxima direção , não precisamos de toda a rota aqui.
    // Só o direction com o route[0] (próximo passo) já é suficiente.
    // E o memory é o restante da rota (route.slice(1))
    return {direction: route[0], memory: route.slice(1)};
}

/**
 * ==========================================
 * PARTE 4: VISUALIZAÇÃO E CONTROLE (VIEW/CONTROLLER)
 * Temas 3, 4, 5, 6 e 7 trabalharão muito aqui.
 * ==========================================
 */

let currentState = null;
let currentRobot = null;
let robotMemory = [];
let turnCount = 0;
let simulationTimeout = null;
let animationSpeed = 800; // Tema 6: deve tornar isso dinâmico

const canvas = document.getElementById('villageCanvas');
const ctx = canvas.getContext('2d');
const logContainer = document.getElementById('logContainer');

function init() {
    currentState = VillageState.random();
    drawVillage(currentState);
    updateStatusUI();
    logAction("Simulação pronta. Escolha um robô e clique em Iniciar.");
}

function startSimulation() {
    if (simulationTimeout) return; // Já está rodando
    
    const robotType = document.getElementById('robotSelect').value;
    
    // Seleciona o algoritmo
    if (robotType === 'random') currentRobot = randomRobot;
    else if (robotType === 'route') currentRobot = routeRobot;
    else currentRobot = goalOrientedRobot;

    robotMemory = []; // Reseta memória do robô
    runTurn();
}

function runTurn() {
    if (currentState.parcels.length == 0) {
        logAction(`<strong>FIM!</strong> Todas as entregas concluídas em ${turnCount} passos.`);
        simulationTimeout = null;
        return;
    }
    // 1. O robô decide
    let action = currentRobot(currentState, robotMemory);
    
    // 2. O estado atualiza (Imutabilidade)
    let nextState = currentState.move(action.direction);
    
    // Detecção simples de entrega para log (Tema 2 pode melhorar isso)
    if(nextState.parcels.length < currentState.parcels.length) {
        logAction(`📦 Entrega realizada em: ${action.direction}`);
    } else {
        logAction(`Movendo para: ${action.direction}`);
    }
    
    // 3. Atualiza variáveis globais
    currentState = nextState;
    robotMemory = action.memory || [];
    turnCount++;
    
    
    // 4. Redesenha e Atualiza UI
    drawVillage(currentState);
    updateStatusUI();

    // 5. Agenda o próximo turno (Loop de animação)
    simulationTimeout = setTimeout(runTurn, animationSpeed);
}

function stopSimulation() {
    clearTimeout(simulationTimeout);
    simulationTimeout = null;
}

function resetSimulation() {
    stopSimulation();
    turnCount = 0;
    logContainer.innerHTML = '';
    init();
}

function updateStatusUI() {
    document.getElementById('stepCount').innerText = turnCount;
    document.getElementById('parcelCount').innerText = currentState.parcels.length;
}

// Função auxiliar de Log (Tema 2 deve melhorar HTML/CSS aqui)
function logAction(message) {
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.innerHTML = `Passo ${turnCount}: ${message}`;
    logContainer.prepend(div);
}

/**
 * ==========================================
 * PARTE 5: DESENHO NO CANVAS
 * Temas 1, 3, 4 e 5: Atenção aqui!
 * ==========================================
 */
function drawVillage(state) {
    // Limpa o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Desenhar Estradas (Linhas)
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 4;
    for (let from in roadGraph) {
        for (let to of roadGraph[from]) {
            // Só desenha se ambos os locais tiverem coordenadas definidas
            if(locations[from] && locations[to]) {
                ctx.beginPath();
                ctx.moveTo(locations[from].x, locations[from].y);
                ctx.lineTo(locations[to].x, locations[to].y);
                ctx.stroke();
            }
        }
    }

    // Dica para Tema 5: Desenhar a rota (linha tracejada) aqui
    // na primeira renderização do canvas, o currentRobot é null, e por isso dá erro se for executar esse bloco de código
    // da mesma forma, quando o robô não tem mais o que fazer (entregou todas as encomendas), o state também é null, então esse bloco de código não deve ser executado
    if(typeof currentRobot === 'function' && state) {
        // obtém a próxima ação do robô
        const action = currentRobot(state, robotMemory);
        // verifica se há uma direção válida para desenhar o caminho que o robô seguirá
        if(action.direction) {
            // configurações da linha tracejada
            ctx.strokeStyle = "#ff00d4ff";
            ctx.lineWidth = 5;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            
            // começa do local atual do robô
            let start = locations[state.place];
            // desenha a linha tracejada
            ctx.moveTo(start.x, start.y);
            
            // obtém a localização da próxima direção
            let loc = locations[action.direction];
            // desenha até a próxima direção
            ctx.lineTo(loc.x, loc.y);
            // finaliza o desenho da linha tracejada
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    // 2. Desenhar Locais (Círculos) - Tema 1 adicionará novos
    for (let loc in locations) {
        const {x, y} = locations[loc];
        
        // Desenha o "chão" do local
        ctx.fillStyle = "#3b82f6"; // Azul
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();

        // Texto do local
        ctx.fillStyle = "#000";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(loc, x, y - 25);
    }

    // 3. Desenhar Encomendas (Quadrados Vermelhos) - Tema 3 pode mudar para imagens
    state.parcels.forEach((p, index) => {
        if(locations[p.place]) {
            const {x, y} = locations[p.place];
            const offset = index * 12; // Empilhamento visual
            
            ctx.fillStyle = "#ef4444"; // Vermelho
            ctx.fillRect(x + 10 + offset, y + 5, 15, 15);
            
            ctx.strokeStyle = "white";
            ctx.strokeRect(x + 10 + offset, y + 5, 15, 15);
        }
    });

    // 4. Desenhar Robô (Círculo Verde) - Tema 3: Substituir por Imagem
    const robotLoc = locations[state.place];
    if(robotLoc) {
        ctx.fillStyle = "#10b981"; // Verde
        ctx.beginPath();
        ctx.arc(robotLoc.x, robotLoc.y, 20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#fff";
        ctx.stroke();

        // Letra 'R' no robô
        ctx.fillStyle = "white";
        ctx.font = "bold 16px Arial";
        ctx.fillText("R", robotLoc.x, robotLoc.y + 5);
    }
}

// Inicializa tudo ao carregar a página
init();
