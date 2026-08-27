import React, { useState } from 'react';

// Acervo enxuto de projetos principais com métricas e stacks
const projetosAcervo = [
  {
    id: '01',
    titulo: 'ZONNO Studio & Blog',
    subtitulo: 'REACT • VITE • TAILWIND',
    categoria: 'Plataforma Web',
    descricao: 'Ecossistema interativo moderno construído com arquitetura modular em React. Possui motor de renderização no Canvas, navegação dinâmica e otimização para múltiplos dispositivos.',
    impacto: '100% Responsivo • Design System Próprio',
    stack: ['React', 'Vite', 'Tailwind CSS', 'HTML5 Canvas', 'JavaScript ES6+'],
    detalhes: 'Estruturação de componentes reutilizáveis, gerenciamento de estado otimizado e integração de gráficos canvas com loop de animação contínuo.',
    github: 'https://github.com/ryanjuni/ZONNO',
    destaque: 'PROJETO PRINCIPAL',
    corGlow: 'rgba(52, 211, 153, 0.4)', // Esmeralda
  },
  {
    id: '02',
    titulo: 'Microsserviço de Notificações',
    subtitulo: 'NODE.JS • REST API • BACKEND',
    categoria: 'Engenharia de Software',
    descricao: 'Serviço backend para automação e disparo de mensagens/e-mails transacionais. Foco em arquitetura orientada a eventos e desacoplamento de regras de negócio.',
    impacto: 'Processamento Assíncrono • Alta Disponibilidade',
    stack: ['Node.js', 'Express', 'REST API', 'Git', 'Ubuntu Linux'],
    detalhes: 'Implementação de rotas resilientes, tratamento de erros centralizado e padronização de respostas HTTP para integração com clientes web.',
    github: 'https://github.com/ryanjuni',
    destaque: 'BACKEND & APIS',
    corGlow: 'rgba(245, 158, 11, 0.4)', // Âmbar
  },
  {
    id: '03',
    titulo: 'Engine de Simulação 2D',
    subtitulo: 'JAVASCRIPT • GRAPHICS • ALGORITHMS',
    categoria: 'Sistemas & Gráficos',
    descricao: 'Motor de jogo e simulação desenvolvido diretamente sobre a API de Canvas do navegador, contendo detecção de colisões, física vetorial e estados de IA.',
    impacto: '60 FPS Estáveis • Zero Dependências Externas',
    stack: ['JavaScript Vanilla', 'HTML5 Canvas', 'Math & Vectors', 'Game Loop'],
    detalhes: 'Desenvolvimento de algoritmos para controle de fronteiras de tela, movimentação em espaço bidimensional e gerenciamento de partículas em tempo real.',
    github: 'https://github.com/ryanjuni',
    destaque: 'SISTEMAS INTERATIVOS',
    corGlow: 'rgba(56, 189, 248, 0.4)', // Sky
  },
];

// Componente individual de Card com Efeito 3D (Tilt em perspectiva)
function Card3D({ item, isSelected, onSelect }) {
  const [transformStyle, setTransformStyle] = useState({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    transition: 'transform 0.5s ease-out, box-shadow 0.5s ease-out',
    boxShadow: isSelected
      ? `0 10px 30px ${item.corGlow}`
      : '0 4px 15px rgba(0, 0, 0, 0.5)',
  });

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Cálculo da rotação em 3D
    const rotateX = ((y - centerY) / centerY) * -8; // Inclinação no eixo X
    const rotateY = ((x - centerX) / centerX) * 8;  // Inclinação no eixo Y

    setTransformStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.1s ease-out',
      boxShadow: `0 15px 35px ${item.corGlow}`,
    });
  };

  const handleMouseLeave = () => {
    setTransformStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s ease-out, box-shadow 0.5s ease-out',
      boxShadow: isSelected
        ? `0 10px 30px ${item.corGlow}`
        : '0 4px 15px rgba(0, 0, 0, 0.5)',
    });
  };

  return (
    <div
      onClick={() => onSelect(item)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={transformStyle}
      className={`group cursor-pointer rounded-2xl border-2 p-6 flex flex-col justify-between bg-zinc-950/90 ${
        isSelected
          ? 'border-emerald-400 text-white'
          : 'border-zinc-800 text-zinc-300 hover:border-zinc-600'
      }`}
    >
      <div className="space-y-3 pointer-events-none">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-bold">
          <span className={isSelected ? 'text-emerald-400' : 'text-zinc-500'}>
            PROJETO #{item.id}
          </span>
          <span className="bg-zinc-900 text-zinc-300 px-2.5 py-0.5 rounded border border-zinc-700 text-[10px]">
            {item.destaque}
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold font-sans text-white tracking-tight group-hover:text-emerald-300 transition-colors">
          {item.titulo}
        </h3>

        <p className="text-xs text-zinc-400 font-sans leading-relaxed">
          {item.descricao}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 pointer-events-none">
        <span>{item.subtitulo}</span>
        <span className={`font-bold ${isSelected ? 'text-emerald-400' : 'text-zinc-400'}`}>
          {isSelected ? 'SELECIONADO ↵' : 'VER DETALHES →'}
        </span>
      </div>
    </div>
  );
}

