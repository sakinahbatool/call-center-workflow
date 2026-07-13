import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from 'reactflow';

export default function EditableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: selected ? '#2563eb' : '#64748b',
          strokeWidth: selected ? 3 : 2,
          ...style,
        }}
      />
      <EdgeLabelRenderer>
        {selected && (
          <div
            className="nodrag nopan px-2 py-1 text-[10px] bg-white border rounded-full shadow text-gray-500"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'none',
            }}
          >
            {data?.label || 'sequence'}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
