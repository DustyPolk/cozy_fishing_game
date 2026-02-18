const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const SCALE = 3;
const WIDTH = 320;
const HEIGHT = 180;
canvas.width = WIDTH;
canvas.height = HEIGHT;
canvas.style.width = WIDTH * SCALE + 'px';
canvas.style.height = HEIGHT * SCALE + 'px';

const WATER_TOP = HEIGHT * 0.55;
const DOCK_RIGHT = WIDTH * 0.35;

const DEPTH_ZONES = {
    shallow: { name: 'Shallow', color: '#2a5a8a', threshold: 0.2, difficulty: 1, luckMod: 0 },
    medium: { name: 'Medium', color: '#1a4a7a', threshold: 0.4, difficulty: 1.3, luckMod: 0.05 },
    deep: { name: 'Deep', color: '#0a3a6a', threshold: 0.6, difficulty: 1.6, luckMod: 0.1 },
    abyss: { name: 'Abyss', color: '#052a4a', threshold: 1, difficulty: 2, luckMod: 0.15 }
};

const FISH_DATA = [
    { id: 'minnow', name: 'Minnow', emoji: '🐟', rarity: 'common', value: 5, zones: ['shallow'] },
    { id: 'carp', name: 'Carp', emoji: '🐠', rarity: 'common', value: 8, zones: ['shallow', 'medium'] },
    { id: 'bluegill', name: 'Bluegill', emoji: '🐡', rarity: 'common', value: 6, zones: ['shallow'] },
    { id: 'bass', name: 'Bass', emoji: '🎣', rarity: 'uncommon', value: 15, zones: ['medium'] },
    { id: 'trout', name: 'Trout', emoji: '🦈', rarity: 'uncommon', value: 20, zones: ['medium', 'deep'] },
    { id: 'perch', name: 'Perch', emoji: '🐋', rarity: 'uncommon', value: 18, zones: ['medium'] },
    { id: 'salmon', name: 'Salmon', emoji: '🍣', rarity: 'rare', value: 35, zones: ['deep'] },
    { id: 'catfish', name: 'Catfish', emoji: '🐱', rarity: 'rare', value: 40, zones: ['deep', 'abyss'] },
    { id: 'pike', name: 'Pike', emoji: '🐊', rarity: 'rare', value: 45, zones: ['deep'] },
    { id: 'sturgeon', name: 'Sturgeon', emoji: '🦭', rarity: 'epic', value: 70, zones: ['abyss'] },
    { id: 'koi', name: 'Koi', emoji: '🎋', rarity: 'epic', value: 75, zones: ['deep', 'abyss'] },
    { id: 'anglerfish', name: 'Anglerfish', emoji: '🪸', rarity: 'epic', value: 80, zones: ['abyss'] },
    { id: 'leviathan', name: 'Leviathan', emoji: '🐉', rarity: 'legendary', value: 120, zones: ['abyss'] },
    { id: 'golden', name: 'Golden Fish', emoji: '✨', rarity: 'legendary', value: 150, zones: ['shallow', 'medium', 'deep', 'abyss'] }
];

const BAIT_TYPES = [
    { id: 'basic', name: 'Basic Bait', desc: 'Standard bait', effect: null, chance: 1 },
    { id: 'lucky', name: 'Lucky Bait', desc: '+15% rare chance', effect: 'luck', chance: 0.15, color: '#88ff88' },
    { id: 'quick', name: 'Quick Bait', desc: '+30% catch window', effect: 'speed', chance: 0.12, color: '#88ffff' },
    { id: 'golden', name: 'Golden Bait', desc: '+50% coin value', effect: 'bonus', chance: 0.08, color: '#ffdd44' },
    { id: 'deep', name: 'Deep Bait', desc: 'Can fish abyss without unlock', effect: 'deep', chance: 0.05, color: '#aa88ff' }
];

const PERMANENT_UPGRADES = [
    { id: 'start_bait', name: 'Extra Bait', desc: 'Start with +5 bait', price: 50, maxLevel: 3, effect: 'bait' },
    { id: 'start_luck', name: 'Lucky Start', desc: '+5% base luck', price: 80, maxLevel: 2, effect: 'luck' },
    { id: 'zone_medium', name: 'Medium Access', desc: 'Unlock medium zone', price: 100, maxLevel: 1, effect: 'zone_medium' },
    { id: 'zone_deep', name: 'Deep Access', desc: 'Unlock deep zone', price: 200, maxLevel: 1, effect: 'zone_deep' },
    { id: 'zone_abyss', name: 'Abyss Access', desc: 'Unlock abyss zone', price: 400, maxLevel: 1, effect: 'zone_abyss' },
    { id: 'run_speed', name: 'Quick Hands', desc: '+15% catch window permanently', price: 150, maxLevel: 2, effect: 'run_speed' }
];

