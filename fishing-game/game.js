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
    shallow: { name: 'Shallow', threshold: 0.2, difficulty: 1, luckMod: 0 },
    medium: { name: 'Medium', threshold: 0.4, difficulty: 1.3, luckMod: 0.05 },
    deep: { name: 'Deep', threshold: 0.6, difficulty: 1.6, luckMod: 0.1 },
    abyss: { name: 'Abyss', threshold: 1, difficulty: 2, luckMod: 0.15 }
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
    { id: 'zone_medium', name: 'Medium Access', desc: 'Unlock medium zone', price: 500, maxLevel: 1, effect: 'zone_medium' },
    { id: 'zone_deep', name: 'Deep Access', desc: 'Unlock deep zone', price: 1500, maxLevel: 1, effect: 'zone_deep' },
    { id: 'zone_abyss', name: 'Abyss Access', desc: 'Unlock abyss zone', price: 3000, maxLevel: 1, effect: 'zone_abyss' },
    { id: 'run_speed', name: 'Quick Hands', desc: '+15% catch window permanently', price: 150, maxLevel: 2, effect: 'run_speed' }
];

const COLLECTION_MILESTONES = {
    common: [10, 25, 50],
    uncommon: [10, 25, 50],
    rare: [8, 20, 40],
    epic: [5, 15, 30],
    legendary: [3, 10, 20]
};

const COLLECTION_BONUSES = {
    common: [0.05, 0.10, 0.20],
    uncommon: [0.05, 0.10, 0.20],
    rare: [0.08, 0.15, 0.25],
    epic: [0.10, 0.20, 0.35],
    legendary: [0.15, 0.30, 0.50]
};

const MASTERY_THRESHOLDS = [25, 50, 100];
const MASTERY_BONUSES = [0.05, 0.10, 0.15];

const ZONE_FISH_POOLS = {
    shallow: FISH_DATA.filter(f => f.zones.includes('shallow')),
    medium: FISH_DATA.filter(f => f.zones.includes('medium')),
    deep: FISH_DATA.filter(f => f.zones.includes('deep')),
    abyss: FISH_DATA.filter(f => f.zones.includes('abyss'))
};

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const RARITY_THRESHOLDS = [0.35, 0.65, 0.85, 0.95, 1.0];

let dom = {};

let gameState = {
    coins: 0,
    collection: {},
    fishMilestones: {},
    unlockedZones: ['shallow'],
    permanentUpgrades: {},
    zoneMastery: { shallow: 0, medium: 0, deep: 0, abyss: 0 },
    seenTensionHint: false,
    
    runActive: false,
    runBait: 10,
    runInventory: { basic: 0, lucky: 0, quick: 0, golden: 0, deep: 0 },
    runStats: { fishCaught: 0, coinsEarned: 0, bestFish: null },
    selectedBait: 'basic',
    selectedBaitColor: '#fff',
    
    fishingState: 'idle',
    canCatch: false,
    currentZone: 'shallow',
    baseLuck: 0,
    baseSpeed: 1,
    
    tension: {
        active: false,
        direction: 0,
        pullStrength: 0,
        lineHealth: 100
    },
    
    time: 0,
    mouseX: 0,
    mouseY: 0,
    castTargetX: WIDTH * 0.5,
    castTargetY: HEIGHT * 0.7,
    castAnimFrame: 0,
    particles: [],
    clouds: [
        { x: 50, y: 25, w: 40, speed: 0.05 },
        { x: 200, y: 35, w: 35, speed: 0.03 },
        { x: 280, y: 20, w: 30, speed: 0.04 }
    ],
    bubbles: [],
    glints: [],
    fireflies: [],
    fishShadows: []
};

function init() {
    cacheDOM();
    loadGame();
    setupUI();
    setupMouse();
    initAmbientParticles();
    requestAnimationFrame(gameLoop);
}

