import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  addEdge, Background, Controls, MiniMap, MarkerType, getConnectedEdges, useEdgesState, useNodesState,
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
import { DB_CONNECTION_NODE_TYPES, TRIGGER_NODE_TYPES, getConnectionError, isConnectionAllowed } from './utils/connectionRules';

const nodeTypes = { workflowNode: EditableNode };
const edgeTypes = { editableEdge: EditableEdge };

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}
function makeEdgeId(source, target, index) { return `edge_${index}_${source}_${target}`; }
function getNodeNumber(nodes, type) { return nodes.filter((n) => n.data?.nodeType === type).length + 1; }
function getNextEdgeNumber(edges) { return edges.length + 1; }

const LATEST_EXAMPLE_WORKFLOW = {
  "schema_version": "0.5",
  "workflow_id": "new_end_agent_workflow",
  "name": "New End-Agent Workflow",
  "company_name": "",
  "company_description": "",
  "nodes": [
    {
      "id": "call_trigger_1",
      "type": "call_trigger",
      "config": {
        "from": "",
        "to": "",
        "purpose": ""
      }
    },
    {
      "id": "voice_agent_start_1",
      "type": "voice_agent_start",
      "config": {
        "voice_agent_name": "",
        "agent_gender": "",
        "voice_id": "",
        "language": "en-PK",
        "speaking_speed": 1
      }
    },
    {
      "id": "initial_message_1",
      "type": "initial_message",
      "config": {
        "message": ""
      }
    },
    {
      "id": "memory_1",
      "type": "memory",
      "config": {
        "use_memory": true,
        "context_last_messages": 8,
        "save_conversation_history": true
      }
    },
    {
      "id": "agent_1",
      "type": "agent",
      "config": {
        "prompt": "",
        "purpose": "",
        "dos": [],
        "donts": []
      }
    },
    {
      "id": "tool_call_1",
      "type": "tool_call",
      "config": {
        "condition": ""
      }
    },
    {
      "id": "db_query_1",
      "type": "db_query",
      "config": {
        "operation": "verify",
        "query": "",
        "parameters": {}
      }
    },
    {
      "id": "postgresql_connection_1",
      "type": "postgresql_connection",
      "config": {
        "connection_string": "${SECRET:POSTGRESQL_CONNECTION_STRING}",
        "connection_timeout_seconds": 30,
        "ssl_enabled": true,
        "read_only": true
      }
    },
    {
      "id": "if_condition_1",
      "type": "if_condition",
      "config": {
        "left_value": "{{db_query_1.account_status}}",
        "operator": "equals",
        "right_value": "active"
      }
    },
    {
      "id": "message_1",
      "type": "message",
      "config": {
        "condition": "",
        "message": ""
      }
    },
    {
      "id": "last_message_1",
      "type": "last_message",
      "config": {
        "message": ""
      }
    },
    {
      "id": "end_call_1",
      "type": "end_call",
      "config": {
        "condition": ""
      }
    },
    {
      "id": "transcription_1",
      "type": "transcription",
      "config": {
        "instruction": ""
      }
    },
    {
      "id": "summarizer_1",
      "type": "summarizer",
      "config": {
        "instruction": ""
      }
    },
    {
      "id": "db_logs_1",
      "type": "db_logs",
      "config": {
        "save_fields": {
          "call_from": true,
          "call_to": true,
          "call_transcription": true,
          "call_summary": true,
          "call_time_and_date": true,
          "call_status": true
        }
      }
    }
  ],
  "connections": [
    {
      "id": "edge_1_call_trigger_1_voice_agent_start_1",
      "from_node_id": "call_trigger_1",
      "to_node_id": "voice_agent_start_1"
    },
    {
      "id": "edge_2_voice_agent_start_1_initial_message_1",
      "from_node_id": "voice_agent_start_1",
      "to_node_id": "initial_message_1"
    },
    {
      "id": "edge_3_initial_message_1_memory_1",
      "from_node_id": "initial_message_1",
      "to_node_id": "memory_1"
    },
    {
      "id": "edge_4_memory_1_agent_1",
      "from_node_id": "memory_1",
      "to_node_id": "agent_1"
    },
    {
      "id": "edge_5_agent_1_tool_call_1",
      "from_node_id": "agent_1",
      "to_node_id": "tool_call_1"
    },
    {
      "id": "edge_6_agent_1_message_1",
      "from_node_id": "agent_1",
      "to_node_id": "message_1"
    },
    {
      "id": "edge_7_tool_call_1_db_query_1",
      "from_node_id": "tool_call_1",
      "to_node_id": "db_query_1"
    },
    {
      "id": "edge_8_db_query_1_postgresql_connection_1",
      "from_node_id": "db_query_1",
      "to_node_id": "postgresql_connection_1"
    },
    {
      "id": "edge_9_db_query_1_if_condition_1",
      "from_node_id": "db_query_1",
      "to_node_id": "if_condition_1"
    },
    {
      "id": "edge_10_if_condition_1_message_1_true",
      "from_node_id": "if_condition_1",
      "to_node_id": "message_1",
      "branch": "true"
    },
    {
      "id": "edge_11_if_condition_1_last_message_1_false",
      "from_node_id": "if_condition_1",
      "to_node_id": "last_message_1",
      "branch": "false"
    },
    {
      "id": "edge_12_message_1_last_message_1",
      "from_node_id": "message_1",
      "to_node_id": "last_message_1"
    },
    {
      "id": "edge_13_last_message_1_end_call_1",
      "from_node_id": "last_message_1",
      "to_node_id": "end_call_1"
    },
    {
      "id": "edge_14_end_call_1_transcription_1",
      "from_node_id": "end_call_1",
      "to_node_id": "transcription_1"
    },
    {
      "id": "edge_15_transcription_1_summarizer_1",
      "from_node_id": "transcription_1",
      "to_node_id": "summarizer_1"
    },
    {
      "id": "edge_16_summarizer_1_db_logs_1",
      "from_node_id": "summarizer_1",
      "to_node_id": "db_logs_1"
    }
  ],
  "phone_number": ""
};