let gameState = {
    coins: 0,
    collection: {},
    unlockedZones: ['shallow'],
    permanentUpgrades: {},
    
    runActive: false,
    runBait: 10,
    runInventory: { basic: 0, lucky: 0, quick: 0, golden: 0, deep: 0 },
    runStats: { fishCaught: 0, coinsEarned: 0, bestFish: null },
    selectedBait: 'basic',
    
    fishingState: 'idle',
    castTime: 0,
    catchWindow: 0,
    canCatch: false,
    currentZone: 'shallow',
    baseLuck: 0,
    baseSpeed: 1,
    
    time: 0,
    mouseX: 0,
    mouseY: 0,
    castTargetX: WIDTH * 0.5,
    castTargetY: HEIGHT * 0.7,
    castAnimFrame: 0,
    particles: [],
    ripples: [],
    sparkles: [],
    clouds: [
        { x: 50, y: 25, w: 40, speed: 0.05 },
        { x: 200, y: 35, w: 35, speed: 0.03 },
        { x: 280, y: 20, w: 30, speed: 0.04 }
    ]
};

function init() {
    loadGame();
    setupUI();
    setupMouse();
    requestAnimationFrame(gameLoop);
}

function loadGame() {
    const saved = localStorage.getItem('cozyFishingRL');
    if (saved) {
        const data = JSON.parse(saved);
        gameState.coins = data.coins || 0;
        gameState.collection = data.collection || {};
        gameState.unlockedZones = data.unlockedZones || ['shallow'];
        gameState.permanentUpgrades = data.permanentUpgrades || {};
        
        applyPermanentUpgrades();
    }
}

function applyPermanentUpgrades() {
    gameState.baseLuck = (gameState.permanentUpgrades['start_luck'] || 0) * 0.05;
    gameState.baseSpeed = 1 + (gameState.permanentUpgrades['run_speed'] || 0) * 0.15;
    
    const startBaitBonus = (gameState.permanentUpgrades['start_bait'] || 0) * 5;
    gameState.runBait = 10 + startBaitBonus;
    
    if (gameState.permanentUpgrades['zone_medium']) gameState.unlockedZones.push('medium');
    if (gameState.permanentUpgrades['zone_deep']) gameState.unlockedZones.push('deep');
    if (gameState.permanentUpgrades['zone_abyss']) gameState.unlockedZones.push('abyss');
}

function saveGame() {
    localStorage.setItem('cozyFishingRL', JSON.stringify({
        coins: gameState.coins,
        collection: gameState.collection,
        unlockedZones: gameState.unlockedZones,
        permanentUpgrades: gameState.permanentUpgrades
    }));
}

function startRun() {
    gameState.runActive = true;
    gameState.runStats = { fishCaught: 0, coinsEarned: 0, bestFish: null };
    gameState.runInventory = { basic: 0, lucky: 0, quick: 0, golden: 0, deep: 0 };
    
    const startBaitBonus = (gameState.permanentUpgrades['start_bait'] || 0) * 5;
    gameState.runBait = 10 + startBaitBonus;
    gameState.selectedBait = 'basic';
    
    document.getElementById('run-ui').classList.remove('hidden');
    document.getElementById('start-run-btn').classList.add('hidden');
    updateBaitDisplay();
}

function endRun() {
    gameState.runActive = false;
    gameState.fishingState = 'idle';
    
    document.getElementById('run-ui').classList.add('hidden');
    document.getElementById('start-run-btn').classList.remove('hidden');
    
    showRunSummary();
}

function showRunSummary() {
    const stats = gameState.runStats;
    document.getElementById('summary-fish').textContent = stats.fishCaught;
    document.getElementById('summary-coins').textContent = stats.coinsEarned;
    document.getElementById('summary-best').textContent = stats.bestFish ? `${stats.bestFish.emoji} ${stats.bestFish.name}` : 'None';
    document.getElementById('summary-modal').classList.remove('hidden');
}

