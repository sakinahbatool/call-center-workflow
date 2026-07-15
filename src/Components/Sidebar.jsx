import React, { useMemo, useState } from 'react';
import nodeTemplates, { NODE_CATEGORIES } from '../utils/nodeTemplates';

const CATEGORY_META = {
  All: { icon: '▦', label: 'Stencils', chip: 'bg-blue-100 text-blue-600' },
  Core: { icon: '★', label: 'Core', chip: 'bg-slate-100 text-slate-500' },
  Triggers: { icon: '⚡', label: 'Triggers', chip: 'bg-amber-100 text-amber-500' },
  Messaging: { icon: '✉', label: 'Messages', chip: 'bg-pink-100 text-pink-500' },
  'Knowledge & Tools': { icon: '🛠', label: 'Tools', chip: 'bg-slate-100 text-slate-600' },
  AI: { icon: '✦', label: 'AI', chip: 'bg-violet-100 text-violet-500' },
  'Storage & Logs': { icon: '▤', label: 'Logs', chip: 'bg-indigo-100 text-indigo-500' },
  'Database Connections': { icon: '🔒', label: 'Database', chip: 'bg-orange-100 text-orange-500' },
  'Call Control': { icon: '⛔', label: 'Control', chip: 'bg-rose-100 text-rose-500' },
};

function StencilPreview({ shape, accent }) {
  const borderClass = accent?.split(' ').find((item) => item.startsWith('border-')) || 'border-slate-400';
  const bgClass = accent?.split(' ').find((item) => item.startsWith('bg-')) || 'bg-slate-50';
  const base = `h-7 w-9 border-2 ${borderClass} ${bgClass}`;

  if (shape === 'diamond') return <div className={`${base} rotate-45 scale-75`} />;

  if (shape === 'hexagon') {
    return <div className={base} style={{ clipPath: 'polygon(14% 0, 86% 0, 100% 50%, 86% 100%, 14% 100%, 0 50%)' }} />;
  }

  if (shape === 'octagon') {
    return <div className={base} style={{ clipPath: 'polygon(24% 0, 76% 0, 100% 24%, 100% 76%, 76% 100%, 24% 100%, 0 76%, 0 24%)' }} />;
  }

  if (shape === 'crystal') {
    return <div className={base} style={{ clipPath: 'polygon(18% 0, 82% 0, 100% 38%, 50% 100%, 0 38%)' }} />;
  }

  if (shape === 'database') {
    return (
      <div className={`relative h-8 w-9 border-x-2 border-b-2 ${borderClass} ${bgClass} rounded-b-md`}>
        <div className={`absolute -top-1 left-0 right-0 h-3 rounded-[50%] border-2 ${borderClass} bg-white`} />
      </div>
    );
  }

  if (shape === 'document' || shape === 'documentStack' || shape === 'appCard') {
    return <div className={`${base} rounded-sm`} style={{ clipPath: 'polygon(0 0, 78% 0, 100% 22%, 100% 100%, 0 100%)' }} />;
  }

  if (shape === 'capsule') return <div className={`${base} rounded-full`} />;
  if (shape === 'bubble') return <div className={`${base} rounded-md`} />;

  return <div className={`${base} rounded-md`} />;
}

export default function Sidebar() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const nodes = useMemo(() => {
    return Object.entries(nodeTemplates).map(([type, template]) => ({ type, ...template }));
  }, []);

  const categories = useMemo(() => {
    const templateCategories = Array.from(new Set(nodes.map((node) => node.category).filter(Boolean)));
    const extraCategories = templateCategories.filter((category) => !NODE_CATEGORIES.includes(category));
    return ['All', ...NODE_CATEGORIES, ...extraCategories];
  }, [nodes]);

  const visibleNodes = nodes
    .filter((node) => activeCategory === 'All' || node.category === activeCategory)
    .filter((node) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return node.displayName.toLowerCase().includes(q) || node.type.toLowerCase().includes(q);
    });

  const activeMeta = CATEGORY_META[activeCategory] || { label: activeCategory };

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-[320px] shrink-0 border-r border-slate-200 bg-white flex min-h-0">
      {/* Vertical category rail */}
      <div className="w-[76px] shrink-0 border-r border-slate-100 bg-white min-h-0 overflow-y-auto py-1">
        <div className="flex flex-col items-center gap-0.5 px-1.5">
          {categories.map((category) => {
            const meta = CATEGORY_META[category] || { icon: '•', label: category, chip: 'bg-slate-100 text-slate-500' };
            const active = activeCategory === category;

            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                title={category}
                className={`w-full flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-colors ${
                  active ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'
                }`}
              >
                <span className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm shadow-sm ${meta.chip}`}>
                  {meta.icon}
                </span>
                <span className={`text-[9px] font-semibold leading-none ${active ? 'text-blue-600' : 'text-slate-500'}`}>
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search + stencil grid */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="px-3 pt-3 pb-2 border-b border-slate-100">
          <h2 className="text-[13px] font-bold text-slate-900 tracking-wide truncate">{activeMeta.label}</h2>
          <div className="mt-2 relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search stencils"
              className="w-full h-8 pl-8 pr-2 rounded-md border border-slate-200 bg-slate-50 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <div className="grid grid-cols-2 gap-2">
            {visibleNodes.map((node) => (
              <div
                key={node.type}
                draggable
                onDragStart={(event) => onDragStart(event, node.type)}
                title={node.description}
                className="group flex flex-col items-center gap-1.5 rounded-md border border-slate-200 bg-white py-3 px-1.5 cursor-grab hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-sm transition-all"
              >
                <StencilPreview shape={node.shape} accent={node.accent} />
                <span className="text-[11px] font-semibold text-slate-700 text-center leading-tight truncate w-full">
                  {node.displayName}
                </span>
              </div>
            ))}
          </div>

          {!visibleNodes.length && (
            <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-500 mt-2">
              No stencils found.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}