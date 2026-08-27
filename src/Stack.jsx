import React, { useState } from 'react';

// Siglas estilizadas para um visual técnico e limpo
const techBadges = {
  'C / C++': { tag: 'C++', color: 'text-sky-400 border-sky-500/20 bg-sky-500/5' },
  'Python': { tag: 'PY', color: 'text-amber-400 border-amber-500/20 bg-amber-500/5' },
  'JavaScript (ES6+)': { tag: 'JS', color: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5' },
  'TypeScript': { tag: 'TS', color: 'text-blue-400 border-blue-500/20 bg-blue-500/5' },
  'SQL': { tag: 'SQL', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
  'Java': { tag: 'JV', color: 'text-orange-400 border-orange-500/20 bg-orange-500/5' },
  'React': { tag: 'REACT', color: 'text-sky-400 border-sky-500/20 bg-sky-500/5' },
  'Tailwind CSS': { tag: 'TAILWIND', color: 'text-teal-400 border-teal-500/20 bg-teal-500/5' },
  'Canvas API': { tag: 'CANVAS', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
  'WebGL / 3D Graphics': { tag: '3D/GL', color: 'text-purple-400 border-purple-500/20 bg-purple-500/5' },
  'Vite': { tag: 'VITE', color: 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5' },
  'Git & GitHub': { tag: 'GIT', color: 'text-red-400 border-red-500/20 bg-red-500/5' },
  'Linux (Ubuntu/Bash)': { tag: 'LINUX', color: 'text-amber-500 border-amber-500/20 bg-amber-500/5' },
  'Docker': { tag: 'DOCKER', color: 'text-blue-400 border-blue-500/20 bg-blue-500/5' },
  'REST APIs': { tag: 'API', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
  'VS Code': { tag: 'IDE', color: 'text-sky-400 border-sky-500/20 bg-sky-500/5' },
};

// Card de Categoria com Tilt Sutil e Glow Dinâmico
function CategoriaCard({ cat }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [transformStyle, setTransformStyle] = useState({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)',
    transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease',
  });

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Rotação suave em 3D
    const rotateX = ((y - centerY) / centerY) * -3;
    const rotateY = ((x - centerX) / centerX) * 3;

    setTransformStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`,
      transition: 'transform 0.1s ease-out',
    });
  };

  const handleMouseLeave = () => {
    setTransformStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)',
      transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
    });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={transformStyle}
      className="relative group p-6 sm:p-7 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl space-y-6 overflow-hidden backdrop-blur-xl hover:border-zinc-700/80 transition-all duration-300 shadow-xl"
    >
      {/* Efeito Radial Glow Interativo ao mover o mouse */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(52, 211, 153, 0.06), transparent 80%)`,
        }}
      />

      {/* Topo do Card */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 relative z-10">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest">
            {cat.nome}
          </h2>
        </div>
        <span className="text-[10px] font-mono text-zinc-600 tracking-wider">
          {cat.itens.length} TECNOLOGIAS
        </span>
      </div>

      {/* Grid de Pílulas das Tecnologias */}
      <div className="flex flex-wrap gap-2.5 relative z-10">
        {cat.itens.map((tech, i) => {
          const badge = techBadges[tech] || { tag: 'CODE', color: 'text-zinc-400 border-zinc-800 bg-zinc-900' };

          return (
            <div
              key={i}
              className="flex items-center space-x-2 px-3 py-1.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl hover:border-zinc-600 hover:bg-zinc-900 transition-all cursor-default group/item"
            >
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${badge.color}`}>
                {badge.tag}
              </span>
              <span className="text-xs font-mono text-zinc-300 group-hover/item:text-white transition-colors">
                {tech}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Stack() {
  const categorias = [
    {
      nome: 'LINGUAGENS & CORE',
      itens: ['C / C++', 'Python', 'JavaScript (ES6+)', 'TypeScript', 'SQL', 'Java'],
    },
    {
      nome: 'FRONTEND & GRAPHICS',
      itens: ['React', 'Tailwind CSS', 'Canvas API', 'WebGL / 3D Graphics', 'Vite'],
    },
    {
      nome: 'FERRAMENTAS & AMBIENTE',
      itens: ['Git & GitHub', 'Linux (Ubuntu/Bash)', 'Docker', 'REST APIs', 'VS Code'],
    },
  ];

  return (
    <div className="space-y-10 animate-fadeIn font-sans">
      {/* Cabeçalho */}
      <div className="space-y-3 font-mono">
        <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
          ECOSSISTEMA TÉCNICO
        </p>
        <h1 className="text-3xl sm:text-5xl font-sans font-light tracking-tight text-white uppercase">
          Ferramentas & Tecnologias
        </h1>
        <p className="text-sm text-zinc-400 max-w-xl font-sans leading-relaxed">
          Conjunto de linguagens de programação, bibliotecas e utilitários utilizados no desenvolvimento de soluções e pesquisas computacionais.
        </p>
      </div>

      <hr className="border-zinc-800/60" />

      {/* Grid das Categorias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categorias.map((cat, idx) => (
          <CategoriaCard key={idx} cat={cat} />
        ))}
      </div>
    </div>
  );
}