function cacheDOM() {
    dom = {
        coinCount: document.getElementById('coin-count'),
        baitCount: document.getElementById('bait-count'),
        baitSelect: document.getElementById('bait-select'),
        catchPopup: document.getElementById('catch-popup'),
        catchContent: document.getElementById('catch-content'),
        escapePopup: document.getElementById('escape-popup'),
        baitPopup: document.getElementById('bait-popup'),
        runUi: document.getElementById('run-ui'),
        startRunBtn: document.getElementById('start-run-btn'),
        journalBtn: document.getElementById('journal-btn'),
        shopBtn: document.getElementById('shop-btn'),
        endRunBtn: document.getElementById('end-run-btn'),
        journalModal: document.getElementById('journal-modal'),
        shopModal: document.getElementById('shop-modal'),
        summaryModal: document.getElementById('summary-modal'),
        journalGrid: document.getElementById('journal-grid'),
        shopItems: document.getElementById('shop-items'),
        summaryFish: document.getElementById('summary-fish'),
        summaryCoins: document.getElementById('summary-coins'),
        summaryBest: document.getElementById('summary-best')
    };
}

function initAmbientParticles() {
    for (let i = 0; i < 6; i++) {
        spawnBubble();
    }
    for (let i = 0; i < 12; i++) {
        spawnGlint();
    }
    for (let i = 0; i < 8; i++) {
        spawnFirefly();
    }
    for (let i = 0; i < 2; i++) {
        spawnFishShadow();
    }
}

function loadGame() {
    const saved = localStorage.getItem('cozyFishingRL');
    if (saved) {
        const data = JSON.parse(saved);
        gameState.coins = data.coins || 0;
        gameState.collection = data.collection || {};
        gameState.fishMilestones = data.fishMilestones || {};
        gameState.permanentUpgrades = data.permanentUpgrades || {};
        gameState.zoneMastery = data.zoneMastery || { shallow: 0, medium: 0, deep: 0, abyss: 0 };
        gameState.seenTensionHint = data.seenTensionHint || false;
        
        applyPermanentUpgrades();
    }
}

function applyPermanentUpgrades() {
    gameState.baseLuck = (gameState.permanentUpgrades['start_luck'] || 0) * 0.05;
    gameState.baseSpeed = 1 + (gameState.permanentUpgrades['run_speed'] || 0) * 0.15;
    
    const startBaitBonus = (gameState.permanentUpgrades['start_bait'] || 0) * 5;
    gameState.runBait = 10 + startBaitBonus;
    
    gameState.unlockedZones = ['shallow'];
    if (gameState.permanentUpgrades['zone_medium']) gameState.unlockedZones.push('medium');
    if (gameState.permanentUpgrades['zone_deep']) gameState.unlockedZones.push('deep');
    if (gameState.permanentUpgrades['zone_abyss']) gameState.unlockedZones.push('abyss');
}

function saveGame() {
    localStorage.setItem('cozyFishingRL', JSON.stringify({
        coins: gameState.coins,
        collection: gameState.collection,
        fishMilestones: gameState.fishMilestones,
        permanentUpgrades: gameState.permanentUpgrades,
        zoneMastery: gameState.zoneMastery,
        seenTensionHint: gameState.seenTensionHint
    }));
}

function startRun() {
    gameState.runActive = true;
    gameState.runStats = { fishCaught: 0, coinsEarned: 0, bestFish: null };
    gameState.runInventory = { basic: 0, lucky: 0, quick: 0, golden: 0, deep: 0 };
    
    const startBaitBonus = (gameState.permanentUpgrades['start_bait'] || 0) * 5;
    gameState.runBait = 10 + startBaitBonus;
    gameState.selectedBait = 'basic';
    gameState.selectedBaitColor = '#fff';
    
    dom.runUi.classList.remove('hidden');
    dom.startRunBtn.classList.add('hidden');
    updateBaitDisplay();
}

function endRun() {
    gameState.runActive = false;
    gameState.fishingState = 'idle';
    
    dom.runUi.classList.add('hidden');
    dom.startRunBtn.classList.remove('hidden');
    
    showRunSummary();
}