export default function Acervo() {
  const [projetoSelecionado, setProjetoSelecionado] = useState(projetosAcervo[0]);

  return (
    <div className="space-y-10 animate-fadeIn font-mono">
      {/* Cabeçalho */}
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
          ACERVO TÉCNICO • REPOSITÓRIOS
        </p>
        <h1 className="text-3xl sm:text-5xl font-sans font-light tracking-tight text-white uppercase">
          PROJETOS EM DESTAQUE
        </h1>
        <p className="text-sm font-sans text-zinc-400 max-w-xl leading-relaxed">
          Projetos selecionados focados em arquitetura de software, desenvolvimento frontend e sistemas interativos.
        </p>
      </div>

      {/* Grid Principal: Cards 3D (7 Cols) / Painel (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Lista de Cards 3D */}
        <div className="lg:col-span-7 space-y-6">
          {projetosAcervo.map((item) => (
            <Card3D
              key={item.id}
              item={item}
              isSelected={projetoSelecionado?.id === item.id}
              onSelect={setProjetoSelecionado}
            />
          ))}
        </div>

        {/* Painel Lateral de Detalhes Estilo Console */}
        {projetoSelecionado && (
          <div className="lg:col-span-5 lg:sticky lg:top-8 bg-zinc-950/90 border-2 border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 text-white shadow-2xl backdrop-blur-md">
            <div className="inline-block px-3 py-1 bg-emerald-400/20 text-emerald-300 font-bold text-xs uppercase tracking-wider rounded-md border border-emerald-500/30">
              {projetoSelecionado.categoria}
            </div>

            <div>
              <p className="text-xs uppercase text-zinc-500 tracking-widest font-bold">
                ESPECIFICAÇÕES DO PROJETO #{projetoSelecionado.id}
              </p>
              <h2 className="text-2xl sm:text-3xl font-sans font-bold text-white mt-1">
                {projetoSelecionado.titulo}
              </h2>
            </div>

            <hr className="border-zinc-800" />

            <div className="space-y-4 text-xs font-sans">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold block mb-1">
                  VISÃO GERAL
                </span>
                <p className="text-zinc-300 leading-relaxed">
                  {projetoSelecionado.detalhes}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-amber-300 font-bold block mb-1">
                  MÉTRICA / DIFERENCIAL
                </span>
                <p className="text-zinc-400 font-mono">
                  {projetoSelecionado.impacto}
                </p>
              </div>

              {/* Tags da Stack Técnica */}
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-sky-400 font-bold block mb-2">
                  TECNOLOGIAS UTILIZADAS
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {projetoSelecionado.stack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-1 bg-zinc-900 text-zinc-300 text-[10px] font-mono rounded border border-zinc-800"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Link para o GitHub */}
            <div className="pt-4">
              <a
                href={projetoSelecionado.github}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-6 rounded-xl transition-all font-mono text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(52,211,153,0.3)]"
              >
                <span>Acessar Código no GitHub</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}