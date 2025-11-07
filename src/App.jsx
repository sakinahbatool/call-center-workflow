import axios from "axios";
import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import Sidebar from './Components/Sidebar';
import EditableNode from './Components/EditableNode';
import EditableEdge from './Components/EditableEdge';
import LoadingSpinner from './Components/LoadingSpinner';

const nodeTypes = { editableNode: EditableNode };
const edgeTypes = { editableEdge: EditableEdge };
let nodeCounter = 1;
let edgeCounter = 1;

const getSimpleNodeId = (type) => `${type}_${nodeCounter++}`;
const getSimpleEdgeId = (source, target) => `edge_${edgeCounter++}_${source}_${target}`;



export default function App() {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [exportJson, setExportJson] = useState(null);
  const [generatedCode, setGeneratedCode] = useState("");
  const [view, setView] = useState('json');
  const [isLoading, setIsLoading] = useState(false);



  // simple history stacks for undo/redo
  const historyRef = useRef([]);
  const redoRef = useRef([]);

  const pushHistory = useCallback(() => {
    // push a shallow clone snapshot
    historyRef.current.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });
    // clear redo on new action
    redoRef.current = [];
  }, [nodes, edges]);

  // inside useEffect in App.jsx
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isTyping = activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable;

      // ⛔ skip shortcuts while typing
      if (isTyping) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        setNodes((nds) => nds.filter((n) => !n.selected));
        setEdges((eds) => eds.filter((e) => !e.selected));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        setRedoStack((rs) => [{ nodes, edges }, ...rs]);
        setHistory((h) => {
          if (h.length === 0) return h;
          const prev = h[h.length - 1];
          setNodes(prev.nodes);
          setEdges(prev.edges);
          return h.slice(0, -1);
        });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        setRedoStack((rs) => {
          if (rs.length === 0) return rs;
          const [next, ...rest] = rs;
          setNodes(next.nodes);
          setEdges(next.edges);
          setHistory((h) => [...h, next]);
          return rest;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, edges]);


  const createNodeOnChange = useCallback((nodeId) => (value) => {
    pushHistory();
    setNodes((ns) => ns.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, label: value } } : n)));
  }, [setNodes, pushHistory]);

  const createEdgeOnChange = useCallback((edgeId) => (value) => {
    pushHistory();
    setEdges((es) => es.map((e) => (e.id === edgeId ? { ...e, data: { ...e.data, label: value } } : e)));
  }, [setEdges, pushHistory]);

  const onConnect = useCallback((params) => {
    pushHistory();
    const id = getSimpleEdgeId(params.source, params.target);
    const newEdge = {
      id,
      source: params.source,
      target: params.target,
      type: 'editableEdge',
      data: { label: '', onChange: createEdgeOnChange(id) }, // blank label initially
      animated: false,
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges, createEdgeOnChange, pushHistory]);


  const onInit = useCallback((instance) => {
    setReactFlowInstance(instance);
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    if (!reactFlowWrapper.current || !reactFlowInstance) return;

    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;

    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });

    const id = getSimpleNodeId(type);
    const newNode = {
      id,
      type: 'editableNode',
      position,
      data: { label: type, onChange: createNodeOnChange(id), nodeType: type },
    };

    pushHistory();
    setNodes((nds) => nds.concat(newNode));
  }, [reactFlowInstance, createNodeOnChange, setNodes, pushHistory]);


  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // const handleExport = useCallback(() => {
  //   const simplifiedNodes = nodes.map(node => ({
  //     id: node.id,
  //     label: node.data?.label,
  //     type: node.data?.nodeType,
  //   }));

  //   const simplifiedEdges = edges.map(edge => {
  //     const sourceNode = nodes.find(n => n.id === edge.source);
  //     const targetNode = nodes.find(n => n.id === edge.target);
  //     return {
  //       id: edge.id,
  //       from: sourceNode?.data?.label || edge.source,
  //       to: targetNode?.data?.label || edge.target,
  //       label: edge.data?.label || '',
  //     };
  //   });

  //   const flowConnections = simplifiedEdges.map(e => `${e.from} → ${e.to}`);

  //   const payload = {
  //     nodes: simplifiedNodes,
  //     edges: simplifiedEdges,
  //     flow: flowConnections,
  //   };

  //   setExportJson(payload);
  //   console.log('Exported Flow JSON:', payload);
  // }, [nodes, edges]);

  // app.jsx

// REMOVE this from handleExport
// const handleExport = useCallback(() => { ... });

