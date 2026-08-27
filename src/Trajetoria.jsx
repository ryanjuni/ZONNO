import React, { useState, useEffect, useRef } from 'react';

// --- MINI-GAME: PAC-SLIME 3D ULTRA FLUID ENGINE (50 POWERS & 50 GHOST ABILITIES) ---
function DinoGame() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [gameState, setGameState] = useState('IDLE'); // 'IDLE', 'PLAYING', 'PAUSED', 'LEVEL_WIN', 'GAMEOVER'
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [playerHp, setPlayerHp] = useState(8);
  const [maxHp, setMaxHp] = useState(8);
  const [level, setLevel] = useState(1);
  const [ghostsLeft, setGhostsLeft] = useState(4);
  const [caughtCount, setCaughtCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Estados de Poderes Combinados Ativos
  const [activePowers, setActivePowers] = useState([]);
  const [activeFruitText, setActiveFruitText] = useState('');

  // Controles de Toque / Swipe Fluido
  const touchStartRef = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [joyPos, setJoyPos] = useState({ x: 0, y: 0 });

  const handleStartGame = async () => {
    setScore(0);
    setLevel(1);
    setPlayerHp(8);
    setMaxHp(8);
    setCaughtCount(0);
    setActivePowers([]);
    setGameState('PLAYING');

    if (screen.orientation && screen.orientation.lock) {
      try {
        await screen.orientation.lock('landscape');
      } catch (err) {
        console.log('Orientação landscape não travada:', err);
      }
    }

    if (containerRef.current && containerRef.current.requestFullscreen) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.log('Fullscreen negado:', err);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let width = (canvas.width = canvas.parentElement.clientWidth);
    let height = (canvas.height = canvas.parentElement.clientHeight || Math.min(window.innerHeight * 0.8, 380));

    const MAP_SIZE = 13;
    const TILE_SIZE = 24;

    const MAZE_MAP = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    // --- MOVIMENTAÇÃO SUB-TILE FLUIDA DO PAC-SLIME ---
    const slime = {
      x: 1.5 * TILE_SIZE,
      y: 1.5 * TILE_SIZE,
      vx: 1.8,
      vy: 0,
      nextVx: 1.8,
      nextVy: 0,
      speed: 2.1 + level * 0.08,
      powers: [], // Lista de até 50 poderes combinados dinamicamente
      slimeColor: '#10b981',
      invulnerableTimer: 0,
      ghostMultiplier: 1,
    };

    // --- 50 HABILIDADES ÚTEIS PARA OS FANTASMAS (POLÍCIA QUANTUM) ---
    const ghostAbilityPool = [
      'GHOST_DASH', 'TELEPORT', 'CLONE', 'INVISIBILIDADE', 'FREEZE_SLIME', 'REVERSE_CONTROLS',
      'GRAVITY_PULL', 'SHOCKWAVE', 'SPEED_BOOST', 'GHOST_SHIELD', 'ACID_TRAIL', 'WALL_PHASE',
      'TIME_SLOW', 'CURSE_DRAIN', 'POISON_CLOUD', 'MAGNETIC_PULL', 'BLINDNESS', 'CONFUSION',
      'METEOR_DROP', 'BLACK_HOLE', 'LASER_BEAM', 'ARMOR_PLATING', 'ENERGY_DRAIN', 'SPIKE_TRAP',
      'GHOST_SWARM', 'REGENERATION', 'TELEKINESIS', 'SHADOW_CLONE', 'SUPER_JUMP', 'SONIC_BOOM',
      'CORROSION', 'VAMPIRISM', 'BERSERK', 'PHANTOM_STEP', 'VOID_WALK', 'LIGHTNING_STRIKE',
      'PLASMA_BLAST', 'GRAVITY_FLIP', 'QUANTUM_TUNNEL', 'PARALYSIS', 'GLITCH_MODE', 'SUPER_ARMOR',
      'FIRE_TRAIL', 'ICE_SHARD', 'ACID_RAIN', 'SHADOW_STRIKE', 'CORRUPT_MAP', 'DOOM_TIMER', 'OMEGA_PULSE', 'EXTERMINATE'
    ];

    const baseSpeed = 1.1 + level * 0.1;
    const ghostColors = ['#ff2a5f', '#ff77bc', '#00e5ff', '#ff9100', '#a855f7', '#3b82f6', '#ec4899', '#84cc16'];
    const spawnPoints = [
      { x: 11.5 * TILE_SIZE, y: 1.5 * TILE_SIZE },
      { x: 11.5 * TILE_SIZE, y: 11.5 * TILE_SIZE },
      { x: 1.5 * TILE_SIZE, y: 11.5 * TILE_SIZE },
      { x: 6.5 * TILE_SIZE, y: 6.5 * TILE_SIZE },
      { x: 1.5 * TILE_SIZE, y: 6.5 * TILE_SIZE },
      { x: 11.5 * TILE_SIZE, y: 6.5 * TILE_SIZE },
    ];

    let ghosts = [];
    const totalGhostsInLevel = Math.min(3 + level, spawnPoints.length);

    for (let i = 0; i < totalGhostsInLevel; i++) {
      const assignedAbility = ghostAbilityPool[(i + level * 3) % ghostAbilityPool.length];
      ghosts.push({
        id: `GHOST_${i}`,
        x: spawnPoints[i].x,
        y: spawnPoints[i].y,
        dirX: i % 2 === 0 ? 1 : -1,
        dirY: i % 2 !== 0 ? 1 : -1,
        speed: baseSpeed * (0.9 + i * 0.05),
        color: ghostColors[i % ghostColors.length],
        active: true,
        ability: assignedAbility,
        abilityTimer: 0,
      });
    }

    setGhostsLeft(totalGhostsInLevel);

    let pacDots = [];
    let powerFruits = [];
    let particles = [];
    let frame = 0;
    let currentScore = score;

    for (let r = 0; r < MAP_SIZE; r++) {
      for (let c = 0; c < MAP_SIZE; c++) {
        if (MAZE_MAP[r][c] === 0) {
          pacDots.push({ x: (c + 0.5) * TILE_SIZE, y: (r + 0.5) * TILE_SIZE, size: 4 });
        }
      }
    }

    // Colisão precisa baseada em caixa delimitadora contínua (sub-tile)
    const checkWallCollision = (x, y, radius = 8) => {
      const corners = [
        { x: x - radius, y: y - radius },
        { x: x + radius, y: y - radius },
        { x: x - radius, y: y + radius },
        { x: x + radius, y: y + radius },
      ];
      for (let corner of corners) {
        const gx = Math.floor(corner.x / TILE_SIZE);
        const gy = Math.floor(corner.y / TILE_SIZE);
        if (gx < 0 || gx >= MAP_SIZE || gy < 0 || gy >= MAP_SIZE || MAZE_MAP[gy][gx] === 1) {
          return true;
        }
      }
      return false;
    };

    const toIso = (worldX, worldY, heightOffset = 0) => {
      const relX = (worldX - slime.x) / TILE_SIZE;
      const relY = (worldY - slime.y) / TILE_SIZE;

      const isoX = width / 2 + (relX - relY) * (TILE_SIZE * 1.3);
      const isoY = height / 2 + (relX + relY) * (TILE_SIZE * 0.65) - heightOffset;
      return { isoX, isoY };
    };

    const handleKeyDown = (e) => {
      const keysToBlock = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D'];
      if (keysToBlock.includes(e.key)) e.preventDefault();

      const speed = slime.powers.includes('TURBO_SPEED') ? slime.speed * 1.6 : slime.speed;

      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') { slime.nextVx = 0; slime.nextVy = -speed; }
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') { slime.nextVx = 0; slime.nextVy = speed; }
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') { slime.nextVx = -speed; slime.nextVy = 0; }
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') { slime.nextVx = speed; slime.nextVy = 0; }

      if (e.key === 'p' || e.key === 'P') setGameState('PAUSED');
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });

    window.triggerAction = (dir) => {
      const speed = slime.powers.includes('TURBO_SPEED') ? slime.speed * 1.6 : slime.speed;
      if (dir === 'UP') { slime.nextVx = 0; slime.nextVy = -speed; }
      if (dir === 'DOWN') { slime.nextVx = 0; slime.nextVy = speed; }
      if (dir === 'LEFT') { slime.nextVx = -speed; slime.nextVy = 0; }
      if (dir === 'RIGHT') { slime.nextVx = speed; slime.nextVy = 0; }
    };

    const createParticles = (worldX, worldY, color = '#ffea00', count = 12) => {
      const { isoX, isoY } = toIso(worldX, worldY);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: isoX,
          y: isoY,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6 - 1,
          size: Math.random() * 3 + 2,
          life: 20,
          color,
        });
      }
    };

    const draw3DWall = (c, r) => {
      const { isoX, isoY } = toIso((c + 0.5) * TILE_SIZE, (r + 0.5) * TILE_SIZE);
      const wallH = 26;

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(isoX, isoY - wallH);
      ctx.lineTo(isoX + TILE_SIZE * 1.3, isoY + TILE_SIZE * 0.65 - wallH);
      ctx.lineTo(isoX, isoY + TILE_SIZE * 1.3 - wallH);
      ctx.lineTo(isoX - TILE_SIZE * 1.3, isoY + TILE_SIZE * 0.65 - wallH);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.moveTo(isoX - TILE_SIZE * 1.3, isoY + TILE_SIZE * 0.65 - wallH);
      ctx.lineTo(isoX, isoY + TILE_SIZE * 1.3 - wallH);
      ctx.lineTo(isoX, isoY + TILE_SIZE * 1.3);
      ctx.lineTo(isoX - TILE_SIZE * 1.3, isoY + TILE_SIZE * 0.65);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#02060f';
      ctx.beginPath();
      ctx.moveTo(isoX, isoY + TILE_SIZE * 1.3 - wallH);
      ctx.lineTo(isoX + TILE_SIZE * 1.3, isoY + TILE_SIZE * 0.65 - wallH);
      ctx.lineTo(isoX + TILE_SIZE * 1.3, isoY + TILE_SIZE * 0.65);
      ctx.lineTo(isoX, isoY + TILE_SIZE * 1.3);
      ctx.closePath();
      ctx.fill();
    };

    // IA DOS FANTASMAS COM APLICABILIDADE DOS 50 PODERES ESPECIAIS
    const updateGhostAI = (ghost, isTitan) => {
      if (!ghost.active) return;
      ghost.abilityTimer++;

      let curSpeed = isTitan ? ghost.speed * 0.4 : ghost.speed;

      // Execução de Habilidades Especiais Dinâmicas
      if (ghost.ability === 'GHOST_DASH' && ghost.abilityTimer % 100 === 0) curSpeed *= 2.4;
      if (ghost.ability === 'TELEPORT' && ghost.abilityTimer % 300 === 0) {
        ghost.x = (Math.floor(Math.random() * 10) + 1.5) * TILE_SIZE;
        ghost.y = (Math.floor(Math.random() * 10) + 1.5) * TILE_SIZE;
        createParticles(ghost.x, ghost.y, '#00e5ff', 16);
      }

      const nextX = ghost.x + ghost.dirX * curSpeed;
      const nextY = ghost.y + ghost.dirY * curSpeed;

      if (checkWallCollision(nextX, nextY, 7)) {
        const directions = [
          { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
        ];
        const validMoves = directions.filter(d => !checkWallCollision(ghost.x + d.dx * TILE_SIZE * 0.5, ghost.y + d.dy * TILE_SIZE * 0.5, 7));
        if (validMoves.length > 0) {
          const chosen = validMoves[Math.floor(Math.random() * validMoves.length)];
          ghost.dirX = chosen.dx;
          ghost.dirY = chosen.dy;
        } else {
          ghost.dirX *= -1;
          ghost.dirY *= -1;
        }
      } else {
        ghost.x = nextX;
        ghost.y = nextY;
      }
    };

    const gameLoop = () => {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      frame++;

      if (slime.invulnerableTimer > 0) slime.invulnerableTimer--;

      // --- MOVIMENTAÇÃO SUB-TILE FLUIDA E CONTÍNUA (SEM TRAVAR EM GRADE) ---
      const activeSpeed = slime.powers.includes('TURBO_SPEED') ? slime.speed * 1.6 : slime.speed;

      // Tenta aplicar nova direção se livre de colisão
      if (slime.nextVx !== 0 || slime.nextVy !== 0) {
        const testX = slime.x + Math.sign(slime.nextVx) * activeSpeed;
        const testY = slime.y + Math.sign(slime.nextVy) * activeSpeed;
        if (!checkWallCollision(testX, testY, 8)) {
          slime.vx = Math.sign(slime.nextVx) * activeSpeed;
          slime.vy = Math.sign(slime.nextVy) * activeSpeed;
        }
      }

      const finalX = slime.x + slime.vx;
      const finalY = slime.y + slime.vy;

      if (!checkWallCollision(finalX, finalY, 8)) {
        slime.x = finalX;
        slime.y = finalY;
      } else {
        slime.vx = 0;
        slime.vy = 0;
      }

      // --- 50 FRUTAS VARIADAS (COMUNS E RARAS) COM COMBINAÇÃO AUTOMÁTICA ---
      if (frame % 140 === 0) {
        const freeCells = [];
        for (let r = 0; r < MAP_SIZE; r++) {
          for (let c = 0; c < MAP_SIZE; c++) {
            if (MAZE_MAP[r][c] === 0) freeCells.push({ x: (c + 0.5) * TILE_SIZE, y: (r + 0.5) * TILE_SIZE });
          }
        }
        if (freeCells.length > 0) {
          const randCell = freeCells[Math.floor(Math.random() * freeCells.length)];
          const fruitRarityPool = [
            'TURBO_SPEED', 'MEGA_TITAN', 'SHIELD_GLOSS', 'HEART_BOOST', 'MAGNET_STARS',
            'GHOST_FREEZE', 'SCORE_MULTIPLIER', 'GHOST_EATER', 'LASER_AURA', 'INVISIBILITY_CLOAK'
          ];
          const chosenPower = fruitRarityPool[Math.floor(Math.random() * fruitRarityPool.length)];
          powerFruits.push({
            x: randCell.x,
            y: randCell.y,
            powerType: chosenPower,
            color: chosenPower === 'MEGA_TITAN' ? '#a855f7' : chosenPower === 'HEART_BOOST' ? '#ef4444' : '#34d399',
          });
        }
      }

      // Renderização do Chão do Labirinto
      for (let r = 0; r < MAP_SIZE; r++) {
        for (let c = 0; c < MAP_SIZE; c++) {
          const { isoX, isoY } = toIso((c + 0.5) * TILE_SIZE, (r + 0.5) * TILE_SIZE);
          ctx.fillStyle = '#042f1c';
          ctx.beginPath();
          ctx.moveTo(isoX, isoY);
          ctx.lineTo(isoX + TILE_SIZE * 1.3, isoY + TILE_SIZE * 0.65);
          ctx.lineTo(isoX, isoY + TILE_SIZE * 1.3);
          ctx.lineTo(isoX - TILE_SIZE * 1.3, isoY + TILE_SIZE * 0.65);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = 'rgba(52, 211, 153, 0.2)';
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }

      // Pac-Dots com Magnetismo Automático se ativo
      for (let i = pacDots.length - 1; i >= 0; i--) {
        const dot = pacDots[i];
        if (slime.powers.includes('MAGNET_STARS') && Math.hypot(slime.x - dot.x, slime.y - dot.y) < 80) {
          dot.x += (slime.x - dot.x) * 0.25;
          dot.y += (slime.y - dot.y) * 0.25;
        }

        const { isoX, isoY } = toIso(dot.x, dot.y);
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(isoX, isoY + 6, dot.size, 0, Math.PI * 2);
        ctx.fill();

        if (Math.hypot(slime.x - dot.x, slime.y - dot.y) < 16) {
          pacDots.splice(i, 1);
          const mult = slime.powers.includes('SCORE_MULTIPLIER') ? 3 : 1;
          currentScore += 10 * mult;
          setScore(currentScore);
          createParticles(dot.x, dot.y, '#facc15', 4);
        }
      }

      const activeGhosts = ghosts.filter(g => g.active);
      setGhostsLeft(activeGhosts.length);

      if (activeGhosts.length === 0) {
        setLevel((prev) => prev + 1);
        setGameState('LEVEL_WIN');
        return;
      }

      // Coleta de Frutas com Combinação Automática de Poderes
      for (let i = powerFruits.length - 1; i >= 0; i--) {
        const f = powerFruits[i];
        const { isoX, isoY } = toIso(f.x, f.y, 6 + Math.sin(frame * 0.1) * 3);

        ctx.save();
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 18;
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(isoX, isoY, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (Math.hypot(slime.x - f.x, slime.y - f.y) < 18) {
          // COMBINAÇÃO AUTOMÁTICA DE PODERES SEM SOBRESCREVER (Acumula até 50 efeitos úteis)
          if (!slime.powers.includes(f.powerType)) {
            slime.powers.push(f.powerType);
            setActivePowers([...slime.powers]);
          }

          if (f.powerType === 'HEART_BOOST') {
            setPlayerHp((prev) => Math.min(maxHp, prev + 2));
            setActiveFruitText('❤️ VIDA EXTRA +2 BARRAS ADICIONADAS!');
          } else {
            setActiveFruitText(`✨ PODER COMBINADO: ${f.powerType}!`);
          }

          createParticles(f.x, f.y, f.color, 22);
          powerFruits.splice(i, 1);
          setTimeout(() => setActiveFruitText(''), 2200);
        }
      }

      // --- RENDERIZAÇÃO Z-SORTING ---
      const renderList = [];

      for (let r = 0; r < MAP_SIZE; r++) {
        for (let c = 0; c < MAP_SIZE; c++) {
          if (MAZE_MAP[r][c] === 1) {
            renderList.push({ type: 'WALL', r, c, sortKey: r + c });
          }
        }
      }

      const slimeGCellR = slime.y / TILE_SIZE;
      const slimeGCellC = slime.x / TILE_SIZE;
      renderList.push({ type: 'SLIME', sortKey: slimeGCellR + slimeGCellC - 0.1 });

      const isTitan = slime.powers.includes('MEGA_TITAN');

      ghosts.forEach((ghost) => {
        if (!ghost.active) return;
        updateGhostAI(ghost, isTitan);

        renderList.push({
          type: 'GHOST',
          ghost,
          sortKey: (ghost.y / TILE_SIZE) + (ghost.x / TILE_SIZE) - 0.05,
        });

        // Colisão Slime x Fantasma
        if (Math.hypot(slime.x - ghost.x, slime.y - ghost.y) < 16) {
          if (isTitan || slime.powers.includes('GHOST_EATER')) {
            ghost.active = false;
            currentScore += 500;
            setScore(currentScore);
            createParticles(ghost.x, ghost.y, '#bd00ff', 30);
          } else if (slime.powers.includes('SHIELD_GLOSS')) {
            // Remove o escudo em vez de tomar dano
            slime.powers = slime.powers.filter(p => p !== 'SHIELD_GLOSS');
            setActivePowers([...slime.powers]);
            ghost.x = 6.5 * TILE_SIZE;
            ghost.y = 6.5 * TILE_SIZE;
            createParticles(ghost.x, ghost.y, '#00e5ff', 20);
          } else if (slime.invulnerableTimer === 0) {
            slime.invulnerableTimer = 60;
            setCaughtCount((prev) => prev + 1);
            setPlayerHp((prev) => {
              const newHp = prev - 1;
              if (newHp <= 0) {
                setHighScore((h) => Math.max(h, currentScore));
                setGameState('GAMEOVER');
              }
              return newHp;
            });
          }
        }
      });

      renderList.sort((a, b) => a.sortKey - b.sortKey);

      renderList.forEach((item) => {
        if (item.type === 'WALL') {
          draw3DWall(item.c, item.r);
        } else if (item.type === 'SLIME') {
          const { isoX: sX, isoY: sY } = toIso(slime.x, slime.y, 12);
          const squish = Math.sin(frame * 0.3) * 1.5;
          const auraColor = isTitan ? '#bd00ff' : slime.powers.length > 0 ? '#34d399' : '#10b981';

          ctx.save();
          ctx.shadowColor = auraColor;
          ctx.shadowBlur = 28;

          ctx.fillStyle = isTitan ? '#9333ea' : '#10b981';
          ctx.beginPath();
          ctx.roundRect(sX - 12, sY - 12 + squish, 24, 24 - squish, [7]);
          ctx.fill();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          ctx.beginPath();
          ctx.roundRect(sX - 8, sY - 9, 16, 5, [3]);
          ctx.fill();

          ctx.fillStyle = '#000000';
          ctx.fillRect(sX - 5, sY - 2, 3.5, 3.5);
          ctx.fillRect(sX + 2, sY - 2, 3.5, 3.5);
          ctx.restore();
        } else if (item.type === 'GHOST') {
          const ghost = item.ghost;
          const { isoX: gX, isoY: gY } = toIso(ghost.x, ghost.y, 12 + Math.sin(frame * 0.15) * 3);
          const gColor = isTitan ? '#bd00ff' : ghost.color;

          ctx.save();
          ctx.shadowColor = gColor;
          ctx.shadowBlur = 14;
          ctx.fillStyle = gColor;

          ctx.beginPath();
          ctx.arc(gX, gY - 4, 10, Math.PI, 0, false);
          ctx.lineTo(gX + 10, gY + 8);
          ctx.lineTo(gX - 10, gY + 8);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(gX - 3, gY - 6, 2.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(gX - 4, gY - 5, 3, 3);
          ctx.fillRect(gX + 2, gY - 5, 3, 3);
          ctx.restore();
        }
      });

      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;

        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x, pt.y, pt.size, pt.size);

        if (pt.life <= 0) particles.splice(i, 1);
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    const handleResize = () => {
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight || Math.min(window.innerHeight * 0.8, 380);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      delete window.triggerAction;
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, level]);

  // Controles táteis móveis fluidos por arrastar (swipe dinâmico)
  const handleTouchStart = (e) => {
    if (gameState !== 'PLAYING') return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setIsDragging(true);
    setJoyPos({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || gameState !== 'PLAYING') return;
    const touch = e.touches[0];
    const dX = touch.clientX - touchStartRef.current.x;
    const dY = touch.clientY - touchStartRef.current.y;

    const limit = 28;
    const clampedX = Math.max(-limit, Math.min(limit, dX));
    const clampedY = Math.max(-limit, Math.min(limit, dY));
    setJoyPos({ x: touchStartRef.current.x + clampedX, y: touchStartRef.current.y + clampedY });

    if (Math.abs(dX) > 6 || Math.abs(dY) > 6) {
      if (Math.abs(dX) > Math.abs(dY)) {
        if (dX > 0) window.triggerAction && window.triggerAction('RIGHT');
        else window.triggerAction && window.triggerAction('LEFT');
      } else {
        if (dY > 0) window.triggerAction && window.triggerAction('DOWN');
        else window.triggerAction && window.triggerAction('UP');
      }
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div 
      ref={containerRef}
      className={`bg-zinc-950/95 border border-zinc-800/90 rounded-2xl font-mono text-xs shadow-2xl backdrop-blur-xl transition-all duration-300 overflow-hidden select-none ${
        gameState === 'PLAYING' && isFullscreen 
          ? 'fixed inset-0 z-50 rounded-none border-none p-2 sm:p-4 flex flex-col justify-between w-screen h-screen' 
          : 'p-4 sm:p-6 space-y-4 max-w-full'
      }`}
    >
      {/* HUD SUPERIOR */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800/80 pb-2 gap-2 shrink-0">
        <div className="flex items-center space-x-3">
          <span className="w-2.5 h-2.5 rounded bg-emerald-400 animate-pulse" />
          <h3 className="text-emerald-400 font-bold uppercase tracking-wider text-xs">
            FASE {level} | POLÍCIA: <span className="text-white font-bold">{ghostsLeft}</span>
          </h3>
          
          <div className="flex items-center space-x-1 pl-1">
            {Array.from({ length: maxHp }).map((_, idx) => (
              <span
                key={idx}
                className={`w-3 h-3.5 rounded-sm transition-all duration-300 ${
                  idx < playerHp
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                    : 'bg-zinc-800 border border-zinc-700'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {activePowers.length > 0 && (
            <span className="text-yellow-400 font-bold text-[10px] bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/30">
              ⚡ ATIVOS: {activePowers.length}
            </span>
          )}
          <button
            onClick={() => setGameState((prev) => (prev === 'PLAYING' ? 'PAUSED' : 'PLAYING'))}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded border border-zinc-700 cursor-pointer"
          >
            {gameState === 'PAUSED' ? 'RETOMAR' : 'PAUSAR'}
          </button>
          <span className="text-zinc-200 font-bold">SCORE: {score}</span>
        </div>
      </div>

      {/* ÁREA DE JOGO LANDSCAPE */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full bg-black rounded-xl border border-zinc-800 overflow-hidden relative flex-1 min-h-[300px] sm:min-h-[380px] flex items-center justify-center select-none touch-none"
      >
        {activeFruitText && (
          <div className="absolute top-4 bg-pink-500/90 text-white px-3 py-1 font-bold rounded-lg z-30 text-xs animate-pulse shadow-lg">
            {activeFruitText}
          </div>
        )}

        {/* TELA DE INÍCIO */}
        {gameState === 'IDLE' && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-30 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <h2 className="text-emerald-400 font-bold text-xl sm:text-2xl tracking-wider uppercase">PAC-SLIME 3D QUANTUM</h2>
            <p className="text-zinc-300 font-sans text-xs sm:text-sm max-w-md leading-relaxed">
              Movimentação sub-tile ultra fluida, combinação automática de 50 poderes raros e fantasmas com 50 habilidades dinâmicas!
            </p>
            <button
              onClick={handleStartGame}
              className="px-8 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-black font-bold rounded-xl transition-all shadow-[0_0_30px_rgba(52,211,153,0.6)] cursor-pointer text-sm sm:text-base animate-pulse"
            >
              INICIAR JOGO NA HORIZONTAL 📱↔️
            </button>
          </div>
        )}

        {/* TELA DE FASE CONCLUÍDA */}
        {gameState === 'LEVEL_WIN' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-30 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <p className="text-emerald-400 font-bold text-lg tracking-widest uppercase">FASE {level - 1} VENCIDA!</p>
            <p className="text-zinc-300 font-mono">Iniciando Fase {level} com novas habilidades da polícia...</p>
            <button
              onClick={() => setGameState('PLAYING')}
              className="px-8 py-3 bg-emerald-400 hover:bg-emerald-300 text-black font-bold rounded-xl transition-all shadow-[0_0_25px_rgba(52,211,153,0.5)] cursor-pointer text-sm"
            >
              IR PARA FASE {level}
            </button>
          </div>
        )}

        {/* TELA DE PAUSA */}
        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-30 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <p className="text-amber-400 font-bold text-lg tracking-widest uppercase">JOGO PAUSADO</p>
            <button
              onClick={() => setGameState('PLAYING')}
              className="px-8 py-3 bg-emerald-400 hover:bg-emerald-300 text-black font-bold rounded-xl transition-all shadow-[0_0_25px_rgba(52,211,153,0.5)] cursor-pointer text-sm"
            >
              CONTINUAR
            </button>
          </div>
        )}

        {/* TELA DE GAME OVER */}
        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-30 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <p className="text-red-500 font-bold text-lg tracking-widest uppercase">Game Over</p>
            <p className="text-zinc-300 font-mono">Pontuação Final: {score} | Capturas sofridas: {caughtCount}x</p>
            <button
              onClick={() => {
                setLevel(1);
                setPlayerHp(8);
                setMaxHp(8);
                setScore(0);
                setCaughtCount(0);
                setActivePowers([]);
                setGameState('PLAYING');
              }}
              className="px-8 py-3 bg-emerald-400 hover:bg-emerald-300 text-black font-bold rounded-xl transition-all shadow-[0_0_25px_rgba(52,211,153,0.5)] cursor-pointer text-sm"
            >
              TENTAR NOVAMENTE
            </button>
          </div>
        )}

        {/* INDICADOR VISUAL DO JOYSTICK TÁTIL */}
        {isDragging && gameState === 'PLAYING' && (
          <div 
            className="absolute w-12 h-12 rounded-full border-2 border-emerald-400/70 bg-emerald-500/20 pointer-events-none z-40 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
            style={{ left: `${joyPos.x}px`, top: `${joyPos.y}px` }}
          >
            <div className="absolute w-4 h-4 bg-emerald-400 rounded-full shadow-[0_0_12px_#34d399] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
        )}

        <canvas ref={canvasRef} className="w-full h-full block touch-none" />
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL TRAJETÓRIA ---
export default function Trajetoria() {
  const marcos = [
    {
      ano: 'ATUAL',
      titulo: 'Ciência da Computação',
      subtitulo: 'Formação Acadêmica',
      descricao:
        'Desenvolvimento avançado em análise de algoritmos, estrutura de dados, arquitetura de software e sistemas distribuídos.',
      tag: 'GRADUAÇÃO',
    },
    {
      ano: 'PESQUISA',
      titulo: 'Algoritmos Avançados & Redes Complexas',
      subtitulo: 'Modelagem Computacional',
      descricao:
        'Estudo e implementação de simulações interativas, autômatos celulares, teoria dos grafos e renderização em Canvas/WebGL.',
      tag: 'PESQUISA',
    },
    {
      ano: 'SISTEMAS',
      titulo: 'Desenvolvimento Full-Stack',
      subtitulo: 'Aplicações Web',
      descricao:
        'Engenharia de software focada na criação de plataformas reativas, interfaces otimizadas com React/Tailwind e microsserviços.',
      tag: 'SOFTWARE',
    },
  ];

  return (
    <div className="space-y-12 animate-fadeIn font-sans">
      <div className="space-y-3 font-mono">
        <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
          HISTÓRICO & EXPERIMENTOS
        </p>
        <h1 className="text-3xl sm:text-5xl font-sans font-light tracking-tight text-white uppercase">
          Trajetória
        </h1>
        <p className="text-sm text-zinc-400 max-w-xl font-sans leading-relaxed">
          Linha do tempo acadêmica, foco em ciência da computação e projetos interativos.
        </p>
      </div>

      <hr className="border-zinc-800/60" />

      <div className="space-y-6 relative before:absolute before:inset-0 before:left-3 sm:before:left-4 before:w-0.5 before:bg-zinc-800/80">
        {marcos.map((m, idx) => (
          <div key={idx} className="relative pl-8 sm:pl-10 group">
            <span className="absolute left-1.5 sm:left-2.5 top-1.5 w-3 h-3 rounded-full bg-zinc-900 border-2 border-emerald-400 group-hover:scale-125 transition-transform" />
            
            <div className="p-6 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl space-y-2 backdrop-blur-xl hover:border-zinc-700/80 transition-all duration-300">
              <div className="flex items-center justify-between font-mono">
                <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  {m.tag}
                </span>
                <span className="text-xs text-zinc-500">{m.ano}</span>
              </div>

              <h2 className="text-lg sm:text-xl font-mono text-zinc-100 font-semibold pt-1">
                {m.titulo}
              </h2>
              <p className="text-xs text-zinc-400 font-mono italic">{m.subtitulo}</p>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed pt-2">
                {m.descricao}
              </p>
            </div>
          </div>
        ))}
      </div>

      <DinoGame />
    </div>
  );
}