function setupUI() {
    document.getElementById('journal-btn').onclick = () => openModal('journal');
    document.getElementById('shop-btn').onclick = () => openModal('shop');
    document.getElementById('start-run-btn').onclick = () => startRun();
    document.getElementById('end-run-btn').onclick = () => endRun();
    document.getElementById('bait-select').onchange = (e) => gameState.selectedBait = e.target.value;
    
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.onclick = () => closeModal();
    });
    
    canvas.onclick = handleClick;
}

function setupMouse() {
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        gameState.mouseX = (e.clientX - rect.left) / SCALE;
        gameState.mouseY = (e.clientY - rect.top) / SCALE;
    });
}

function openModal(type) {
    const modal = document.getElementById(type + '-modal');
    modal.classList.remove('hidden');
    
    if (type === 'journal') renderJournal();
    if (type === 'shop') renderShop();
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

function renderJournal() {
    const grid = document.getElementById('journal-grid');
    grid.innerHTML = '';
    
    FISH_DATA.forEach(fish => {
        const caught = gameState.collection[fish.id] || 0;
        const card = document.createElement('div');
        card.className = 'fish-card' + (caught ? '' : ' uncaught');
        card.innerHTML = `
            <div class="fish-sprite">${fish.emoji}</div>
            <div class="fish-name">${caught ? fish.name : '???'}</div>
            <div class="fish-count">${caught ? `x${caught}` : ''}</div>
            <div class="fish-zones">${caught ? fish.zones.join(' ') : ''}</div>
        `;
        if (caught) {
            card.onclick = () => showFishInfo(fish);
        }
        grid.appendChild(card);
    });
}

function renderShop() {
    const container = document.getElementById('shop-items');
    container.innerHTML = '<h3 style="margin-bottom:15px;color:#7dd3fc;">Permanent Upgrades</h3>';
    
    PERMANENT_UPGRADES.forEach(item => {
        const level = gameState.permanentUpgrades[item.id] || 0;
        const maxed = level >= item.maxLevel;
        const owned = gameState.unlockedZones.some(z => 
            (item.effect === 'zone_medium' && z === 'medium') ||
            (item.effect === 'zone_deep' && z === 'deep') ||
            (item.effect === 'zone_abyss' && z === 'abyss')
        ) || maxed;
        
        const div = document.createElement('div');
        div.className = 'shop-item' + (owned ? ' owned' : '');
        div.innerHTML = `
            <div class="shop-item-info">
                <h3>${item.name} ${level > 0 ? `(Lv.${level})` : ''}</h3>
                <p>${item.desc}</p>
            </div>
            <button ${maxed ? 'disabled' : ''}>${maxed ? 'Maxed' : `${item.price} 🪙`}</button>
        `;
        if (!maxed) {
            div.querySelector('button').onclick = () => buyPermanentUpgrade(item);
        }
        container.appendChild(div);
    });
}

function buyPermanentUpgrade(item) {
    if (gameState.coins >= item.price) {
        gameState.coins -= item.price;
        gameState.permanentUpgrades[item.id] = (gameState.permanentUpgrades[item.id] || 0) + 1;
        
        applyPermanentUpgrades();
        updateCoinDisplay();
        saveGame();
        renderShop();
    }
}

function showFishInfo(fish) {
    alert(`${fish.name}\nRarity: ${fish.rarity}\nValue: ${fish.value} coins\nZones: ${fish.zones.join(', ')}\nTotal caught: ${gameState.collection[fish.id]}`);
}

function getZoneFromY(y) {
    const waterDepth = y - WATER_TOP;
    const maxDepth = HEIGHT - WATER_TOP;
    const depthRatio = waterDepth / maxDepth;
    
    for (const [zoneId, zone] of Object.entries(DEPTH_ZONES)) {
        if (depthRatio <= zone.threshold) {
            return zoneId;
        }
    }
    return 'abyss';
}

function canFishZone(zoneId) {
    if (gameState.unlockedZones.includes(zoneId)) return true;
    if (gameState.selectedBait === 'deep' && gameState.runInventory.deep > 0) return true;
    return false;
}

function handleClick() {
    if (!gameState.runActive) return;
    
    const mx = gameState.mouseX;
    const my = gameState.mouseY;
    
    if (gameState.fishingState === 'idle') {
        if (my > WATER_TOP && mx > DOCK_RIGHT - 20) {
            const zone = getZoneFromY(my);
            if (canFishZone(zone)) {
                gameState.castTargetX = mx;
                gameState.castTargetY = my;
                gameState.currentZone = zone;
                castLine();
            }
        }
    } else if (gameState.fishingState === 'waiting') {
        if (gameState.canCatch) {
            catchFish();
        } else {
            gameState.fishingState = 'idle';
        }
    } else if (gameState.fishingState === 'reeling') {
        gameState.fishingState = 'idle';
    }
}

function castLine() {
    const baitCount = gameState.runInventory[gameState.selectedBait] || 0;
    if (gameState.runBait <= 0 && baitCount <= 0) {
        return;
    }
    
    if (baitCount > 0) {
        gameState.runInventory[gameState.selectedBait]--;
    } else {
        gameState.runBait--;
        gameState.selectedBait = 'basic';
    }
    
    gameState.fishingState = 'waiting';
    gameState.castTime = Date.now();
    gameState.castAnimFrame = 0;
    
    updateBaitDisplay();
    
    createSplash(gameState.castTargetX, gameState.castTargetY);
    createRipple(gameState.castTargetX, gameState.castTargetY);
    
    const zone = DEPTH_ZONES[gameState.currentZone];
    const baseWait = 1500 + Math.random() * 3000;
    const waitTime = baseWait / (1 + zone.difficulty * 0.2);
    
    let catchDuration = 800 / gameState.baseSpeed;
    if (gameState.selectedBait === 'quick') catchDuration *= 1.3;
    catchDuration /= zone.difficulty;
    
    setTimeout(() => {
        if (gameState.fishingState === 'waiting') {
            gameState.canCatch = true;
            gameState.catchWindow = Date.now();
            
            setTimeout(() => {
                if (gameState.fishingState === 'waiting' && gameState.canCatch) {
                    gameState.canCatch = false;
                    gameState.fishingState = 'idle';
                }
            }, catchDuration);
        }
    }, waitTime);
}

function catchFish() {
    gameState.canCatch = false;
    gameState.fishingState = 'reeling';
    
    const fish = selectRandomFish();
    let value = fish.value;
    if (gameState.selectedBait === 'golden') value = Math.floor(value * 1.5);
    
    gameState.coins += value;
    gameState.runStats.coinsEarned += value;
    gameState.runStats.fishCaught++;
    
    if (!gameState.runStats.bestFish || fish.value > gameState.runStats.bestFish.value) {
        gameState.runStats.bestFish = fish;
    }
    
    gameState.collection[fish.id] = (gameState.collection[fish.id] || 0) + 1;
    
    maybeDropBait();
    
    createSparkles(gameState.castTargetX, gameState.castTargetY);
    showCatchPopup(fish, value);
    updateCoinDisplay();
    saveGame();
    
    setTimeout(() => {
        gameState.fishingState = 'idle';
        hideCatchPopup();
        
        if (gameState.runBait <= 0 && Object.values(gameState.runInventory).every(v => v === 0)) {
            endRun();
        }
    }, 1500);
}

function selectRandomFish() {
    const zone = DEPTH_ZONES[gameState.currentZone];
    let luck = gameState.baseLuck + zone.luckMod;
    if (gameState.selectedBait === 'lucky') luck += 0.15;
    
    const zoneFish = FISH_DATA.filter(f => f.zones.includes(gameState.currentZone));
    
    const roll = Math.random() + luck;
    
    let pool;
    if (roll > 0.95) pool = zoneFish.filter(f => f.rarity === 'legendary');
    else if (roll > 0.85) pool = zoneFish.filter(f => f.rarity === 'epic');
    else if (roll > 0.65) pool = zoneFish.filter(f => f.rarity === 'rare');
    else if (roll > 0.35) pool = zoneFish.filter(f => f.rarity === 'uncommon');
    else pool = zoneFish.filter(f => f.rarity === 'common');
    
    return (pool.length > 0 ? pool : zoneFish)[Math.floor(Math.random() * zoneFish.length)];
}

function maybeDropBait() {
    const roll = Math.random();
    let totalChance = 0;
    
    for (const bait of BAIT_TYPES) {
        if (bait.id === 'basic') continue;
        totalChance += bait.chance;
        if (roll < totalChance) {
            gameState.runInventory[bait.id] = (gameState.runInventory[bait.id] || 0) + 1;
            showBaitDrop(bait);
            break;
        }
    }
}

function showBaitDrop(bait) {
    const popup = document.getElementById('bait-popup');
    popup.innerHTML = `Found: ${bait.name}!`;
    popup.classList.remove('hidden');
    setTimeout(() => popup.classList.add('hidden'), 2000);
}

function showCatchPopup(fish, value) {
    const popup = document.getElementById('catch-popup');
    const zone = DEPTH_ZONES[gameState.currentZone];
    document.getElementById('catch-content').innerHTML = `
        <div class="fish-emoji">${fish.emoji}</div>
        <div class="fish-name">${fish.name}</div>
        <div class="fish-zone">${zone.name}</div>
        <div class="fish-value">+${value} 🪙</div>
    `;
    popup.classList.remove('hidden');
}

function hideCatchPopup() {
    document.getElementById('catch-popup').classList.add('hidden');
}

function updateCoinDisplay() {
    document.getElementById('coin-count').textContent = gameState.coins;
}

function updateBaitDisplay() {
    document.getElementById('bait-count').textContent = gameState.runBait;
    
    const select = document.getElementById('bait-select');
    select.innerHTML = `<option value="basic">Basic (${gameState.runBait})</option>`;
    
    BAIT_TYPES.forEach(bait => {
        if (bait.id === 'basic') return;
        const count = gameState.runInventory[bait.id] || 0;
        if (count > 0) {
            select.innerHTML += `<option value="${bait.id}">${bait.name} (${count})</option>`;
        }
    });
}

function createSplash(x, y) {
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI / 6) + Math.random() * (Math.PI * 2 / 3);
        const speed = 1 + Math.random() * 2;
        gameState.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: -Math.sin(angle) * speed * 1.5,
            life: 1,
            size: 1 + Math.random() * 2
        });
    }
}