function showRunSummary() {
    const stats = gameState.runStats;
    dom.summaryFish.textContent = stats.fishCaught;
    dom.summaryCoins.textContent = stats.coinsEarned;
    dom.summaryBest.textContent = stats.bestFish ? `${stats.bestFish.emoji} ${stats.bestFish.name}` : 'None';
    dom.summaryModal.classList.remove('hidden');
}

function setupUI() {
    dom.journalBtn.onclick = () => openModal('journal');
    dom.shopBtn.onclick = () => openModal('shop');
    dom.startRunBtn.onclick = () => startRun();
    dom.endRunBtn.onclick = () => endRun();
    dom.baitSelect.onchange = (e) => {
        gameState.selectedBait = e.target.value;
        gameState.selectedBaitColor = BAIT_TYPES.find(b => b.id === gameState.selectedBait)?.color || '#fff';
    };
    
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.onclick = () => closeModal();
    });
    
    canvas.onclick = handleClick;
}

function setupMouse() {
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        gameState.mouseX = Math.max(0, Math.min(WIDTH, (e.clientX - rect.left) / SCALE));
        gameState.mouseY = Math.max(0, Math.min(HEIGHT, (e.clientY - rect.top) / SCALE));
    });
}

function openModal(type) {
    const modal = dom[type + 'Modal'];
    modal.classList.remove('hidden');
    
    if (type === 'journal') renderJournal();
    if (type === 'shop') renderShop();
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

function renderJournal() {
    dom.journalGrid.innerHTML = '';
    
    FISH_DATA.forEach(fish => {
        const caught = gameState.collection[fish.id] || 0;
        const milestones = COLLECTION_MILESTONES[fish.rarity];
        const currentMilestone = gameState.fishMilestones[fish.id] || 0;
        
        let progressHtml = '';
        if (caught > 0) {
            let nextMilestone = milestones[currentMilestone];
            let progress = nextMilestone ? Math.min(caught / nextMilestone * 100, 100) : 100;
            let milestoneText = currentMilestone >= milestones.length ? 'MAX' : `${caught}/${nextMilestone}`;
            
            progressHtml = `
                <div class="milestone-progress">
                    <div class="milestone-bar" style="width:${progress}%"></div>
                </div>
                <div class="milestone-text">${milestoneText}</div>
            `;
        }
        
        const card = document.createElement('div');
        card.className = 'fish-card' + (caught ? '' : ' uncaught');
        card.innerHTML = `
            <div class="fish-sprite">${fish.emoji}</div>
            <div class="fish-name">${caught ? fish.name : '???'}</div>
            <div class="fish-count">${caught ? `x${caught}` : ''}</div>
            ${progressHtml}
            <div class="fish-zones">${caught ? fish.zones.join(' ') : ''}</div>
        `;
        if (caught) {
            card.onclick = () => showFishInfo(fish);
        }
        dom.journalGrid.appendChild(card);
    });
}

function renderShop() {
    dom.shopItems.innerHTML = '<h3 style="margin-bottom:15px;color:#7dd3fc;">Permanent Upgrades</h3>';
    
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
        dom.shopItems.appendChild(div);
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
    const caught = gameState.collection[fish.id] || 0;
    const milestones = COLLECTION_MILESTONES[fish.rarity];
    const currentMilestone = gameState.fishMilestones[fish.id] || 0;
    const bonus = getCollectionBonus(fish) * 100;
    
    let milestoneStr = '';
    if (caught > 0) {
        if (currentMilestone >= milestones.length) {
            milestoneStr = `\nMilestone: MAX (${milestones[milestones.length - 1]} caught)`;
        } else {
            milestoneStr = `\nNext Milestone: ${milestones[currentMilestone]} (${caught}/${milestones[currentMilestone]})`;
        }
    }
    
    alert(`${fish.name}\nRarity: ${fish.rarity}\nBase Value: ${fish.value} coins\nCurrent Bonus: +${bonus.toFixed(0)}%\nZones: ${fish.zones.join(', ')}\nTotal caught: ${caught}${milestoneStr}`);
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
            if (gameState.tension.active) {
                const clickDirection = mx < gameState.castTargetX ? -1 : 1;
                const success = handleTensionClick(clickDirection);
                if (success) {
                    catchFish();
                }
            } else {
                catchFish();
            }
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
        gameState.selectedBaitColor = '#fff';
    }
    
    gameState.fishingState = 'waiting';
    gameState.castAnimFrame = 0;
    
    updateBaitDisplay();
    
    createSplash(gameState.castTargetX, gameState.castTargetY);
    
    const zone = DEPTH_ZONES[gameState.currentZone];
    const baseWait = 1500 + Math.random() * 3000;
    const waitTime = baseWait / (1 + zone.difficulty * 0.2);
    
    const masteryBonus = getMasteryBonus(gameState.currentZone);
    let catchDuration = 800 / gameState.baseSpeed;
    catchDuration *= (1 + masteryBonus);
    if (gameState.selectedBait === 'quick') catchDuration *= 1.3;
    catchDuration /= zone.difficulty;
    
    setTimeout(() => {
        if (gameState.fishingState === 'waiting') {
            gameState.canCatch = true;
            
            if (gameState.currentZone === 'deep' || gameState.currentZone === 'abyss') {
                startTension();
            }
            
            setTimeout(() => {
                if (gameState.fishingState === 'waiting' && gameState.canCatch) {
                    gameState.canCatch = false;
                    gameState.fishingState = 'idle';
                    gameState.tension.active = false;
                    showEscapePopup();
                }
            }, catchDuration);
        }
    }, waitTime);
}

