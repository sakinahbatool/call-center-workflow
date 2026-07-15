import React from 'react';
import { getSubtypeDisplay } from '../utils/nodeTemplates';

const TRIGGER_TYPES = new Set([
  'schedule',
  'webhook',
  'call_trigger',
  'whatsapp_trigger',
  'sms_trigger',
  'slack_trigger',
  'email_trigger',
]);

const STEP_LABELS = {
  schedule: 'Schedule trigger evaluated',
  webhook: 'Webhook trigger activated',
  call_trigger: 'Call trigger received call event',
  whatsapp_trigger: 'WhatsApp trigger received message',
  sms_trigger: 'SMS trigger received message',
  slack_trigger: 'Slack trigger matched message/keyword',
  email_trigger: 'Email trigger received support request',

  voice_agent_start: 'Voice agent global voice settings initialized',
  initial_message: 'Initial fixed message played',
  memory: 'Memory context loaded',
  data_capture_verification: 'Data capture and verification step prepared',
  agent: 'Conversational agent phase started',
  end_agent: 'Current conversational agent phase ended',

  tool_call: 'Tool call condition evaluated',
  knowledge_base: 'Knowledge base/RAG step prepared',
  db_query: 'Parameterized database query prepared',
  mysql_connection: 'MySQL connection selected',
  postgresql_connection: 'PostgreSQL connection selected',
  microsoft_sql_connection: 'Microsoft SQL Server connection selected',
  database_connection: 'Database connection selected',

  crm: 'CRM action prepared',
  ticketing: 'Ticketing action prepared',
  external_api: 'External API request prepared',
  routing: 'Routing decision prepared',
  fallback: 'Fallback response prepared',
  message: 'Fixed workflow message prepared',
  if_condition: 'If condition evaluated',

  whatsapp_message: 'WhatsApp message prepared',
  sms_message: 'SMS message prepared',
  slack_message: 'Slack message prepared',
  email_send: 'Email message prepared',
  messaging_app: 'Messaging app response prepared',

  last_message: 'Last fixed message prepared',
  end_call: 'Live call termination reached',
  transcription: 'Transcription step prepared',
  summarizer: 'Post-call summarizer prepared',
  llm: 'LLM instruction executed as dry-run step',
  db_logs: 'Database log fields prepared',

  voice_agent: 'Legacy voice agent node processed',
};

function getEdgeBranch(edge) {
  return edge.data?.branch || edge.sourceHandle || '';
}

function buildSimulationSteps(nodes, edges) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const incoming = new Map(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map(nodes.map((node) => [node.id, []]));

  edges.forEach((edge, index) => {
    incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
    outgoing.set(edge.source, [...(outgoing.get(edge.source) || []), { ...edge, order: index }]);
  });

  outgoing.forEach((items, nodeId) => {
    outgoing.set(nodeId, [...items].sort((a, b) => a.order - b.order));
  });

  let starts = nodes.filter((node) => TRIGGER_TYPES.has(node.data?.nodeType));

  if (starts.length === 0) {
    starts = nodes.filter((node) => (incoming.get(node.id) || 0) === 0);
  }

  const visited = new Set();
  const steps = [];

  const walk = (nodeId, viaBranch = '') => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = byId.get(nodeId);
    if (!node) return;

    const nodeType = node.data?.nodeType;
    const nextEdges = outgoing.get(nodeId) || [];
    const nextBranches = nextEdges
      .map((edge) => getEdgeBranch(edge))
      .filter(Boolean);

    steps.push({
      nodeId,
      nodeType,
      label: STEP_LABELS[nodeType] || `${nodeType} processed`,
      subtype: getSubtypeDisplay(nodeType, node.data?.config || {}),
      branch: viaBranch,
      nextNodeIds: nextEdges.map((edge) => edge.target),
      nextBranches,
      branchCount: nextEdges.length,
    });

    nextEdges.forEach((edge) => {
      walk(edge.target, getEdgeBranch(edge));
    });
  };

  starts.forEach((node) => walk(node.id));

  const unreachable = nodes.filter((node) => !visited.has(node.id)).map((node) => node.id);
  return { starts: starts.map((node) => node.id), steps, unreachable };
}


