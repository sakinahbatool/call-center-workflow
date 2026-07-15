import React from 'react';
import { Handle, Position } from 'reactflow';
import nodeTemplates, { getNodeFields, getSubtypeDisplay } from '../utils/nodeTemplates';
import { getByPath, isEmptyValue } from '../utils/objectPath';

/**
 * Flat, Miro/Lucidchart-style stencil shapes.
 * Two "kinds":
 *  - "poly": the clip-path IS the node (diamond/hexagon/octagon/crystal). Filled solid
 *    with the accent color, centered content, no card chrome.
 *  - "card": a plain rectangular/rounded/pill/cylinder card with a colored left/top
 *    accent bar and a small icon chip (agent, memory, message, document, db, etc).
 */
const shapeStyles = {
  agent: {
    kind: 'card', wrapper: 'w-[250px] min-h-[100px]', frame: 'rounded-lg', style: {}, align: 'left', accentBar: 'left',
  },
  capsule: {
    kind: 'card', wrapper: 'w-[210px] h-[82px]', frame: 'rounded-full', style: {}, align: 'center', accentBar: 'top',
  },
  bubble: {
    kind: 'card', wrapper: 'w-[220px] min-h-[94px]', frame: 'rounded-2xl', style: {}, align: 'left', accentBar: 'left', tail: true,
  },
  appCard: {
    kind: 'card', wrapper: 'w-[230px] min-h-[96px]', frame: 'rounded-lg', style: {}, align: 'left', accentBar: 'left', fold: true,
  },
  document: {
    kind: 'card', wrapper: 'w-[220px] min-h-[92px]', frame: 'rounded-md', style: {}, align: 'left', accentBar: 'left', fold: true,
  },
  documentStack: {
    kind: 'card', wrapper: 'w-[230px] min-h-[98px]', frame: 'rounded-md', style: {}, align: 'left', accentBar: 'left', stack: true,
  },
  database: {
    kind: 'cylinder', wrapper: 'w-[200px] h-[122px]', frame: '', style: {}, align: 'center',
  },
  hexagon: {
    kind: 'poly', wrapper: 'w-[200px] h-[92px]', frame: '', style: { clipPath: 'polygon(12% 0, 88% 0, 100% 50%, 88% 100%, 12% 100%, 0 50%)' }, align: 'center',
  },
  octagon: {
    kind: 'poly', wrapper: 'w-[200px] h-[96px]', frame: '', style: { clipPath: 'polygon(22% 0, 78% 0, 100% 22%, 100% 78%, 78% 100%, 22% 100%, 0 78%, 0 22%)' }, align: 'center',
  },
  diamond: {
    kind: 'poly', wrapper: 'w-[184px] h-[146px]', frame: '', style: { clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)' }, align: 'center', compact: true,
  },
  crystal: {
    kind: 'poly', wrapper: 'w-[200px] h-[114px]', frame: '', style: { clipPath: 'polygon(16% 0, 84% 0, 100% 34%, 50% 100%, 0 34%)' }, align: 'center', compact: true,
  },
};

function getMissingCount(nodeType, config) {
  return getNodeFields(nodeType, config).filter((field) => {
    if (!field.required) return false;
    return isEmptyValue(getByPath(config, field.key));
  }).length;
}

const handleClass = '!bg-slate-400 !w-2.5 !h-2.5 !border-2 !border-white';
const sourceHandleClass = '!bg-slate-700 !w-2.5 !h-2.5 !border-2 !border-white';