function getExampleNodePosition(node, index) {
  const positionMap = {
    call_trigger_inbound: { x: 80, y: 80 },
    voice_agent_start_main: { x: 380, y: 80 },
    initial_message_main: { x: 680, y: 80 },
    memory_runtime_context: { x: 980, y: 80 },
    capture_customer_identity: { x: 1280, y: 80 },
    verify_customer_query: { x: 1580, y: 80 },
    postgres_customer_database: { x: 1880, y: 80 },

    agent_general_support: { x: 1280, y: 320 },
    tool_call_policy_lookup: { x: 980, y: 520 },
    kb_nbp_docs: { x: 680, y: 520 },
    tool_call_crm_search: { x: 1280, y: 520 },
    crm_customer_search: { x: 1580, y: 520 },
    fallback_general_support: { x: 1880, y: 520 },
    end_agent_general_support: { x: 1280, y: 760 },

    llm_prepare_handoff: { x: 380, y: 1020 },
    handoff_db_query: { x: 680, y: 1020 },
    crm_update_handoff: { x: 980, y: 1020 },
    create_support_ticket: { x: 1280, y: 1020 },
    external_api_case_enrichment: { x: 1580, y: 1020 },
    routing_complaints: { x: 1880, y: 1020 },
    handoff_message: { x: 680, y: 1230 },
    handoff_whatsapp_message: { x: 980, y: 1230 },
    handoff_if_condition: { x: 1280, y: 1230 },
    llm_finalize_handoff: { x: 1580, y: 1230 },

    agent_complaint_specialist: { x: 1280, y: 1500 },
    tool_call_ticket_update: { x: 980, y: 1710 },
    update_support_ticket: { x: 1280, y: 1710 },
    end_agent_complaint: { x: 1580, y: 1710 },

    last_message_goodbye: { x: 1280, y: 1950 },
    end_call_complete: { x: 1280, y: 2160 },
    transcription_complete_call: { x: 1280, y: 2370 },
    summarizer_call_notes: { x: 1280, y: 2580 },
    llm_post_call_classification: { x: 1280, y: 2790 },
    db_logs_call_record: { x: 1280, y: 3000 },
    slack_post_call_message: { x: 1280, y: 3210 },
  };

  if (positionMap[node.id]) return positionMap[node.id];

  return {
    x: 80 + (index % 4) * 300,
    y: 80 + Math.floor(index / 4) * 220,
  };
}