// REPLACE it with this simple function:
const getFlowPayload = () => {
  const simplifiedNodes = nodes.map(node => ({
    id: node.id,
    label: node.data?.label,
    type: node.data?.nodeType,
  }));

  const simplifiedEdges = edges.map(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    return {
      id: edge.id,
      from: sourceNode?.data?.label || edge.source,
      to: targetNode?.data?.label || edge.target,
      label: edge.data?.label || '',
    };
  });

  const flowConnections = simplifiedEdges.map(e => `${e.from} → ${e.to}`);

  const payload = {
    nodes: simplifiedNodes,
    edges: simplifiedEdges,
    flow: flowConnections,
  };

  return payload; // <-- Return the data
};

// This function is now only for the "Display JSON" button
const displayJson = useCallback(() => {
    const payload = getFlowPayload();
    setExportJson(payload);
    console.log('Exported Flow JSON:', payload);
}, [nodes, edges]); // Keep this for your button


  // app.jsx

const generateTypescriptFromFlow = useCallback(async () => {
    // 1️⃣ Get the *current* flow data directly
    const flowPayload = getFlowPayload();
    // 2️⃣ (Optional but good) Update the JSON view
    setExportJson(flowPayload);
    // Check for empty data before starting the request
    if (flowPayload.nodes.length === 0) {
        alert("Flowchart is empty.");
        return;
    }

    setIsLoading(true); // 🚨 START LOADER
  try {
    // 3️⃣ Send the *fresh* data to the backend
    const response = await fetch("http://localhost:5000/api/ts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flowData: flowPayload }), // <-- Send fresh payload
    });

    // ... rest of your function
    const data = await response.json();
    if (!response.ok) {
        // Handle server errors better
        throw new Error(data.error || "Failed to generate code");
    }
    
    setGeneratedCode(data.ts);
  } catch (err) {
    console.error(err);
    alert(`Error: ${err.message}`);
  }finally {
        setIsLoading(false); // 🛑 STOP LOADER, regardless of success or failure
    }
}, [nodes, edges]); // <-- Change dependency to [nodes, edges]


  const handleDownload = useCallback(() => {
    if (!generatedCode) return;

    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'flowchart.ts';
    link.click();
    URL.revokeObjectURL(url);
  }, [generatedCode]);




  return (
    <div className="h-screen flex">
      <Sidebar />
      <div className="flex-1 p-4">
        <div className="h-full border rounded-lg overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-3 border-b">
            <h2 className="text-lg font-semibold">Flowchart Editor</h2>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={displayJson}
              >
                Display JSON
              </button>

              <button
                className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                onClick={handleDownload}
              >
                Download TS
              </button>

              <button
                className="px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-700"
                onClick={generateTypescriptFromFlow}
              >
                Generate TypeScript
              </button>
            </div>

          </div>

          <div className="flex-1 relative flex">
            {isLoading && <LoadingSpinner />}
            <div ref={reactFlowWrapper} className="flex-1">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onInit={onInit}
                onNodesChange={(changes) => { pushHistory(); setNodes((nds) => applyNodeChanges(changes, nds)); }}
                onEdgesChange={(changes) => { pushHistory(); setEdges((eds) => applyEdgeChanges(changes, eds)); }}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                onDrop={onDrop}
                onDragOver={onDragOver}
                multiSelectionKeyCode="Shift"
                selectionOnDrag
                className="w-full h-[calc(100vh-140px)]"
              >
                <Background />
                <Controls />
                <MiniMap />
              </ReactFlow>
            </div>
            <div className="w-80 border-l bg-slate-50 p-3 overflow-auto">
              {/* <h3 className="font-medium mb-2">Exported JSON</h3>
              <pre className="text-xs h-[40vh] overflow-auto bg-white p-2 rounded">
                {exportJson ? JSON.stringify(exportJson, null, 2) : 'Click "Display JSON" first.'}
              </pre>

              <h3 className="font-medium mb-2">Exported Typescript</h3>
              <pre className="text-xs h-[40vh] overflow-auto bg-white p-2 rounded">
                {exportJson ? JSON.stringify(exportJson, null, 2) : 'Click "Display JSON" first.'}
              </pre> */}

              <div className="flex space-x-2 mb-2">
                <button onClick={() => setView('json')} className="px-2 py-1 border rounded">
                  JSON
                </button>
                <button onClick={() => setView('ts')} className="px-2 py-1 border rounded">
                  TypeScript
                </button>
              </div>

              <pre className="text-xs h-[40vh] overflow-auto bg-white p-2 rounded">
                {view === 'json'
                  ? exportJson
                    ? JSON.stringify(exportJson, null, 2)
                    : 'Click "Display JSON" first.'
                  : generatedCode
                    ? generatedCode
                    : 'Click "Generate TypeScript" to view the generated code.'}
              </pre>


            </div>

          </div>
        </div>
      </div>
    </div>
  );
}