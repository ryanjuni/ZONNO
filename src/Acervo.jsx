import React, { useState } from 'react';

// Dados dos cards de projetos / incidentes do acervo
const projetosAcervo = [
  {
    id: '01',
    titulo: 'Detector',
    subtitulo: 'SEVERAL AVOIDABLE DAYS',
    descricao: 'The team forgot the primary objective after encountering lotus.',
    categoria: 'Distractions',
    severidade: 'HIGH SEVERITY',
    destaque: true,
  },
  {
    id: '02',
    titulo: 'MicrosservicoEmails',
    subtitulo: 'ONE CAVE INCIDENT',
    descricao: 'An unvetted cave became a hostage situation.',
    categoria: 'Blockers',
    severidade: 'CRITICAL',
    destaque: false,
  },
  {
    id: '03',
    titulo: 'Dino_Chrome',
    subtitulo: 'DESTINATION NEARLY REACHED',
    descricao: 'The crew opened a critical asset because nobody explained it.',
    categoria: 'Team Failures',
    severidade: 'MODERATE',
    destaque: false,
  },
  {
    id: '04',
    titulo: "Circe's Island",
    subtitulo: 'APPROXIMATELY ONE YEAR',
    descricao: 'A rescue operation turned into a year-long residency.',
    categoria: 'Distractions',
    severidade: 'HIGH SEVERITY',
    destaque: false,
  },
  {
    id: '05',
    titulo: 'The Sirens',
    subtitulo: 'BRIEF BUT DRAMATIC',
    descricao: 'A predictable temptation required a mast-based workaround.',
    categoria: 'Blockers',
    severidade: 'LOW',
    destaque: false,
  },
  {
    id: '06',
    titulo: 'Scylla and Charybdis',
    subtitulo: 'ONE CATASTROPHIC PASSAGE',
    descricao: 'The route offered two bad options and no perfect route.',
    categoria: 'Team Failures',
    severidade: 'CRITICAL',
    destaque: false,
  },
];

export default function Acervo() {
  const [filtro, setFiltro] = useState('ALL');
  const [projetoSelecionado, setProjetoSelecionado] = useState(projetosAcervo[0]);

  const categorias = ['ALL', 'Distractions', 'Blockers', 'Team Failures'];

  const projetosFiltrados = filtro === 'ALL'
    ? projetosAcervo
    : projetosAcervo.filter((p) => p.categoria === filtro);

  return (
    <div className="space-y-10 animate-fadeIn font-mono">
      {/* Cabeçalho da Seção */}
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
          Galeria de Projetos
        </p>
        <h1 className="text-3xl sm:text-5xl font-sans font-light tracking-tight text-white uppercase">
          PROJETOS  DESTAQUES
        </h1>
      </div>

      {/* Filtros em Pílulas / Tags */}
      <div className="flex flex-wrap gap-2 pt-2">
        {categorias.map((cat) => (
          <button
            key={cat}
            onClick={() => setFiltro(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all border ${
              filtro === cat
                ? 'bg-amber-300 text-black border-amber-300 font-bold shadow-[2px_2px_0px_rgba(0,0,0,1)]'
                : 'bg-zinc-900/80 text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid Principal Layout: Cards à esquerda / Detalhes à direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Grid de Cards de Projetos (8 Colunas) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {projetosFiltrados.map((item) => {
            const isSelected = projetoSelecionado?.id === item.id;

            return (
              <div
                key={item.id}
                onClick={() => setProjetoSelecionado(item)}
                className={`group cursor-pointer rounded-2xl border-2 transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-300 bg-amber-300 text-black shadow-[4px_4px_0px_rgba(16,185,129,0.8)]'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-900'
                }`}
              >
                {/* Topo do Card */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-bold opacity-80">
                    <span>INCIDENT {item.id}</span>
                    <span className="text-[10px] tracking-normal">{item.subtitulo}</span>
                  </div>

                  <h3 className="text-2xl font-bold font-sans tracking-tight leading-snug">
                    {item.titulo}
                  </h3>

                  <p className={`text-xs leading-relaxed ${isSelected ? 'text-zinc-900' : 'text-zinc-400'}`}>
                    {item.descricao}
                  </p>
                </div>

                {/* Canto Inferior Decorativo estilo Retro */}
                <div className="px-5 pb-4 flex justify-end">
                  <div
                    className={`w-6 h-6 rounded-tl-xl border-t-2 border-l-2 ${
                      isSelected ? 'border-black bg-black/10' : 'border-zinc-700'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Card Lateral de Detalhes Estilo Painel (5 Colunas) */}
        {projetoSelecionado && (
          <div className="lg:col-span-5 lg:sticky lg:top-8 bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 text-white shadow-2xl">
            {/* Tag de Severidade */}
            <div className="inline-block px-3 py-1 bg-amber-300 text-black font-bold text-xs uppercase tracking-wider rounded-md border border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              {projetoSelecionado.severidade}
            </div>

            <div>
              <p className="text-xs uppercase text-zinc-500 tracking-widest font-bold">
                INCIDENT #{projetoSelecionado.id}
              </p>
              <h2 className="text-3xl font-serif font-bold text-white mt-1">
                {projetoSelecionado.titulo}
              </h2>
            </div>

            <hr className="border-zinc-800" />

            <div className="space-y-4 text-xs leading-relaxed font-sans">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold block mb-1">
                  WHAT HAPPENED
                </span>
                <p className="text-zinc-300">
                  {projetoSelecionado.descricao}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-amber-300 font-bold block mb-1">
                  WHAT SHOULD HAVE BEEN DONE
                </span>
                <p className="text-zinc-400">
                  Establish milestones, maintain team accountability, and enforce a strict departure deadline.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <a
                href="https://github.com/ryanjuni"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-6 rounded-xl transition-colors font-mono text-xs uppercase tracking-wider shadow-[3px_3px_0px_rgba(255,255,255,0.2)]"
              >
                <span>Ver Código no GitHub</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}