export default function SimulationPanel({ nodes, edges, isOpen, onClose, onHighlight }) {
  const [running, setRunning] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  // New: draggable panel position
  const [position, setPosition] = React.useState({ x: 24, y: 24 });
  const dragRef = React.useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    startPanelX: 0,
    startPanelY: 0,
  });

  const timeoutRef = React.useRef(null);
  const simulation = React.useMemo(() => buildSimulationSteps(nodes, edges), [nodes, edges]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stop = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setRunning(false);
    setActiveIndex(-1);
    onHighlight?.(null);
  };

  const play = () => {
    if (simulation.steps.length === 0) return;
    stop();
    setRunning(true);

    let index = 0;
    const tick = () => {
      setActiveIndex(index);
      const step = simulation.steps[index];
      onHighlight?.(step?.nodeId || null);
      index += 1;

      if (index >= simulation.steps.length) {
        timeoutRef.current = setTimeout(() => {
          setRunning(false);
          onHighlight?.(null);
        }, 800);
        return;
      }

      timeoutRef.current = setTimeout(tick, 900);
    };

    tick();
  };

  const handleDragStart = (event) => {
    // Do not start drag when clicking close button or action buttons
    if (event.target.closest('button')) return;

    dragRef.current = {
      dragging: true,
      startX: event.clientX,
      startY: event.clientY,
      startPanelX: position.x,
      startPanelY: position.y,
    };

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
  };

  const handleDragMove = (event) => {
    if (!dragRef.current.dragging) return;

    const deltaX = event.clientX - dragRef.current.startX;
    const deltaY = event.clientY - dragRef.current.startY;

    const nextX = dragRef.current.startPanelX + deltaX;
    const nextY = dragRef.current.startPanelY + deltaY;

    // Keep panel inside visible browser area roughly
    const maxX = window.innerWidth - 460;
    const maxY = window.innerHeight - 220;

    setPosition({
      x: Math.max(12, Math.min(nextX, maxX)),
      y: Math.max(12, Math.min(nextY, maxY)),
    });
  };

  const handleDragEnd = () => {
    dragRef.current.dragging = false;
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        left: position.x,
        top: position.y,
      }}
      className="absolute z-20 w-[420px] max-h-[70vh] bg-white border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
    >
      <div
        onMouseDown={handleDragStart}
        className="p-4 border-b flex items-center justify-between bg-gray-50 cursor-move select-none"
        title="Drag to move simulation panel"
      >
        <div>
          <h3 className="font-semibold text-gray-900">Workflow Simulation</h3>
          <p className="text-xs text-gray-500">Dry-run only. No real AI call or API execution.</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 cursor-pointer">✕</button>
      </div>

      <div className="p-4 border-b flex items-center gap-2">
        <button
          onClick={play}
          disabled={running || simulation.steps.length === 0}
          className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-60"
        >
          ▶ Play
        </button>
        <button
          onClick={stop}
          className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
        >
          Stop
        </button>
        <span className="ml-auto text-xs text-gray-500">
          {simulation.steps.length} step(s)
        </span>
      </div>

      <div className="overflow-y-auto p-4 space-y-3">
        {simulation.starts.length > 0 && (
          <div className="text-xs bg-blue-50 border border-blue-200 rounded-lg p-2 text-blue-700">
            Start node(s): {simulation.starts.join(', ')}
          </div>
        )}

        {simulation.steps.length === 0 && (
          <div className="text-sm text-gray-500 border border-dashed rounded-xl p-5 text-center">
            No simulation path found. Add nodes and connections first.
          </div>
        )}

        {simulation.steps.map((step, index) => (
          <div
            key={`${step.nodeId}_${index}`}
            className={`border rounded-xl p-3 ${activeIndex === index ? 'border-blue-500 bg-blue-50' : 'bg-white'}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-gray-900">
                Step {index + 1}: {step.label}
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                {step.subtype || step.nodeType}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">Node: {step.nodeId}</div>

            {step.branch && (
              <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2">
                Entered through {step.branch.toUpperCase()} branch.
              </div>
            )}

            {step.branchCount > 1 && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
                This node has {step.branchCount} outgoing paths. Simulation completes each path fully before moving to the next path in connection order.
                {step.nextBranches.length > 0 ? ` Branches: ${step.nextBranches.join(', ')}.` : ''}
              </div>
            )}
          </div>
        ))}

        {simulation.unreachable.length > 0 && (
          <div className="text-xs bg-red-50 border border-red-200 rounded-lg p-2 text-red-700">
            Unreached node(s): {simulation.unreachable.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}
