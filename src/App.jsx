import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  getConnectedEdges,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

import Sidebar from './Components/Sidebar';
import EditableNode from './Components/EditableNode';
import EditableEdge from './Components/EditableEdge';
import ConfigSidebar from './Components/ConfigSidebar';
import WorkflowActions from './Components/WorkflowActions';
import SimulationPanel from './Components/SimulationPanel';

import nodeTemplates, { getNodeFields } from './utils/nodeTemplates';
import { compileWorkflow, DEFAULT_WORKFLOW_META } from './utils/workflowCompiler';
import { getByPath, isEmptyValue, setByPath } from './utils/objectPath';
import { getConnectionError, isConnectionAllowed } from './utils/connectionRules';

const nodeTypes = { workflowNode: EditableNode };
const edgeTypes = { editableEdge: EditableEdge };

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function makeEdgeId(source, target, index) {
  return `edge_${index}_${source}_${target}`;
}

function getNodeNumber(nodes, type) {
  const sameTypeCount = nodes.filter((node) => node.data?.nodeType === type).length;
  return sameTypeCount + 1;
}

function getNextEdgeNumber(edges) {
  return edges.length + 1;
}

function ToolbarGroup({ children }) {
  return (
    <div className="flex items-center gap-0.5 pr-3 mr-2 border-r border-slate-200 last:border-r-0 last:mr-0 last:pr-0">
      {children}
    </div>
  );
}

