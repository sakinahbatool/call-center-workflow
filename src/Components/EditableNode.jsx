import React from 'react';
import { Handle, Position } from 'reactflow';

export default function EditableNode({ id, data, selected }) {
  const onChange = (e) => {
    const val = e.target.value;
    if (data && typeof data.onChange === 'function') data.onChange(val);
  };

  const nodeType = data?.nodeType || 'Process';
  let classes = 'p-3 rounded-lg border min-w-[160px] text-center';

  // Node type styling
  switch (nodeType) {
    case 'Input':
      classes += ' bg-blue-50 border-blue-400';
      break;
    case 'Output':
      classes += ' bg-red-50 border-red-400';
      break;
    case 'Decision':
      classes += ' bg-yellow-50 border-yellow-400';
      break;
    default: // Process/Default
      classes += ' bg-white border-slate-300';
      break;
  }

  if (selected) classes += ' ring-2 ring-blue-400';

  return (
    <div className={classes}>
      {/* Top handle */}
      {(nodeType === 'Process' || nodeType === 'Output' || nodeType === 'Decision') && (
        <Handle type="target" position={Position.Top} />
      )}

      {/* Editable label */}
      <input
        className="node-input text-sm font-medium w-full text-center"
        value={data?.label || ''}
        onChange={onChange}
      />

      {/* Bottom handles */}
      {(nodeType === 'Process' || nodeType === 'Input') && (
        <Handle type="source" position={Position.Bottom}  />
      )}

      {/* Decision node bottom handle (single handle, max 2 connections) */}
      {nodeType === 'Decision' && (
        <Handle type="source" position={Position.Bottom} id="condition"  />
      )}
    </div>
  );
}
