import React, { useEffect, useRef, useState } from 'react';

function AdvancedGameEngine() {
  const canvasRef = useRef(null);

  // Estados do Jogo
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [level, setLevel] = useState(1);
  const [wave, setWave] = useState(1);
  const [health, setHealth] = useState(600);
  const [maxHealth, setMaxHealth] = useState(600);
  const [alliedShipsCount, setAlliedShipsCount] = useState(0);
  const [tacticalCommand, setTacticalCommand] = useState('LIVRE');

  // Níveis de Upgrades da Nave do Jogador
  const [upgrades, setUpgrades] = useState({
    cannons: 1,
    speed: 1,
    armor: 1,
    squadCap: 1,
  });

  // HUD do Chefão
  const [bossHp, setBossHp] = useState(null);
  const [bossName, setBossName] = useState('');
  const [bossActionText, setBossActionText] = useState('');

  // Estados de Controle de Partida
  const [empCooldown, setEmpCooldown] = useState(0);
  const [evolutionNotice, setEvolutionNotice] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const requestRef = useRef(null);
  const gameStateRef = useRef({
    score: 0,
    combo: 1,
    comboTimer: 0,
    level: 1,
    wave: 1,
    enemiesKilledInWave: 0,
    enemiesRequiredForBoss: 20,
    health: 600,
    maxHealth: 600,
    empTimer: 0,
    empMaxCooldown: 180,
    invincibleTimer: 180,
    hitCooldownTimer: 0,
    laserTimer: 0,
    superAmmoTimer: 0,
    gameOver: false,
    gameStarted: false,
    isPaused: false,
    bossActive: false,
    alliedShips: [],
    tacticalCommand: 'LIVRE',
    upgrades: {
      cannons: 1,
      speed: 1,
      armor: 1,
      squadCap: 1,
    },
  });

  // Alternar Pausa
  const togglePause = () => {
    if (!gameStateRef.current.gameStarted || gameStateRef.current.gameOver) return;
    const nextPaused = !gameStateRef.current.isPaused;
    gameStateRef.current.isPaused = nextPaused;
    setIsPaused(nextPaused);
  };

  // Evolução Automática ao Apertar [Space] ou [U]
  const triggerAutoUpgrade = () => {
    const ups = gameStateRef.current.upgrades;
    const currentScore = gameStateRef.current.score;

    const upgradeTypes = ['cannons', 'speed', 'armor', 'squadCap'];
    const typeNames = {
      cannons: 'CANHÕES QUÂNTICOS',
      speed: 'PROPULSORES HIPER-SÔNICOS',
      armor: 'BLINDAGEM NANOFORTIFICADA',
      squadCap: 'CAPACIDADE DE ESQUADRA',
    };

    for (let type of upgradeTypes) {
      const currentLvl = ups[type];
      const cost = currentLvl * 180;

      if (currentLvl < 5 && currentScore >= cost) {
        gameStateRef.current.score -= cost;
        gameStateRef.current.upgrades[type] += 1;

        if (type === 'armor') {
          gameStateRef.current.maxHealth += 100;
          gameStateRef.current.health += 100;
          setMaxHealth(gameStateRef.current.maxHealth);
          setHealth(gameStateRef.current.health);
        }

        setScore(gameStateRef.current.score);
        setUpgrades({ ...gameStateRef.current.upgrades });
        setEvolutionNotice(`⚡ AUTO-UPGRADE: ${typeNames[type]} LVL ${currentLvl + 1}!`);
        setTimeout(() => setEvolutionNotice(null), 2000);
        return;
      }
    }

    setEvolutionNotice('⚠️ PONTOS INSUFICIENTES OU TUDO NO NÍVEL MÁXIMO!');
    setTimeout(() => setEvolutionNotice(null), 1800);
  };

  const startGame = () => {
    const initHp = 600;

    gameStateRef.current = {
      score: 0,
      combo: 1,
      comboTimer: 0,
      level: 1,
      wave: 1,
      enemiesKilledInWave: 0,
      enemiesRequiredForBoss: 20,
      health: initHp,
      maxHealth: initHp,
      empTimer: 0,
      empMaxCooldown: 180,
      invincibleTimer: 180,
      hitCooldownTimer: 0,
      laserTimer: 0,
      superAmmoTimer: 0,
      gameOver: false,
      gameStarted: true,
      isPaused: false,
      bossActive: false,
      alliedShips: [],
      tacticalCommand: 'LIVRE',
      upgrades: { cannons: 1, speed: 1, armor: 1, squadCap: 1 },
    };

    setScore(0);
    setCombo(1);
    setLevel(1);
    setWave(1);
    setHealth(initHp);
    setMaxHealth(initHp);
    setAlliedShipsCount(0);
    setEmpCooldown(0);
    setUpgrades({ cannons: 1, speed: 1, armor: 1, squadCap: 1 });
    setTacticalCommand('LIVRE');
    setIsPaused(false);
    setEvolutionNotice('CONTROLES AGRUPADOS PRÓXIMOS AO WASD! [P] PAUSA');
    setTimeout(() => setEvolutionNotice(null), 3500);
    setBossHp(null);
    setBossName('');
    setBossActionText('');
    setGameOver(false);
    setGameStarted(true);
  };

  const quitGame = () => {
    gameStateRef.current.gameOver = true;
    gameStateRef.current.gameStarted = false;
    gameStateRef.current.isPaused = false;
    setIsPaused(false);
    setGameOver(true);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = canvas.parentElement.clientWidth);
    let height = (canvas.height = canvas.parentElement.clientHeight);

    const player = {
      x: width / 2,
      y: height - 70,
      size: 18,
      speed: 7.2,
      boost: 1.0,
    };

    // Estrelas de Fundo em Parallax
    const starField = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 1.5 + 0.3,
    }));

    let bullets = [];
    let enemyBullets = [];
    let xpModules = [];
    let powerUps = [];
    let enemies = [];
    let particles = [];
    let shockwaves = [];
    let gravityWells = [];
    let floatingTexts = [];

    const keys = {};

    const handleKeyDown = (e) => {
      const keysToBlock = [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'q', 'Q', 'e', 'E', 'r', 'R', 'f', 'F', 'p', 'P', 'u', 'U', '1', '2', '3', 'Shift'];
      if (keysToBlock.includes(e.key)) {
        e.preventDefault();
      }
      keys[e.key] = true;

      if (!gameStateRef.current.gameStarted || gameStateRef.current.gameOver) return;

      // PAUSA DO JOGO
      if (e.key === 'p' || e.key === 'P') {
        togglePause();
        return;
      }

      if (gameStateRef.current.isPaused) return;

      // TECLAS PRÓXIMAS (MÃO ESQUERDA)
      if (e.key === ' ' || e.key === 'u' || e.key === 'U') triggerAutoUpgrade();
      if (e.key === 'q' || e.key === 'Q') triggerEMP();
      if (e.key === 'e' || e.key === 'E') recruitAlliedShip();
      if (e.key === 'f' || e.key === 'F') triggerHeal();
      if (e.key === 'r' || e.key === 'R') triggerHyperLaser();

      if (e.key === '1') setCommand('ATACAR');
      if (e.key === '2') setCommand('DEFENDER');
      if (e.key === '3') setCommand('REAGRUPAR');
    };

    const setCommand = (cmd) => {
      gameStateRef.current.tacticalCommand = cmd;
      setTacticalCommand(cmd);

      if (cmd === 'REAGRUPAR') {
        gameStateRef.current.alliedShips.forEach((s) => {
          if (!s.isTraitor) s.loyalty = Math.min(100, s.loyalty + 30);
        });
      }

      setEvolutionNotice(`MANDATO EMITIDO: ${cmd}!`);
      setTimeout(() => setEvolutionNotice(null), 1800);
    };

    const handleKeyUp = (e) => {
      keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);

    // FUNÇÃO DE RECRUTAMENTO DE NAVES ALIADAS (TECLA [E])
    const recruitAlliedShip = () => {
      const cost = 50;
      const maxShips = gameStateRef.current.upgrades.squadCap * 2 + 2;

      if (gameStateRef.current.alliedShips.length >= maxShips) {
        setEvolutionNotice(`⚠️ LIMITE ATINGIDO (${maxShips}/${maxShips})! EVOLUA [ESPAÇO]!`);
        setTimeout(() => setEvolutionNotice(null), 2200);
        return;
      }

      if (gameStateRef.current.score < cost) {
        setEvolutionNotice(`⚠️ PRECISA DE ${cost} XP PARA RECRUTAR!`);
        setTimeout(() => setEvolutionNotice(null), 2000);
        return;
      }

      gameStateRef.current.score -= cost;
      setScore(gameStateRef.current.score);

      const newShip = {
        x: player.x + (Math.random() - 0.5) * 40,
        y: player.y - 20,
        size: 13,
        speed: 5.2,
        hp: 120,
        maxHp: 120,
        loyalty: 100,
        isTraitor: false,
        angle: -Math.PI / 2,
        targetX: player.x,
        targetY: player.y - 80,
        shootTimer: 0,
      };

      gameStateRef.current.alliedShips.push(newShip);
      setAlliedShipsCount(gameStateRef.current.alliedShips.length);

      createExplosion(player.x, player.y, '#38bdf8', 20);
      setEvolutionNotice(`🛸 NAVE RECRUTADA! (${gameStateRef.current.alliedShips.length}/${maxShips})`);
      setTimeout(() => setEvolutionNotice(null), 1800);
    };

    const autoFirePlayer = () => {
      const cannonLvl = gameStateRef.current.upgrades.cannons;
      const superAmmo = gameStateRef.current.superAmmoTimer > 0;

      if (superAmmo) {
        bullets.push({ x: player.x - 14, y: player.y - player.size, vx: -3.5, vy: -15, color: '#c084fc' });
        bullets.push({ x: player.x - 5, y: player.y - player.size, vx: -1, vy: -15, color: '#c084fc' });
        bullets.push({ x: player.x + 5, y: player.y - player.size, vx: 1, vy: -15, color: '#c084fc' });
        bullets.push({ x: player.x + 14, y: player.y - player.size, vx: 3.5, vy: -15, color: '#c084fc' });
        return;
      }

      if (cannonLvl === 1) {
        bullets.push({ x: player.x, y: player.y - player.size, vx: 0, vy: -12, color: '#38bdf8' });
      } else if (cannonLvl === 2) {
        bullets.push({ x: player.x - 8, y: player.y - player.size, vx: 0, vy: -13, color: '#38bdf8' });
        bullets.push({ x: player.x + 8, y: player.y - player.size, vx: 0, vy: -13, color: '#38bdf8' });
      } else if (cannonLvl === 3) {
        bullets.push({ x: player.x, y: player.y - player.size, vx: 0, vy: -13, color: '#38bdf8' });
        bullets.push({ x: player.x - 10, y: player.y - player.size, vx: -2, vy: -12, color: '#34d399' });
        bullets.push({ x: player.x + 10, y: player.y - player.size, vx: 2, vy: -12, color: '#34d399' });
      } else {
        bullets.push({ x: player.x - 12, y: player.y - player.size, vx: -2, vy: -14, color: '#c084fc' });
        bullets.push({ x: player.x - 4, y: player.y - player.size, vx: 0, vy: -14, color: '#38bdf8' });
        bullets.push({ x: player.x + 4, y: player.y - player.size, vx: 0, vy: -14, color: '#38bdf8' });
        bullets.push({ x: player.x + 12, y: player.y - player.size, vx: 2, vy: -14, color: '#c084fc' });
      }
    };

    const triggerEMP = () => {
      if (gameStateRef.current.empTimer <= 0) {
        gameStateRef.current.empTimer = gameStateRef.current.empMaxCooldown;
        shockwaves.push({ x: player.x, y: player.y, radius: 10, maxRadius: Math.max(width, height) * 0.9 });

        enemyBullets = [];

        gameStateRef.current.alliedShips.forEach((s) => {
          if (!s.isTraitor) s.loyalty = Math.min(100, s.loyalty + 50);
        });

        for (let i = enemies.length - 1; i >= 0; i--) {
          const e = enemies[i];
          if (e.type === 'BOSS' || e.type === 'ELITE') {
            e.hp -= 35;
          } else {
            createExplosion(e.x, e.y, e.color, 16);
            enemies.splice(i, 1);
          }
        }
      }
    };

    const triggerHeal = () => {
      const cost = 120;
      if (gameStateRef.current.score >= cost && gameStateRef.current.health < gameStateRef.current.maxHealth) {
        gameStateRef.current.score -= cost;
        gameStateRef.current.health = Math.min(gameStateRef.current.maxHealth, gameStateRef.current.health + 120);
        setScore(gameStateRef.current.score);
        setHealth(gameStateRef.current.health);
        createExplosion(player.x, player.y, '#34d399', 20);
      }
    };

    const triggerHyperLaser = () => {
      const cost = 220;
      if (gameStateRef.current.score >= cost && gameStateRef.current.laserTimer <= 0) {
        gameStateRef.current.score -= cost;
        gameStateRef.current.laserTimer = 220;
        setScore(gameStateRef.current.score);
      }
    };

    const applyDamageToPlayer = (amount) => {
      if (gameStateRef.current.invincibleTimer > 0 || gameStateRef.current.hitCooldownTimer > 0) return;

      const newHealth = gameStateRef.current.health - amount;
      gameStateRef.current.health = newHealth;
      gameStateRef.current.hitCooldownTimer = 40;
      setHealth(newHealth);

      if (newHealth <= 0) {
        if (gameStateRef.current.score >= 500) {
          gameStateRef.current.score -= 500;
          const recoveredHp = Math.floor(gameStateRef.current.maxHealth * 0.5);
          gameStateRef.current.health = recoveredHp;
          gameStateRef.current.hitCooldownTimer = 120;
          setScore(gameStateRef.current.score);
          setHealth(recoveredHp);
          setEvolutionNotice('🛡️ RESGATE DE EMERGÊNCIA USOU 500 XP!');
          setTimeout(() => setEvolutionNotice(null), 3000);
          createExplosion(player.x, player.y, '#38bdf8', 30);
        } else {
          gameStateRef.current.gameOver = true;
          setGameOver(true);
        }
      }
    };

    const createExplosion = (x, y, color, count = 14) => {
      for (let i = 0; i < count; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          size: Math.random() * 4 + 1,
          color,
          life: 28,
        });
      }
    };

    const spawnModule = (x = Math.random() * (width - 40) + 20, y = 20) => {
      xpModules.push({
        x,
        y,
        size: 10,
        speed: 1.0,
      });
    };

    const spawnPowerUp = (x, y) => {
      const types = ['HEAL', 'SHIELD', 'AMMO'];
      const pType = types[Math.floor(Math.random() * types.length)];
      powerUps.push({
        x,
        y,
        type: pType,
        size: 12,
        speed: 1.2,
      });
    };

    const spawnEnemy = (forceElite = false) => {
      const rand = Math.random();
      let type = 'STANDARD';
      let hp = 1;
      let size = 16;
      let speed = 1.4;
      let color = '#ef4444';

      if (forceElite || rand > 0.82) {
        type = 'ELITE';
        hp = 18;
        size = 30;
        speed = 1.2;
        color = '#f97316';
      } else if (rand > 0.65) {
        type = 'CORRUPTOR';
        hp = 3;
        size = 20;
        speed = 2.0;
        color = '#f59e0b';
      } else if (rand > 0.50) {
        type = 'SNIPER';
        hp = 2;
        size = 15;
        speed = 1.0;
        color = '#dc2626';
      } else if (rand > 0.35) {
        type = 'TANK';
        hp = 6;
        size = 24;
        speed = 0.8;
        color = '#2563eb';
      }

      let startX = Math.random() * (width - 80) + 40;
      let startY = Math.random() * 80 + 30;

      enemies.push({
        type,
        x: startX,
        y: startY,
        vx: (Math.random() - 0.5) * 2.5,
        vy: speed,
        size,
        hp,
        maxHp: hp,
        speed,
        color,
        shootTimer: 0,
        skillTimer: 0,
        shieldActive: false,
        dirTimer: Math.floor(Math.random() * 60) + 30,
      });
    };

    const spawnBoss = () => {
      gameStateRef.current.bossActive = true;

      const bossList = [
        { shape: 'RHOMBUS', name: 'LOSANGO QUÂNTICO', color: '#38bdf8' },
        { shape: 'OCTAGON_COMPLEX', name: 'OCTÓGONO DO VAZIO', color: '#a855f7' },
        { shape: 'TITAN_SHIP', name: 'TITÃ GEOMÉTRICO DE AÇO', color: '#f43f5e' }
      ];

      const bossData = bossList[(gameStateRef.current.wave - 1) % bossList.length];
      setBossName(bossData.name);

      enemies.push({
        type: 'BOSS',
        shape: bossData.shape,
        name: bossData.name,
        x: width / 2,
        y: 80,
        size: 58,
        hp: 200 + gameStateRef.current.wave * 35,
        maxHp: 200 + gameStateRef.current.wave * 35,
        speed: 1.2,
        vx: 2.2,
        vy: 0.8,
        color: bossData.color,
        shootTimer: 0,
        aiDecisionTimer: 0,
        shieldActive: false,
        shieldTimer: 0,
      });
    };

    let frameCount = 0;

    const gameLoop = () => {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Renderização das Estrelas Parallax
      starField.forEach((s) => {
        if (!gameStateRef.current.isPaused) s.y += s.speed;
        if (s.y > height) s.y = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(s.x, s.y, s.size, s.size);
      });

      // Grid Neon
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 28;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // Moldura Luminosa de Borda da Arena
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, width - 4, height - 4);

      if (gameStateRef.current.gameStarted && !gameStateRef.current.gameOver && !gameStateRef.current.isPaused) {
        frameCount++;

        if (keys['Shift']) {
          player.boost = 1.7;
        } else {
          player.boost = 1.0;
        }

        if (gameStateRef.current.hitCooldownTimer > 0) {
          gameStateRef.current.hitCooldownTimer--;
        }

        if (gameStateRef.current.empTimer > 0) {
          gameStateRef.current.empTimer--;
          const cdPct = Math.floor((1 - gameStateRef.current.empTimer / gameStateRef.current.empMaxCooldown) * 100);
          setEmpCooldown(cdPct);
        }

        if (gameStateRef.current.invincibleTimer > 0) {
          gameStateRef.current.invincibleTimer--;
        }

        if (gameStateRef.current.laserTimer > 0) {
          gameStateRef.current.laserTimer--;
        }

        if (gameStateRef.current.superAmmoTimer > 0) {
          gameStateRef.current.superAmmoTimer--;
        }

        if (gameStateRef.current.comboTimer > 0) {
          gameStateRef.current.comboTimer--;
          if (gameStateRef.current.comboTimer <= 0) {
            gameStateRef.current.combo = 1;
            setCombo(1);
          }
        }

        if (!gameStateRef.current.bossActive && gameStateRef.current.enemiesKilledInWave >= gameStateRef.current.enemiesRequiredForBoss) {
          spawnBoss();
        }

        // Densidade Mínima Garantida
        const minEnemies = gameStateRef.current.bossActive ? 2 : 5;
        if (enemies.length < minEnemies) {
          spawnEnemy();
        }

        if (frameCount % 18 === 0) spawnModule();
        if (frameCount % 24 === 0) spawnEnemy();

        const spd = (player.speed + gameStateRef.current.upgrades.speed * 0.8) * player.boost;
        if ((keys['ArrowLeft'] || keys['a'] || keys['A']) && player.x > player.size) player.x -= spd;
        if ((keys['ArrowRight'] || keys['d'] || keys['D']) && player.x < width - player.size) player.x += spd;
        if ((keys['ArrowUp'] || keys['w'] || keys['W']) && player.y > player.size) player.y -= spd;
        if ((keys['ArrowDown'] || keys['s'] || keys['S']) && player.y < height - player.size) player.y += spd;

        if (frameCount % 10 === 0) {
          autoFirePlayer();
        }

        // POWER-UPS
        for (let p = powerUps.length - 1; p >= 0; p--) {
          const pw = powerUps[p];
          pw.y += pw.speed;

          let pColor = '#10b981';
          if (pw.type === 'SHIELD') pColor = '#38bdf8';
          if (pw.type === 'AMMO') pColor = '#c084fc';

          ctx.save();
          ctx.fillStyle = pColor;
          ctx.shadowBlur = 10;
          ctx.shadowColor = pColor;
          ctx.beginPath();
          ctx.arc(pw.x, pw.y, pw.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          if (Math.hypot(player.x - pw.x, player.y - pw.y) < player.size + pw.size) {
            if (pw.type === 'HEAL') {
              gameStateRef.current.health = Math.min(gameStateRef.current.maxHealth, gameStateRef.current.health + 100);
              setHealth(gameStateRef.current.health);
              floatingTexts.push({ x: pw.x, y: pw.y, text: '+VIDA!', color: '#10b981', life: 40 });
            } else if (pw.type === 'SHIELD') {
              gameStateRef.current.invincibleTimer = 280;
              floatingTexts.push({ x: pw.x, y: pw.y, text: 'ESCUDO!', color: '#38bdf8', life: 40 });
            } else if (pw.type === 'AMMO') {
              gameStateRef.current.superAmmoTimer = 320;
              floatingTexts.push({ x: pw.x, y: pw.y, text: 'MUNIÇÃO QUÂNTICA!', color: '#c084fc', life: 40 });
            }
            powerUps.splice(p, 1);
          } else if (pw.y > height + 20) {
            powerUps.splice(p, 1);
          }
        }

        // BURACOS NEGROS
        for (let g = gravityWells.length - 1; g >= 0; g--) {
          const gw = gravityWells[g];
          gw.life--;

          ctx.save();
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(gw.x, gw.y, gw.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          const distP = Math.hypot(gw.x - player.x, gw.y - player.y);
          if (distP < gw.radius * 2) {
            const angle = Math.atan2(gw.y - player.y, gw.x - player.x);
            player.x += Math.cos(angle) * 2.4;
            player.y += Math.sin(angle) * 2.4;
          }

          if (gw.life <= 0) gravityWells.splice(g, 1);
        }

        // NAVES ALIADAS
        const cmd = gameStateRef.current.tacticalCommand;

        for (let sIdx = gameStateRef.current.alliedShips.length - 1; sIdx >= 0; sIdx--) {
          const ship = gameStateRef.current.alliedShips[sIdx];

          if (ship.isTraitor) {
            ship.angle = Math.atan2(player.y - ship.y, player.x - ship.x);

            ship.targetX = player.x;
            ship.targetY = player.y - 80;
            ship.x += (ship.targetX - ship.x) * 0.04;
            ship.y += (ship.targetY - ship.y) * 0.04;

            ship.shootTimer++;
            if (ship.shootTimer % 18 === 0) {
              const vx = Math.cos(ship.angle) * 7;
              const vy = Math.sin(ship.angle) * 7;
              enemyBullets.push({ x: ship.x, y: ship.y, vx, vy, color: '#f59e0b' });
            }

            for (let j = bullets.length - 1; j >= 0; j--) {
              const b = bullets[j];
              if (Math.hypot(ship.x - b.x, ship.y - b.y) < ship.size + 6) {
                bullets.splice(j, 1);
                ship.hp -= 20;

                if (ship.hp <= 0) {
                  createExplosion(ship.x, ship.y, '#f59e0b', 22);
                  spawnPowerUp(ship.x, ship.y);
                  gameStateRef.current.alliedShips.splice(sIdx, 1);
                  setAlliedShipsCount(gameStateRef.current.alliedShips.length);
                  break;
                }
              }
            }

          } else {
            ship.angle = -Math.PI / 2;

            if (cmd === 'DEFENDER') {
              ship.targetX = player.x + Math.sin(frameCount * 0.1 + sIdx * 2) * 45;
              ship.targetY = player.y + Math.cos(frameCount * 0.1 + sIdx * 2) * 45;
            } else if (cmd === 'REAGRUPAR') {
              ship.targetX = player.x + (sIdx - 1) * 30;
              ship.targetY = player.y + 35;
            } else {
              let closestTarget = null;
              let minDist = Infinity;

              enemies.concat(gameStateRef.current.alliedShips.filter(s => s.isTraitor)).forEach((e) => {
                const d = Math.hypot(e.x - ship.x, e.y - ship.y);
                if (d < minDist) {
                  minDist = d;
                  closestTarget = e;
                }
              });

              if (closestTarget) {
                ship.targetX = closestTarget.x;
                ship.targetY = closestTarget.y + 110;
              } else {
                ship.targetX = player.x + Math.sin(frameCount * 0.05 + sIdx) * 60;
                ship.targetY = player.y - 50;
              }
            }

            ship.x += (ship.targetX - ship.x) * 0.06;
            ship.y += (ship.targetY - ship.y) * 0.06;

            ship.shootTimer++;
            if (ship.shootTimer % 16 === 0) {
              bullets.push({ x: ship.x, y: ship.y - ship.size, vx: 0, vy: -11, color: '#38bdf8' });
            }
          }

          if (gameStateRef.current.alliedShips[sIdx]) {
            ctx.save();
            ctx.translate(ship.x, ship.y);
            ctx.rotate(ship.angle + Math.PI / 2);

            ctx.fillStyle = ship.isTraitor ? '#f59e0b' : '#38bdf8';
            ctx.shadowBlur = 12;
            ctx.shadowColor = ship.isTraitor ? '#f59e0b' : '#38bdf8';

            ctx.beginPath();
            ctx.moveTo(0, -ship.size);
            ctx.lineTo(-ship.size, ship.size);
            ctx.lineTo(0, ship.size * 0.5);
            ctx.lineTo(ship.size, ship.size);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            if (ship.hp <= 0 && !ship.isTraitor) {
              createExplosion(ship.x, ship.y, '#38bdf8', 18);
              gameStateRef.current.alliedShips.splice(sIdx, 1);
              setAlliedShipsCount(gameStateRef.current.alliedShips.length);
            }
          }
        }

        // TEXTOS FLUTUANTES
        for (let t = floatingTexts.length - 1; t >= 0; t--) {
          const ft = floatingTexts[t];
          ft.y -= 0.8;
          ft.life--;

          ctx.save();
          ctx.fillStyle = ft.color;
          ctx.font = 'bold 10px monospace';
          ctx.fillText(ft.text, ft.x - 20, ft.y);
          ctx.restore();

          if (ft.life <= 0) floatingTexts.splice(t, 1);
        }

        // Laser
        if (gameStateRef.current.laserTimer > 0) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 18;
          ctx.shadowBlur = 25;
          ctx.shadowColor = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(player.x, player.y - player.size);
          ctx.lineTo(player.x, 0);
          ctx.stroke();

          enemies.forEach((e) => {
            if (Math.abs(e.x - player.x) < e.size + 12) {
              e.hp -= 1.0;
              createExplosion(e.x, e.y, e.color, 2);
            }
          });
        }

        // EMP
        for (let i = shockwaves.length - 1; i >= 0; i--) {
          const sw = shockwaves[i];
          sw.radius += 14;

          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
          ctx.stroke();

          if (sw.radius >= sw.maxRadius) shockwaves.splice(i, 1);
        }

        // Tiros do Jogador
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.x += b.vx;
          b.y += b.vy;

          ctx.fillStyle = b.color || '#38bdf8';
          ctx.fillRect(b.x - 2, b.y, 4, 10);

          if (b.y < -10 || b.x < -10 || b.x > width + 10) bullets.splice(i, 1);
        }

        // Tiros Inimigos
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
          const eb = enemyBullets[i];
          eb.x += eb.vx || 0;
          eb.y += eb.vy || 2.8;

          ctx.fillStyle = eb.color || '#ef4444';
          ctx.beginPath();
          ctx.arc(eb.x, eb.y, 4, 0, Math.PI * 2);
          ctx.fill();

          if (Math.hypot(player.x - eb.x, player.y - eb.y) < player.size + 4) {
            enemyBullets.splice(i, 1);
            applyDamageToPlayer(10);
            continue;
          }

          for (let sIdx = 0; sIdx < gameStateRef.current.alliedShips.length; sIdx++) {
            const ship = gameStateRef.current.alliedShips[sIdx];
            if (!ship.isTraitor && Math.hypot(ship.x - eb.x, ship.y - eb.y) < ship.size + 4) {
              enemyBullets.splice(i, 1);
              ship.hp -= 12;
              createExplosion(ship.x, ship.y, '#ef4444', 4);
              break;
            }
          }
        }

        // BOLINHAS LARANJAS DE XP
        for (let i = xpModules.length - 1; i >= 0; i--) {
          const mod = xpModules[i];
          const distToPlayer = Math.hypot(player.x - mod.x, player.y - mod.y);

          if (distToPlayer < 150) {
            const angle = Math.atan2(player.y - mod.y, player.x - mod.x);
            mod.x += Math.cos(angle) * 7.5;
            mod.y += Math.sin(angle) * 7.5;
          } else {
            mod.y += mod.speed;
          }

          ctx.save();
          ctx.fillStyle = '#f97316';
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#f97316';
          ctx.beginPath();
          ctx.arc(mod.x, mod.y, mod.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          if (distToPlayer < player.size + mod.size + 6) {
            xpModules.splice(i, 1);
            const addedScore = 100 * gameStateRef.current.combo;
            const newScore = gameStateRef.current.score + addedScore;
            gameStateRef.current.score = newScore;
            setScore(newScore);

            const newLevel = Math.floor(newScore / 250) + 1;
            if (newLevel !== gameStateRef.current.level) {
              gameStateRef.current.level = newLevel;
              setLevel(newLevel);
            }
            continue;
          }

          if (mod.y > height + 20) xpModules.splice(i, 1);
        }

        // INIMIGOS DENTRO DOS LIMITES
        for (let i = enemies.length - 1; i >= 0; i--) {
          const e = enemies[i];

          e.dirTimer--;
          if (e.dirTimer <= 0 && e.type !== 'BOSS') {
            e.dirTimer = Math.floor(Math.random() * 70) + 30;

            if (e.type === 'ELITE') {
              const targetX = player.x + (Math.random() - 0.5) * 140;
              const angle = Math.atan2(player.y - 100 - e.y, targetX - e.x);
              e.vx = Math.cos(angle) * 2.8;
              e.vy = Math.sin(angle) * 1.6;
            } else if (e.type === 'SNIPER') {
              e.vx = (Math.random() - 0.5) * 3;
              e.vy = e.y > 110 ? -0.8 : 0.8;
            } else if (e.type === 'TANK') {
              e.vx = (player.x - e.x) * 0.012;
              e.vy = 1.0;
            } else {
              e.vx = (Math.random() - 0.5) * 3.5;
              e.vy = Math.random() * 1.5 + 0.8;
            }
          }

          e.x += e.vx || 0;
          e.y += e.vy || e.speed;

          const margin = e.size + 5;
          if (e.x < margin) {
            e.x = margin;
            e.vx = Math.abs(e.vx || 2);
          } else if (e.x > width - margin) {
            e.x = width - margin;
            e.vx = -Math.abs(e.vx || 2);
          }

          if (e.y < margin) {
            e.y = margin;
            e.vy = Math.abs(e.vy || 1.5);
          } else if (e.y > height - margin - 30 && e.type === 'BOSS') {
            e.y = height - margin - 30;
            e.vy = -Math.abs(e.vy || 1.5);
          }

          if (e.type === 'BOSS') {
            e.shootTimer++;
            e.aiDecisionTimer++;

            if (e.aiDecisionTimer % 100 === 0) {
              setBossActionText('USOU: MATRIZ DE LASERS 360°!');
              for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
                enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 4, vy: Math.sin(a) * 4, color: e.color });
              }
              setTimeout(() => setBossActionText(''), 1800);
            }

            setBossHp(Math.floor((e.hp / e.maxHp) * 100));

            ctx.save();
            ctx.translate(e.x, e.y);
            ctx.strokeStyle = e.color;
            ctx.lineWidth = 4;
            ctx.shadowBlur = 25;
            ctx.shadowColor = e.color;

            if (e.shape === 'RHOMBUS') {
              ctx.rotate(frameCount * 0.03);
              ctx.beginPath();
              ctx.moveTo(0, -e.size);
              ctx.lineTo(e.size * 0.8, 0);
              ctx.lineTo(0, e.size);
              ctx.lineTo(-e.size * 0.8, 0);
              ctx.closePath();
              ctx.stroke();
            } else {
              ctx.rotate(frameCount * 0.02);
              ctx.beginPath();
              for (let side = 0; side < 8; side++) {
                const a = (side * Math.PI) / 4;
                if (side === 0) ctx.moveTo(Math.cos(a) * e.size, Math.sin(a) * e.size);
                else ctx.lineTo(Math.cos(a) * e.size, Math.sin(a) * e.size);
              }
              ctx.closePath(); ctx.stroke();
            }
            ctx.restore();

          } else if (e.type === 'ELITE') {
            e.shootTimer++;
            e.skillTimer++;

            if (e.skillTimer % 75 === 0) {
              const skillChoice = Math.floor(Math.random() * 5);

              if (skillChoice === 0) {
                const angle = Math.atan2(player.y - e.y, player.x - e.x);
                enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(angle) * 7.5, vy: Math.sin(angle) * 7.5, color: '#f97316' });
              } else if (skillChoice === 1) {
                for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
                  enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 3.5, vy: Math.sin(a) * 3.5, color: '#f97316' });
                }
              } else if (skillChoice === 2) {
                e.shieldActive = true;
                setTimeout(() => { if (e) e.shieldActive = false; }, 1500);
              } else if (skillChoice === 3) {
                e.y += 28;
              } else {
                shockwaves.push({ x: e.x, y: e.y, radius: 5, maxRadius: 110 });
              }
            }

            ctx.save();
            ctx.translate(e.x, e.y);
            ctx.strokeStyle = e.color;
            ctx.lineWidth = 4;
            ctx.shadowBlur = 14;
            ctx.shadowColor = e.color;
            ctx.strokeRect(-e.size / 2, -e.size / 2, e.size, e.size);

            if (e.shieldActive) {
              ctx.strokeStyle = '#38bdf8';
              ctx.beginPath();
              ctx.arc(0, 0, e.size + 8, 0, Math.PI * 2);
              ctx.stroke();
            }
            ctx.restore();

          } else {
            ctx.save();
            ctx.strokeStyle = e.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(e.x - e.size / 2, e.y - e.size / 2, e.size, e.size);
            ctx.restore();
          }

          // Colisão com Tiros
          for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            if (Math.hypot(e.x - b.x, e.y - b.y) < e.size / 2 + 4) {
              if (e.type === 'ELITE' && e.shieldActive) {
                bullets.splice(j, 1);
                continue;
              }

              bullets.splice(j, 1);
              e.hp--;

              if (e.hp <= 0) {
                createExplosion(e.x, e.y, e.color, e.type === 'BOSS' ? 40 : 14);

                for (let orb = 0; orb < (e.type === 'BOSS' ? 8 : 2); orb++) {
                  spawnModule(e.x + (Math.random() - 0.5) * 20, e.y + (Math.random() - 0.5) * 20);
                }

                if (Math.random() < 0.3) spawnPowerUp(e.x, e.y);

                if (e.type === 'BOSS') {
                  gameStateRef.current.bossActive = false;
                  gameStateRef.current.enemiesKilledInWave = 0;
                  gameStateRef.current.wave++;
                  setWave(gameStateRef.current.wave);
                  setBossHp(null);
                  setBossName('');
                  setBossActionText('');
                  setEvolutionNotice(`ONDA ${gameStateRef.current.wave} ALCANÇADA!`);
                  setTimeout(() => setEvolutionNotice(null), 2500);
                } else {
                  gameStateRef.current.enemiesKilledInWave++;
                }

                enemies.splice(i, 1);

                const newCombo = Math.min(5, gameStateRef.current.combo + 1);
                gameStateRef.current.combo = newCombo;
                gameStateRef.current.comboTimer = 180;
                setCombo(newCombo);

                const pts = (e.type === 'BOSS' ? 1200 : e.type === 'ELITE' ? 350 : 150) * newCombo;
                const newScore = gameStateRef.current.score + pts;
                gameStateRef.current.score = newScore;
                setScore(newScore);
                break;
              }
            }
          }

          // Dano de Impacto
          if (enemies[i] && Math.hypot(player.x - e.x, player.y - e.y) < player.size + e.size / 2) {
            applyDamageToPlayer(15);
            createExplosion(e.x, e.y, e.color);
            if (e.type !== 'BOSS') enemies.splice(i, 1);
          } else if (e.y > height + 40) {
            enemies.splice(i, 1);
          }
        }

        // Partículas
        for (let i = particles.length - 1; i >= 0; i--) {
          const pt = particles[i];
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.life--;

          ctx.fillStyle = pt.color;
          ctx.fillRect(pt.x, pt.y, pt.size, pt.size);

          if (pt.life <= 0) particles.splice(i, 1);
        }

        // Desenho da Nave Principal
        ctx.save();
        ctx.translate(player.x, player.y);

        if (gameStateRef.current.hitCooldownTimer > 0 && Math.floor(frameCount / 4) % 2 === 0) {
          ctx.globalAlpha = 0.3;
        }

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(-player.size * 0.4, player.size);
        ctx.lineTo(0, player.size + 10 + Math.random() * 6);
        ctx.lineTo(player.size * 0.4, player.size);
        ctx.fill();

        ctx.fillStyle = gameStateRef.current.upgrades.cannons >= 3 ? '#c084fc' : '#34d399';
        ctx.shadowBlur = 15;
        ctx.shadowColor = ctx.fillStyle;

        ctx.beginPath();
        ctx.moveTo(0, -player.size);
        ctx.lineTo(-player.size, player.size);
        ctx.lineTo(0, player.size * 0.5);
        ctx.lineTo(player.size, player.size);
        ctx.closePath();
        ctx.fill();

        if (gameStateRef.current.invincibleTimer > 0) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#38bdf8';
          ctx.beginPath();
          ctx.arc(0, 0, player.size + 12, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);

    const handleResize = () => {
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div className="w-full h-96 sm:h-[460px] bg-zinc-950 rounded-2xl border-2 border-zinc-800/80 overflow-hidden relative font-mono select-none shadow-2xl">
      {/* Barra do Chefão */}
      {bossHp !== null && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-80 bg-black/85 border border-purple-500/60 p-2 rounded-xl text-center z-20 shadow-[0_0_20px_rgba(168,85,247,0.4)] backdrop-blur-md">
          <p className="text-[10px] text-purple-400 font-bold mb-0.5">ALERTA: {bossName}</p>
          {bossActionText && (
            <p className="text-[9px] text-amber-300 font-bold mb-0.5 animate-pulse">{bossActionText}</p>
          )}
          <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full transition-all duration-200" style={{ width: `${bossHp}%` }} />
          </div>
        </div>
      )}

      {/* Banner de Evolução Automática */}
      {evolutionNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-bold px-4 py-2 rounded-xl backdrop-blur-md z-20 animate-bounce text-xs shadow-[0_0_20px_rgba(52,211,153,0.5)]">
          ✨ {evolutionNotice} ✨
        </div>
      )}

      {/* HUD Superior com Botão de Pausa */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2 items-center justify-between z-10 text-xs pointer-events-auto">
        <div className="flex items-center space-x-2">
          <button
            onClick={togglePause}
            className="bg-zinc-800/90 hover:bg-zinc-700 text-amber-400 font-bold px-3 py-1 rounded-xl border border-amber-500/40 cursor-pointer backdrop-blur-md transition-colors"
          >
            {isPaused ? '▶ RETOMAR [P]' : '⏸ PAUSAR [P]'}
          </button>

          <div className="flex items-center space-x-2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-xl border border-zinc-800/80">
            <span className="text-zinc-400">ONDA:</span>
            <span className="text-purple-400 font-bold">{wave}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-xl border border-zinc-800/80">
          <span className="text-zinc-400">VIDA:</span>
          <div className="w-20 bg-zinc-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                health > 150 ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
              style={{ width: `${(health / maxHealth) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-xl border border-sky-500/40 text-sky-400 font-bold">
          <span>ALIADOS: {alliedShipsCount}</span>
        </div>

        <div className="flex items-center space-x-2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-xl border border-zinc-800/80 font-bold">
          <span className="text-emerald-400">XP: {score}</span>
        </div>
      </div>

      {/* Painel de Controle Agrupado na Mão Esquerda */}
      <div className="absolute bottom-3 left-4 right-4 flex flex-wrap gap-1.5 items-center justify-between pointer-events-none z-10 text-[10px]">
        <div className="flex flex-wrap gap-1.5">
          <div className="px-2 py-1 rounded-xl border bg-amber-500/20 border-amber-400 text-amber-300 font-bold">
            [ESPAÇO] EVOLUIR
          </div>

          <div className={`px-2 py-1 rounded-xl border backdrop-blur-md font-bold ${
            score >= 50 ? 'bg-sky-500/20 border-sky-400 text-sky-300 animate-pulse' : 'bg-black/70 border-zinc-800 text-zinc-500'
          }`}>
            [E] RECRUTAR (-50)
          </div>

          <div className={`px-2 py-1 rounded-xl border backdrop-blur-md font-bold ${
            empCooldown === 100 ? 'bg-sky-500/20 border-sky-400 text-sky-300' : 'bg-black/70 border-zinc-800 text-zinc-500'
          }`}>
            [Q] EMP
          </div>

          <div className={`px-2 py-1 rounded-xl border backdrop-blur-md font-bold ${
            score >= 120 ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-black/70 border-zinc-800 text-zinc-500'
          }`}>
            [F] CURAR (-120)
          </div>

          <div className={`px-2 py-1 rounded-xl border backdrop-blur-md font-bold ${
            score >= 220 ? 'bg-purple-500/20 border-purple-400 text-purple-300' : 'bg-black/70 border-zinc-800 text-zinc-500'
          }`}>
            [R] LASER (-220)
          </div>

          <div className="px-2 py-1 rounded-xl border bg-zinc-900/90 border-amber-500/50 text-amber-300 font-bold">
            [1, 2, 3] COMANDOS
          </div>
        </div>
      </div>

      {/* TELA DE PAUSA */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center space-y-4 z-40 text-center p-6">
          <h2 className="text-2xl font-bold text-amber-400 uppercase tracking-widest animate-pulse">
            ⏸ JOGO PAUSADO
          </h2>
          <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
            A partida está congelada. O recrutador pode analisar a aplicação com tranquilidade.
          </p>

          <div className="flex flex-col space-y-2.5 w-48 pt-2">
            <button
              onClick={togglePause}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-[0_0_15px_rgba(52,211,153,0.3)]"
            >
              Continuar `[P]`
            </button>
            <button
              onClick={startGame}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all border border-zinc-700"
            >
              Reiniciar Partida ↵
            </button>
            <button
              onClick={quitGame}
              className="px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all border border-rose-500/40"
            >
              Finalizar Jogo
            </button>
          </div>
        </div>
      )}

      {/* Tela Inicial ou Game Over */}
      {(!gameStarted || gameOver) && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center space-y-5 z-30 text-center p-6">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white uppercase tracking-wider">
            {gameOver ? 'MISSÃO FINALIZADA' : 'ODISSEIA ESTELAR (INFINITO)'}
          </h2>
          <p className="text-xs text-zinc-400 max-w-sm font-sans leading-relaxed">
            {gameOver
              ? `Pontuação final alcançada: ${score} XP!`
              : 'Controles agrupados no WASD! Pressione [P] para pausar e retomar a partida quando quiser!'}
          </p>

          <button
            onClick={startGame}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(52,211,153,0.4)] cursor-pointer"
          >
            {gameOver ? 'Jogar Novamente ↵' : 'Iniciar Modo Infinito ↵'}
          </button>

          <span className="text-[10px] text-zinc-500 pt-2">
            CONTROLES: [WASD] MOVER | [ESPAÇO] EVOLUIR | [E] RECRUTAR | [Q] EMP | [F] CURA | [R] LASER | [P] PAUSAR
          </span>
        </div>
      )}

      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />
    </div>
  );
}

export default function Trajetoria() {
  const marcos = [
    {
      fase: 'NÍVEL 03 • 2024 — PRESENTE',
      titulo: 'Pesquisa & Desenvolvimento em Ciência da Computação',
      subtitulo: 'Projetos Autônomos & Estúdio Zonno',
      descricao: 'Desenvolvimento de ecossistemas interativos, algoritmos de renderização gráfica 3D e arquitetura de software.',
      tag: 'ÓRBITA ATUAL',
    },
    {
      fase: 'NÍVEL 02 • 2022 — 2024',
      titulo: 'Graduação em Ciência da Computação',
      subtitulo: 'Aprofundamento Teórico & Prático',
      descricao: 'Estudo rigoroso de estrutura de dados avançadas, análise de complexidade temporal O(n), sistemas operacionais e compiladores.',
      tag: 'SALTO QUÂNTICO',
    },
    {
      fase: 'NÍVEL 01 • 2021',
      titulo: 'Primeiras Imersões em Software',
      subtitulo: 'Projetos de Código Aberto',
      descricao: 'Primeiros passos com C/C++, lógica de programação estruturada e contribuições para repositórios no GitHub.',
      tag: 'PONTO DE PARTIDA',
    },
  ];

  return (
    <div className="space-y-10 animate-fadeIn font-sans">
      <div className="space-y-3 font-mono">
        <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
          HISTÓRICO & CONQUISTAS • MAPA DE CARREIRA
        </p>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white leading-tight">
          Trajetória
        </h1>
        <p className="text-sm text-zinc-400 max-w-xl font-sans">
          Mapeamento da jornada acadêmica e profissional em formato de fases ativas.
        </p>
      </div>

      <AdvancedGameEngine />

      <hr className="border-zinc-800/80" />

      <div className="relative border-l-2 border-zinc-800 ml-4 pl-6 space-y-10 font-mono">
        {marcos.map((item, idx) => (
          <div key={idx} className="relative group">
            <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-zinc-900 border-2 border-zinc-700 group-hover:bg-emerald-400 group-hover:border-emerald-300 transition-colors shadow-[0_0_10px_rgba(52,211,153,0.3)]" />

            <div className="flex items-center space-x-3 mb-1">
              <span className="text-xs text-emerald-400 font-bold">{item.fase}</span>
              <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700 uppercase">
                {item.tag}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-sans font-bold text-white group-hover:text-emerald-300 transition-colors">
              {item.titulo}
            </h2>
            <p className="text-xs text-zinc-500 font-medium mb-2">{item.subtitulo}</p>
            <p className="text-sm text-zinc-400 leading-relaxed font-sans max-w-2xl">
              {item.descricao}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}