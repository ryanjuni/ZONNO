import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import Sobre from './Sobre';
import Acervo from './Acervo';
import Trajetoria from './Trajetoria';
import Stack from './Stack';

// --- CURSOR DINÂMICO DE RASTRO SUAVE ---
function CursorFireTrail() {
  const coordsRef = useRef({ x: -100, y: -100 });
  const prevCoordsRef = useRef({ x: -100, y: -100 });
  const speedRef = useRef(0);
  const circlesRef = useRef([]);
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);

  const CIRCLE_COUNT = 12;

  const colors = [
    "rgba(52, 211, 153, 0.9)",
    "rgba(16, 185, 129, 0.75)",
    "rgba(16, 185, 129, 0.6)",
    "rgba(5, 150, 105, 0.45)",
    "rgba(4, 120, 87, 0.3)",
    "rgba(6, 95, 70, 0.15)",
    "rgba(0, 0, 0, 0)"
  ];

  useEffect(() => {
    circlesRef.current.forEach((circle) => {
      if (circle) {
        circle.x = -100;
        circle.y = -100;
      }
    });

    const handleMouseMove = (e) => {
      coordsRef.current.x = e.clientX;
      coordsRef.current.y = e.clientY;

      if (containerRef.current) {
        containerRef.current.style.opacity = '1';
      }

      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.opacity = '0';
        }
      }, 300);
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId;

    const animateCircles = () => {
      let x = coordsRef.current.x;
      let y = coordsRef.current.y;

      const deltaX = x - prevCoordsRef.current.x;
      const deltaY = y - prevCoordsRef.current.y;
      const distance = Math.hypot(deltaX, deltaY);
      
      speedRef.current += (distance - speedRef.current) * 0.1;
      prevCoordsRef.current = { x, y };

      circlesRef.current.forEach((circle, index) => {
        if (!circle) return;

        const baseScale = (CIRCLE_COUNT - index) / CIRCLE_COUNT;
        
        circle.style.transform = `translate3d(${x - 6}px, ${y - 6}px, 0) scale(${baseScale})`;

        circle.x = x;
        circle.y = y;

        const nextCircle = circlesRef.current[index + 1] || circlesRef.current[0];
        x += (nextCircle.x - x) * 0.28;
        y += (nextCircle.y - y) * 0.28;
      });

      animationFrameId = requestAnimationFrame(animateCircles);
    };

    animateCircles();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      style={{ opacity: 0, transition: 'opacity 0.4s ease-out' }}
      className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden hidden md:block"
    >
      {Array.from({ length: CIRCLE_COUNT }).map((_, index) => (
        <div
          key={index}
          ref={(el) => (circlesRef.current[index] = el)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: colors[index % colors.length],
            boxShadow: index === 0 ? '0 0 8px rgba(52, 211, 153, 0.8)' : 'none',
            pointerEvents: 'none',
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  );
}

// --- FLUID BACKGROUND ---
function FluidBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width, height;
    let particles = [];

    const PARTICLE_COUNT = Math.min(800, Math.floor(window.innerWidth * 0.5));
    const SPEED = 0.6;

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.life = Math.random() * 200 + 100;
        this.age = 0;
        const hue = Math.floor(Math.random() * 40 + 210);
        this.color = `hsla(${hue}, 60%, 70%, 0.5)`;
      }

      update() {
        const angle = (Math.sin(this.x * 0.003) + Math.cos(this.y * 0.003)) * Math.PI * 2;
        this.x += Math.cos(angle) * SPEED;
        this.y += Math.sin(angle) * SPEED;
        this.age++;

        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height || this.age > this.life) {
          this.reset();
        }
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 1.2, 1.2);
      }
    }

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
      }
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    handleResize();
    animate();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.6,
      }}
    />
  );
}