function startTension() {
    gameState.tension.active = true;
    gameState.tension.lineHealth = 100;
    
    if (!gameState.seenTensionHint) {
        gameState.seenTensionHint = true;
        showTensionHint();
        saveGame();
    }
    
    const masteryLevel = getMasteryLevel(gameState.currentZone);
    const masteryReduction = masteryLevel * 0.15;
    
    const baseStrength = gameState.currentZone === 'abyss' ? 0.8 : 0.5;
    gameState.tension.pullStrength = Math.max(0.2, baseStrength - masteryReduction);
    changeTensionDirection();
}

function showTensionHint() {
    dom.baitPopup.innerHTML = `🎣 Fish fighting!<br>Click ← or → to counter!`;
    dom.baitPopup.classList.remove('hidden');
    setTimeout(() => dom.baitPopup.classList.add('hidden'), 3000);
}

function changeTensionDirection() {
    gameState.tension.direction = Math.random() > 0.5 ? 1 : -1;
}

function handleTensionClick(direction) {
    if (!gameState.tension.active) return false;
    
    if (direction === gameState.tension.direction) {
        gameState.tension.lineHealth = Math.min(100, gameState.tension.lineHealth + 15);
        if (gameState.tension.lineHealth >= 100) {
            return true;
        }
    } else {
        gameState.tension.lineHealth -= 25;
        if (gameState.tension.lineHealth <= 0) {
            gameState.canCatch = false;
            gameState.fishingState = 'idle';
            gameState.tension.active = false;
            showEscapePopup();
            return false;
        }
    }
    changeTensionDirection();
    return false;
}

