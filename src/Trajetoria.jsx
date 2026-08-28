import React, { useState, useEffect, useRef } from 'react';

// --- MINI-GAME: PAC-SLIME 3D GRID-SNAP FLUID & SMART GHOST ABILITIES ---
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

  // Estados de Poderes e Alertas de Habilidades dos Fantasmas
  const [activePowers, setActivePowers] = useState([]);
  const [activeFruitText, setActiveFruitText] = useState('');
  const [ghostAlert, setGhostAlert] = useState('');

  // Função para forçar tela cheia paisagem
  const handleStartGame = async () => {
    setScore(0);
    setLevel(1);
    setPlayerHp(8);
    setMaxHp(8);
    setCaughtCount(0);
    setActivePowers([]);
    setGameState('PLAYING');

    const elem = containerRef.current;
    if (elem) {
      try {
        if (elem.requestFullscreen) await elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.log('Fullscreen ativado:', err);
      }
    }

    if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
      try {
        await window.screen.orientation.lock('landscape');
      } catch (err) {
        console.log('Landscape lock:', err);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let width = (canvas.width = canvas.parentElement.clientWidth);
    let height = (canvas.height = canvas.parentElement.clientHeight || Math.min(window.innerHeight * 0.85, 420));

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

    // --- MOVIMENTAÇÃO POR LINHAS/GRADE (ELIMINA TRAVAMENTOS NA BASE CENTRAL) ---
    const slime = {
      tileX: 1,
      tileY: 1,
      x: 1.5 * TILE_SIZE,
      y: 1.5 * TILE_SIZE,
      targetX: 1.5 * TILE_SIZE,
      targetY: 1.5 * TILE_SIZE,
      speed: 2.5 + level * 0.1,
      nextDirX: 0,
      nextDirY: 0,
      dirX: 0,
      dirY: 0,
      powers: [],
      invulnerableTimer: 0,
    };

    const isWalkable = (gx, gy) => {
      if (gx < 0 || gx >= MAP_SIZE || gy < 0 || gy >= MAP_SIZE) return false;
      return MAZE_MAP[gy][gx] === 0;
    };

    // --- FANTASMAS INTELIGENTES COM HABILIDADES ATIVAS E MUDANÇA DE COR ---
    const smartGhostAbilities = [
      { name: 'SUPER DASH', color: '#ff0055' },
      { name: 'TELEPORTE QUANTUM', color: '#00ffff' },
      { name: 'INVISIBILIDADE', color: '#888888' },
      { name: 'BERSERK SPEED', color: '#ff9900' }
    ];

    const baseSpeed = 1.1 + level * 0.08;
    const spawnPoints = [
      { x: 11.5 * TILE_SIZE, y: 1.5 * TILE_SIZE },
      { x: 11.5 * TILE_SIZE, y: 11.5 * TILE_SIZE },
      { x: 1.5 * TILE_SIZE, y: 11.5 * TILE_SIZE },
      { x: 6.5 * TILE_SIZE, y: 6.5 * TILE_SIZE },
    ];

    let ghosts = [];
    const totalGhostsInLevel = Math.min(3 + level, spawnPoints.length);

    for (let i = 0; i < totalGhostsInLevel; i++) {
      const assigned = smartGhostAbilities[i % smartGhostAbilities.length];
      ghosts.push({
        id: `GHOST_${i + 1}`,
        x: spawnPoints[i].x,
        y: spawnPoints[i].y,
        dirX: 0,
        dirY: -1,
        speed: baseSpeed,
        originalColor: spawnPoints[i] === 6.5 ? '#ff9100' : '#ff2a5f',
        color: '#ff2a5f',
        active: true,
        abilityName: assigned.name,
        abilityColor: assigned.color,
        abilityTimer: 0,
        isUsingAbility: false,
        stuckCheckTimer: 0,
        lastX: spawnPoints[i].x,
        lastY: spawnPoints[i].y,
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

    const toIso = (worldX, worldY, heightOffset = 0) => {
      const relX = (worldX - slime.x) / TILE_SIZE;
      const relY = (worldY - slime.y) / TILE_SIZE;

      const isoX = width / 2 + (relX - relY) * (TILE_SIZE * 1.3);
      const isoY = height / 2 + (relX + relY) * (TILE_SIZE * 0.65) - heightOffset;
      return { isoX, isoY };
    };

    // SISTEMA DE CONTROLE POR CLIQUE / TOQUE NA GRADE (DIRECIONAL POR LINHAS)
    window.triggerAction = (dir) => {
      if (dir === 'UP') { slime.nextDirX = 0; slime.nextDirY = -1; }
      if (dir === 'DOWN') { slime.nextDirX = 0; slime.nextDirY = 1; }
      if (dir === 'LEFT') { slime.nextDirX = -1; slime.nextDirY = 0; }
      if (dir === 'RIGHT') { slime.nextDirX = 1; slime.nextDirY = 0; }
    };

    const handleKeyDown = (e) => {
      const keysToBlock = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D'];
      if (keysToBlock.includes(e.key)) e.preventDefault();

      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') window.triggerAction('UP');
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') window.triggerAction('DOWN');
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') window.triggerAction('LEFT');
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') window.triggerAction('RIGHT');

      if (e.key === 'p' || e.key === 'P') setGameState('PAUSED');
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });

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

    // IA INTELIGENTE DOS FANTASMAS COM ANTIBUG E USO DE PODERES
    const updateGhostAI = (ghost, isTitan) => {
      if (!ghost.active) return;
      ghost.abilityTimer++;

      // Ativação inteligente e autônoma de poderes dos fantasmas com mudança de cor e alerta na tela
      if (ghost.abilityTimer % 220 === 0) {
        ghost.isUsingAbility = true;
        ghost.color = ghost.abilityColor;
        setGhostAlert(`👻 ${ghost.id} usou ${ghost.abilityName}!`);
        setTimeout(() => {
          ghost.isUsingAbility = false;
          ghost.color = ghost.originalColor;
          setGhostAlert('');
        }, 3000);
      }

      let curSpeed = isTitan ? ghost.speed * 0.4 : ghost.speed;
      if (ghost.isUsingAbility && ghost.abilityName === 'SUPER DASH') curSpeed *= 2.2;
      if (ghost.isUsingAbility && ghost.abilityName === 'TELEPORTE QUANTUM' && ghost.abilityTimer % 60 === 0) {
        ghost.x = (Math.floor(Math.random() * 10) + 1.5) * TILE_SIZE;
        ghost.y = (Math.floor(Math.random() * 10) + 1.5) * TILE_SIZE;
      }

      const nextX = ghost.x + ghost.dirX * curSpeed;
      const nextY = ghost.y + ghost.dirY * curSpeed;

      const gx = Math.floor(nextX / TILE_SIZE);
      const gy = Math.floor(nextY / TILE_SIZE);

      // Sistema Antibug anti-travamento em paredes ou cantos centrais
      if (gx < 0 || gx >= MAP_SIZE || gy < 0 || gy >= MAP_SIZE || MAZE_MAP[gy][gx] === 1) {
        const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
        const currentGx = Math.floor(ghost.x / TILE_SIZE);
        const currentGy = Math.floor(ghost.y / TILE_SIZE);
        const valid = dirs.filter(d => isWalkable(currentGx + d.dx, currentGy + d.dy));
        if (valid.length > 0) {
          const chosen = valid[Math.floor(Math.random() * valid.length)];
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

      // Previne travamento estático perpétuo
      if (Math.hypot(ghost.x - ghost.lastX, ghost.y - ghost.lastY) < 0.2) {
        ghost.stuckCheckTimer++;
        if (ghost.stuckCheckTimer > 40) {
          ghost.x = 6.5 * TILE_SIZE;
          ghost.y = 6.5 * TILE_SIZE;
          ghost.stuckCheckTimer = 0;
        }
      } else {
        ghost.stuckCheckTimer = 0;
      }
      ghost.lastX = ghost.x;
      ghost.lastY = ghost.y;
    };

    const gameLoop = () => {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      frame++;
      if (slime.invulnerableTimer > 0) slime.invulnerableTimer--;

      // --- MOVIMENTAÇÃO POR GRADE/LINHA SUAVE (ELIMINA BUG DA BASE CENTRAL) ---
      const activeSpeed = slime.powers.includes('TURBO_SPEED') ? slime.speed * 1.5 : slime.speed;

      const currentCellX = slime.x / TILE_SIZE;
      const currentCellY = slime.y / TILE_SIZE;

      // Se estiver próximo ao centro da célula atual, permite trocar para a próxima direção desejada
      const atTileCenter = Math.abs(slime.x - (Math.floor(currentCellX) + 0.5) * TILE_SIZE) < activeSpeed &&
                           Math.abs(slime.y - (Math.floor(currentCellY) + 0.5) * TILE_SIZE) < activeSpeed;

      if (atTileCenter && (slime.nextDirX !== 0 || slime.nextDirY !== 0)) {
        const targetGx = Math.floor(currentCellX) + slime.nextDirX;
        const targetGy = Math.floor(currentCellY) + slime.nextDirY;
        if (isWalkable(targetGx, targetGy)) {
          slime.dirX = slime.nextDirX;
          slime.dirY = slime.nextDirY;
        }
      }

      // Testa se a direção atual é caminhável antes de mover
      const nextX = slime.x + slime.dirX * activeSpeed;
      const nextY = slime.y + slime.dirY * activeSpeed;
      const nextGx = Math.floor(nextX / TILE_SIZE);
      const nextGy = Math.floor(nextY / TILE_SIZE);

      if (isWalkable(nextGx, nextGy)) {
        slime.x = nextX;
        slime.y = nextY;
      } else {
        slime.dirX = 0;
        slime.dirY = 0;
      }

      // Spawn de frutas
      if (frame % 140 === 0) {
        const freeCells = [];
        for (let r = 0; r < MAP_SIZE; r++) {
          for (let c = 0; c < MAP_SIZE; c++) {
            if (MAZE_MAP[r][c] === 0) freeCells.push({ x: (c + 0.5) * TILE_SIZE, y: (r + 0.5) * TILE_SIZE });
          }
        }
        if (freeCells.length > 0) {
          const randCell = freeCells[Math.floor(Math.random() * freeCells.length)];
          const fruitPool = ['TURBO_SPEED', 'MEGA_TITAN', 'SHIELD_GLOSS', 'HEART_BOOST', 'MAGNET_STARS'];
          const chosen = fruitPool[Math.floor(Math.random() * fruitPool.length)];
          powerFruits.push({
            x: randCell.x,
            y: randCell.y,
            powerType: chosen,
            color: chosen === 'MEGA_TITAN' ? '#a855f7' : chosen === 'HEART_BOOST' ? '#ef4444' : '#34d399',
          });
        }
      }

      // Renderização do Chão
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

      // Pac-Dots & Ímã
      for (let i = pacDots.length - 1; i >= 0; i--) {
        const dot = pacDots[i];
        if (slime.powers.includes('MAGNET_STARS') && Math.hypot(slime.x - dot.x, slime.y - dot.y) < 70) {
          dot.x += (slime.x - dot.x) * 0.3;
          dot.y += (slime.y - dot.y) * 0.3;
        }

        const { isoX, isoY } = toIso(dot.x, dot.y);
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(isoX, isoY + 6, dot.size, 0, Math.PI * 2);
        ctx.fill();

        if (Math.hypot(slime.x - dot.x, slime.y - dot.y) < 16) {
          pacDots.splice(i, 1);
          currentScore += 10;
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

      // Frutas de Poder
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
          if (!slime.powers.includes(f.powerType)) {
            slime.powers.push(f.powerType);
            setActivePowers([...slime.powers]);
          }

          if (f.powerType === 'HEART_BOOST') {
            setPlayerHp((prev) => Math.min(maxHp, prev + 2));
            setActiveFruitText('❤️ VIDA EXTRA +2 BARRAS!');
          } else {
            setActiveFruitText(`✨ PODER ADICIONADO: ${f.powerType}!`);
          }

          createParticles(f.x, f.y, f.color, 20);
          powerFruits.splice(i, 1);
          setTimeout(() => setActiveFruitText(''), 2200);
        }
      }

      // Z-Sorting & Renderização
      const renderList = [];

      for (let r = 0; r < MAP_SIZE; r++) {
        for (let c = 0; c < MAP_SIZE; c++) {
          if (MAZE_MAP[r][c] === 1) {
            renderList.push({ type: 'WALL', r, c, sortKey: r + c });
          }
        }
      }

      renderList.push({ type: 'SLIME', sortKey: (slime.y / TILE_SIZE) + (slime.x / TILE_SIZE) - 0.1 });

      const isTitan = slime.powers.includes('MEGA_TITAN');

      ghosts.forEach((ghost) => {
        if (!ghost.active) return;
        updateGhostAI(ghost, isTitan);

        renderList.push({
          type: 'GHOST',
          ghost,
          sortKey: (ghost.y / TILE_SIZE) + (ghost.x / TILE_SIZE) - 0.05,
        });

        if (Math.hypot(slime.x - ghost.x, slime.y - ghost.y) < 16) {
          if (isTitan) {
            ghost.active = false;
            currentScore += 500;
            setScore(currentScore);
            createParticles(ghost.x, ghost.y, '#bd00ff', 25);
          } else if (slime.powers.includes('SHIELD_GLOSS')) {
            slime.powers = slime.powers.filter(p => p !== 'SHIELD_GLOSS');
            setActivePowers([...slime.powers]);
            ghost.x = 6.5 * TILE_SIZE;
            ghost.y = 6.5 * TILE_SIZE;
            createParticles(ghost.x, ghost.y, '#00e5ff', 16);
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
          const auraColor = isTitan ? '#bd00ff' : '#10b981';

          ctx.save();
          ctx.shadowColor = auraColor;
          ctx.shadowBlur = 24;

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
          ctx.shadowBlur = 16;
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
      height = canvas.height = canvas.parentElement.clientHeight || Math.min(window.innerHeight * 0.85, 420);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      delete window.triggerAction;
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, level]);

  // Controles de toque fluídos por arrastar ou deslizar na tela
  const handleTouchStart = (e) => {
    if (gameState !== 'PLAYING') return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || gameState !== 'PLAYING') return;
    const touch = e.touches[0];
    const dX = touch.clientX - touchStartRef.current.x;
    const dY = touch.clientY - touchStartRef.current.y;

    if (Math.abs(dX) > 10 || Math.abs(dY) > 10) {
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

  const handleTouchEnd = () => setIsDragging(false);

  return (
    <div 
      ref={containerRef}
      className={`bg-zinc-950/95 border border-zinc-800/90 rounded-2xl font-mono text-xs shadow-2xl backdrop-blur-xl transition-all duration-300 overflow-hidden select-none ${
        gameState === 'PLAYING' && isFullscreen 
          ? 'fixed inset-0 z-50 rounded-none border-none p-2 sm:p-4 flex flex-col justify-between w-screen h-screen m-0' 
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

      {/* ÁREA DE JOGO LANDSCAPE FULLSCREEN */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full bg-black rounded-xl border border-zinc-800 overflow-hidden relative flex-1 min-h-[320px] sm:min-h-[400px] flex items-center justify-center select-none touch-none"
      >
        {ghostAlert && (
          <div className="absolute top-3 bg-red-600 text-white px-4 py-1.5 font-bold rounded-xl z-40 text-xs animate-bounce shadow-2xl border border-red-400">
            {ghostAlert}
          </div>
        )}

        {activeFruitText && (
          <div className="absolute top-12 bg-pink-500/90 text-white px-3 py-1 font-bold rounded-lg z-30 text-xs animate-pulse shadow-lg">
            {activeFruitText}
          </div>
        )}

        {/* TELA DE INÍCIO */}
        {gameState === 'IDLE' && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-30 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <h2 className="text-emerald-400 font-bold text-xl sm:text-2xl tracking-wider uppercase">PAC-SLIME 3D GRID-SNAP</h2>
            <p className="text-zinc-300 font-sans text-xs sm:text-sm max-w-md leading-relaxed">
              Movimentação por linhas fluida (sem travamentos na base central), fantasmas inteligentes que mudam de cor e usam poderes dinâmicos!
            </p>
            <button
              onClick={handleStartGame}
              className="px-8 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-black font-bold rounded-xl transition-all shadow-[0_0_30px_rgba(52,211,153,0.6)] cursor-pointer text-sm sm:text-base animate-pulse"
            >
              INICIAR JOGO EM TELA CHEIA 📱↔️
            </button>
          </div>
        )}

        {/* TELA DE FASE CONCLUÍDA */}
        {gameState === 'LEVEL_WIN' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-30 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <p className="text-emerald-400 font-bold text-lg tracking-widest uppercase">FASE {level - 1} VENCIDA!</p>
            <p className="text-zinc-300 font-mono">Iniciando Fase {level} com novos desafios na horizontal...</p>
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