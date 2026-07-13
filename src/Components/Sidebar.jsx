import React, { useMemo, useState } from 'react';
import nodeTemplates, { NODE_CATEGORIES } from '../utils/nodeTemplates';

const CATEGORY_META = {
  All: { icon: '▦', label: 'All' },
  Core: { icon: '●', label: 'Core' },
  Triggers: { icon: '⚡', label: 'Triggers' },
  Messaging: { icon: '✉', label: 'Messaging' },
  'Knowledge & Tools': { icon: '◆', label: 'Knowledge' },
  AI: { icon: '✦', label: 'AI' },
  'Storage & Logs': { icon: '▤', label: 'Storage' },
  'Database Connections': { icon: '▥', label: 'Database' },
  'Call Control': { icon: '■', label: 'Call Control' },
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

  const categories = useMemo(() => ['All', ...NODE_CATEGORIES], []);

  const visibleNodes = nodes
    .filter((node) => activeCategory === 'All' || node.category === activeCategory)
    .filter((node) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return node.displayName.toLowerCase().includes(q) || node.type.toLowerCase().includes(q);
    });

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-[260px] shrink-0 border-r border-slate-200 bg-white flex flex-col">
      <div className="px-3 pt-3 pb-2 border-b border-slate-100">
        <h2 className="text-[13px] font-bold text-slate-900 tracking-wide">Stencils</h2>
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

      <div className="border-b border-slate-100 px-2 py-2">
        <div className="flex flex-wrap gap-1">
          {categories.map((category) => {
            const meta = CATEGORY_META[category] || { icon: '•', label: category };
            const active = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                title={category}
                className={`h-6 px-2 rounded-md text-[10.5px] font-semibold border transition-colors flex items-center gap-1 ${
                  active
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-700'
                }`}
              >
                <span className="text-[10px]">{meta.icon}</span>
                <span>{meta.label}</span>
              </button>
            );
          })}
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
    </aside>
  );
}