function catchFish() {
    gameState.canCatch = false;
    gameState.fishingState = 'reeling';
    
    const fish = selectRandomFish();
    let value = fish.value;
    
    const collectionBonus = getCollectionBonus(fish);
    value = Math.floor(value * (1 + collectionBonus));
    
    if (gameState.selectedBait === 'golden') value = Math.floor(value * 1.5);
    
    gameState.coins += value;
    gameState.runStats.coinsEarned += value;
    gameState.runStats.fishCaught++;
    
    if (!gameState.runStats.bestFish || fish.value > gameState.runStats.bestFish.value) {
        gameState.runStats.bestFish = fish;
    }
    
    gameState.collection[fish.id] = (gameState.collection[fish.id] || 0) + 1;
    gameState.zoneMastery[gameState.currentZone]++;
    
    checkMilestone(fish);
    
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

function getCollectionBonus(fish) {
    const milestones = COLLECTION_MILESTONES[fish.rarity];
    const bonuses = COLLECTION_BONUSES[fish.rarity];
    const caught = gameState.collection[fish.id] || 0;
    const currentMilestone = gameState.fishMilestones[fish.id] || 0;
    
    let bonus = 0;
    for (let i = 0; i < milestones.length; i++) {
        if (caught >= milestones[i]) {
            bonus = bonuses[i];
        }
    }
    return bonus;
}

function checkMilestone(fish) {
    const milestones = COLLECTION_MILESTONES[fish.rarity];
    const caught = gameState.collection[fish.id];
    const currentMilestone = gameState.fishMilestones[fish.id] || 0;
    
    for (let i = 0; i < milestones.length; i++) {
        if (caught >= milestones[i] && currentMilestone <= i) {
            gameState.fishMilestones[fish.id] = i + 1;
            showMilestonePopup(fish, i + 1);
            break;
        }
    }
    
    const zone = gameState.currentZone;
    const masteryLevel = getMasteryLevel(zone);
    if (masteryLevel > 0 && gameState.zoneMastery[zone] === MASTERY_THRESHOLDS[masteryLevel - 1]) {
        showMasteryPopup(zone, masteryLevel);
    }
}

function getMasteryLevel(zone) {
    const catches = gameState.zoneMastery[zone];
    for (let i = MASTERY_THRESHOLDS.length - 1; i >= 0; i--) {
        if (catches >= MASTERY_THRESHOLDS[i]) {
            return i + 1;
        }
    }
    return 0;
}

function getMasteryBonus(zone) {
    const level = getMasteryLevel(zone);
    return level > 0 ? MASTERY_BONUSES[level - 1] : 0;
}

function showMilestonePopup(fish, level) {
    const bonus = COLLECTION_BONUSES[fish.rarity][level - 1] * 100;
    dom.baitPopup.innerHTML = `🏆 ${fish.name} Milestone ${level}!<br>+${bonus}% value!`;
    dom.baitPopup.classList.remove('hidden');
    createCelebrationParticles();
    setTimeout(() => dom.baitPopup.classList.add('hidden'), 2500);
}

function showMasteryPopup(zone, level) {
    const bonus = MASTERY_BONUSES[level - 1] * 100;
    const zoneName = DEPTH_ZONES[zone].name;
    dom.baitPopup.innerHTML = `⭐ ${zoneName} Mastery ${level}!<br>+${bonus}% catch window!`;
    dom.baitPopup.classList.remove('hidden');
    createCelebrationParticles();
    setTimeout(() => dom.baitPopup.classList.add('hidden'), 2500);
}

function createCelebrationParticles() {
    const centerX = WIDTH / 2;
    const centerY = WATER_TOP;
    
    for (let i = 0; i < 25; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        gameState.particles.push({
            type: 'celebration',
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            life: 1,
            hue: Math.random() * 360
        });
    }
}

function selectRandomFish() {
    const zone = DEPTH_ZONES[gameState.currentZone];
    let luck = gameState.baseLuck + zone.luckMod;
    if (gameState.selectedBait === 'lucky') luck += 0.15;
    
    const zoneFish = ZONE_FISH_POOLS[gameState.currentZone];
    
    const roll = Math.random() + luck;
    
    let rarityIndex = 0;
    for (let i = 0; i < RARITY_THRESHOLDS.length; i++) {
        if (roll > RARITY_THRESHOLDS[i]) {
            rarityIndex = i + 1;
        }
    }
    
    const targetRarity = RARITY_ORDER[rarityIndex];
    const pool = zoneFish.filter(f => f.rarity === targetRarity);
    
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
    dom.baitPopup.innerHTML = `Found: ${bait.name}!`;
    dom.baitPopup.classList.remove('hidden');
    setTimeout(() => dom.baitPopup.classList.add('hidden'), 2000);
}

function showCatchPopup(fish, value) {
    const zone = DEPTH_ZONES[gameState.currentZone];
    dom.catchContent.innerHTML = `
        <div class="fish-emoji">${fish.emoji}</div>
        <div class="fish-name">${fish.name}</div>
        <div class="fish-zone">${zone.name}</div>
        <div class="fish-value">+${value} 🪙</div>
    `;
    dom.catchPopup.classList.remove('hidden');
}

function hideCatchPopup() {
    dom.catchPopup.classList.add('hidden');
}

function showEscapePopup() {
    dom.escapePopup.classList.remove('hidden');
    setTimeout(() => dom.escapePopup.classList.add('hidden'), 1500);
}

function updateCoinDisplay() {
    dom.coinCount.textContent = gameState.coins;
}

function updateBaitDisplay() {
    dom.baitCount.textContent = gameState.runBait;
    
    dom.baitSelect.innerHTML = `<option value="basic">Basic (${gameState.runBait})</option>`;
    
    BAIT_TYPES.forEach(bait => {
        if (bait.id === 'basic') return;
        const count = gameState.runInventory[bait.id] || 0;
        if (count > 0) {
            dom.baitSelect.innerHTML += `<option value="${bait.id}">${bait.name} (${count})</option>`;
        }
    });
}

function createSplash(x, y) {
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI / 6) + Math.random() * (Math.PI * 2 / 3);
        const speed = 1 + Math.random() * 2;
        gameState.particles.push({
            type: 'splash',
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: -Math.sin(angle) * speed * 1.5,
            life: 1,
            size: 1 + Math.random() * 2
        });
    }
    gameState.particles.push({
        type: 'ripple',
        x, y,
        radius: 3,
        alpha: 1
    });
}

