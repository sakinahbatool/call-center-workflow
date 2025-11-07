import React from 'react';

const items = [
  { type: 'Input', label: 'Input' },
  { type: 'Process', label: 'Process' },
  { type: 'Decision', label: 'Decision' },
  { type: 'Output', label: 'Output' },
];

export default function Sidebar() {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-1/4 bg-gray-100 p-4 border-r">
      <h2 className="text-xl font-semibold mb-4">Palette</h2>
      <div className="flex flex-col gap-3">
        {items.map((it) => (
          <div
            key={it.type}
            className="p-3 rounded shadow-sm bg-white cursor-grab hover:shadow-md"
            draggable
            onDragStart={(e) => onDragStart(e, it.label)}
          >
            <div className="text-sm font-medium">{it.label}</div>
            <div className="text-xs text-slate-500">Drag to canvas</div>
          </div>
        ))}
      </div>
    </aside>
  );
}
