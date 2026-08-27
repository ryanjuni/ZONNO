import React, { useState, useEffect, useRef } from 'react';

// --- MINI-GAME: PAC-SLIME 3D GLOSSY (AUTO-PROGRESSIVE PHASES & GHOST HUNTER) ---
function DinoGame() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [gameState, setGameState] = useState('IDLE'); // 'IDLE', 'PLAYING', 'PAUSED', 'LEVEL_WIN', 'GAMEOVER'
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [playerHp, setPlayerHp] = useState(3);
  const [level, setLevel] = useState(1);
  const [ghostsLeft, setGhostsLeft] = useState(4);
  const [caughtCount, setCaughtCount] = useState(0); // Quantas vezes o jogador foi pego

  // Estados dos Poderes
  const [powerTimer, setPowerTimer] = useState(0);
  const [activeFruitText, setActiveFruitText] = useState('');

  // Estados de Controle por Toque / Swipe
  const touchStartRef = useRef({ x: 0, y: 0 });
  const joypadRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [joyPos, setJoyPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let width = (canvas.width = canvas.parentElement.clientWidth);
    let height = (canvas.height = Math.min(window.innerHeight * 0.65, 460));

    // LABIRINTO DO PAC-MAN (1 = PAREDE SÓLIDA, 0 = CORREDOR)
    const MAP_SIZE = 13;
    const TILE_SIZE = 26;

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

    // --- PERSONAGEM PAC-SLIME ---
    const slime = {
      x: 1.5 * TILE_SIZE,
      y: 1.5 * TILE_SIZE,
      vx: 2.0,
      vy: 0,
      nextVx: 2.0,
      nextVy: 0,
      speed: 2.2 + level * 0.1,
      powerTimer: 0,
      powerType: 'NONE', // 'TITAN', 'SPEED', 'SHIELD'
      slimeColor: '#10b981',
      invulnerableTimer: 0,
    };

    // --- FANTASMAS DINÂMICOS (Aumentam em quantidade e inteligência por fase) ---
    const baseSpeed = 1.2 + level * 0.12;
    const ghostColors = ['#ff2a5f', '#ff77bc', '#00e5ff', '#ff9100', '#a855f7', '#3b82f6'];
    const spawnPoints = [
      { x: 11.5 * TILE_SIZE, y: 1.5 * TILE_SIZE },
      { x: 11.5 * TILE_SIZE, y: 11.5 * TILE_SIZE },
      { x: 1.5 * TILE_SIZE, y: 11.5 * TILE_SIZE },
      { x: 6.5 * TILE_SIZE, y: 6.5 * TILE_SIZE },
      { x: 1.5 * TILE_SIZE, y: 6.5 * TILE_SIZE },
      { x: 11.5 * TILE_SIZE, y: 6.5 * TILE_SIZE },
    ];

    let ghosts = [];
    const totalGhostsInLevel = Math.min(3 + level, spawnPoints.length); // Mais polícia por fase!

    for (let i = 0; i < totalGhostsInLevel; i++) {
      ghosts.push({
        id: `GHOST_${i}`,
        x: spawnPoints[i].x,
        y: spawnPoints[i].y,
        dirX: i % 2 === 0 ? 1 : -1,
        dirY: i % 2 !== 0 ? 1 : -1,
        speed: baseSpeed * (0.9 + i * 0.05),
        color: ghostColors[i % ghostColors.length],
        lastX: 0,
        lastY: 0,
        stuckFrames: 0,
        active: true, // Vivo no mapa
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
          pacDots.push({ x: (c + 0.5) * TILE_SIZE, y: (r + 0.5) * TILE_SIZE, size: 5 });
        }
      }
    }

    const isWalkable = (gx, gy) => {
      if (gx < 0 || gx >= MAP_SIZE || gy < 0 || gy >= MAP_SIZE) return false;
      return MAZE_MAP[gy][gx] === 0;
    };

    const toIso = (worldX, worldY, heightOffset = 0) => {
      const relX = (worldX - slime.x) / TILE_SIZE;
      const relY = (worldY - slime.y) / TILE_SIZE;

      const isoX = width / 2 + (relX - relY) * (TILE_SIZE * 1.25);
      const isoY = height / 2 + (relX + relY) * (TILE_SIZE * 0.62) - heightOffset;
      return { isoX, isoY };
    };

    const handleKeyDown = (e) => {
      const keysToBlock = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D'];
      if (keysToBlock.includes(e.key)) e.preventDefault();

      const speed = slime.powerType === 'SPEED' ? 3.4 : slime.speed;

      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') { slime.nextVx = 0; slime.nextVy = -speed; }
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') { slime.nextVx = 0; slime.nextVy = speed; }
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') { slime.nextVx = -speed; slime.nextVy = 0; }
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') { slime.nextVx = speed; slime.nextVy = 0; }

      if (e.key === 'p' || e.key === 'P') setGameState('PAUSED');
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });

    window.triggerAction = (dir) => {
      const speed = slime.powerType === 'SPEED' ? 3.4 : slime.speed;
      if (dir === 'UP') { slime.nextVx = 0; slime.nextVy = -speed; }
      if (dir === 'DOWN') { slime.nextVx = 0; slime.nextVy = speed; }
      if (dir === 'LEFT') { slime.nextVx = -speed; slime.nextVy = 0; }
      if (dir === 'RIGHT') { slime.nextVx = speed; slime.nextVy = 0; }
    };

    const createParticles = (worldX, worldY, color = '#ffea00', count = 10) => {
      const { isoX, isoY } = toIso(worldX, worldY);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: isoX,
          y: isoY,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5 - 1,
          size: Math.random() * 3 + 2,
          life: 18,
          color,
        });
      }
    };

    const draw3DWall = (c, r) => {
      const { isoX, isoY } = toIso((c + 0.5) * TILE_SIZE, (r + 0.5) * TILE_SIZE);
      const wallH = 26;

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(isoX, isoY - wallH);
      ctx.lineTo(isoX + TILE_SIZE * 1.25, isoY + TILE_SIZE * 0.62 - wallH);
      ctx.lineTo(isoX, isoY + TILE_SIZE * 1.24 - wallH);
      ctx.lineTo(isoX - TILE_SIZE * 1.25, isoY + TILE_SIZE * 0.62 - wallH);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(isoX - TILE_SIZE * 1.25, isoY + TILE_SIZE * 0.62 - wallH);
      ctx.lineTo(isoX, isoY + TILE_SIZE * 1.24 - wallH);
      ctx.lineTo(isoX, isoY + TILE_SIZE * 1.24);
      ctx.lineTo(isoX - TILE_SIZE * 1.25, isoY + TILE_SIZE * 0.62);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.moveTo(isoX, isoY + TILE_SIZE * 1.24 - wallH);
      ctx.lineTo(isoX + TILE_SIZE * 1.25, isoY + TILE_SIZE * 0.62 - wallH);
      ctx.lineTo(isoX + TILE_SIZE * 1.25, isoY + TILE_SIZE * 0.62);
      ctx.lineTo(isoX, isoY + TILE_SIZE * 1.24);
      ctx.closePath();
      ctx.fill();
    };

    const updateGhostAI = (ghost, isTitan) => {
      if (!ghost.active) return;
      const gx = Math.floor(ghost.x / TILE_SIZE);
      const gy = Math.floor(ghost.y / TILE_SIZE);

      if (Math.hypot(ghost.x - ghost.lastX, ghost.y - ghost.lastY) < 0.1) {
        ghost.stuckFrames++;
      } else {
        ghost.stuckFrames = 0;
      }
      ghost.lastX = ghost.x;
      ghost.lastY = ghost.y;

      const curSpeed = isTitan ? ghost.speed * 0.5 : ghost.speed;

      const nextCellX = Math.floor((ghost.x + ghost.dirX * (TILE_SIZE * 0.55)) / TILE_SIZE);
      const nextCellY = Math.floor((ghost.y + ghost.dirY * (TILE_SIZE * 0.55)) / TILE_SIZE);

      const isBlocked = !isWalkable(nextCellX, nextCellY);
      const cellCenterX = (gx + 0.5) * TILE_SIZE;
      const cellCenterY = (gy + 0.5) * TILE_SIZE;
      const atCenter = Math.hypot(ghost.x - cellCenterX, ghost.y - cellCenterY) <= curSpeed;

      if (isBlocked || atCenter || ghost.stuckFrames > 8) {
        if (atCenter || isBlocked || ghost.stuckFrames > 8) {
          ghost.x = cellCenterX;
          ghost.y = cellCenterY;

          const slimeGx = Math.floor(slime.x / TILE_SIZE);
          const slimeGy = Math.floor(slime.y / TILE_SIZE);

          let targetGx = slimeGx;
          let targetGy = slimeGy;

          if (isTitan) {
            targetGx = slimeGx > 6 ? 1 : 11;
            targetGy = slimeGy > 6 ? 1 : 11;
          }

          const possibleMoves = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
          ].filter(m => isWalkable(gx + m.dx, gy + m.dy));

          let validMoves = possibleMoves.filter(m => m.dx !== -ghost.dirX || m.dy !== -ghost.dirY);
          if (validMoves.length === 0) validMoves = possibleMoves;

          if (validMoves.length > 0) {
            validMoves.sort((a, b) => {
              const distA = Math.hypot((gx + a.dx) - targetGx, (gy + a.dy) - targetGy);
              const distB = Math.hypot((gx + b.dx) - targetGx, (gy + b.dy) - targetGy);
              return distA - distB;
            });

            ghost.dirX = validMoves[0].dx;
            ghost.dirY = validMoves[0].dy;
            ghost.stuckFrames = 0;
          }
        }
      }

      ghost.x += ghost.dirX * curSpeed;
      ghost.y += ghost.dirY * curSpeed;
    };

    const gameLoop = () => {
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      frame++;

      if (slime.powerTimer > 0) {
        slime.powerTimer--;
        setPowerTimer(slime.powerTimer);
        if (slime.powerTimer === 0) {
          slime.powerType = 'NONE';
          slime.slimeColor = '#10b981';
        }
      }

      if (slime.invulnerableTimer > 0) slime.invulnerableTimer--;

      const testNextX = slime.x + slime.nextVx;
      const testNextY = slime.y + slime.nextVy;
      const checkNextGx = Math.floor((testNextX + (slime.nextVx > 0 ? 6 : slime.nextVx < 0 ? -6 : 0)) / TILE_SIZE);
      const checkNextGy = Math.floor((testNextY + (slime.nextVy > 0 ? 6 : slime.nextVy < 0 ? -6 : 0)) / TILE_SIZE);

      if (isWalkable(checkNextGx, checkNextGy)) {
        slime.vx = slime.nextVx;
        slime.vy = slime.nextVy;
      }

      const moveX = slime.x + slime.vx;
      const moveY = slime.y + slime.vy;
      const checkGx = Math.floor((moveX + (slime.vx > 0 ? 6 : slime.vx < 0 ? -6 : 0)) / TILE_SIZE);
      const checkGy = Math.floor((moveY + (slime.vy > 0 ? 6 : slime.vy < 0 ? -6 : 0)) / TILE_SIZE);

      if (isWalkable(checkGx, checkGy)) {
        slime.x = moveX;
        slime.y = moveY;
      }

      // SPAWN AUTOMÁTICO DE FRUTAS ESPECIAIS COM PODERES VARIADOS
      if (frame % 180 === 0) {
        const freeCells = [];
        for (let r = 0; r < MAP_SIZE; r++) {
          for (let c = 0; c < MAP_SIZE; c++) {
            if (MAZE_MAP[r][c] === 0) freeCells.push({ x: (c + 0.5) * TILE_SIZE, y: (r + 0.5) * TILE_SIZE });
          }
        }
        if (freeCells.length > 0) {
          const randCell = freeCells[Math.floor(Math.random() * freeCells.length)];
          const fruitTypes = ['TITAN_STRAWBERRY', 'SPEED_LEMON', 'SHIELD_ORB', 'GOLDEN_CHERRY'];
          powerFruits.push({
            x: randCell.x,
            y: randCell.y,
            type: fruitTypes[Math.floor(Math.random() * fruitTypes.length)],
          });
        }
      }

      for (let r = 0; r < MAP_SIZE; r++) {
        for (let c = 0; c < MAP_SIZE; c++) {
          const { isoX, isoY } = toIso((c + 0.5) * TILE_SIZE, (r + 0.5) * TILE_SIZE);
          ctx.fillStyle = '#052e16';
          ctx.beginPath();
          ctx.moveTo(isoX, isoY);
          ctx.lineTo(isoX + TILE_SIZE * 1.25, isoY + TILE_SIZE * 0.62);
          ctx.lineTo(isoX, isoY + TILE_SIZE * 1.24);
          ctx.lineTo(isoX - TILE_SIZE * 1.25, isoY + TILE_SIZE * 0.62);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      for (let i = pacDots.length - 1; i >= 0; i--) {
        const dot = pacDots[i];
        const { isoX, isoY } = toIso(dot.x, dot.y);

        ctx.fillStyle = '#ffea00';
        ctx.beginPath();
        ctx.arc(isoX, isoY + 6, dot.size, 0, Math.PI * 2);
        ctx.fill();

        if (Math.hypot(slime.x - dot.x, slime.y - dot.y) < 14) {
          pacDots.splice(i, 1);
          currentScore += 10;
          setScore(currentScore);
          createParticles(dot.x, dot.y, '#ffea00', 4);
        }
      }

      // CONTAGEM DE FANTASMAS ATIVOS
      const activeGhosts = ghosts.filter(g => g.active);
      setGhostsLeft(activeGhosts.length);

      // SE TODOS OS FANTASMAS FOREM CAPTURADOS -> AVANÇA DE FASE AUTOMATICAMENTE!
      if (activeGhosts.length === 0) {
        setLevel((prev) => prev + 1);
        setGameState('LEVEL_WIN');
        return;
      }

      for (let i = powerFruits.length - 1; i >= 0; i--) {
        const f = powerFruits[i];
        const { isoX, isoY } = toIso(f.x, f.y, 6 + Math.sin(frame * 0.1) * 3);
        const fColor = f.type === 'TITAN_STRAWBERRY' ? '#a855f7' : f.type === 'SPEED_LEMON' ? '#ffea00' : f.type === 'SHIELD_ORB' ? '#00e5ff' : '#fbbf24';

        ctx.save();
        ctx.shadowColor = fColor;
        ctx.shadowBlur = 14;
        ctx.fillStyle = fColor;
        ctx.beginPath();
        ctx.arc(isoX, isoY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (Math.hypot(slime.x - f.x, slime.y - f.y) < 16) {
          slime.powerTimer = 300;
          setPowerTimer(300);

          if (f.type === 'TITAN_STRAWBERRY') {
            slime.powerType = 'TITAN';
            slime.slimeColor = '#bd00ff';
            setActiveFruitText('🍓 MODO TITÃ: DEVORE OS FANTASMAS!');
          } else if (f.type === 'SPEED_LEMON') {
            slime.powerType = 'SPEED';
            slime.slimeColor = '#ffea00';
            setActiveFruitText('⚡ MODO TURBO ATIVADO!');
          } else if (f.type === 'SHIELD_ORB') {
            slime.powerType = 'SHIELD';
            slime.slimeColor = '#00e5ff';
            setActiveFruitText('🛡️ BARREIRA PROTETORA GLOSSY!');
          } else if (f.type === 'GOLDEN_CHERRY') {
            currentScore += 500;
            setScore(currentScore);
            setActiveFruitText('🍒 CEREJA DOURADA (+500 PONTOS)!');
          }

          createParticles(f.x, f.y, fColor, 18);
          powerFruits.splice(i, 1);
          setTimeout(() => setActiveFruitText(''), 2200);
        }
      }

      // --- 4. RENDERIZAÇÃO Z-SORTING ---
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

      const isTitan = slime.powerType === 'TITAN';

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
          if (isTitan) {
            ghost.active = false; // CAPTURA PERMANENTE DO FANTASMA NA FASE
            currentScore += 300;
            setScore(currentScore);
            createParticles(ghost.x, ghost.y, '#bd00ff', 25);
          } else if (slime.powerType === 'SHIELD') {
            slime.powerType = 'NONE';
            slime.slimeColor = '#10b981';
            ghost.x = 6.5 * TILE_SIZE;
            ghost.y = 6.5 * TILE_SIZE;
            createParticles(ghost.x, ghost.y, '#00e5ff', 18);
          } else if (slime.invulnerableTimer === 0) {
            slime.invulnerableTimer = 60;
            setCaughtCount((prev) => prev + 1); // Incrementa quantas vezes foi pego
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
          const squish = Math.sin(frame * 0.2) * 1.2;

          ctx.save();
          ctx.shadowColor = slime.slimeColor;
          ctx.shadowBlur = 20;

          ctx.fillStyle = slime.slimeColor;
          ctx.beginPath();
          ctx.ellipse(sX, sY, 12 + squish, 11 - squish, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.beginPath();
          ctx.arc(sX - 3, sY - 4, 3.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#000000';
          ctx.fillRect(sX - 4, sY - 3, 3, 3);
          ctx.fillRect(sX + 2, sY - 3, 3, 3);
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

          if (isTitan) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(gX - 3, gY - 4, 2.5, 0, Math.PI * 2);
            ctx.arc(gX + 3, gY - 4, 2.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(gX, gY + 2, 3, 0, Math.PI, true);
            ctx.stroke();
          } else {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(gX - 4, gY - 5, 3, 3);
            ctx.fillRect(gX + 2, gY - 5, 3, 3);
          }

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
      height = canvas.height = Math.min(window.innerHeight * 0.65, 460);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      delete window.triggerAction;
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, level]);

  // Handlers para o Joystick Touch / Arrastar na tela
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

    const limit = 35;
    const clampedX = Math.max(-limit, Math.min(limit, dX));
    const clampedY = Math.max(-limit, Math.min(limit, dY));
    setJoyPos({ x: touchStartRef.current.x + clampedX, y: touchStartRef.current.y + clampedY });

    if (Math.abs(dX) > 12 || Math.abs(dY) > 12) {
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
      className="p-4 sm:p-6 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl space-y-4 font-mono text-xs shadow-2xl backdrop-blur-xl max-w-full overflow-hidden touch-none select-none"
    >
      {/* HUD SUPERIOR */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800/80 pb-3 gap-2 hud-header">
        <div className="flex items-center space-x-3">
          <span className="w-2.5 h-2.5 rounded bg-emerald-400 animate-pulse" />
          <h3 className="text-emerald-400 font-bold uppercase tracking-wider text-xs">
            FASE {level} | FANTASMAS: <span className="text-white font-bold">{ghostsLeft}</span>
          </h3>
          
          <div className="flex items-center space-x-1 pl-1">
            {Array.from({ length: 3 }).map((_, idx) => (
              <span
                key={idx}
                className={`w-3.5 h-3.5 rounded-sm transition-all duration-300 ${
                  idx < playerHp
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : 'bg-zinc-800 border border-zinc-700'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-red-400">PEGOS: {caughtCount}x</span>
          <button
            onClick={() => setGameState((prev) => (prev === 'PLAYING' ? 'PAUSED' : 'PLAYING'))}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded border border-zinc-700"
          >
            {gameState === 'PAUSED' ? 'RETOMAR' : 'PAUSAR'}
          </button>
          <span className="text-zinc-200 font-bold">SCORE: {score}</span>
        </div>
      </div>

      {/* ÁREA DE JOGO COM SUPORTE A SWIPE / JOYPAD TÁTIL */}
      <div 
        ref={joypadRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full bg-black rounded-xl border border-zinc-800 overflow-hidden relative min-h-[360px] max-h-[460px] flex items-center justify-center select-none touch-none"
      >
        {powerTimer > 0 && (
          <div className="absolute top-4 bg-yellow-400 text-black px-4 py-1 font-bold rounded-lg z-30 animate-bounce text-xs">
            ⚡ PODER ATIVO! ({Math.ceil(powerTimer / 30)}s) - CAPTURE A POLÍCIA!
          </div>
        )}

        {activeFruitText && (
          <div className="absolute top-12 bg-pink-500/90 text-white px-3 py-1 font-bold rounded-lg z-30 text-xs animate-pulse">
            {activeFruitText}
          </div>
        )}

        {/* TELA DE INÍCIO CENTRALIZADA */}
        {gameState === 'IDLE' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-30 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <h2 className="text-emerald-400 font-bold text-xl tracking-wider uppercase">PAC-SLIME 3D GHOST HUNTER</h2>
            <p className="text-zinc-300 font-sans text-xs max-w-sm leading-relaxed">
              Arraste o dedo na tela para mover. Pegue frutas de poder para devorar os fantasmas. Elimine todos para avançar automaticamente de fase!
            </p>
            <button
              onClick={() => {
                setScore(0);
                setLevel(1);
                setPlayerHp(3);
                setCaughtCount(0);
                setGameState('PLAYING');
              }}
              className="px-8 py-3 bg-emerald-400 hover:bg-emerald-300 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(52,211,153,0.4)] cursor-pointer text-sm"
            >
              INICIAR JOGO 3D
            </button>
          </div>
        )}

        {/* TELA DE FASE CONCLUÍDA AUTOMÁTICA */}
        {gameState === 'LEVEL_WIN' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-30 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <p className="text-emerald-400 font-bold text-lg tracking-widest uppercase">FASE {level - 1} SUPERADA!</p>
            <p className="text-zinc-300 font-mono">Você eliminou todos os fantasmas! Preparando Fase {level} com mais polícia...</p>
            <button
              onClick={() => setGameState('PLAYING')}
              className="px-8 py-3 bg-emerald-400 hover:bg-emerald-300 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(52,211,153,0.4)] cursor-pointer text-sm"
            >
              INICIAR FASE {level}
            </button>
          </div>
        )}

        {/* TELA DE PAUSA CENTRALIZADA */}
        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-30 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <p className="text-amber-400 font-bold text-lg tracking-widest uppercase">JOGO PAUSADO</p>
            <button
              onClick={() => setGameState('PLAYING')}
              className="px-8 py-3 bg-emerald-400 hover:bg-emerald-300 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(52,211,153,0.4)] cursor-pointer text-sm"
            >
              CONTINUAR
            </button>
          </div>
        )}

        {/* TELA DE GAME OVER CENTRALIZADA */}
        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-30 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <p className="text-red-500 font-bold text-lg tracking-widest uppercase">Game Over!</p>
            <p className="text-zinc-300 font-mono">Pontuação Final: {score} | Fantasmas te pegaram: {caughtCount} vezes</p>
            <button
              onClick={() => {
                setLevel(1);
                setPlayerHp(3);
                setScore(0);
                setCaughtCount(0);
                setGameState('PLAYING');
              }}
              className="px-8 py-3 bg-emerald-400 hover:bg-emerald-300 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(52,211,153,0.4)] cursor-pointer text-sm"
            >
              TENTAR NOVAMENTE
            </button>
          </div>
        )}

        {/* INDICADOR VISUAL DO JOYSTICK TÁTIL */}
        {isDragging && gameState === 'PLAYING' && (
          <div 
            className="absolute w-14 h-14 rounded-full border-2 border-emerald-400/50 bg-emerald-500/10 pointer-events-none z-40 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
            style={{ left: `${joyPos.x}px`, top: `${joyPos.y}px` }}
          >
            <div className="absolute w-5 h-5 bg-emerald-400 rounded-full shadow-[0_0_10px_#10b981] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
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