function createSparkles(x, y) {
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.5;
        gameState.particles.push({
            type: 'sparkle',
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            hue: 40 + Math.random() * 40
        });
    }
}

function spawnBubble() {
    gameState.bubbles.push({
        x: DOCK_RIGHT + Math.random() * (WIDTH - DOCK_RIGHT - 20) + 10,
        y: HEIGHT - Math.random() * 20,
        size: 1 + Math.random() * 2,
        speed: 0.2 + Math.random() * 0.3,
        wobble: Math.random() * Math.PI * 2
    });
}

function spawnGlint() {
    gameState.glints.push({
        x: DOCK_RIGHT + Math.random() * (WIDTH - DOCK_RIGHT - 10),
        y: WATER_TOP + Math.random() * 5,
        phase: Math.random() * Math.PI * 2,
        speed: 1 + Math.random() * 2
    });
}

function spawnFirefly() {
    gameState.fireflies.push({
        x: Math.random() * WIDTH,
        y: Math.random() * WATER_TOP * 0.8,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.2,
        phase: Math.random() * Math.PI * 2,
        brightness: 0.5 + Math.random() * 0.5
    });
}

function spawnFishShadow() {
    const fromLeft = Math.random() > 0.5;
    const zone = ['shallow', 'medium', 'deep', 'abyss'][Math.floor(Math.random() * 4)];
    const zoneThreshold = DEPTH_ZONES[zone].threshold;
    const waterHeight = HEIGHT - WATER_TOP;
    
    gameState.fishShadows.push({
        x: fromLeft ? DOCK_RIGHT : WIDTH,
        y: WATER_TOP + waterHeight * (zoneThreshold - 0.1) + Math.random() * 15,
        size: 4 + Math.random() * 8,
        speed: (0.5 + Math.random() * 0.5) * (fromLeft ? 1 : -1),
        alpha: 0.3 + Math.random() * 0.3
    });
}

function updateParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        
        if (p.type === 'splash') {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= 0.03;
            if (p.life <= 0) {
                gameState.particles.splice(i, 1);
            }
        } else if (p.type === 'ripple') {
            p.radius += 0.5;
            p.alpha -= 0.02;
            if (p.alpha <= 0) {
                gameState.particles.splice(i, 1);
            }
        } else if (p.type === 'sparkle') {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            if (p.life <= 0) {
                gameState.particles.splice(i, 1);
            }
        } else if (p.type === 'celebration') {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.08;
            p.life -= 0.015;
            if (p.life <= 0) {
                gameState.particles.splice(i, 1);
            }
        }
    }
    
    for (let i = gameState.bubbles.length - 1; i >= 0; i--) {
        const b = gameState.bubbles[i];
        b.y -= b.speed;
        b.x += Math.sin(gameState.time * 3 + b.wobble) * 0.2;
        b.wobble += 0.02;
        if (b.y < WATER_TOP) {
            gameState.bubbles.splice(i, 1);
            spawnBubble();
        }
    }
    
    for (let i = gameState.glints.length - 1; i >= 0; i--) {
        const g = gameState.glints[i];
        g.phase += 0.05 * g.speed;
    }
    
    for (let i = gameState.fireflies.length - 1; i >= 0; i--) {
        const f = gameState.fireflies[i];
        f.x += f.vx + Math.sin(gameState.time * 2 + f.phase) * 0.1;
        f.y += f.vy + Math.cos(gameState.time * 1.5 + f.phase) * 0.08;
        f.phase += 0.03;
        
        if (f.x < 0) f.x = WIDTH;
        if (f.x > WIDTH) f.x = 0;
        if (f.y < 0) f.y = WATER_TOP * 0.8;
        if (f.y > WATER_TOP * 0.8) f.y = 0;
    }
    
    for (let i = gameState.fishShadows.length - 1; i >= 0; i--) {
        const fs = gameState.fishShadows[i];
        fs.x += fs.speed;
        
        if ((fs.speed > 0 && fs.x > WIDTH + 20) || (fs.speed < 0 && fs.x < DOCK_RIGHT - 20)) {
            gameState.fishShadows.splice(i, 1);
            if (Math.random() < 0.7) {
                setTimeout(spawnFishShadow, 2000 + Math.random() * 3000);
            }
        }
    }
}

