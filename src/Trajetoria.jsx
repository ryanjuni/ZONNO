import React, { useState, useEffect, useRef } from 'react';

// --- MINI-GAME: PAC-SLIME 3D DUAL-MODE (CASUAL SPEED + EXIT SYSTEM) ---
function DinoGame() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [gameState, setGameState] = useState('IDLE');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [playerHp, setPlayerHp] = useState(8);
  const [maxHp, setMaxHp] = useState(8);
  const [level, setLevel] = useState(1);
  const [ghostsLeft, setGhostsLeft] = useState(4);
  const [caughtCount, setCaughtCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [activePowers, setActivePowers] = useState([]);
  const [activeFruitText, setActiveFruitText] = useState('');
  const [ghostAlert, setGhostAlert] = useState('');

  const isDraggingRef = useRef(false);

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
        console.log('Fullscreen automático retido pelo navegador:', err);
      }
    }

    if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
      try {
        await window.screen.orientation.lock('landscape');
      } catch (err) {
        console.log('Bloqueio landscape nativo não suportado:', err);
      }
    }
  };

  // --- NOVA FUNÇÃO PARA FINALIZAR O JOGO E SAIR DO FULLSCREEN ---
  const handleQuitGame = async () => {
    // Tenta sair da tela cheia
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
      } catch (err) {
        console.log('Erro ao sair do fullscreen:', err);
      }
    }

    // Desbloqueia a rotação da tela no celular
    if (window.screen && window.screen.orientation && window.screen.orientation.unlock) {
      try {
        window.screen.orientation.unlock();
      } catch (err) {
        console.log('Erro ao desbloquear orientação:', err);
      }
    }

    // Reseta o estado para a tela inicial
    setIsFullscreen(false);
    setGameState('IDLE');
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        setIsFullscreen(false);
        // Opcional: Se quiser que o jogo pause ao sair do fullscreen pelo "Esc" ou botão nativo do celular
        if (gameState === 'PLAYING') {
          setGameState('PAUSED');
        }
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    
    const updateCanvasSize = () => {
      if (!canvas || !canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    updateCanvasSize();

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

    const isWalkable = (gx, gy) => {
      if (gx < 0 || gx >= MAP_SIZE || gy < 0 || gy >= MAP_SIZE) return false;
      return MAZE_MAP[gy][gx] === 0;
    };

    const slime = {
      x: 1.5 * TILE_SIZE,
      y: 1.5 * TILE_SIZE,
      path: [], 
      speed: 1.4 + level * 0.05, 
      powers: [],
      invulnerableTimer: 0,
      stuckFrames: 0,
    };

    const findPath = (startGx, startGy, targetGx, targetGy) => {
      if (!isWalkable(targetGx, targetGy)) return [];
      const queue = [[startGx, startGy]];
      const visited = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill(false));
      const parent = {};

      visited[startGy][startGx] = true;
      let found = false;

      while (queue.length > 0) {
        const [cx, cy] = queue.shift();
        if (cx === targetGx && cy === targetGy) {
          found = true;
          break;
        }

        const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
        for (let d of dirs) {
          const nx = cx + d.dx;
          const ny = cy + d.dy;
          if (isWalkable(nx, ny) && !visited[ny][nx]) {
            visited[ny][nx] = true;
            parent[`${nx},${ny}`] = [cx, cy];
            queue.push([nx, ny]);
          }
        }
      }

      if (!found) return [];

      let curr = [targetGx, targetGy];
      const path = [curr];
      while (parent[`${curr[0]},${curr[1]}`]) {
        curr = parent[`${curr[0]},${curr[1]}`];
        path.unshift(curr);
      }
      return path;
    };

    const toIso = (worldX, worldY, heightOffset = 0) => {
      const relX = (worldX - slime.x) / TILE_SIZE;
      const relY = (worldY - slime.y) / TILE_SIZE;

      const isoX = canvas.width / 2 + (relX - relY) * (TILE_SIZE * 1.3);
      const isoY = canvas.height / 2 + (relX + relY) * (TILE_SIZE * 0.65) - heightOffset;
      return { isoX, isoY };
    };

    const getTileFromScreenCoord = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const clickY = clientY - rect.top;

      let closestCell = null;
      let minDst = Infinity;

      for (let r = 0; r < MAP_SIZE; r++) {
        for (let c = 0; c < MAP_SIZE; c++) {
          if (MAZE_MAP[r][c] === 0) {
            const { isoX, isoY } = toIso((c + 0.5) * TILE_SIZE, (r + 0.5) * TILE_SIZE);
            const dst = Math.hypot(clickX - isoX, clickY - isoY);
            if (dst < minDst) {
              minDst = dst;
              closestCell = { r, c };
            }
          }
        }
      }
      return closestCell && minDst < TILE_SIZE * 1.8 ? closestCell : null;
    };

    const updatePathFromEvent = (e) => {
      const targetCell = getTileFromScreenCoord(e.clientX, e.clientY);
      if (targetCell) {
        const lastPoint = slime.path.length > 0 ? slime.path[slime.path.length - 1] : { x: slime.x, y: slime.y };
        const lastGx = Math.floor(lastPoint.x / TILE_SIZE);
        const lastGy = Math.floor(lastPoint.y / TILE_SIZE);
        
        if (lastGx !== targetCell.c || lastGy !== targetCell.r) {
          const extension = findPath(lastGx, lastGy, targetCell.c, targetCell.r);
          if (extension.length > 1) {
            const formattedExtension = extension.slice(1).map(([gx, gy]) => ({ x: (gx + 0.5) * TILE_SIZE, y: (gy + 0.5) * TILE_SIZE }));
            slime.path = slime.path.concat(formattedExtension);
          }
        }
      }
    };

    const handlePointerDown = (e) => {
      if (gameState !== 'PLAYING') return;
      isDraggingRef.current = true;
      canvas.setPointerCapture(e.pointerId);
      
      const targetCell = getTileFromScreenCoord(e.clientX, e.clientY);
      if (targetCell) {
        const startGx = Math.floor(slime.x / TILE_SIZE);
        const startGy = Math.floor(slime.y / TILE_SIZE);
        const newPath = findPath(startGx, startGy, targetCell.c, targetCell.r);
        if (newPath.length > 0) {
          slime.path = newPath.map(([gx, gy]) => ({ x: (gx + 0.5) * TILE_SIZE, y: (gy + 0.5) * TILE_SIZE }));
        }
      }
    };

    const handlePointerMove = (e) => {
      if (!isDraggingRef.current || gameState !== 'PLAYING') return;
      updatePathFromEvent(e);
    };

    const handlePointerUp = (e) => {
      isDraggingRef.current = false;
      canvas.releasePointerCapture(e.pointerId);
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerUp);

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

    const smartGhostAbilities = [
      { name: 'SUPER DASH', color: '#ff0055' },
      { name: 'TELEPORTE QUANTUM', color: '#00ffff' },
      { name: 'INVISIBILIDADE', color: '#888888' },
      { name: 'BERSERK SPEED', color: '#ff9900' }
    ];

    const baseSpeed = 0.7 + level * 0.03; 
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
        dirX: i % 2 === 0 ? 1 : -1,
        dirY: i % 2 !== 0 ? 1 : -1,
        speed: baseSpeed,
        originalColor: i === 3 ? '#ff9100' : '#ff2a5f',
        color: i === 3 ? '#ff9100' : '#ff2a5f',
        active: true,
        abilityName: assigned.name,
        abilityColor: assigned.color,
        abilityTimer: 0,
        isUsingAbility: false,
        stuckFrames: 0,
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

    const updateGhostAI = (ghost, isTitan) => {
      if (!ghost.active) return;
      ghost.abilityTimer++;

      if (ghost.abilityTimer % 280 === 0) {
        ghost.isUsingAbility = true;
        ghost.color = ghost.abilityColor;
        setGhostAlert(`👻 ${ghost.id} usou ${ghost.abilityName}!`);
        setTimeout(() => {
          ghost.isUsingAbility = false;
          ghost.color = ghost.originalColor;
          setGhostAlert('');
        }, 2500);
      }

      let curSpeed = isTitan ? ghost.speed * 0.4 : ghost.speed;
      if (ghost.isUsingAbility && ghost.abilityName === 'SUPER DASH') curSpeed *= 1.8; 
      if (ghost.isUsingAbility && ghost.abilityName === 'TELEPORTE QUANTUM' && ghost.abilityTimer % 120 === 0) {
        ghost.x = (Math.floor(Math.random() * 10) + 1.5) * TILE_SIZE;
        ghost.y = (Math.floor(Math.random() * 10) + 1.5) * TILE_SIZE;
      }

      const nextX = ghost.x + ghost.dirX * curSpeed;
      const nextY = ghost.y + ghost.dirY * curSpeed;
      const gx = Math.floor(nextX / TILE_SIZE);
      const gy = Math.floor(nextY / TILE_SIZE);

      if (!isWalkable(gx, gy)) {
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

      if (Math.hypot(ghost.x - ghost.lastX, ghost.y - ghost.lastY) < 0.15) {
        ghost.stuckFrames++;
        if (ghost.stuckFrames > 25) {
          ghost.x = 6.5 * TILE_SIZE;
          ghost.y = 6.5 * TILE_SIZE;
          ghost.dirX = 1;
          ghost.dirY = 0;
          ghost.stuckFrames = 0;
        }
      } else {
        ghost.stuckFrames = 0;
      }
      ghost.lastX = ghost.x;
      ghost.lastY = ghost.y;
    };

    const gameLoop = () => {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      frame++;
      if (slime.invulnerableTimer > 0) slime.invulnerableTimer--;

      const activeSpeed = slime.powers.includes('TURBO_SPEED') ? slime.speed * 1.5 : slime.speed;

      if (slime.path.length > 0) {
        const target = slime.path[0];
        const angle = Math.atan2(target.y - slime.y, target.x - slime.x);
        const moveX = Math.cos(angle) * activeSpeed;
        const moveY = Math.sin(angle) * activeSpeed;

        slime.x += moveX;
        slime.y += moveY;

        if (Math.hypot(slime.x - target.x, slime.y - target.y) <= activeSpeed * 1.5) {
          slime.x = target.x;
          slime.y = target.y;
          slime.path.shift();
          slime.stuckFrames = 0;
        } else {
          slime.stuckFrames++;
          if (slime.stuckFrames > 120) {
            slime.path = [];
            slime.stuckFrames = 0;
          }
        }
      }

      if (frame % 130 === 0) {
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

          if (MAZE_MAP[r][c] === 0) {
            ctx.fillStyle = 'rgba(52, 211, 153, 0.15)';
            ctx.beginPath();
            ctx.arc(isoX, isoY + 6, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      if (slime.path.length > 0) {
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        const startIso = toIso(slime.x, slime.y);
        ctx.moveTo(startIso.isoX, startIso.isoY);
        slime.path.forEach(pt => {
          const pIso = toIso(pt.x, pt.y);
          ctx.lineTo(pIso.isoX, pIso.isoY);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }

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

          ctx.save();
          ctx.shadowColor = ghost.color;
          ctx.shadowBlur = ghost.isUsingAbility ? 25 : 14;
          ctx.fillStyle = ghost.color;

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
      setTimeout(() => {
        updateCanvasSize();
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (canvas) {
        canvas.removeEventListener('pointerdown', handlePointerDown);
        canvas.removeEventListener('pointermove', handlePointerMove);
        canvas.removeEventListener('pointerup', handlePointerUp);
        canvas.removeEventListener('pointercancel', handlePointerUp);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, level]);

  return (
    <div 
      ref={containerRef}
      className={`bg-zinc-950/95 border border-zinc-800/90 rounded-2xl font-mono text-xs shadow-2xl backdrop-blur-xl transition-all duration-300 overflow-hidden select-none ${
        gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'GAMEOVER' || gameState === 'LEVEL_WIN' 
          ? (isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none p-2 sm:p-4 flex flex-col justify-between w-[100dvw] h-[100dvh] m-0' : 'p-4 sm:p-6 space-y-4 max-w-full')
          : 'p-4 sm:p-6 space-y-4 max-w-full'
      }`}
    >
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

        <div className="flex items-center space-x-2 sm:space-x-3">
          {activePowers.length > 0 && (
            <span className="text-yellow-400 font-bold text-[10px] bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/30 hidden sm:inline">
              ⚡ ATIVOS: {activePowers.length}
            </span>
          )}
          
          {/* BOTÃO PAUSAR */}
          <button
            onClick={() => setGameState((prev) => (prev === 'PLAYING' ? 'PAUSED' : 'PLAYING'))}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded border border-zinc-700 cursor-pointer"
          >
            {gameState === 'PAUSED' ? 'RETOMAR' : 'PAUSAR'}
          </button>

          {/* NOVO BOTÃO SAIR NO MENU SUPERIOR */}
          <button
            onClick={handleQuitGame}
            className="px-3 py-1 bg-red-600/80 hover:bg-red-500 text-white font-bold rounded border border-red-500/50 cursor-pointer transition-colors"
          >
            SAIR
          </button>
          
          <span className="text-zinc-200 font-bold hidden sm:inline">SCORE: {score}</span>
        </div>
      </div>

      <div className="w-full bg-black rounded-xl border border-zinc-800 overflow-hidden relative flex-1 min-h-[320px] sm:min-h-[400px] flex items-center justify-center select-none">
        
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

        {gameState === 'IDLE' && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-30 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <h2 className="text-emerald-400 font-bold text-xl sm:text-2xl tracking-wider uppercase">PAC-SLIME: ACESSÍVEL</h2>
            <p className="text-zinc-300 font-sans text-xs sm:text-sm max-w-md leading-relaxed">
              Arraste suavemente no chão para desenhar a rota do Slime. Você pode pausar ou <strong>sair do jogo a qualquer momento</strong> no menu superior.
            </p>
            <button
              onClick={handleStartGame}
              className="px-8 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-black font-bold rounded-xl transition-all shadow-[0_0_30px_rgba(52,211,153,0.6)] cursor-pointer text-sm sm:text-base animate-pulse"
            >
              INICIAR JOGO 📱💻
            </button>
          </div>
        )}

        {gameState === 'LEVEL_WIN' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-30 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <p className="text-emerald-400 font-bold text-lg tracking-widest uppercase">FASE {level - 1} VENCIDA!</p>
            <p className="text-zinc-300 font-mono">Próxima fase gerada com sucesso...</p>
            <div className="flex gap-4">
              <button
                onClick={() => setGameState('PLAYING')}
                className="px-6 py-3 bg-emerald-400 hover:bg-emerald-300 text-black font-bold rounded-xl transition-all shadow-[0_0_25px_rgba(52,211,153,0.5)] cursor-pointer text-sm"
              >
                IR PARA FASE {level}
              </button>
            </div>
          </div>
        )}

        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-30 flex flex-col items-center justify-center text-center p-6 space-y-6">
            <p className="text-amber-400 font-bold text-2xl tracking-widest uppercase">JOGO PAUSADO</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setGameState('PLAYING')}
                className="px-8 py-3 bg-emerald-400 hover:bg-emerald-300 text-black font-bold rounded-xl transition-all shadow-[0_0_25px_rgba(52,211,153,0.5)] cursor-pointer text-sm"
              >
                CONTINUAR
              </button>
              {/* BOTÃO FINALIZAR NA TELA DE PAUSA */}
              <button
                onClick={handleQuitGame}
                className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-[0_0_25px_rgba(220,38,38,0.3)] cursor-pointer text-sm"
              >
                FINALIZAR JOGO
              </button>
            </div>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-30 flex flex-col items-center justify-center text-center p-6 space-y-6">
            <p className="text-red-500 font-bold text-2xl tracking-widest uppercase">Game Over</p>
            <p className="text-zinc-300 font-mono">Pontuação Final: {score} | Capturas sofridas: {caughtCount}x</p>
            <div className="flex flex-col sm:flex-row gap-4">
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
                className="px-6 py-3 bg-emerald-400 hover:bg-emerald-300 text-black font-bold rounded-xl transition-all shadow-[0_0_25px_rgba(52,211,153,0.5)] cursor-pointer text-sm"
              >
                TENTAR NOVAMENTE
              </button>
              {/* BOTÃO FINALIZAR NA TELA DE GAME OVER */}
              <button
                onClick={handleQuitGame}
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all cursor-pointer text-sm border border-zinc-700"
              >
                SAIR DO JOGO
              </button>
            </div>
          </div>
        )}

        <canvas 
          ref={canvasRef} 
          className="w-full h-full block cursor-pointer" 
          style={{ touchAction: 'none' }}
        />
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