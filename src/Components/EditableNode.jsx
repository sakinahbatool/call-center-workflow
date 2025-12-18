import React from 'react';
import { Handle, Position } from 'reactflow';
import nodeTemplates from '../utils/nodeTemplates';

export default function EditableNode({ id, data, selected }) {
  const nodeType = data?.nodeType || 'Code';
  const template = nodeTemplates[nodeType] || nodeTemplates['Code'];
  
  // Handle parameter changes properly
  const onParamChange = (paramKey, value) => {
    if (data && typeof data.onParamChange === 'function') {
      data.onParamChange(paramKey, value);
    }
  };

  // Handle input change events
  const handleInputChange = (paramKey, event) => {
    onParamChange(paramKey, event.target.value);
  };

  let classes = 'p-3 rounded-lg border min-w-[160px]';
  classes += ` ${template.bgColor}`;
  if (selected) classes += ' ring-2 ring-blue-400';

  return (
    <div className={classes}>
      {/* Top handle for target connections */}
      {template.handles.target && (
        <Handle type="target" position={Position.Top} />
      )}

      {/* Node header with display name */}
      <div className="text-sm font-medium mb-2 text-center border-b pb-1">
        {template.displayName}
      </div>

      {/* Parameter inputs */}
      <div className="space-y-2">
        {template.inputs.map((input) => (
          <div key={input.key} className="text-xs">
            <label className="block text-left mb-1 font-medium">
              {input.label}:
            </label>
            <input
              type="text"
              className="w-full p-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={data?.params?.[input.key] ?? ''} // Use empty string if undefined
              onChange={(e) => handleInputChange(input.key, e)}
              placeholder={input.defaultValue} // Show default as placeholder only
            />
          </div>
        ))}
        
        {/* For nodes with no inputs, show a simple display */}
        {template.inputs.length === 0 && (
          <div className="text-xs text-gray-500 text-center py-1">
            {template.displayName}
          </div>
        )}
      </div>

      {/* Bottom handle for source connections */}
      {template.handles.source && (
        <Handle type="source" position={Position.Bottom} />
      )}
    </div>
  );
}