// --- CANVAS 3D INTERATIVO DA HOME ---
function FloatingParticlesWave3D() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current || canvas.parentElement;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = container.clientWidth);
    let height = (canvas.height = container.clientHeight);

    let time = 0;

    const camera = {
      rotX: 0.38,
      rotY: 0,
      targetRotX: 0.38,
      targetRotY: 0,
      fov: 440,
      targetFov: 440,
      minFov: 200,
      maxFov: 750,
    };

    let isDragging = false;
    let previousPointerPos = { x: 0, y: 0 };
    let initialPinchDistance = null;

    class FloatingParticle {
      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        this.x = (Math.random() - 0.5) * 400;
        this.z = (Math.random() - 0.5) * 320;
        this.y = initial ? (Math.random() - 0.5) * 140 : 110;
        this.speedY = Math.random() * 0.7 + 0.25;
        this.size = Math.random() * 0.85 + 0.25;
        this.alpha = 0;
        this.maxAlpha = Math.random() * 0.75 + 0.25;
      }

      update() {
        this.y -= this.speedY;
        this.x += Math.sin(time * 2 + this.y * 0.05) * 0.3;

        if (this.y > 0) {
          this.alpha = Math.min(this.maxAlpha, this.alpha + 0.03);
        } else {
          this.alpha -= 0.015;
        }

        if (this.y < -150 || this.alpha <= 0) {
          this.reset();
        }
      }
    }

    const floatingParticles = Array.from({ length: 110 }, () => new FloatingParticle());

    const getPinchDistance = (touches) => {
      return Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
      );
    };

    const handlePointerDown = (e) => {
      if (e.touches && e.touches.length === 2) {
        initialPinchDistance = getPinchDistance(e.touches);
        return;
      }

      isDragging = true;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      previousPointerPos = { x: clientX, y: clientY };
    };

    const handlePointerMove = (e) => {
      if (e.touches && e.touches.length === 2 && initialPinchDistance) {
        const currentDistance = getPinchDistance(e.touches);
        const delta = initialPinchDistance - currentDistance;
        camera.targetFov += delta * 0.8;
        camera.targetFov = Math.max(camera.minFov, Math.min(camera.maxFov, camera.targetFov));
        initialPinchDistance = currentDistance;
        return;
      }

      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);

      if (clientX === undefined || clientY === undefined) return;

      if (isDragging) {
        const deltaX = clientX - previousPointerPos.x;
        const deltaY = clientY - previousPointerPos.y;

        camera.targetRotY += deltaX * 0.009;
        camera.targetRotX += deltaY * 0.009;

        previousPointerPos = { x: clientX, y: clientY };
      } else {
        const rect = container.getBoundingClientRect();
        const mouseX = (clientX - rect.left) / rect.width - 0.5;
        const mouseY = (clientY - rect.top) / rect.height - 0.5;

        camera.targetRotY += mouseX * 0.015;
        camera.targetRotX += mouseY * 0.015;
      }
    };

    const handlePointerUp = () => {
      isDragging = false;
      initialPinchDistance = null;
    };

    const handleMouseLeave = () => {
      isDragging = false;
      initialPinchDistance = null;
      camera.targetRotY = 0;
      camera.targetRotX = 0.38;
    };

    const handleWheel = (e) => {
      e.preventDefault();
      const zoomSensitivity = e.ctrlKey ? 1.2 : 0.4;
      camera.targetFov += e.deltaY * zoomSensitivity;
      camera.targetFov = Math.max(camera.minFov, Math.min(camera.maxFov, camera.targetFov));
    };

    const project3D = (x, y, z) => {
      const cosY = Math.cos(camera.rotY);
      const sinY = Math.sin(camera.rotY);
      const x1 = x * cosY - z * sinY;
      const z1 = z * cosY + x * sinY;

      const cosX = Math.cos(camera.rotX);
      const sinX = Math.sin(camera.rotX);
      const y2 = y * cosX - z1 * sinX;
      const z2 = z1 * cosX + y * sinX;

      const scale = camera.fov / (camera.fov + z2 + 300);

      return {
        x: x1 * scale + width / 2,
        y: y2 * scale + height / 2 + 12,
        scale,
        z: z2,
        visible: z2 + 300 > 0,
      };
    };

    const render = () => {
      camera.rotX += (camera.targetRotX - camera.rotX) * 0.08;
      camera.rotY += (camera.targetRotY - camera.rotY) * 0.08;
      camera.fov += (camera.targetFov - camera.fov) * 0.1;

      ctx.fillStyle = '#030504';
      ctx.fillRect(0, 0, width, height);

      const cols = 58;
      const rows = 36;
      const spacing = 8.5;
      const grid = [];

      for (let i = 0; i < cols; i++) {
        grid[i] = [];
        for (let j = 0; j < rows; j++) {
          const posX = (i - cols / 2) * spacing;
          const posZ = (j - rows / 2) * spacing;

          const posY =
            Math.sin(time + i * 0.18 + j * 0.12) * 18 +
            Math.cos(time * 0.8 + i * 0.1) * 10;

          grid[i][j] = project3D(posX, posY, posZ);
        }
      }

      ctx.lineWidth = 0.35;
      for (let i = 0; i < cols - 1; i++) {
        for (let j = 0; j < rows; j++) {
          const p = grid[i][j];
          const pRight = grid[i + 1][j];

          if (p.visible && pRight.visible) {
            const alpha = Math.min(0.18, Math.max(0.015, p.scale * 0.2));
            ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(pRight.x, pRight.y);
            ctx.stroke();
          }
        }
      }

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const p = grid[i][j];
          if (!p.visible) continue;

          const size = Math.max(0.3, 1.0 * p.scale);
          const alpha = Math.min(0.85, Math.max(0.15, p.scale * 0.65));

          ctx.fillStyle = `rgba(16, 210, 145, ${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      floatingParticles.forEach((fp) => {
        fp.update();
        const proj = project3D(fp.x, fp.y, fp.z);

        if (proj.visible && fp.alpha > 0) {
          const pSize = Math.max(0.3, fp.size * proj.scale);

          ctx.fillStyle = `rgba(52, 211, 153, ${fp.alpha})`;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, pSize, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `rgba(255, 255, 255, ${fp.alpha * 0.9})`;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, pSize * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      time += 0.035;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = canvas.width = container.clientWidth;
      height = canvas.height = container.clientHeight;
    };

    container.addEventListener('mousedown', handlePointerDown);
    container.addEventListener('touchstart', handlePointerDown, { passive: true });
    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('touchmove', handlePointerMove, { passive: true });
    container.addEventListener('mouseup', handlePointerUp);
    container.addEventListener('touchend', handlePointerUp);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('wheel', handleWheel, { passive: false });

    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('mousedown', handlePointerDown);
      container.removeEventListener('touchstart', handlePointerDown);
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('touchmove', handlePointerMove);
      container.removeEventListener('mouseup', handlePointerUp);
      container.removeEventListener('touchend', handlePointerUp);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('wheel', handleWheel);

      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}

// --- RECURSO: AUTÔMATOS CELULARES & REDES COMPLEXAS ---
function GraphTheoryModal({ isOpen, onClose }) {
  const canvasRef = useRef(null);
  const [metric, setMetric] = useState({ nodes: 14, edges: 26, splits: 0 });

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let width = (canvas.width = canvas.parentElement.clientWidth);
    let height = (canvas.height = 320);

    const clusterColors = ['#34d399', '#f59e0b', '#38bdf8', '#a855f7'];

    class AutonomousNode {
      constructor(x, y, cluster = 0, initialCapacity = 35) {
        this.x = x || Math.random() * (width - 100) + 50;
        this.y = y || Math.random() * (height - 100) + 50;
        this.vx = (Math.random() - 0.5) * 1.2;
        this.vy = (Math.random() - 0.5) * 1.2;
        this.capacity = initialCapacity;
        this.cluster = cluster;
        this.isSplitting = false;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 25 || this.x > width - 25) this.vx *= -1;
        if (this.y < 25 || this.y > height - 25) this.vy *= -1;

        this.capacity += 0.22;
        this.isSplitting = this.capacity > 85;
      }

      draw() {
        const radius = Math.min(10, 3.5 + this.capacity * 0.065);
        const color = clusterColors[this.cluster % clusterColors.length];

        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = color;
        ctx.beginPath();
        if (this.isSplitting) {
          ctx.ellipse(0, 0, radius + 3, radius - 1, Math.PI / 4, 0, Math.PI * 2);
        } else {
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
        }
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    let nodes = Array.from({ length: 14 }, () => new AutonomousNode());
    let mouse = { x: -1000, y: -1000 };
    let totalSplitsCount = 0;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      let found = false;
      nodes.forEach((n) => {
        if (Math.hypot(n.x - clickX, n.y - clickY) < 32) {
          n.capacity = 100;
          found = true;
        }
      });

      if (!found && nodes.length < 50) {
        const randomCluster = Math.floor(Math.random() * clusterColors.length);
        nodes.push(new AutonomousNode(clickX, clickY, randomCluster, 40));
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    const renderLab = () => {
      ctx.fillStyle = '#030504';
      ctx.fillRect(0, 0, width, height);

      let totalEdges = 0;
      let newNodes = [];

      nodes.forEach((n, idx) => {
        n.update();
        n.draw();

        if (n.capacity >= 100 && nodes.length + newNodes.length < 50) {
          n.capacity = 25;
          totalSplitsCount++;

          const childCluster = Math.random() < 0.2 ? n.cluster + 1 : n.cluster;
          const offsetAngle = Math.random() * Math.PI * 2;
          const childX = n.x + Math.cos(offsetAngle) * 20;
          const childY = n.y + Math.sin(offsetAngle) * 20;

          newNodes.push(new AutonomousNode(childX, childY, childCluster, 25));
        }

        const distMouse = Math.hypot(n.x - mouse.x, n.y - mouse.y);
        if (distMouse < 110) {
          n.capacity += 0.35;
          ctx.strokeStyle = clusterColors[n.cluster % clusterColors.length];
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }

        for (let j = idx + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dist = Math.hypot(n.x - other.x, n.y - other.y);

          if (dist < 92) {
            totalEdges++;
            const alpha = (1 - dist / 92) * 0.5;

            ctx.strokeStyle = n.cluster === other.cluster 
              ? clusterColors[n.cluster % clusterColors.length]
              : `rgba(255, 255, 255, ${alpha * 0.4})`;

            ctx.lineWidth = n.cluster === other.cluster ? 1.2 : 0.6;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      });

      if (newNodes.length > 0) {
        nodes = [...nodes, ...newNodes];
      }

      if (nodes.length > 50) {
        nodes.shift();
      }

      setMetric({
        nodes: nodes.length,
        edges: totalEdges,
        splits: totalSplitsCount,
      });

      animationFrameId = requestAnimationFrame(renderLab);
    };

    renderLab();

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-2xl bg-zinc-950 border border-emerald-500/40 rounded-2xl p-6 shadow-[0_0_50px_rgba(16,185,129,0.25)] font-mono text-xs space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 cursor-pointer" onClick={onClose} />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-emerald-400 font-bold pl-2 text-[11px] uppercase tracking-wider">
              ZONNO ENGINE • AUTÔMATOS DE REDES RECONFIGURÁVEIS
            </span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-xs cursor-pointer">
            [ESC fechar]
          </button>
        </div>

        <div className="w-full bg-black rounded-xl border border-zinc-800 overflow-hidden relative cursor-pointer">
          <canvas ref={canvasRef} className="w-full block" />
        </div>

        <div className="grid grid-cols-3 gap-3 text-center font-mono">
          <div className="p-2.5 bg-zinc-900/50 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block uppercase">Nós Ativos</span>
            <span className="text-emerald-400 font-bold text-sm">{metric.nodes}</span>
          </div>
          <div className="p-2.5 bg-zinc-900/50 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block uppercase">Conexões (Arestas)</span>
            <span className="text-sky-400 font-bold text-sm">{metric.edges}</span>
          </div>
          <div className="p-2.5 bg-zinc-900/50 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block uppercase">Bifurcações</span>
            <span className="text-amber-400 font-bold text-sm">{metric.splits}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL APP ---
export default function App() {
  const [githubVideoUrl, setGithubVideoUrl] = useState(null);
  const [projectTitle, setProjectTitle] = useState('Inventário');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState('home');
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const githubUsername = 'ryanjuni';

  const handleLogoClick = () => {
    setClickCount((prev) => {
      if (prev + 1 >= 3) {
        setIsGraphOpen(true);
        return 0;
      }
      return prev + 1;
    });

    setTimeout(() => setClickCount(0), 1200);
  };

  useEffect(() => {
    async function fetchGitHubVideo() {
      try {
        const reposRes = await fetch(`https://api.github.com/users/${githubUsername}/repos?sort=updated`);
        const repos = await reposRes.json();

        if (Array.isArray(repos)) {
          for (const repo of repos) {
            const contentsRes = await fetch(`https://api.github.com/repos/${githubUsername}/${repo.name}/contents`);
            const contents = await contentsRes.json();

            if (Array.isArray(contents)) {
              const videoFile = contents.find(
                (file) => file.name.endsWith('.mp4') || file.name.endsWith('.webm')
              );

              if (videoFile) {
                setGithubVideoUrl(videoFile.download_url);
                setProjectTitle(repo.name.replace(/-/g, ' ').toUpperCase());
                break;
              }
            }
          }
        }
      } catch (err) {
        console.error('Erro ao buscar mídia no GitHub:', err);
      }
    }

    fetchGitHubVideo();
  }, [githubUsername]);

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        backgroundColor: '#111111',
        backgroundImage: `
          radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.2), rgba(255, 255, 255, 0)),
          radial-gradient(ellipse 60% 40% at 100% 100%, rgba(39, 39, 42, 0.3), rgba(0, 0, 0, 0))
        `,
        backgroundAttachment: 'fixed',
        color: '#E5E5E5',
        overflowX: 'hidden',
      }}
    >
      <CursorFireTrail />
      <FluidBackground />
      <GraphTheoryModal isOpen={isGraphOpen} onClose={() => setIsGraphOpen(false)} />

      <div style={{ position: 'relative', zIndex: 10 }}>
        <header className="flex items-center justify-between px-4 sm:px-8 py-5 border-b border-zinc-800/80 max-w-7xl mx-auto relative">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => {
                setPaginaAtual('home');
                handleLogoClick();
              }}
              className="text-lg sm:text-xl font-black tracking-widest uppercase text-white font-mono hover:opacity-80 transition-opacity cursor-pointer select-none"
            >
              ZONNO
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-2 text-xs uppercase tracking-wider font-semibold border border-zinc-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full hover:bg-white hover:text-black transition-all font-mono cursor-pointer"
            >
              <span>MENU</span>
              <span className={`text-[10px] transform transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-xl shadow-2xl py-2 z-50 font-mono text-xs">
                <button
                  onClick={() => {
                    setPaginaAtual('sobre');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full text-left block px-4 py-2 hover:bg-zinc-800 transition-colors ${
                    paginaAtual === 'sobre' ? 'text-emerald-400 font-bold' : 'text-zinc-300'
                  }`}
                >
                  ↳ Sobre
                </button>

                <button
                  onClick={() => {
                    setPaginaAtual('trajetoria');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full text-left block px-4 py-2 hover:bg-zinc-800 transition-colors ${
                    paginaAtual === 'trajetoria' ? 'text-emerald-400 font-bold' : 'text-zinc-300'
                  }`}
                >
                  ↳ Trajetória
                </button>

                <button
                  onClick={() => {
                    setPaginaAtual('stack');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full text-left block px-4 py-2 hover:bg-zinc-800 transition-colors ${
                    paginaAtual === 'stack' ? 'text-emerald-400 font-bold' : 'text-zinc-300'
                  }`}
                >
                  ↳ Stack
                </button>

                <div className="border-t border-zinc-800 my-1" />

                <a
                  href={`https://github.com/${githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  ↗ GitHub
                </a>
              </div>
            )}
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {paginaAtual === 'sobre' && <Sobre />}
          {paginaAtual === 'acervo' && <Acervo />}
          {paginaAtual === 'trajetoria' && <Trajetoria />}
          {paginaAtual === 'stack' && <Stack />}

          {paginaAtual === 'home' && (
            <>
              <section className="mb-10 sm:mb-16">
                <p className="text-[10px] sm:text-xs uppercase tracking-widest text-emerald-500 font-semibold mb-3 font-mono">
                  CIÊNCIA DA COMPUTAÇÃO
                </p>
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-black tracking-tight text-white max-w-3xl leading-tight mb-4 sm:mb-6">
                  Oficina de Projetos
                </h1>
                <p className="text-base sm:text-lg text-zinc-400 max-w-xl font-normal leading-relaxed">
                  Pesquisa computacional, análise de algoritmos e sistemas de software.
                </p>
              </section>

              <hr className="border-zinc-800/60 mb-10 sm:mb-16" />

              <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center bg-zinc-900/40 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-zinc-800/50">
                <div className="w-full aspect-[4/3] sm:aspect-video md:aspect-[4/3] bg-black rounded-xl border border-zinc-800 overflow-hidden relative flex items-center justify-center">
                  {githubVideoUrl ? (
                    <video
                      src={githubVideoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FloatingParticlesWave3D />
                  )}
                </div>

                <div className="flex flex-col justify-center space-y-3 sm:space-y-4 md:pl-2">
                  <p className="text-[10px] sm:text-xs uppercase tracking-widest text-emerald-500 font-semibold font-mono">
                    ACERVO DE COMPUTAÇÃO • ALGORITMOS & SISTEMAS
                  </p>
                  
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-mono tracking-wider text-zinc-200 uppercase leading-snug">
                    {projectTitle}
                  </h2>
                  
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
                    Um índice centralizado de implementações, algoritmos e pesquisas aplicadas. Este espaço reúne o meu trabalho prático em Ciência da Computação, englobando análise de dados, estruturas de dados avançadas, arquitetura de sistemas e códigos-fonte.
                  </p>
                  
                  <div className="pt-2">
                    <button 
                      onClick={() => setPaginaAtual('acervo')}
                      className="inline-flex items-center space-x-2 text-xs sm:text-sm font-medium text-white hover:text-emerald-400 transition-colors group font-mono cursor-pointer"
                    >
                      <span>Explorar o Acervo</span>
                      <span className="group-hover:translate-x-1 transition-transform">↳</span>
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}