function createRipple(x, y) {
    gameState.ripples.push({ x, y, radius: 3, alpha: 1 });
}

function createSparkles(x, y) {
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.5;
        gameState.sparkles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            color: `hsl(${40 + Math.random() * 40}, 100%, 70%)`
        });
    }
}

function updateParticles() {
    gameState.particles = gameState.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life -= 0.03;
        return p.life > 0;
    });
    
    gameState.ripples = gameState.ripples.filter(r => {
        r.radius += 0.5;
        r.alpha -= 0.02;
        return r.alpha > 0;
    });
    
    gameState.sparkles = gameState.sparkles.filter(s => {
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.02;
        return s.life > 0;
    });
}

function gameLoop(timestamp) {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

function update() {
    gameState.time += 0.016;
    
    if (gameState.fishingState === 'waiting' || gameState.fishingState === 'reeling') {
        gameState.castAnimFrame = Math.min(gameState.castAnimFrame + 0.15, 3);
    }
    
    gameState.clouds.forEach(c => {
        c.x += c.speed;
        if (c.x > WIDTH + 50) c.x = -c.w;
    });
    
    updateParticles();
}

function render() {
    drawSky();
    drawClouds();
    drawMountains();
    drawTrees();
    drawWater();
    drawDepthIndicators();
    drawParticles();
    drawDock();
    
    if (gameState.runActive) {
        drawPlayer();
        drawFishingLine();
        drawStateIndicator();
        drawCastCursor();
    }
}

function drawSky() {
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT * 0.6);
    gradient.addColorStop(0, '#0d1b2a');
    gradient.addColorStop(0.5, '#1b263b');
    gradient.addColorStop(1, '#415a77');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT * 0.6);
    
    drawStars();
    drawMoon();
}

