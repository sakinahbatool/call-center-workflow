import React from 'react';
import { Handle, Position } from 'reactflow';
import allNodeTemplates from '../utils/nodeTemplates'; // Import the default export

export default function ExtensibleFunctionNode({ id, data, selected }) {
  const functionType = data?.nodeType;
  const functionDef = allNodeTemplates[functionType]; // Look in the combined map
    
  if (!functionDef) {
    return (
      <div className="p-3 rounded-lg border bg-red-50 border-red-400 min-w-[160px]">
        <div className="text-sm font-medium text-center">Invalid Function</div>
      </div>
    );
  }

  // Handle parameter changes
  const onParamChange = (paramKey, value) => {
    if (data && typeof data.onParamChange === 'function') {
      data.onParamChange(paramKey, value);
    }
  };

  const handleInputChange = (paramKey, event) => {
    onParamChange(paramKey, event.target.value);
  };

  // Handle edit button click
  const handleEditClick = (e) => {
    e.stopPropagation(); // Prevent node selection when clicking edit
    if (data && typeof data.onEdit === 'function') {
      data.onEdit();
    }
  };

  let classes = 'p-3 rounded-lg border min-w-[160px]';
  classes += ` ${functionDef.bgColor}`;
  if (selected) classes += ' ring-2 ring-blue-400';

  // Show edit button if selected
  // Show edit button if selected AND if the onEdit prop exists
  const showEditButton = selected && functionDef.isExtensible && typeof data.onEdit === 'function';
  return (
    <div className={classes}>
      {/* Top handle for target connections */}
      {functionDef.handles.target && (
        <Handle type="target" position={Position.Top} />
      )}

      {/* Node header with display name */}
      <div className="text-sm font-medium mb-2 text-center border-b pb-1 flex items-center justify-between">
        <span>{functionDef.displayName}</span>
        {showEditButton && (
          <button
            onClick={handleEditClick}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
            title="Edit function logic"
          >
            Edit
          </button>
        )}
      </div>

      {/* Function description */}
      <div className="text-xs text-gray-600 mb-2 text-center">
        {functionDef.description}
      </div>

      {/* Parameter inputs */}
      <div className="space-y-2">
        {functionDef.inputs.map((input) => (
          <div key={input.key} className="text-xs">
            <label className="block text-left mb-1 font-medium">
              {input.label}:
            </label>
            <input
              type="text"
              className="w-full p-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              // --- THIS IS THE FIX ---
              value={data?.params?.[input.key] ?? ''} // Use empty string if undefined
              onChange={(e) => handleInputChange(input.key, e)}
              placeholder={input.defaultValue} // Show default as placeholder
            // --- END FIX ---
            />
          </div>
        ))}
      </div>

      {/* User code indicator */}
      {data?.userNodes && data.userNodes.length > 0 && (
        <div className="mt-2 text-xs text-green-600 text-center">
          ✓ Custom logic added
        </div>
      )}

      {/* Bottom handle for source connections */}
      {functionDef.handles.source && (
        <Handle type="source" position={Position.Bottom} />
      )}
    </div>
  );
}