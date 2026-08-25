import React, { useEffect, useRef } from 'react';

// Canvas: Fundo Animado de Partículas Subtis
function FluidBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width, height;
    let particles = [];

    const PARTICLE_COUNT = Math.min(600, Math.floor(window.innerWidth * 0.4));
    const SPEED = 0.5;

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
        this.color = `hsla(${hue}, 60%, 70%, 0.35)`;
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
        opacity: 0.5,
      }}
    />
  );
}

export default function Sobre() {
  return (
    <div className="relative min-h-screen text-zinc-300 font-sans px-4 py-8 md:px-12 md:py-16 max-w-7xl mx-auto">
      {/* Fundo Animado */}
      <FluidBackground />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* COLUNA ESQUERDA (FIXA / STICKY SCROLL) */}
        <div className="lg:col-span-5 lg:sticky lg:top-12 flex flex-col justify-between space-y-8">
          <div>
            {/* NOME COM ESPESSURA MAIS FINA E ELEGANTE */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-wide text-white uppercase mb-3 font-sans leading-none">
              Ryan <br />
              <span className="font-medium text-zinc-100">Junio</span>
            </h1>
            
            <p className="text-xs uppercase tracking-widest text-emerald-400 font-mono font-medium mb-6">
              Cientista da Computação
            </p>
            
            <p className="text-sm text-zinc-400 leading-relaxed font-normal max-w-sm mb-10">
              Transformando ideias em projetos de alta performance e algoritmos eficientes.
            </p>

            {/* Menu Interno de Navegação */}
            <nav className="flex flex-col space-y-3 font-mono text-xs uppercase tracking-widest">
              <a 
                href="#sobre-mim" 
                className="text-white font-semibold flex items-center space-x-3 group transition-colors"
              >
                <span className="w-8 h-[1px] bg-emerald-400 transition-all group-hover:w-12"></span>
                <span className="group-hover:text-emerald-400 transition-colors">Sobre</span>
              </a>
              <a 
                href="#experiencia" 
                className="text-zinc-500 hover:text-white transition-colors flex items-center space-x-3 group"
              >
                <span className="w-4 h-[1px] bg-zinc-600 transition-all group-hover:w-8 group-hover:bg-emerald-400"></span>
                <span className="group-hover:text-emerald-400 transition-colors">Experiência</span>
              </a>
            </nav>
          </div>

          {/* Redes Sociais */}
          <div className="flex items-center space-x-6 pt-6 text-zinc-400">
            <a 
              href="https://github.com/ryanjuni" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="GitHub"
              className="hover:text-emerald-400 transition-colors"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            </a>
            
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="LinkedIn"
              className="hover:text-emerald-400 transition-colors"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>

            <a 
              href="https://codepen.io" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="CodePen"
              className="hover:text-emerald-400 transition-colors"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0l-12 8v8l12 8 12-8v-8l-12-8zm0 2.651l8.517 5.678-3.66 2.448-4.857-3.246-4.857 3.246-3.66-2.448 8.517-5.678zm-10 10.876l-8.517-5.678 3.66-2.448 4.857 3.246 4.857-3.246 3.66 2.448-8.517 5.678zm10-7.301l-2.673-1.788 2.673-1.787v3.575zm-10-2.684l-4.225-2.825 4.225-2.825 4.225 2.825-4.225 2.825z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* COLUNA DIREITA (CONTEÚDO QUE ROLA CONTINUAMENTE) */}
        <div className="lg:col-span-7 space-y-10">
          
          {/* SEÇÃO SOBRE MIM COM DETALHES DE ACABAMENTO */}
          <section 
            id="sobre-mim" 
            className="space-y-4 text-sm text-zinc-300 leading-relaxed font-sans bg-zinc-900/30 p-6 sm:p-8 rounded-2xl border border-zinc-800/60 border-l-2 border-l-emerald-500/80 backdrop-blur-md hover:border-zinc-700/80 transition-all duration-300 shadow-lg shadow-black/20"
          >
            <h2 className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold mb-3 flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Sobre</span>
            </h2>
            <p className="text-zinc-300 font-normal">
              Sou estudante de Ciência da Computação, apaixonado por tecnologia e inovação. Busco transformar ideias em soluções práticas, explorando áreas como desenvolvimento, inteligência artificial e ciência de dados. Estou sempre em busca de novos aprendizados e desafios para evoluir minhas habilidades e contribuir com projetos impactantes.
            </p>
            <p className="text-zinc-400 font-light">
              Fora da faculdade, geralmente você pode me encontrar em treinos de musculação, assistindo a séries, passando tempo com meus dois gatos ou estudando.
            </p>
          </section>

          {/* SEÇÃO EXPERIÊNCIA COM DETALHES DE ACABAMENTO */}
          <section 
            id="experiencia" 
            className="space-y-4 bg-zinc-900/30 p-6 sm:p-8 rounded-2xl border border-zinc-800/60 border-l-2 border-l-emerald-500/80 backdrop-blur-md hover:border-zinc-700/80 transition-all duration-300 shadow-lg shadow-black/20"
          >
            <h2 className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold mb-3 flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Experiência</span>
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed font-normal">
              Atualmente, tenho a oportunidade de aplicar meus conhecimentos em projetos reais e colaborar com profissionais experientes. Estou envolvido em atividades que abrangem desde o desenvolvimento de software até a análise de dados.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}