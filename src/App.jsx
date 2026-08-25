import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import Sobre from './Sobre';
import Acervo from './Acervo';
import Trajetoria from './Trajetoria';

// Cursor Dinâmico: Oculto quando parado e com Rastro Suave ao Mover
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

// Componente do Fundo Animado Base
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

// Canvas 3D Interativo do Inventário
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


function Stack() {
  const categorias = [
    {
      nome: 'LINGUAGENS & CORE',
      itens: ['C / C++', 'Python', 'JavaScript (ES6+)', 'TypeScript', 'SQL', 'Java'],
    },
    {
      nome: 'FRONTEND & RENDERIZAÇÃO',
      itens: ['React', 'Tailwind CSS (v4)', 'Canvas API', 'WebGL / 3D Graphics', 'Vite'],
    },
    {
      nome: 'FERRAMENTAS & SISTEMAS',
      itens: ['Git & GitHub', 'Linux (Bash/Shell)', 'Docker', 'REST APIs', 'VS Code'],
    },
  ];

  return (
    <div className="space-y-10 animate-fadeIn font-sans">
      <div className="space-y-3 font-mono">
        <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
          TECNOLOGIAS & FERRAMENTAS
        </p>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white leading-tight">
          Stack Tecnológica
        </h1>
        <p className="text-sm text-zinc-400 max-w-xl font-sans">
          Conjunto de linguagens, frameworks e ecossistemas utilizados em minhas pesquisas e softwares.
        </p>
      </div>

      <hr className="border-zinc-800/80" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
        {categorias.map((cat, idx) => (
          <div key={idx} className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-4">
            <h2 className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
              {cat.nome}
            </h2>
            <ul className="space-y-2">
              {cat.itens.map((tech, i) => (
                <li key={i} className="text-sm text-zinc-300 flex items-center space-x-2">
                  <span className="text-zinc-600">↳</span>
                  <span>{tech}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function Terminal() {
  const [mensagem, setMensagem] = useState('');
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!mensagem.trim()) return;
    setEnviado(true);
    setTimeout(() => {
      setMensagem('');
      setEnviado(false);
    }, 4000);
  };

  return (
    <div className="space-y-8 animate-fadeIn font-mono">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
          INTERACTIVE SHELL • CONEXÃO DIRETA
        </p>
        <h1 className="text-3xl sm:text-5xl font-sans font-light text-white uppercase tracking-tight">
          Terminal
        </h1>
        <p className="text-sm text-zinc-400 max-w-xl font-sans">
          Entre em contato direto para propostas, pesquisas em conjunto ou oportunidades.
        </p>
      </div>

      <hr className="border-zinc-800/80" />

      <div className="bg-black border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center space-x-2 border-b border-zinc-900 pb-4">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className="text-xs text-zinc-600 pl-2">zonno-shell v2.4 -- tty1</span>
        </div>

        <div className="space-y-2 text-xs text-zinc-400">
          <p><span className="text-emerald-400">ryan@zonno:~$</span> status --info</p>
          <p className="text-zinc-500">↳ Estudante de Ciência da Computação • Disponível para projetos</p>
          <p><span className="text-emerald-400">ryan@zonno:~$</span> cat contact.txt</p>
          <p className="text-zinc-300">↳ GitHub: github.com/ryanjuni</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-zinc-900">
          <label className="block text-xs text-emerald-400">
            <span>ryan@zonno:~$</span> send-message
          </label>
          <textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Digite sua mensagem ou proposta aqui..."
            rows={4}
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
          />

          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_rgba(255,255,255,0.2)] cursor-pointer"
          >
            Executar envio ↵
          </button>

          {enviado && (
            <p className="text-xs text-emerald-400 animate-pulse pt-2">
              ✔ Mensagem enviada com sucesso para a fila de execução!
            </p>
          )}
        </form>
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
  const githubUsername = 'ryanjuni';

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

      <div style={{ position: 'relative', zIndex: 10 }}>
        <header className="flex items-center justify-between px-4 sm:px-8 py-5 border-b border-zinc-800/80 max-w-7xl mx-auto relative">
          <button 
            onClick={() => setPaginaAtual('home')}
            className="text-lg sm:text-xl font-black tracking-widest uppercase text-white font-mono hover:opacity-80 transition-opacity cursor-pointer"
          >
            ZONNO
          </button>

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

                <button
                  onClick={() => {
                    setPaginaAtual('terminal');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full text-left block px-4 py-2 hover:bg-zinc-800 transition-colors ${
                    paginaAtual === 'terminal' ? 'text-emerald-400 font-bold' : 'text-zinc-300'
                  }`}
                >
                  ↳ Terminal
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
          {paginaAtual === 'pesquisa' && <Pesquisa />}
          {paginaAtual === 'trajetoria' && <Trajetoria />}
          {paginaAtual === 'stack' && <Stack />}
          {paginaAtual === 'terminal' && <Terminal />}

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