function drawStars() {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 30; i++) {
        const x = (i * 37 + Math.sin(i * 2) * 40) % WIDTH;
        const y = (i * 17 + Math.cos(i * 3) * 25) % (HEIGHT * 0.4);
        const twinkle = Math.sin(gameState.time * 3 + i) * 0.3 + 0.7;
        ctx.globalAlpha = twinkle;
        ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;
}

function drawMoon() {
    ctx.fillStyle = '#ffffee';
    ctx.beginPath();
    ctx.arc(260, 30, 18, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#415a77';
    ctx.beginPath();
    ctx.arc(268, 26, 14, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 255, 238, 0.15)';
    ctx.beginPath();
    ctx.arc(260, 30, 30, 0, Math.PI * 2);
    ctx.fill();
}

function drawClouds() {
    ctx.fillStyle = 'rgba(200, 210, 230, 0.3)';
    gameState.clouds.forEach(c => {
        drawCloud(c.x, c.y, c.w);
    });
}

function drawCloud(x, y, w) {
    const h = w * 0.4;
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - w * 0.3, y + 2, w * 0.35, h * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w * 0.3, y + 3, w * 0.3, h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawMountains() {
    ctx.fillStyle = '#1a2d40';
    ctx.beginPath();
    ctx.moveTo(0, WATER_TOP);
    ctx.lineTo(40, WATER_TOP - 35);
    ctx.lineTo(80, WATER_TOP - 15);
    ctx.lineTo(120, WATER_TOP - 50);
    ctx.lineTo(160, WATER_TOP - 25);
    ctx.lineTo(200, WATER_TOP - 60);
    ctx.lineTo(250, WATER_TOP - 30);
    ctx.lineTo(300, WATER_TOP - 45);
    ctx.lineTo(WIDTH, WATER_TOP - 20);
    ctx.lineTo(WIDTH, WATER_TOP);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#152238';
    ctx.beginPath();
    ctx.moveTo(0, WATER_TOP);
    ctx.lineTo(30, WATER_TOP - 25);
    ctx.lineTo(70, WATER_TOP - 10);
    ctx.lineTo(100, WATER_TOP - 35);
    ctx.lineTo(140, WATER_TOP - 15);
    ctx.lineTo(180, WATER_TOP - 40);
    ctx.lineTo(220, WATER_TOP - 20);
    ctx.lineTo(270, WATER_TOP - 30);
    ctx.lineTo(WIDTH, WATER_TOP - 10);
    ctx.lineTo(WIDTH, WATER_TOP);
    ctx.closePath();
    ctx.fill();
}

function drawTrees() {
    drawPineTree(8, WATER_TOP - 5, 20, 30);
    drawPineTree(25, WATER_TOP - 3, 15, 22);
    drawBush(WIDTH * 0.36, WATER_TOP - 2, 8);
}

function drawPineTree(x, baseY, w, h) {
    ctx.fillStyle = '#2d3a24';
    for (let layer = 0; layer < 3; layer++) {
        const layerY = baseY - h * 0.3 * layer;
        const layerW = w - layer * 3;
        const layerH = h * 0.5 - layer * 3;
        ctx.beginPath();
        ctx.moveTo(x, layerY);
        ctx.lineTo(x - layerW / 2, layerY);
        ctx.lineTo(x, layerY - layerH);
        ctx.lineTo(x + layerW / 2, layerY);
        ctx.closePath();
        ctx.fill();
    }
    
    ctx.fillStyle = '#3d2a1a';
    ctx.fillRect(x - 1, baseY - 3, 2, 5);
}

function drawBush(x, y, r) {
    ctx.fillStyle = '#2a4030';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + r * 0.6, y + 1, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
}

function drawWater() {
    const waterHeight = HEIGHT - WATER_TOP;
    const zoneHeight = waterHeight / 4;
    
    let y = WATER_TOP;
    for (const [zoneId, zone] of Object.entries(DEPTH_ZONES)) {
        const gradient = ctx.createLinearGradient(0, y, 0, y + zoneHeight);
        const unlocked = gameState.unlockedZones.includes(zoneId);
        const baseColor = unlocked ? zone.color : '#0a1520';
        
        gradient.addColorStop(0, baseColor);
        gradient.addColorStop(1, unlocked ? shadeColor(baseColor, -20) : '#050a10');
        ctx.fillStyle = gradient;
        ctx.fillRect(DOCK_RIGHT, y, WIDTH - DOCK_RIGHT, zoneHeight + 1);
        y += zoneHeight;
    }
    
    for (let wave = 0; wave < 6; wave++) {
        ctx.strokeStyle = `rgba(100, 160, 220, ${0.15 - wave * 0.02})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const waveY = WATER_TOP + 8 + wave * 12;
        for (let x = DOCK_RIGHT; x < WIDTH; x += 2) {
            const offset = Math.sin((x + gameState.time * 30 + wave * 25) * 0.06) * 2.5;
            if (x === DOCK_RIGHT) ctx.moveTo(x, waveY + offset);
            else ctx.lineTo(x, waveY + offset);
        }
        ctx.stroke();
    }
    
    drawMoonReflection();
}

function shadeColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function drawMoonReflection() {
    ctx.fillStyle = 'rgba(255, 255, 238, 0.08)';
    for (let i = 0; i < 8; i++) {
        const y = WATER_TOP + 20 + i * 15;
        const w = 15 - i * 1.5;
        const shimmer = Math.sin(gameState.time * 2 + i) * 3;
        ctx.fillRect(260 - w + shimmer, y, w * 2, 4);
    }
}

function drawDepthIndicators() {
    ctx.font = '8px monospace';
    ctx.textAlign = 'right';
    
    const waterHeight = HEIGHT - WATER_TOP;
    const zoneHeight = waterHeight / 4;
    
    let y = WATER_TOP;
    for (const [zoneId, zone] of Object.entries(DEPTH_ZONES)) {
        const unlocked = gameState.unlockedZones.includes(zoneId);
        ctx.fillStyle = unlocked ? 'rgba(255,255,255,0.5)' : 'rgba(255,100,100,0.5)';
        ctx.fillText(zone.name.toUpperCase(), WIDTH - 5, y + zoneHeight / 2 + 3);
        
        if (!unlocked) {
            ctx.fillText('🔒', WIDTH - 50, y + zoneHeight / 2 + 3);
        }
        y += zoneHeight;
    }
}

function drawParticles() {
    gameState.particles.forEach(p => {
        ctx.fillStyle = `rgba(150, 200, 255, ${p.life})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    
    gameState.ripples.forEach(r => {
        ctx.strokeStyle = `rgba(150, 200, 255, ${r.alpha * 0.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
    });
    
    gameState.sparkles.forEach(s => {
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.life;
        ctx.fillRect(s.x, s.y, 2, 2);
    });
    ctx.globalAlpha = 1;
}

function drawDock() {
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(0, WATER_TOP, DOCK_RIGHT, 10);
    
    ctx.strokeStyle = '#4a3020';
    ctx.lineWidth = 1;
    for (let i = 0; i < DOCK_RIGHT; i += 8) {
        ctx.beginPath();
        ctx.moveTo(i, WATER_TOP);
        ctx.lineTo(i, WATER_TOP + 10);
        ctx.stroke();
    }
    for (let j = 0; j < 10; j += 3) {
        ctx.beginPath();
        ctx.moveTo(0, WATER_TOP + j);
        ctx.lineTo(DOCK_RIGHT, WATER_TOP + j);
        ctx.stroke();
    }
    
    ctx.fillStyle = '#3d2817';
    for (let i = 0; i < 6; i++) {
        const px = i * 18 + 4;
        ctx.fillRect(px, WATER_TOP + 10, 5, 28);
        ctx.fillStyle = '#2d1a10';
        ctx.fillRect(px, WATER_TOP + 10, 1, 28);
        ctx.fillStyle = '#3d2817';
    }
    
    drawLadder();
    drawBarrel();
    drawLanterns();
}

function drawLadder() {
    const lx = DOCK_RIGHT - 15;
    ctx.strokeStyle = '#3d2817';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(lx, WATER_TOP);
    ctx.lineTo(lx - 5, WATER_TOP + 25);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(lx + 8, WATER_TOP);
    ctx.lineTo(lx + 3, WATER_TOP + 25);
    ctx.stroke();
    
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
        const rungY = WATER_TOP + 4 + i * 6;
        ctx.beginPath();
        ctx.moveTo(lx - 4 + i * 0.5, rungY);
        ctx.lineTo(lx + 7 + i * 0.5, rungY);
        ctx.stroke();
    }
}

function drawBarrel() {
    const bx = 15;
    const by = WATER_TOP - 6;
    
    ctx.fillStyle = '#4a3020';
    ctx.beginPath();
    ctx.ellipse(bx, by + 6, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(bx - 6, by, 12, 6);
    
    ctx.strokeStyle = '#2d1a10';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx - 6, by + 2);
    ctx.lineTo(bx + 6, by + 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx - 6, by + 5);
    ctx.lineTo(bx + 6, by + 5);
    ctx.stroke();
}

function drawLanterns() {
    const lx = DOCK_RIGHT - 25;
    const ly = WATER_TOP - 12;
    
    const glow = Math.sin(gameState.time * 3) * 0.2 + 0.8;
    ctx.fillStyle = `rgba(255, 200, 100, ${glow * 0.15})`;
    ctx.beginPath();
    ctx.arc(lx, ly, 10, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#2d1a10';
    ctx.fillRect(lx - 1, ly - 4, 2, 2);
    
    ctx.fillStyle = '#3d2817';
    ctx.fillRect(lx - 3, ly - 2, 6, 6);
    
    ctx.fillStyle = `rgba(255, 180, 80, ${glow})`;
    ctx.fillRect(lx - 2, ly - 1, 4, 4);
}

function drawPlayer() {
    const px = DOCK_RIGHT - 40;
    const py = WATER_TOP - 16;
    
    const bob = Math.sin(gameState.time * 2) * 0.5;
    
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(px + 2, py + bob - 5, 8, 4);
    
    ctx.fillStyle = '#ffccaa';
    ctx.fillRect(px + 3, py + bob - 1, 6, 4);
    
    ctx.fillStyle = '#2a4a6a';
    ctx.fillRect(px + 1, py + bob + 3, 10, 10);
    
    ctx.fillStyle = '#1a3a5a';
    ctx.fillRect(px + 2, py + bob + 4, 8, 8);
    
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(px, py + bob + 3, 2, 6);
    ctx.fillRect(px + 10, py + bob + 3, 2, 6);
    
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(px + 2, py + bob + 13, 3, 3);
    ctx.fillRect(px + 7, py + bob + 13, 3, 3);
    
    drawRod(px, py + bob);
}

function drawRod(px, py) {
    const rodAngle = gameState.fishingState === 'idle' ? -0.3 : 
                     gameState.castAnimFrame < 2 ? -0.8 + gameState.castAnimFrame * 0.25 : -0.3;
    
    ctx.save();
    ctx.translate(px + 10, py + 5);
    ctx.rotate(rodAngle);
    
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(0, -1, 25, 2);
    
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.arc(25, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawFishingLine() {
    if (gameState.fishingState === 'idle') return;
    
    const playerX = DOCK_RIGHT - 40;
    const playerY = WATER_TOP - 16;
    const bob = Math.sin(gameState.time * 2) * 0.5;
    
    const rodAngle = gameState.castAnimFrame < 2 ? -0.8 + gameState.castAnimFrame * 0.25 : -0.3;
    const rodTipX = (playerX + 10) + Math.cos(rodAngle) * 25;
    const rodTipY = (playerY + bob + 5) + Math.sin(rodAngle) * 25;
    
    const endX = gameState.castTargetX + Math.sin(gameState.time * 2) * 3;
    const endY = gameState.castTargetY;
    
    const baitColor = BAIT_TYPES.find(b => b.id === gameState.selectedBait)?.color || '#fff';
    
    ctx.strokeStyle = 'rgba(180, 180, 180, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rodTipX, rodTipY);
    
    const midX = (rodTipX + endX) / 2;
    const midY = Math.min(rodTipY, endY) - 15 + Math.sin(gameState.time * 3) * 5;
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    ctx.stroke();
    
    const bobberBob = Math.sin(gameState.time * 4) * 1;
    
    ctx.fillStyle = gameState.selectedBait !== 'basic' ? baitColor : '#ff4444';
    ctx.beginPath();
    ctx.arc(endX, endY + bobberBob, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(endX, endY + bobberBob - 1, 1.5, Math.PI, Math.PI * 2);
    ctx.fill();
}

function drawStateIndicator() {
    if (gameState.fishingState !== 'waiting') return;
    
    const x = gameState.castTargetX;
    const y = gameState.castTargetY;
    
    if (gameState.canCatch) {
        const pulse = Math.sin(gameState.time * 15) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 255, 100, ${pulse})`;
        ctx.beginPath();
        ctx.arc(x, y - 8, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('!', x, y - 6);
    }
}

function drawCastCursor() {
    if (gameState.fishingState !== 'idle' || !gameState.runActive) return;
    
    const mx = gameState.mouseX;
    const my = gameState.mouseY;
    
    if (my > WATER_TOP && mx > DOCK_RIGHT - 20) {
        const zone = getZoneFromY(my);
        const canFish = canFishZone(zone);
        
        ctx.strokeStyle = canFish ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 100, 100, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(mx, my, 8 + Math.sin(gameState.time * 5) * 2, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = canFish ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 100, 100, 0.15)';
        ctx.beginPath();
        ctx.arc(mx, my, 6, 0, Math.PI * 2);
        ctx.fill();
        
        if (!canFish) {
            ctx.fillStyle = '#ff6666';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('LOCKED', mx, my - 12);
        }
    }
}

init();