function validateWorkflowState({ workflowMeta, nodes, edges }) {
  const errors = [];
  const warnings = [];

  if (!workflowMeta.workflow_id?.trim()) errors.push('Workflow ID is required.');
  if (!workflowMeta.name?.trim()) errors.push('Workflow name is required.');
  if (!workflowMeta.company_name?.trim()) errors.push('Company name is required.');
  if (!workflowMeta.company_description?.trim()) errors.push('Company description is required.');
  if (!workflowMeta.phone_number?.trim()) warnings.push('Phone number is empty.');

  nodes.forEach((node) => {
    const template = nodeTemplates[node.data?.nodeType];
    if (!template) { errors.push(`${node.id}: unknown node type.`); return; }
    getNodeFields(node.data?.nodeType, node.data?.config || {}).forEach((field) => {
      if (!field.required) return;
      if (isEmptyValue(getByPath(node.data?.config || {}, field.key))) errors.push(`${node.id}: ${field.label} is required.`);
    });
  });

  edges.forEach((edge) => {
    const source = nodes.find((n) => n.id === edge.source);
    const target = nodes.find((n) => n.id === edge.target);
    if (!source || !target) { errors.push(`${edge.id}: source or target node missing.`); return; }
    if (!isConnectionAllowed(source.data?.nodeType, target.data?.nodeType)) {
      errors.push(`${edge.id}: ${getConnectionError(source.data?.nodeType, target.data?.nodeType)}`);
    }
  });

  const voiceAgentStartCount = nodes.filter((n) => n.data?.nodeType === 'voice_agent_start').length;
  if (voiceAgentStartCount === 0) errors.push('One voice_agent_start node is required.');
  if (voiceAgentStartCount > 1) errors.push('Only one voice_agent_start node is allowed in a live-call workflow.');

  if (!nodes.some((n) => TRIGGER_NODE_TYPES.includes(n.data?.nodeType))) warnings.push('No trigger node found.');
  if (!nodes.some((n) => n.data?.nodeType === 'agent')) errors.push('At least one agent node is required.');
  if (!nodes.some((n) => n.data?.nodeType === 'end_call')) warnings.push('No end_call node found.');
  if (edges.length === 0) warnings.push('No connections found.');

  nodes.filter((n) => n.data?.nodeType === 'db_query').forEach((node) => {
    const dbTargets = edges
      .filter((edge) => edge.source === node.id)
      .map((edge) => nodes.find((item) => item.id === edge.target))
      .filter((target) => DB_CONNECTION_NODE_TYPES.includes(target?.data?.nodeType));

    if (dbTargets.length !== 1) {
      errors.push(`${node.id}: db_query must connect to exactly one database connection node.`);
    }
  });

  nodes.filter((n) => n.data?.nodeType === 'if_condition').forEach((node) => {
    const outgoing = edges.filter((edge) => edge.source === node.id);
    const branches = outgoing.map((edge) => edge.data?.branch || edge.sourceHandle).filter(Boolean);

    outgoing.forEach((edge) => {
      const branch = edge.data?.branch || edge.sourceHandle;
      if (!['true', 'false'].includes(branch)) {
        errors.push(`${edge.id}: if_condition outgoing connection must use TRUE or FALSE branch handle.`);
      }
    });

    if (branches.filter((branch) => branch === 'true').length > 1) {
      errors.push(`${node.id}: if_condition can only have one TRUE branch.`);
    }

    if (branches.filter((branch) => branch === 'false').length > 1) {
      errors.push(`${node.id}: if_condition can only have one FALSE branch.`);
    }

    if (outgoing.length > 0 && !branches.includes('true')) {
      warnings.push(`${node.id}: if_condition has no TRUE branch.`);
    }

    if (outgoing.length > 0 && !branches.includes('false')) {
      warnings.push(`${node.id}: if_condition has no FALSE branch.`);
    }
  });

  return { errors, warnings };
}