function drawParticles() {
    for (const p of gameState.particles) {
        if (p.type === 'splash') {
            ctx.fillStyle = `rgba(150, 200, 255, ${p.life})`;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        } else if (p.type === 'ripple') {
            ctx.strokeStyle = `rgba(150, 200, 255, ${p.alpha * 0.5})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.stroke();
        } else if (p.type === 'sparkle') {
            ctx.fillStyle = `hsl(${p.hue}, 100%, 70%)`;
            ctx.globalAlpha = p.life;
            ctx.fillRect(p.x, p.y, 2, 2);
        } else if (p.type === 'celebration') {
            ctx.fillStyle = `hsl(${p.hue}, 100%, 60%)`;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1;
    
    for (const b of gameState.bubbles) {
        ctx.strokeStyle = `rgba(180, 220, 255, 0.4)`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = `rgba(220, 240, 255, 0.2)`;
        ctx.beginPath();
        ctx.arc(b.x - b.size * 0.3, b.y - b.size * 0.3, b.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    for (const g of gameState.glints) {
        const alpha = (Math.sin(g.phase) + 1) * 0.25 + 0.1;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(g.x, g.y, 1, 1);
    }
    
    for (const f of gameState.fireflies) {
        const glow = (Math.sin(gameState.time * 4 + f.phase) + 1) * 0.3 * f.brightness;
        
        ctx.fillStyle = `rgba(200, 255, 150, ${glow * 0.3})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = `rgba(255, 255, 200, ${glow})`;
        ctx.fillRect(f.x, f.y, 1, 1);
    }
    
    for (const fs of gameState.fishShadows) {
        ctx.fillStyle = `rgba(10, 20, 40, ${fs.alpha})`;
        ctx.beginPath();
        ctx.ellipse(fs.x, fs.y, fs.size, fs.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(fs.x - fs.size * fs.speed * 0.3, fs.y);
        ctx.lineTo(fs.x - fs.size * 1.3 * fs.speed * 0.3, fs.y - fs.size * 0.3);
        ctx.lineTo(fs.x - fs.size * 1.3 * fs.speed * 0.3, fs.y + fs.size * 0.3);
        ctx.closePath();
        ctx.fill();
    }
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
    
    if (gameState.tension.active) {
        gameState.tension.lineHealth -= gameState.tension.pullStrength;
        if (gameState.time % 0.5 < 0.02 && Math.random() < 0.3) {
            changeTensionDirection();
        }
        if (gameState.tension.lineHealth <= 0) {
            gameState.canCatch = false;
            gameState.fishingState = 'idle';
            gameState.tension.active = false;
            showEscapePopup();
        }
    }
    
    gameState.clouds.forEach(c => {
        c.x += c.speed;
        if (c.x > WIDTH + 50) c.x = -c.w;
    });
    
    updateParticles();
}

function render() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
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
        drawTensionUI();
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
    const gradient = ctx.createLinearGradient(0, WATER_TOP, 0, HEIGHT);
    
    gradient.addColorStop(0, '#2a5a8a');
    gradient.addColorStop(0.2, '#1a4a7a');
    gradient.addColorStop(0.4, '#0a3a6a');
    gradient.addColorStop(0.6, '#052a4a');
    gradient.addColorStop(1, '#020810');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(DOCK_RIGHT, WATER_TOP, WIDTH - DOCK_RIGHT, waterHeight);
    
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
    const zoneOrder = ['shallow', 'medium', 'deep', 'abyss'];
    const thresholds = [0, 0.2, 0.4, 0.6, 1.0];
    
    for (let i = 0; i < zoneOrder.length; i++) {
        const zoneId = zoneOrder[i];
        const zone = DEPTH_ZONES[zoneId];
        const unlocked = gameState.unlockedZones.includes(zoneId);
        const masteryLevel = getMasteryLevel(zoneId);
        
        const t0 = thresholds[i];
        const t1 = thresholds[i + 1];
        const zoneTop = WATER_TOP + waterHeight * t0;
        const zoneHeight = waterHeight * (t1 - t0);
        
        ctx.fillStyle = unlocked ? 'rgba(255,255,255,0.5)' : 'rgba(255,100,100,0.5)';
        ctx.fillText(zone.name.toUpperCase(), WIDTH - 5, zoneTop + zoneHeight / 2 + 3);
        
        if (!unlocked) {
            ctx.fillText('🔒', WIDTH - 50, zoneTop + zoneHeight / 2 + 3);
        } else if (masteryLevel > 0) {
            const stars = '★'.repeat(masteryLevel) + '☆'.repeat(3 - masteryLevel);
            ctx.fillStyle = 'rgba(255,215,0,0.7)';
            ctx.fillText(stars, WIDTH - 60, zoneTop + zoneHeight / 2 + 3);
        }
    }
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
    
    ctx.strokeStyle = 'rgba(180, 180, 180, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rodTipX, rodTipY);
    
    const midX = (rodTipX + endX) / 2;
    const midY = Math.min(rodTipY, endY) - 15 + Math.sin(gameState.time * 3) * 5;
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    ctx.stroke();
    
    const bobberBob = Math.sin(gameState.time * 4) * 1;
    
    ctx.fillStyle = gameState.selectedBait !== 'basic' ? gameState.selectedBaitColor : '#ff4444';
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
    
    if (gameState.canCatch && !gameState.tension.active) {
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

function drawTensionUI() {
    if (!gameState.tension.active) return;
    
    const x = gameState.castTargetX;
    const y = gameState.castTargetY;
    
    const arrowPulse = Math.sin(gameState.time * 8) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255, 200, 50, ${arrowPulse})`;
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    
    const arrow = gameState.tension.direction > 0 ? '→' : '←';
    ctx.fillText(arrow, x, y - 15);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x - 20, y - 25, 40, 6);
    
    const healthWidth = (gameState.tension.lineHealth / 100) * 38;
    const healthColor = gameState.tension.lineHealth > 60 ? '#44ff44' : 
                        gameState.tension.lineHealth > 30 ? '#ffaa00' : '#ff4444';
    ctx.fillStyle = healthColor;
    ctx.fillRect(x - 19, y - 24, healthWidth, 4);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '6px monospace';
    ctx.fillText('←  →', x, y - 30);
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