function ToolbarButton({ icon, label, onClick, title, primary }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`h-11 min-w-[54px] px-2.5 rounded-md flex flex-col items-center justify-center gap-0.5 text-[10.5px] font-semibold leading-none transition-colors ${
        primary
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <span className="text-[15px] leading-none">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function validateWorkflowState({ workflowMeta, nodes, edges }) {
  const errors = [];
  const warnings = [];

  if (!workflowMeta.workflow_id?.trim()) errors.push('Workflow ID is required.');
  if (!workflowMeta.name?.trim()) errors.push('Workflow name is required.');
  if (!workflowMeta.phone_number?.trim()) warnings.push('Phone number is empty.');

  nodes.forEach((node) => {
    const template = nodeTemplates[node.data?.nodeType];
    if (!template) {
      errors.push(`${node.id}: unknown node type.`);
      return;
    }

    getNodeFields(node.data?.nodeType, node.data?.config || {}).forEach((field) => {
      if (!field.required) return;
      const value = getByPath(node.data?.config || {}, field.key);
      if (isEmptyValue(value)) errors.push(`${node.id}: ${field.label} is required.`);
    });
  });

  edges.forEach((edge) => {
    const source = nodes.find((node) => node.id === edge.source);
    const target = nodes.find((node) => node.id === edge.target);
    if (!source || !target) {
      errors.push(`${edge.id}: source or target node is missing.`);
      return;
    }

    const allowed = isConnectionAllowed(source.data?.nodeType, target.data?.nodeType);
    if (!allowed) {
      errors.push(`${edge.id}: ${getConnectionError(source.data?.nodeType, target.data?.nodeType)}`);
    }
  });

  const hasTrigger = nodes.some((node) => [
    'webhook',
    'schedule',
    'whatsapp_trigger',
    'sms_trigger',
    'slack_trigger',
    'email_trigger',
  ].includes(node.data?.nodeType));

  if (!hasTrigger) warnings.push('No trigger node found. Add webhook, schedule, WhatsApp, SMS, Slack, or email trigger.');
  if (!nodes.some((node) => node.data?.nodeType === 'voice_agent')) errors.push('At least one voice_agent node is required.');
  if (edges.length === 0) warnings.push('No connections found.');

  nodes
    .filter((node) => node.data?.nodeType === 'webhook')
    .forEach((node) => {
      const targetId = node.data?.config?.voice_agent_to_activate;
      if (targetId && !nodes.some((item) => item.id === targetId && item.data?.nodeType === 'voice_agent')) {
        errors.push(`${node.id}: voice_agent_to_activate must match an existing voice_agent node ID.`);
      }
    });

  return { errors, warnings };
}

export default function App() {
  const wrapperRef = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowMeta, setWorkflowMeta] = useState(DEFAULT_WORKFLOW_META);
  const [rightPanelWidth, setRightPanelWidth] = useState(420);
  const [connectionError, setConnectionError] = useState('');
  const [simulationOpen, setSimulationOpen] = useState(false);

  const historyRef = useRef([]);
  const redoRef = useRef([]);

  const saveEndpoint = import.meta.env.VITE_WORKFLOW_SAVE_API || '';

  const selectedNode = useMemo(() => nodes.find((node) => node.selected) || null, [nodes]);

  const workflowJson = useMemo(() => {
    return compileWorkflow({ workflowMeta, nodes, edges });
  }, [workflowMeta, nodes, edges]);

  const pushHistory = useCallback(() => {
    historyRef.current.push({
      nodes: clone(nodes),
      edges: clone(edges),
      workflowMeta: clone(workflowMeta),
    });
    redoRef.current = [];
  }, [nodes, edges, workflowMeta]);

  const undo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (!prev) return;

    redoRef.current.push({
      nodes: clone(nodes),
      edges: clone(edges),
      workflowMeta: clone(workflowMeta),
    });

    setNodes(prev.nodes);
    setEdges(prev.edges);
    setWorkflowMeta(prev.workflowMeta);
  }, [nodes, edges, workflowMeta, setNodes, setEdges]);

  const redo = useCallback(() => {
    const next = redoRef.current.pop();
    if (!next) return;

    historyRef.current.push({
      nodes: clone(nodes),
      edges: clone(edges),
      workflowMeta: clone(workflowMeta),
    });

    setNodes(next.nodes);
    setEdges(next.edges);
    setWorkflowMeta(next.workflowMeta);
  }, [nodes, edges, workflowMeta, setNodes, setEdges]);


  const clearWorkflow = useCallback(() => {
    const hasContent = nodes.length || edges.length;
    if (!hasContent) return;

    const confirmed = window.confirm('This will clear the current canvas. Continue?');
    if (!confirmed) return;

    pushHistory();
    setNodes([]);
    setEdges([]);
    setWorkflowMeta(DEFAULT_WORKFLOW_META);
  }, [nodes.length, edges.length, pushHistory, setEdges, setNodes]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isTyping = activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable;
      if (isTyping) return;

      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selectedNodes = nodes.filter((node) => node.selected);
        const selectedEdges = edges.filter((edge) => edge.selected);
        if (!selectedNodes.length && !selectedEdges.length) return;

        event.preventDefault();
        pushHistory();

        const connectedEdges = getConnectedEdges(selectedNodes, edges);
        const edgeIdsToDelete = new Set([...selectedEdges, ...connectedEdges].map((edge) => edge.id));
        const nodeIdsToDelete = new Set(selectedNodes.map((node) => node.id));

        setNodes((current) => current.filter((node) => !nodeIdsToDelete.has(node.id)));
        setEdges((current) => current.filter((edge) => !edgeIdsToDelete.has(edge.id)));
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        undo();
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [nodes, edges, pushHistory, redo, setEdges, setNodes, undo]);

  const onConnect = useCallback((params) => {
    const sourceNode = nodes.find((node) => node.id === params.source);
    const targetNode = nodes.find((node) => node.id === params.target);
    const sourceType = sourceNode?.data?.nodeType;
    const targetType = targetNode?.data?.nodeType;

    if (!isConnectionAllowed(sourceType, targetType)) {
      const message = getConnectionError(sourceType, targetType);
      setConnectionError(message);
      window.setTimeout(() => setConnectionError(''), 4000);
      return;
    }

    pushHistory();
    const edgeNumber = getNextEdgeNumber(edges);
    const id = makeEdgeId(params.source, params.target, edgeNumber);

    const newEdge = {
      id,
      source: params.source,
      target: params.target,
      type: 'editableEdge',
      markerEnd: { type: MarkerType.ArrowClosed },
      data: { label: 'sequence' },
    };

    setEdges((current) => addEdge(newEdge, current));
  }, [edges, nodes, pushHistory, setEdges]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    if (!wrapperRef.current || !reactFlowInstance) return;

    const nodeType = event.dataTransfer.getData('application/reactflow');
    const template = nodeTemplates[nodeType];
    if (!template) return;

    const bounds = wrapperRef.current.getBoundingClientRect();
    const position = reactFlowInstance.project({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });

    const id = `${nodeType}_${getNodeNumber(nodes, nodeType)}`;
    const newNode = {
      id,
      type: 'workflowNode',
      position,
      data: {
        label: template.displayName,
        nodeType,
        config: clone(template.defaultConfig),
      },
    };

    pushHistory();
    setNodes((current) => current.concat(newNode));
  }, [nodes, pushHistory, reactFlowInstance, setNodes]);

  const updateWorkflowMeta = useCallback((key, value) => {
    pushHistory();
    setWorkflowMeta((current) => ({ ...current, [key]: value }));
  }, [pushHistory]);

  const updateNodeConfig = useCallback((nodeId, path, value) => {
    pushHistory();
    setNodes((current) => current.map((node) => {
      if (node.id !== nodeId) return node;
      return {
        ...node,
        data: {
          ...node.data,
          config: setByPath(node.data.config || {}, path, value),
        },
      };
    }));
  }, [pushHistory, setNodes]);

  const validateNow = useCallback(() => {
    const result = validateWorkflowState({ workflowMeta, nodes, edges });
    if (result.errors.length || result.warnings.length) {
      console.group('Workflow Validation');
      result.errors.forEach((error) => console.error(error));
      result.warnings.forEach((warning) => console.warn(warning));
      console.groupEnd();
    }
    return result;
  }, [edges, nodes, workflowMeta]);

  const showValidation = useCallback(() => {
    const result = validateNow();
    if (!result.errors.length && !result.warnings.length) {
      window.alert('Validation passed.');
      return;
    }

    const message = [
      result.errors.length ? `Errors:\n- ${result.errors.join('\n- ')}` : '',
      result.warnings.length ? `Warnings:\n- ${result.warnings.join('\n- ')}` : '',
    ].filter(Boolean).join('\n\n');

    window.alert(message);
  }, [validateNow]);

  const highlightSimulationNode = useCallback((nodeId) => {
    setNodes((current) => current.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isSimulating: node.id === nodeId,
      },
    })));
  }, [setNodes]);

  const addLatestExampleWorkflow = useCallback(() => {
    const confirmed = nodes.length || edges.length
      ? window.confirm('This will replace the current canvas with the latest example workflow. Continue?')
      : true;
    if (!confirmed) return;

    pushHistory();

    const exampleNodes = [
      ['memory_runtime_context', 'memory', 80, 80, { use_memory: true, context_last_messages: 8, save_conversation_history: true }],
      ['schedule_weekly_call', 'schedule', 80, 240, { schedule_type: 'weekly', day_of_week: 'monday', time: '10:30', timezone: 'Asia/Karachi', total_calls: 4 }],
      ['summarizer_call_notes', 'summarizer', 80, 400, { instruction: 'Create a concise post-call summary for a banking support supervisor. Include caller intent, key questions, answers given, tools or knowledge base facts used, unresolved issues, promised follow-ups, and overall outcome. Do not include raw tool-call syntax.' }],
      ['kb_nbp_docs', 'knowledge_base', 80, 580, { description: 'Banking support documents used to ground factual answers.', files: [{ id: 'nbp_product_pdf', path: 'NBP.pdf', metadata: { title: 'NBP Product Document' } }] }],
      ['webhook_inbound_trigger', 'webhook', 80, 780, { webhook_url: 'https://example.com/webhooks/voice-workflow', active_time_window: { timezone: 'Asia/Karachi', start_time: '09:00', end_time: '18:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] }, allowed_trigger_source: 'frontend_workflow_builder', trigger_action: 'start_outbound_call', voice_agent_to_activate: 'voice_agent_support' }],
      ['whatsapp_trigger_customer_message', 'whatsapp_trigger', 80, 980, { whatsapp_number: '+923001234567', incoming_message_condition: 'Start when a customer sends a WhatsApp message containing a support request.', customer_phone_number: '{{incoming.customer_phone_number}}', message_content: '{{incoming.message_content}}' }],
      ['sms_trigger_customer_message', 'sms_trigger', 80, 1140, { sms_number: '+923001234567', incoming_message_condition: 'Start when an incoming SMS contains a banking support question.' }],
      ['slack_trigger_support_message', 'slack_trigger', 80, 1300, { workspace: 'NBP Support Workspace', channel: 'customer-escalations', trigger_keyword: 'urgent-support', sender: '{{incoming.sender}}', message_content: '{{incoming.message_content}}' }],
      ['email_trigger_support_request', 'email_trigger', 80, 1480, { email_inbox: 'support@example.com', sender_condition: 'Accept messages from customers and approved partner domains.', subject_condition: 'Subject contains support, account, card, transfer, complaint, or app.', body_condition: 'Body contains a customer-service request related to NBP banking services.' }],

      ['voice_agent_support', 'voice_agent', 560, 620, { company_name: 'National Bank of Pakistan', company_description: 'A banking organization that supports account, card, transfer, mobile app, and customer-service questions.', voice_agent_name: 'Malik', agent_gender: 'male', main_prompt: 'Help callers with NBP banking questions in the same language they use. Use clear English for English callers and simple Pakistani Roman Urdu for Urdu or mixed Urdu callers. Keep answers brief, direct, and phone-friendly. Ask one short clarification question if the caller intent is unclear, and never make up policy details.', dos: ['Reply in English when the caller speaks English.', 'Reply in simple Pakistani Roman Urdu when the caller speaks Urdu, Roman Urdu, or mixed Urdu.', 'Keep every answer concise: normally 1-3 short spoken sentences.', 'Use knowledge base facts for product, fee, card, account, transfer, app, or policy questions.', 'Ask one short clarification question if the caller intent is unclear.'], donts: ['Do not mention internal workflow nodes, vector databases, embeddings, retrieved chunks, or tool calls.', 'Do not answer outside the company support domain.', 'Do not invent fees, limits, requirements, policies, or timelines.', 'Do not give long explanations unless the caller asks for details.', 'Do not use markdown, bullet points, headings, or numbered lists in spoken replies.'], initial_greeting: 'Hello, Malik speaking from National Bank of Pakistan. How can I help you?', purpose: 'Provide concise NBP customer support over a live outbound voice call, answer banking questions accurately, and use the knowledge base for factual policy or product details.' }],
      ['tool_call_kb_lookup', 'tool_call', 980, 220, { condition: 'Use this tool when the caller asks a specific factual question about accounts, cards, transfers, app login, OTP, PIN, fees, limits, requirements, complaints, or branch services.' }],
      ['message_out_of_scope', 'message', 980, 400, { condition: 'Use when the caller asks anything unrelated to banking, NBP, accounts, cards, transfers, mobile app, OTP, PIN, fees, limits, requirements, complaints, or branch services.', message: 'This is out of my scope. I can only give you answers related to banking.' }],
      ['db_logs_call_record', 'db_logs', 980, 580, { save_fields: { call_from: true, call_to: true, call_transcription: true, call_summary: true, call_time_and_date: true, call_status: true } }],
      ['llm_custom_processing', 'llm', 980, 760, { prompt: 'Analyze the current conversation context and decide the next best action for this workflow. Keep the result concise and operational.' }],
      ['end_call_when_resolved', 'end_call', 980, 940, { condition: 'Use when the caller confirms they have no more questions, says goodbye, asks to end the call, or the workflow goal is completed.', message_before_ending: 'Thank you for contacting us. Khuda hafiz.' }],

      ['messaging_whatsapp_reply', 'messaging_app', 980, 1120, { app_type: 'whatsapp_message', recipient_number: '{{whatsapp_trigger_customer_message.customer_phone_number}}', message_text: 'Thank you for contacting National Bank of Pakistan. How can we help you today?', template_name: 'customer_support_reply', variables: { customer_name: '{{customer.name}}', company_name: 'National Bank of Pakistan' } }],
      ['messaging_sms_reply', 'messaging_app', 980, 1300, { app_type: 'sms_message', recipient_number: '{{incoming.sender_number}}', message_text: 'Thank you for contacting NBP support. Please share your question, but never send your PIN or OTP.' }],
      ['messaging_slack_update', 'messaging_app', 980, 1480, { app_type: 'slack_message', workspace: 'NBP Support Workspace', channel_or_user: 'customer-escalations', message_text: 'A customer support interaction requires review.', attach_call_summary: true }],
      ['messaging_email_reply', 'messaging_app', 980, 1660, { app_type: 'email_send', to: ['{{email_trigger_support_request.sender_email}}'], cc: [], bcc: [], subject: 'Re: {{email_trigger_support_request.subject}}', body: 'Thank you for contacting National Bank of Pakistan support. We received your request and will assist you shortly.' }],

      ['tool_call_mysql_lookup', 'tool_call', 1400, 220, { condition: 'Use this tool only when the workflow needs permitted customer or operational data stored in the connected MySQL database.' }],
      ['mysql_customer_database', 'database_connection', 1780, 220, { database_type: 'mysql_connection', connection_string: '${SECRET:MYSQL_CONNECTION_STRING}', connection_timeout_seconds: 30, ssl_enabled: true, read_only: true }],
      ['tool_call_postgresql_lookup', 'tool_call', 1400, 420, { condition: 'Use this tool only when the workflow needs permitted customer or operational data stored in the connected PostgreSQL database.' }],
      ['postgresql_customer_database', 'database_connection', 1780, 420, { database_type: 'postgresql_connection', connection_string: '${SECRET:POSTGRESQL_CONNECTION_STRING}', connection_timeout_seconds: 30, ssl_enabled: true, read_only: true }],
      ['tool_call_microsoft_sql_lookup', 'tool_call', 1400, 620, { condition: 'Use this tool only when the workflow needs permitted customer or operational data stored in the connected Microsoft SQL Server database.' }],
      ['microsoft_sql_customer_database', 'database_connection', 1780, 620, { database_type: 'microsoft_sql_connection', connection_string: '${SECRET:MICROSOFT_SQL_CONNECTION_STRING}', connection_timeout_seconds: 30, encrypt_connection: true, trust_server_certificate: false, read_only: true }],
    ].map(([id, nodeType, x, y, config]) => ({
      id,
      type: 'workflowNode',
      position: { x, y },
      data: {
        label: nodeTemplates[nodeType]?.displayName || nodeType,
        nodeType,
        config,
      },
    }));

    const exampleEdges = [
      ['memory_runtime_context', 'voice_agent_support'],
      ['schedule_weekly_call', 'voice_agent_support'],
      ['summarizer_call_notes', 'voice_agent_support'],
      ['kb_nbp_docs', 'voice_agent_support'],
      ['voice_agent_support', 'tool_call_kb_lookup'],
      ['tool_call_kb_lookup', 'kb_nbp_docs'],
      ['voice_agent_support', 'message_out_of_scope'],
      ['webhook_inbound_trigger', 'voice_agent_support'],
      ['voice_agent_support', 'db_logs_call_record'],
      ['voice_agent_support', 'llm_custom_processing'],
      ['llm_custom_processing', 'tool_call_kb_lookup'],
      ['tool_call_kb_lookup', 'end_call_when_resolved'],
      ['whatsapp_trigger_customer_message', 'voice_agent_support'],
      ['voice_agent_support', 'messaging_whatsapp_reply'],
      ['sms_trigger_customer_message', 'voice_agent_support'],
      ['voice_agent_support', 'messaging_sms_reply'],
      ['slack_trigger_support_message', 'voice_agent_support'],
      ['voice_agent_support', 'messaging_slack_update'],
      ['email_trigger_support_request', 'voice_agent_support'],
      ['voice_agent_support', 'messaging_email_reply'],
      ['voice_agent_support', 'tool_call_mysql_lookup'],
      ['tool_call_mysql_lookup', 'mysql_customer_database'],
      ['voice_agent_support', 'tool_call_postgresql_lookup'],
      ['tool_call_postgresql_lookup', 'postgresql_customer_database'],
      ['voice_agent_support', 'tool_call_microsoft_sql_lookup'],
      ['tool_call_microsoft_sql_lookup', 'microsoft_sql_customer_database'],
    ].map(([source, target], index) => ({
      id: makeEdgeId(source, target, index + 1),
      source,
      target,
      type: 'editableEdge',
      markerEnd: { type: MarkerType.ArrowClosed },
      data: {},
    }));

    setWorkflowMeta({
      schema_version: '0.1',
      workflow_id: 'dummy_complete_voice_workflow',
      name: 'Complete Dummy Voice Workflow With Messaging Nodes',
      phone_number: '03330330703',
    });
    setNodes(exampleNodes);
    setEdges(exampleEdges);
    window.setTimeout(() => reactFlowInstance?.fitView({ padding: 0.2, duration: 500 }), 100);
  }, [edges.length, nodes.length, pushHistory, reactFlowInstance, setEdges, setNodes]);

  const onResizeRightPanelStart = (event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = rightPanelWidth;

    const onMove = (moveEvent) => {
      const delta = startX - moveEvent.clientX;
      const nextWidth = Math.min(620, Math.max(320, startWidth + delta));
      setRightPanelWidth(nextWidth);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 text-gray-900 overflow-hidden">
      <header className="h-14 shrink-0 border-b border-slate-200 bg-white flex items-center px-3 gap-1">
        <div className="flex items-center gap-2 pr-3 mr-2 border-r border-slate-200 min-w-[210px]">
          <div className="h-7 w-7 rounded-md bg-blue-600 text-white flex items-center justify-center font-black text-xs">
            AI
          </div>
          <div className="min-w-0">
            <h1 className="text-[12.5px] font-bold leading-tight text-slate-900 truncate">Call Center Workflow Builder</h1>
            <p className="text-[10px] text-slate-400 truncate">Visual configuration builder</p>
          </div>
        </div>

        <ToolbarGroup>
          <ToolbarButton icon="↶" label="Undo" onClick={undo} title="Undo" />
          <ToolbarButton icon="↷" label="Redo" onClick={redo} title="Redo" />
          <ToolbarButton icon="⌫" label="Clear" onClick={clearWorkflow} title="Clear canvas" />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton icon="▦" label="Example" onClick={addLatestExampleWorkflow} title="Load example workflow" />
          <ToolbarButton icon="☑" label="Validate" onClick={showValidation} title="Validate workflow" />
        </ToolbarGroup>

        <div className="flex-1" />

        <ToolbarButton icon="▶" label="Simulate" onClick={() => setSimulationOpen(true)} title="Play simulation" primary />
      </header>

      <div className="flex-1 flex min-h-0">
        <Sidebar />

        <main className="flex-1 min-w-0 flex flex-col relative">
          {connectionError && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-red-600 text-white px-4 py-2 rounded-xl shadow-lg text-sm">
              {connectionError}
            </div>
          )}

          <div ref={wrapperRef} className="flex-1 min-h-0">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              fitView
              deleteKeyCode={null}
              multiSelectionKeyCode="Shift"
            >
              <Background gap={20} size={1} />
              <Controls />
              <MiniMap pannable zoomable />
            </ReactFlow>
          </div>

          <WorkflowActions
            workflowJson={workflowJson}
            onValidate={validateNow}
            saveEndpoint={saveEndpoint}
          />

          <SimulationPanel
            isOpen={simulationOpen}
            onClose={() => {
              setSimulationOpen(false);
              highlightSimulationNode(null);
            }}
            nodes={nodes}
            edges={edges}
            onHighlight={highlightSimulationNode}
          />
        </main>

        <div
          onMouseDown={onResizeRightPanelStart}
          className="w-1.5 cursor-col-resize bg-gray-200 hover:bg-blue-400 transition-colors"
          title="Drag to resize configuration panel"
        />

        <ConfigSidebar
          width={rightPanelWidth}
          workflowMeta={workflowMeta}
          onWorkflowMetaChange={updateWorkflowMeta}
          selectedNode={selectedNode}
          onNodeConfigChange={updateNodeConfig}
        />
      </div>
    </div>
  );
}