// Reusable Topbar Action Button Component to match the Miro style
const TopbarButton = ({ icon, label, onClick, className = '' }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center min-w-[56px] px-2 py-1 rounded hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900 ${className}`}
  >
    <span className="text-lg leading-none mb-1">{icon}</span>
    <span className="text-[10px] font-semibold">{label}</span>
  </button>
);

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
  const selectedNode = useMemo(() => nodes.find((n) => n.selected) || null, [nodes]);
  const workflowJson = useMemo(() => compileWorkflow({ workflowMeta, nodes, edges }), [workflowMeta, nodes, edges]);

  const pushHistory = useCallback(() => {
    historyRef.current.push({ nodes: clone(nodes), edges: clone(edges), workflowMeta: clone(workflowMeta) });
    redoRef.current = [];
  }, [nodes, edges, workflowMeta]);

  const undo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    redoRef.current.push({ nodes: clone(nodes), edges: clone(edges), workflowMeta: clone(workflowMeta) });
    setNodes(prev.nodes); setEdges(prev.edges); setWorkflowMeta(prev.workflowMeta);
  }, [nodes, edges, workflowMeta, setNodes, setEdges]);

  const redo = useCallback(() => {
    const next = redoRef.current.pop();
    if (!next) return;
    historyRef.current.push({ nodes: clone(nodes), edges: clone(edges), workflowMeta: clone(workflowMeta) });
    setNodes(next.nodes); setEdges(next.edges); setWorkflowMeta(next.workflowMeta);
  }, [nodes, edges, workflowMeta, setNodes, setEdges]);

  const clearWorkflow = useCallback(() => {
    if (!nodes.length && !edges.length) return;
    if (!window.confirm('This will clear the current canvas. Continue?')) return;
    pushHistory(); setNodes([]); setEdges([]); setWorkflowMeta(DEFAULT_WORKFLOW_META);
  }, [nodes.length, edges.length, pushHistory, setEdges, setNodes]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable) return;

      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selectedNodes = nodes.filter((n) => n.selected);
        const selectedEdges = edges.filter((e) => e.selected);
        if (!selectedNodes.length && !selectedEdges.length) return;
        event.preventDefault(); pushHistory();
        const connectedEdges = getConnectedEdges(selectedNodes, edges);
        const edgeIdsToDelete = new Set([...selectedEdges, ...connectedEdges].map((e) => e.id));
        const nodeIdsToDelete = new Set(selectedNodes.map((n) => n.id));
        setNodes((cur) => cur.filter((n) => !nodeIdsToDelete.has(n.id)));
        setEdges((cur) => cur.filter((e) => !edgeIdsToDelete.has(e.id)));
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); undo(); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [nodes, edges, pushHistory, redo, setEdges, setNodes, undo]);

  const onConnect = useCallback((params) => {
    const sourceNode = nodes.find((n) => n.id === params.source);
    const targetNode = nodes.find((n) => n.id === params.target);
    const sourceType = sourceNode?.data?.nodeType;
    const targetType = targetNode?.data?.nodeType;

    if (!isConnectionAllowed(sourceType, targetType)) {
      setConnectionError(getConnectionError(sourceType, targetType));
      window.setTimeout(() => setConnectionError(''), 4000);
      return;
    }

    const branch = sourceType === 'if_condition' ? params.sourceHandle : null;
    if (sourceType === 'if_condition' && !['true', 'false'].includes(branch)) {
      setConnectionError('If Condition connections must start from either the TRUE or FALSE handle.');
      window.setTimeout(() => setConnectionError(''), 4000);
      return;
    }

    if (sourceType === 'if_condition') {
      const duplicateBranch = edges.some((edge) => (
        edge.source === params.source
        && ((edge.data?.branch || edge.sourceHandle) === branch)
      ));

      if (duplicateBranch) {
        setConnectionError(`If Condition already has a ${branch.toUpperCase()} branch connection.`);
        window.setTimeout(() => setConnectionError(''), 4000);
        return;
      }
    }

    pushHistory();
    const newEdge = {
      id: makeEdgeId(params.source, params.target, getNextEdgeNumber(edges)),
      source: params.source,
      sourceHandle: params.sourceHandle || undefined,
      target: params.target,
      targetHandle: params.targetHandle || undefined,
      type: 'editableEdge',
      markerEnd: { type: MarkerType.ArrowClosed },
      data: branch ? { label: branch, branch } : { label: 'sequence' },
    };
    setEdges((cur) => addEdge(newEdge, cur));
  }, [edges, nodes, pushHistory, setEdges]);

  const onDragOver = useCallback((event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    if (!wrapperRef.current || !reactFlowInstance) return;
    const nodeType = event.dataTransfer.getData('application/reactflow');
    const template = nodeTemplates[nodeType];
    if (!template) return;
    const bounds = wrapperRef.current.getBoundingClientRect();
    const position = reactFlowInstance.project({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
    const newNode = {
      id: `${nodeType}_${getNodeNumber(nodes, nodeType)}`, type: 'workflowNode', position,
      data: { label: template.displayName, nodeType, config: clone(template.defaultConfig) },
    };
    pushHistory(); setNodes((cur) => cur.concat(newNode));
  }, [nodes, pushHistory, reactFlowInstance, setNodes]);

  const updateWorkflowMeta = useCallback((key, value) => { pushHistory(); setWorkflowMeta((cur) => ({ ...cur, [key]: value })); }, [pushHistory]);
  
  const updateNodeConfig = useCallback((nodeId, path, value) => {
    pushHistory();
    setNodes((cur) => cur.map((n) => n.id !== nodeId ? n : { ...n, data: { ...n.data, config: setByPath(n.data.config || {}, path, value) } }));
  }, [pushHistory, setNodes]);

  const validateNow = useCallback(() => {
    const result = validateWorkflowState({ workflowMeta, nodes, edges });
    if (result.errors.length || result.warnings.length) {
      console.group('Workflow Validation');
      result.errors.forEach((e) => console.error(e)); result.warnings.forEach((w) => console.warn(w));
      console.groupEnd();
    }
    return result;
  }, [edges, nodes, workflowMeta]);

  const showValidation = useCallback(() => {
    const result = validateNow();
    if (!result.errors.length && !result.warnings.length) return window.alert('Validation passed.');
    const msg = [result.errors.length ? `Errors:\n- ${result.errors.join('\n- ')}` : '', result.warnings.length ? `Warnings:\n- ${result.warnings.join('\n- ')}` : ''].filter(Boolean).join('\n\n');
    window.alert(msg);
  }, [validateNow]);

  const highlightSimulationNode = useCallback((nodeId) => {
    setNodes((cur) => cur.map((n) => ({ ...n, data: { ...n.data, isSimulating: n.id === nodeId } })));
  }, [setNodes]);

  const addLatestExampleWorkflow = useCallback(() => {
    const confirmed = nodes.length || edges.length
      ? window.confirm('This will replace the current canvas with the latest example workflow. Continue?')
      : true;
    if (!confirmed) return;

    pushHistory();

    const exampleNodes = LATEST_EXAMPLE_WORKFLOW.nodes.map((item, index) => {
      const template = nodeTemplates[item.type];
      return {
        id: item.id,
        type: 'workflowNode',
        position: getExampleNodePosition(item, index),
        data: {
          label: template?.displayName || item.type,
          nodeType: item.type,
          config: clone(item.config || {}),
        },
      };
    });

    const exampleEdges = LATEST_EXAMPLE_WORKFLOW.connections.map((connection) => ({
      id: connection.id,
      source: connection.from_node_id,
      sourceHandle: connection.branch || undefined,
      target: connection.to_node_id,
      type: 'editableEdge',
      markerEnd: { type: MarkerType.ArrowClosed },
      data: connection.branch ? { label: connection.branch, branch: connection.branch } : { label: 'sequence' },
    }));

    setWorkflowMeta({
      schema_version: LATEST_EXAMPLE_WORKFLOW.schema_version || '0.5',
      workflow_id: LATEST_EXAMPLE_WORKFLOW.workflow_id || '',
      name: LATEST_EXAMPLE_WORKFLOW.name || '',
      company_name: LATEST_EXAMPLE_WORKFLOW.company_name || '',
      company_description: LATEST_EXAMPLE_WORKFLOW.company_description || '',
      phone_number: LATEST_EXAMPLE_WORKFLOW.phone_number || '',
    });
    setNodes(exampleNodes);
    setEdges(exampleEdges);
    window.setTimeout(() => reactFlowInstance?.fitView({ padding: 0.2, duration: 500 }), 100);
  }, [edges.length, nodes.length, pushHistory, reactFlowInstance, setEdges, setNodes]);


  const onResizeRightPanelStart = (event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = rightPanelWidth;
    const onMove = (moveEvent) => setRightPanelWidth(Math.min(620, Math.max(320, startWidth + (startX - moveEvent.clientX))));
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden font-sans">
      
      {/* 
        TOPBAR: Clean white header matching the provided image style 
        with icon-above-text buttons in the center 
      */}
      <header className="h-[60px] shrink-0 border-b border-slate-200 bg-white flex items-center justify-between px-4">
        
        {/* Left: Project Context */}
        <div className="flex items-center gap-3 w-1/4">
          <div className="text-slate-400">🔒</div>
          <div>
            <h1 className="text-sm font-bold leading-tight text-slate-800">AI Call Center</h1>
            <p className="text-[11px] text-slate-500">Workflow configuration</p>
          </div>
        </div>

        {/* Center: Main Editor Tools (Icon above text) */}
        <div className="flex items-center gap-1 flex-1 justify-center border-x border-slate-100 px-4">
          <TopbarButton icon="↶" label="Undo" onClick={undo} />
          <TopbarButton icon="↷" label="Redo" onClick={redo} />
          <TopbarButton icon="⌫" label="Clear" onClick={clearWorkflow} />
          <div className="h-8 w-px bg-slate-200 mx-2" />
          <TopbarButton icon="▦" label="Example" onClick={addLatestExampleWorkflow} />
          <TopbarButton icon="☑" label="Validate" onClick={showValidation} />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 justify-end w-1/4">
          <TopbarButton icon="▶" label="Simulate" onClick={() => setSimulationOpen(true)} className="text-blue-600 hover:bg-blue-50" />
        </div>

      </header>

      <div className="flex-1 flex min-h-0">
        <Sidebar />

        <main className="flex-1 min-w-0 flex flex-col relative bg-white">
          {connectionError && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-red-600 text-white px-4 py-2 rounded shadow-lg text-sm">
              {connectionError}
            </div>
          )}

          <div ref={wrapperRef} className="flex-1 min-h-0">
            <ReactFlow
              nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
              onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
              onInit={setReactFlowInstance} onDrop={onDrop} onDragOver={onDragOver}
              fitView deleteKeyCode={null} multiSelectionKeyCode="Shift"
            >
              <Background gap={20} size={1} color="#e2e8f0" />
              <Controls className="bg-white border-slate-200 shadow-sm" />
              <MiniMap pannable zoomable className="border-slate-200 shadow-sm" />
            </ReactFlow>
          </div>

          <WorkflowActions workflowJson={workflowJson} onValidate={validateNow} saveEndpoint={saveEndpoint} />

          <SimulationPanel
            isOpen={simulationOpen} onClose={() => { setSimulationOpen(false); highlightSimulationNode(null); }}
            nodes={nodes} edges={edges} onHighlight={highlightSimulationNode}
          />
        </main>

        <div
          onMouseDown={onResizeRightPanelStart}
          className="w-1 cursor-col-resize bg-slate-200 hover:bg-blue-400 transition-colors"
        />

        <ConfigSidebar
          width={rightPanelWidth} workflowMeta={workflowMeta} onWorkflowMetaChange={updateWorkflowMeta}
          selectedNode={selectedNode} onNodeConfigChange={updateNodeConfig}
        />
      </div>
    </div>
  );
}