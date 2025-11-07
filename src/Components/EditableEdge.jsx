import React, { useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, getMarkerEnd } from 'reactflow';

export default function EditableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
  selected,
}) {
  const [editing, setEditing] = useState(false);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const onLabelChange = (e) => {
    if (data && typeof data.onChange === 'function') data.onChange(e.target.value);
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke: selected ? '#2563eb' : '#999', strokeWidth: 2, ...style }}
        markerEnd={getMarkerEnd(markerEnd)}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {/* Show input if editing */}
          {editing ? (
            <input
              autoFocus
              value={data?.label || ''}
              onChange={onLabelChange}
              onBlur={() => setEditing(false)}
              className="text-xs p-1 rounded border node-input bg-white shadow-sm"
              style={{ width: '100px', textAlign: 'center' }}
            />
          ) : (
            <>
              {/* Show existing label or plus button if selected */}
              {data?.label ? (
                <div
                  className="text-xs p-1 bg-white border rounded shadow cursor-pointer"
                  onClick={() => setEditing(true)}
                  style={{ minWidth: '50px', textAlign: 'center' }}
                >
                  {data.label}
                </div>
              ) : selected ? (
                <button
                  className="text-xs px-1 bg-blue-500 text-white rounded shadow"
                  onClick={() => setEditing(true)}
                >
                  + Label
                </button>
              ) : null}
            </>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