export default function EditableNode({ data, selected }) {
  const nodeType = data?.nodeType;
  const template = nodeTemplates[nodeType];

  if (!template) {
    return (
      <div className="p-3 rounded-lg border-2 border-red-400 bg-red-50 min-w-[180px]">
        <Handle type="target" position={Position.Top} className={handleClass} />
        <div className="text-sm font-semibold text-red-700">Invalid Node</div>
        <Handle type="source" position={Position.Bottom} className={sourceHandleClass} />
      </div>
    );
  }

  const config = data?.config || {};
  const missingCount = getMissingCount(nodeType, config);
  const shape = shapeStyles[template.shape] || shapeStyles.agent;
  const subtypeDisplay = getSubtypeDisplay(nodeType, config);
  const ready = missingCount === 0;

  const statusClass = ready
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-red-50 text-red-700 border-red-200';

  const ringClass = data?.isSimulating
    ? 'ring-[3px] ring-emerald-400'
    : selected
      ? 'ring-[3px] ring-blue-400'
      : '';

  const isPoly = shape.kind === 'poly';
  const isCylinder = shape.kind === 'cylinder';

  return (
    <div className={`relative ${shape.wrapper}`}>
      <Handle type="target" position={Position.Top} className={handleClass} />
      <Handle type="target" position={Position.Left} className={handleClass} />

      {/* ---- Polygon shapes: solid fill, no card chrome ---- */}
      {isPoly && (
        <>
          {data?.isSimulating && (
            <div
              style={shape.style}
              className="absolute -inset-[6px] bg-emerald-400 pointer-events-none"
            />
          )}

          <div
            style={shape.style}
            className={`relative z-10 h-full w-full border-2 ${template.accent || 'border-slate-400 bg-slate-50'} flex flex-col items-center justify-center gap-1 px-6 text-center shadow-sm transition-transform ${selected ? 'ring-[3px] ring-blue-400' : ''} ${!selected && !data?.isSimulating ? 'hover:brightness-95' : ''}`}
          >
            <div className="text-lg leading-none">{template.icon}</div>
            <div className="text-xs font-bold text-slate-800 leading-tight line-clamp-2">{template.displayName}</div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${statusClass}`}>
              {ready ? 'Ready' : `${missingCount} missing`}
            </span>
          </div>
        </>
      )}

      {/* ---- Cylinder (database) ---- */}
      {isCylinder && (
        <div className={`relative h-full w-full ${ringClass}`}>
          <div className={`absolute inset-x-0 top-0 h-6 rounded-[50%] border-2 ${template.accent || 'border-slate-400 bg-slate-50'}`} />
          <div className={`absolute inset-x-0 top-3 bottom-3 border-x-2 ${(template.accent || '').split(' ').find((c) => c.startsWith('border-')) || 'border-slate-400'} ${(template.accent || '').split(' ').find((c) => c.startsWith('bg-')) || 'bg-slate-50'}`} />
          <div className={`absolute inset-x-0 bottom-0 h-6 rounded-[50%] border-2 ${template.accent || 'border-slate-400 bg-slate-50'}`} />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 text-center">
            <div className="text-lg leading-none">{template.icon}</div>
            <div className="text-xs font-bold text-slate-800 leading-tight">{template.displayName}</div>
            <div className="text-[9px] uppercase tracking-wide text-slate-500 truncate max-w-full">
              {subtypeDisplay || nodeType}
            </div>
          </div>
        </div>
      )}

      {/* ---- Card shapes: white card + colored accent bar + icon chip ---- */}
      {shape.kind === 'card' && (
        <div
          style={shape.style}
          className={`relative h-full w-full bg-white border-2 border-slate-200 ${shape.frame} shadow-sm overflow-hidden transition-transform ${ringClass} ${!ringClass && 'hover:shadow-md'}`}
        >
          <div
            className={`absolute ${shape.accentBar === 'top' ? 'top-0 left-0 right-0 h-1.5' : 'left-0 top-0 bottom-0 w-1.5'} ${(template.accent || '').split(' ').find((c) => c.startsWith('border-'))?.replace('border-', 'bg-') || 'bg-slate-400'}`}
          />

          {shape.fold && <div className="absolute right-0 top-0 h-4 w-4 bg-slate-100 border-l border-b border-slate-200" />}
          {shape.stack && (
            <>
              <div className="absolute left-3 right-3 -top-1.5 h-4 rounded-t-md border border-slate-200 bg-slate-50" />
            </>
          )}
          {shape.tail && <div className="absolute -bottom-2 left-7 h-4 w-4 rotate-45 bg-white border-r border-b border-slate-200" />}

          <div className={`relative z-10 h-full px-4 py-3 ${shape.align === 'center' ? 'flex flex-col items-center justify-center text-center' : 'pl-5'}`}>
            <div className={`flex items-center gap-2.5 ${shape.align === 'center' ? 'flex-col' : ''}`}>
              <div className={`h-8 w-8 rounded-md flex items-center justify-center text-base shrink-0 border border-slate-200 ${(template.accent || '').split(' ').find((c) => c.startsWith('bg-')) || 'bg-slate-50'}`}>
                {template.icon}
              </div>
              <div className={shape.align === 'center' ? 'min-w-0 text-center' : 'min-w-0 flex-1'}>
                <div className="text-sm font-bold text-slate-900 truncate">{template.displayName}</div>
                <div className="text-[10px] uppercase tracking-wide text-slate-400 truncate">
                  {subtypeDisplay || nodeType}
                </div>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 truncate">
                {template.category}
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full border shrink-0 ${statusClass}`}>
                {ready ? 'Ready' : `${missingCount} missing`}
              </span>
            </div>
          </div>
        </div>
      )}

      {nodeType === 'if_condition' ? (
        <>
          <Handle
            id="true"
            type="source"
            position={Position.Bottom}
            className="!bg-emerald-600 !w-3 !h-3 !border-2 !border-white"
          />
          <Handle
            id="false"
            type="source"
            position={Position.Right}
            className="!bg-rose-600 !w-3 !h-3 !border-2 !border-white"
          />
          <span className="absolute left-1/2 -translate-x-1/2 -bottom-6 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 pointer-events-none">
            TRUE
          </span>
          <span className="absolute -right-12 top-1/2 -translate-y-1/2 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[9px] font-bold text-rose-700 pointer-events-none">
            FALSE
          </span>
        </>
      ) : (
        <>
          <Handle type="source" position={Position.Bottom} className={sourceHandleClass} />
          <Handle type="source" position={Position.Right} className={sourceHandleClass} />
        </>
      )}
    </div>
  );
}