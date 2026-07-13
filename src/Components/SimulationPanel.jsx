import React from 'react';
import { getSubtypeDisplay } from '../utils/nodeTemplates';

const TRIGGER_TYPES = new Set([
  'webhook',
  'schedule',
  'whatsapp_trigger',
  'sms_trigger',
  'slack_trigger',
  'email_trigger',
]);

const STEP_LABELS = {
  webhook: 'Webhook trigger activated',
  schedule: 'Scheduled trigger evaluated',
  whatsapp_trigger: 'WhatsApp trigger received message',
  sms_trigger: 'SMS trigger received message',
  slack_trigger: 'Slack trigger matched message/keyword',
  email_trigger: 'Email trigger received support request',
  voice_agent: 'Voice agent started conversation handling',
  memory: 'Memory context loaded',
  knowledge_base: 'Knowledge base made available',
  tool_call: 'Tool call condition evaluated',
  message: 'Fixed message prepared',
  db_logs: 'Database log fields prepared',
  llm: 'LLM prompt executed as dry-run step',
  summarizer: 'Post-call summarizer prepared',
  end_call: 'End-call condition evaluated',
  messaging_app: 'Messaging app response prepared',
  database_connection: 'Database connection selected for tool usage',
};

function buildSimulationSteps(nodes, edges) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const incoming = new Map(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map(nodes.map((node) => [node.id, []]));

  edges.forEach((edge) => {
    incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
    outgoing.set(edge.source, [...(outgoing.get(edge.source) || []), edge]);
  });

  let starts = nodes.filter((node) => TRIGGER_TYPES.has(node.data?.nodeType));

  if (starts.length === 0) {
    starts = nodes.filter((node) => (incoming.get(node.id) || 0) === 0);
  }

  const queue = starts.map((node) => node.id);
  const visited = new Set();
  const steps = [];

  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    const node = byId.get(nodeId);
    if (!node) continue;

    const nodeType = node.data?.nodeType;
    const nextEdges = outgoing.get(nodeId) || [];

    steps.push({
      nodeId,
      nodeType,
      label: STEP_LABELS[nodeType] || `${nodeType} processed`,
      subtype: getSubtypeDisplay(nodeType, node.data?.config || {}),
      nextNodeIds: nextEdges.map((edge) => edge.target),
      branchCount: nextEdges.length,
    });

    nextEdges.forEach((edge) => {
      if (!visited.has(edge.target)) queue.push(edge.target);
    });
  }

  const unreachable = nodes.filter((node) => !visited.has(node.id)).map((node) => node.id);
  return { starts: starts.map((node) => node.id), steps, unreachable };
}

export default function SimulationPanel({ nodes, edges, isOpen, onClose, onHighlight }) {
  const [running, setRunning] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const timeoutRef = React.useRef(null);

  const simulation = React.useMemo(() => buildSimulationSteps(nodes, edges), [nodes, edges]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
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

  if (!isOpen) return null;

  return (
    <div className="absolute right-6 bottom-24 z-20 w-[420px] max-h-[70vh] bg-white border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between bg-gray-50">
        <div>
          <h3 className="font-semibold text-gray-900">Workflow Simulation</h3>
          <p className="text-xs text-gray-500">Dry-run only. No real AI call or API execution.</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
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
            {step.branchCount > 1 && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
                This node has {step.branchCount} outgoing paths. Final execution behavior may need conditions once provided by AI team.
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
