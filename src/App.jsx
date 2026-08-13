import React, { useEffect, useRef } from 'react';
import './App.css';

// Componente do Fundo Animado (Garantido sem cobrir o fundo CSS)
function FluidBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width, height;
    let particles = [];

    const PARTICLE_COUNT = 800;
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
        const hue = Math.floor(Math.random() * 40 + 210); // Azul / Violeta
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
      // Limpa o canvas para que a textura CSS por trás apareça perfeitamente
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

export default function App() {
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
      {/* Canvas no fundo */}
      <FluidBackground />

      {/* Conteúdo Principal */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-6 border-b border-zinc-800/80 max-w-7xl mx-auto">
          <div className="text-xl font-black tracking-widest uppercase text-white font-mono">
            ZONNO
          </div>

          <nav className="hidden md:flex space-x-8 text-sm text-zinc-400 font-medium">
            <a href="#" className="hover:text-white transition-colors">Ideias</a>
            <a href="#" className="hover:text-white transition-colors">Sobre</a>
            <a href="#" className="hover:text-white transition-colors">Novidades</a>
          </nav>

          <button className="text-xs uppercase tracking-wider font-semibold border border-zinc-700 px-4 py-2 rounded-full hover:bg-white hover:text-black transition-all">
            Receber edições
          </button>
        </header>

        {/* Main Container */}
        <main className="max-w-6xl mx-auto px-6 py-12">
          <section className="mb-16">
            <p className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-4 font-mono">
              BLOG INDEPENDENTE — EDIÇÃO 01
            </p>
            <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tight text-white max-w-3xl leading-tight mb-6">
              Em Breve
            </h1>
            <p className="text-lg text-zinc-400 max-w-xl font-normal leading-relaxed">
              Uma coleção de ensaios, cultura e observações para quem prefere perguntas melhores a respostas apressadas.
            </p>
          </section>

          <hr className="border-zinc-800/60 mb-16" />

          <section className="grid md:grid-cols-2 gap-8 items-center bg-zinc-900/40 backdrop-blur-md p-4 md:p-6 rounded-2xl border border-zinc-800/50">
            <div className="w-full aspect-[4/3] bg-gradient-to-br from-zinc-800 via-zinc-900 to-black rounded-xl border border-zinc-800 flex items-center justify-center">
              <div className="w-24 h-24 bg-zinc-700/20 rounded-full blur-xl"></div>
            </div>

            <div className="flex flex-col justify-center space-y-4 md:pl-4">
              <p className="text-xs uppercase tracking-widest text-zinc-500 font-semibold font-mono">
                ENSAIO · 12 AGO 2026
              </p>
              <h2 className="text-2xl md:text-3xl font-mono tracking-wider text-zinc-200 uppercase leading-snug">
                A LENTIDÃO COMO FORMA DE PRECISÃO
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Em um mundo que pede resposta imediata, escolher o ritmo certo continua sendo um gesto radical.
              </p>
              <a href="#" className="inline-flex items-center space-x-2 text-sm font-medium text-white hover:underline pt-2">
                <span>Ler o ensaio</span>
                <span>↳</span>
              </a>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
