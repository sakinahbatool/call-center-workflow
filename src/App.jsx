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
  useEdgesState,
  getConnectedEdges
} from 'reactflow';
import 'reactflow/dist/style.css';
import Sidebar from './Components/Sidebar';
import EditableNode from './Components/EditableNode';
import EditableEdge from './Components/EditableEdge';
import LoadingSpinner from './Components/LoadingSpinner';
import ExtensibleFunctionNode from './Components/ExtensibleFunctionNode';
import nodeTemplates from "./utils/nodeTemplates";
import { predefinedFunctions } from './utils/nodeTemplates'
import FunctionEditorModal from './Components/FunctionEditorModal';
import DebuggerPanel from './Components/DebuggerPanel';
import { simulateNodeExecution } from './utils/FlowExecutor';

const nodeTypes = {
  editableNode: EditableNode,
  extensibleFunction: ExtensibleFunctionNode
};

const edgeTypes = { editableEdge: EditableEdge };
let nodeCounter = 1;
let edgeCounter = 1;

const getSimpleNodeId = (type) => `${type}_${nodeCounter++}`;
const getSimpleEdgeId = (source, target) => `edge_${edgeCounter++}_${source}_${target}`;


const generateNodeCode = (node, allNodeTemplates, part = 'all') => {
  if (!node) return "";
  const template = allNodeTemplates[node.data.nodeType];
  if (!template) return "";

  let nodeCode = "";
  const nodeType = node.data.nodeType;
  let runPlaceholderReplacement = false;

  if (nodeType === 'HandleTransaction') {
    const parts = template.functionTemplate.split('{{USER_CODE}}');
    if (part === 'start') nodeCode = parts[0] || '';
    else if (part === 'end') nodeCode = parts[1] || '';
    else {
      nodeCode = template.mainFlowTemplate || '';
      runPlaceholderReplacement = true;
    }
  }

  else if (nodeType === 'CustomFunction') {
    const params = node.data.params || {};
    const funcName = params.functionName || 'myFunction';
    const funcParams = params.functionParams || '';
    const funcArgs = params.functionArgs || '';
    const resultVar = params.resultVar || '';

    if (part === 'start') nodeCode = `async function ${funcName}(${funcParams}) {`;
    else if (part === 'end') nodeCode = `}`;
    else {
      runPlaceholderReplacement = true;
      if (resultVar) nodeCode = `const ${resultVar} = await ${funcName}(${funcArgs});`;
      else nodeCode = `await ${funcName}(${funcArgs});`;
    }
  }

  else if (nodeType === 'If') {
    if (part === 'start') {
      nodeCode = `if ({{condition}}) {`;
      runPlaceholderReplacement = true;
    }
    else if (part === 'end') {
      nodeCode = `}`;
    }
    else {
      nodeCode = template.codeTemplate;
      runPlaceholderReplacement = true;
    }
  }

  else if (template.isExtensible) {
    const parts = (template.functionTemplate || '').split('{{USER_CODE}}');
    if (part === 'start') nodeCode = parts[0] || '';
    else if (part === 'end') nodeCode = parts[1] || '}';
    else {
      nodeCode = template.mainFlowTemplate || '';
      runPlaceholderReplacement = true;
    }
  }

  else {
    nodeCode = template.codeTemplate;
    runPlaceholderReplacement = true;
  }

  if (nodeCode && runPlaceholderReplacement) {
    if (node.data?.params) {
      Object.entries(node.data.params).forEach(([key, value]) => {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        nodeCode = nodeCode.replace(placeholder, value || '');
      });
    }
    if (template.inputs) {
      template.inputs.forEach(input => {
        const placeholder = new RegExp(`{{${input.key}}}`, 'g');
        nodeCode = nodeCode.replace(placeholder, input.defaultValue);
      });
    }
  }

  return nodeCode ? '  ' + nodeCode : '';
};


export default function App() {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [exportJson, setExportJson] = useState(null);
  const [generatedCode, setGeneratedCode] = useState("");
  const [view, setView] = useState('json');
  const [isLoading, setIsLoading] = useState(false);
  const [editingFunction, setEditingFunction] = useState(null);
  const [isFunctionModalOpen, setIsFunctionModalOpen] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnimationModalOpen, setIsAnimationModalOpen] = useState(false);
  const [animatingNode, setAnimatingNode] = useState(null);
  const [debugVariables, setDebugVariables] = useState({});
  const [debugLogs, setDebugLogs] = useState([]);

  const animationTimeoutRef = useRef(null);
  const resumeCallbackRef = useRef(null);

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const flowVarsRef = useRef({});

  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  const allNodeTemplates = { ...nodeTemplates, ...predefinedFunctions };

  const historyRef = useRef([]);
  const redoRef = useRef([]);

  const pushHistory = useCallback(() => {
    historyRef.current.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });
    redoRef.current = [];
  }, [nodes, edges]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isTypING = activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable;

      if (isTypING || isPlaying || isFunctionModalOpen) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        const selectedNodes = nodes.filter((n) => n.selected);
        const selectedEdges = edges.filter((e) => e.selected);
        const connectedEdges = getConnectedEdges(selectedNodes, edges);
        const edgesToDelete = [...selectedEdges, ...connectedEdges];
        const edgeIdsToDelete = new Set(edgesToDelete.map(e => e.id));
        setNodes((nds) => nds.filter((n) => !n.selected));
        setEdges((eds) => eds.filter((e) => !edgeIdsToDelete.has(e.id)));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (historyRef.current.length === 0) return;
        const prev = historyRef.current[historyRef.current.length - 1];
        redoRef.current.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });
        setNodes(prev.nodes);
        setEdges(prev.edges);
        historyRef.current = historyRef.current.slice(0, -1);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        if (redoRef.current.length === 0) return;
        const next = redoRef.current[redoRef.current.length - 1];
        historyRef.current.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });
        setNodes(next.nodes);
        setEdges(next.edges);
        redoRef.current = redoRef.current.slice(0, -1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [nodes, edges, setNodes, setEdges, isPlaying, isFunctionModalOpen]);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const createNodeOnParamChange = useCallback((nodeId) => (paramKey, value) => {
    pushHistory();
    setNodes((ns) => ns.map((n) => {
      if (n.id === nodeId) {
        const currentParams = n.data.params || {};
        let updatedParams;
        if (value === '') {
          updatedParams = { ...currentParams };
          delete updatedParams[paramKey];
        } else {
          updatedParams = { ...currentParams, [paramKey]: value };
        }
        return {
          ...n,
          data: { ...n.data, params: updatedParams }
        };
      }
      return n;
    }));
  }, [setNodes, pushHistory]);

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
      id, source: params.source, target: params.target,
      type: 'editableEdge',
      data: { label: '', onChange: createEdgeOnChange(id) },
      animated: false,
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges, createEdgeOnChange, pushHistory]);

  const onInit = useCallback((instance) => {
    setReactFlowInstance(instance);
  }, []);

  const handleEditFunction = useCallback((nodeId) => {
    if (!reactFlowInstance) return;
    const currentNodes = reactFlowInstance.getNodes();
    const functionNode = currentNodes.find(n => n.id === nodeId);
    if (!functionNode) return;
    setEditingFunction(functionNode);
    setIsFunctionModalOpen(true);
  }, [reactFlowInstance]);


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
    const template = allNodeTemplates[type];
    const isExtensible = template?.isExtensible;
    if (isExtensible) {
      const newNode = {
        id, type: 'extensibleFunction', position,
        data: {
          label: template.displayName,
          onParamChange: createNodeOnParamChange(id),
          onEdit: () => handleEditFunction(id),
          nodeType: type, params: {}, userNodes: [], userEdges: []
        },
      };
      pushHistory();
      setNodes((nds) => nds.concat(newNode));
    } else {
      const newNode = {
        id, type: 'editableNode', position,
        data: {
          label: template.displayName,
          onChange: createNodeOnChange(id),
          onParamChange: createNodeOnParamChange(id),
          nodeType: type, params: {}
        },
      };
      pushHistory();
      setNodes((nds) => nds.concat(newNode));
    }
  }, [reactFlowInstance, createNodeOnChange, createNodeOnParamChange, setNodes, pushHistory, handleEditFunction, allNodeTemplates]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleSaveFunction = useCallback((updatedFunctionNode) => {
    pushHistory();
    setNodes((ns) => ns.map((n) =>
      n.id === updatedFunctionNode.id ? updatedFunctionNode : n
    ));
    setEditingFunction(null);
    setIsFunctionModalOpen(false);
  }, [setNodes, pushHistory]);


  const getFlowPayload = useCallback(() => {
    const simplifiedNodes = nodes.map(node => ({
      id: node.id,
      label: node.data?.label,
      type: node.data?.nodeType,
      params: node.data?.params || {}
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
    return payload;
  }, [nodes, edges]);

  const displayJson = useCallback(() => {
    if (nodes.length === 0) {
      alert("Flowchart is empty. Add some nodes first.");
      return;
    }
    const payload = getFlowPayload();
    setExportJson(payload);
    setView('json');
    console.log('Exported Flow JSON:', payload);
  }, [nodes, edges, getFlowPayload]);

  const generateInternalFlow = useCallback((flowNodes, flowEdges) => {
    let internalCode = '';
    if (!flowNodes || flowNodes.length === 0) {
      return '// No custom logic\n';
    }

    let startNode = flowNodes.find(n => n.data?.nodeType === 'Start');
    if (startNode) {
      const startEdge = flowEdges.find(e => e.source === startNode.id);
      if (startEdge) {
        startNode = flowNodes.find(n => n.id === startEdge.target);
      } else {
        startNode = null;
      }
    } else {
      const targetNodeIds = new Set(flowEdges.map(e => e.target));
      startNode = flowNodes.find(n => !targetNodeIds.has(n.id));

      if (!startNode) startNode = flowNodes[0];
    }

    let currentNode = startNode;
    const visited = new Set();

    while (currentNode && !visited.has(currentNode.id)) {
      visited.add(currentNode.id);
      const template = allNodeTemplates[currentNode.data.nodeType];

      if (template) {
        let nodeCode = template.mainFlowTemplate || template.codeTemplate;

        if (nodeCode) {
          if (currentNode.data?.params) {
            Object.entries(currentNode.data.params).forEach(([key, value]) => {
              const placeholder = new RegExp(`{{${key}}}`, 'g');
              nodeCode = nodeCode.replace(placeholder, value);
            });
          }

          if (currentNode.data.nodeType === 'If') {
            const trueBranchEdge = flowEdges.find(edge => edge.source === currentNode.id);

            if (trueBranchEdge) {
              const nextNode = flowNodes.find(n => n.id === trueBranchEdge.target);

              let innerCode = "";
              let innerCurrent = nextNode;

              while (innerCurrent) {
                if (visited.has(innerCurrent.id)) break;
                visited.add(innerCurrent.id);

                const innerTemplate = allNodeTemplates[innerCurrent.data.nodeType];
                if (innerTemplate) {
                  let c = innerTemplate.mainFlowTemplate || innerTemplate.codeTemplate;
                  if (innerCurrent.data?.params) {
                    Object.entries(innerCurrent.data.params).forEach(([k, v]) => {
                      c = c.replace(new RegExp(`{{${k}}}`, 'g'), v);
                    });
                  }
                  innerCode += "  " + c + "\n";
                }

                const innerEdge = flowEdges.find(e => e.source === innerCurrent.id);
                innerCurrent = innerEdge ? flowNodes.find(n => n.id === innerEdge.target) : null;
              }

              nodeCode = nodeCode.replace(/\{\{\s*TRUE_BRANCH\s*\}\}/, innerCode);
            } else {
              nodeCode = nodeCode.replace(/\{\{\s*TRUE_BRANCH\s*\}\}/, '  // True branch\n');
            }

            internalCode += nodeCode + '\n';

            currentNode = null;
            break;
          }

          if (template.inputs) {
            template.inputs.forEach(input => {
              const placeholder = new RegExp(`{{${input.key}}}`, 'g');
              nodeCode = nodeCode.replace(placeholder, input.defaultValue);
            });
          }

          internalCode += nodeCode + '\n';
        }
      }

      const outgoingEdge = flowEdges.find(edge => edge.source === currentNode.id);
      if (outgoingEdge) {
        currentNode = flowNodes.find(node => node.id === outgoingEdge.target);
      } else {
        currentNode = null;
      }
    }

    return internalCode;
  }, [allNodeTemplates]);

  const generateBranchCode = useCallback((startNodeId, allNodes, allEdges, visitedNodes) => {
    let branchCode = '';
    let currentNode = allNodes.find(n => n.id === startNodeId);
    while (currentNode && !visitedNodes.has(currentNode.id)) {
      visitedNodes.add(currentNode.id);
      const template = allNodeTemplates[currentNode.data.nodeType];
      if (template && currentNode.data.nodeType !== 'If') {
        let nodeCode = template.codeTemplate;
        if (currentNode.data?.params) {
          Object.entries(currentNode.data.params).forEach(([key, value]) => {
            const placeholder = new RegExp(`{{${key}}}`, 'g');
            nodeCode = nodeCode.replace(placeholder, value);
          });
        }
        branchCode += '  ' + nodeCode;
      }
      const outgoingEdge = allEdges.find(edge => edge.source === currentNode.id);
      if (outgoingEdge) {
        currentNode = allNodes.find(node => node.id === outgoingEdge.target);
      } else {
        currentNode = null;
      }
    }
    return branchCode;
  }, [allNodeTemplates]);

  const generateTypescriptFromFlow = useCallback(() => {
    if (nodes.length === 0) {
      alert("Flowchart is empty.");
      return;
    }

    // 1. FIND START NODE
    const startNode = nodes.find(node => node.data?.nodeType === 'Start');
    if (!startNode) {
      alert("No Start node found in the flowchart.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      try {
        // 2. CALCULATE REACHABILITY (Graph Traversal)
        // This ensures we only generate code for nodes actually connected to Start
        const reachableIds = new Set();
        const queue = [startNode.id];
        reachableIds.add(startNode.id);

        while (queue.length > 0) {
          const currId = queue.shift();
          // Find all edges leaving this node (handles If branches, loops, etc.)
          const outgoingEdges = edges.filter(e => e.source === currId);

          outgoingEdges.forEach(edge => {
            if (!reachableIds.has(edge.target)) {
              reachableIds.add(edge.target);
              queue.push(edge.target);
            }
          });
        }

        // 3. FILTER NODES
        // Only work with nodes that were found in the traversal
        const validNodes = nodes.filter(n => reachableIds.has(n.id));

        let functionDefinitions = '// --- Function Definitions ---\n';
        let mainFlowCode = '\n// --- Main Flow ---\n';

        // 4. GENERATE FUNCTION DEFINITIONS (Only for reachable nodes)
        const functionNodes = validNodes.filter(n =>
          n.data.nodeType !== 'HandleTransaction' &&
          allNodeTemplates[n.data.nodeType]?.isExtensible
        );

        functionNodes.forEach(funcNode => {
          const template = allNodeTemplates[funcNode.data.nodeType];
          let functionWrapper = '';

          if (funcNode.data.nodeType === 'CustomFunction') {
            const params = funcNode.data.params || {};
            const funcName = params.functionName || 'myFunction';
            const funcParams = params.functionParams || '';
            functionWrapper = `async function ${funcName}(${funcParams}) { {{USER_CODE}} }`;
          } else {
            functionWrapper = template.functionTemplate;
          }

          if (funcNode.data?.params) {
            Object.entries(funcNode.data.params).forEach(([key, value]) => {
              const placeholder = new RegExp(`{{${key}}}`, 'g');
              functionWrapper = functionWrapper.replace(placeholder, value);
            });
          }

          const internalCode = generateInternalFlow(
            funcNode.data.userNodes,
            funcNode.data.userEdges
          );
          functionDefinitions += functionWrapper.replace('{{USER_CODE}}', internalCode) + '\n';
        });

        // 5. GENERATE MAIN FLOW (Traverse valid nodes)
        const visitedNodes = new Set();
        let currentNode = startNode;

        // We use validNodes in our lookups to be safe, though following edges is usually enough
        while (currentNode && !visitedNodes.has(currentNode.id)) {
          visitedNodes.add(currentNode.id);

          const nodeType = currentNode.data.nodeType;
          const template = allNodeTemplates[nodeType];

          if (template) {
            let nodeCode = '';

            if (nodeType === 'HandleTransaction') {
              let wrapper = template.functionTemplate;
              const internalCode = generateInternalFlow(
                currentNode.data.userNodes,
                currentNode.data.userEdges
              );
              nodeCode = wrapper.replace('{{USER_CODE}}', internalCode);
            }
            else if (nodeType === 'CustomFunction') {
              const params = currentNode.data.params || {};
              const funcName = params.functionName || 'myFunction';
              const funcArgs = params.functionArgs || '';
              const resultVar = params.resultVar || '';
              if (resultVar) {
                nodeCode = `const ${resultVar} = await ${funcName}(${funcArgs});`;
              } else {
                nodeCode = `await ${funcName}(${funcArgs});`;
              }
            }
            else if (nodeType === 'If') {
              nodeCode = template.codeTemplate;
              const trueBranchEdge = edges.find(edge => edge.source === currentNode.id);

              if (trueBranchEdge) {
                // Pass validNodes to generateBranchCode to ensure consistency
                const trueBranchCode = generateBranchCode(trueBranchEdge.target, validNodes, edges, visitedNodes);
                nodeCode = nodeCode.replace(/\{\{\s*TRUE_BRANCH\s*\}\}/, trueBranchCode);
              } else {
                nodeCode = nodeCode.replace(/\{\{\s*TRUE_BRANCH\s*\}\}/, '  // True branch\n');
              }
            }
            else if (template.isExtensible) {
              nodeCode = template.mainFlowTemplate;
            }
            else {
              nodeCode = template.codeTemplate;
            }

            if (nodeCode) {
              if (currentNode.data?.params) {
                Object.entries(currentNode.data.params).forEach(([key, value]) => {
                  const placeholder = new RegExp(`{{${key}}}`, 'g');
                  nodeCode = nodeCode.replace(placeholder, value);
                });
              }
              if (template.inputs) {
                template.inputs.forEach(input => {
                  const placeholder = new RegExp(`{{${input.key}}}`, 'g');
                  nodeCode = nodeCode.replace(placeholder, input.defaultValue);
                });
              }
              mainFlowCode += nodeCode + '\n';
            }
          }

          const outgoingEdge = edges.find(edge => edge.source === currentNode.id);
          if (outgoingEdge) {
            currentNode = validNodes.find(node => node.id === outgoingEdge.target);
          } else {
            currentNode = null;
          }
        }

        const finalCode = functionDefinitions + mainFlowCode;
        setView('ts');
        setGeneratedCode(finalCode);

      } catch (err) {
        console.error('Code generation error:', err);
        alert(`Error generating code: ${err.message} `);
      } finally {
        setIsLoading(false);
      }
    }, 100);
  }, [nodes, edges, allNodeTemplates, generateInternalFlow, generateBranchCode]);
  const stopAnimation = () => {
    console.log("STOP command received.");
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    setIsAnimationModalOpen(false);
    setAnimatingNode(null);
    setIsPlaying(false);
  };

  const handleModalAnimationDone = useCallback((nodeId) => {
    console.log(`Modal animation for ${nodeId} finished.`);
    setIsAnimationModalOpen(false);
    setAnimatingNode(null);

    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node) return;

    const closingCode = generateNodeCode(node, allNodeTemplates, 'end');
    setGeneratedCode(prevCode => prevCode + closingCode + '\n\n');

    const callCode = generateNodeCode(node, allNodeTemplates, 'all');
    if (callCode) {
      setGeneratedCode(prevCode => prevCode + callCode + '\n');
    }

    const outgoingEdge = edgesRef.current.find(e => e.source === nodeId);
    if (outgoingEdge) {
      const nextNode = nodesRef.current.find(n => n.id === outgoingEdge.target);
      if (nextNode) {
        console.log("Resuming main flow animation at:", nextNode.id);
        playFlowAnimation(nextNode.id);
        return;
      }
    }

    console.log("Main flow animation finished after modal.");
    setIsPlaying(false);
    setNodes(nds => nds.map(n => ({ ...n, selected: false })));
    setEdges(eds => eds.map(e => ({ ...e, selected: false })));

  }, [allNodeTemplates]);

  const playFlowAnimation = useCallback((startNodeId) => {
    // 1. Clear previous timeouts
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    // 2. Reset Debugger State & Ref
    setDebugVariables({});
    setDebugLogs([]);
    flowVarsRef.current = {}; // <--- Reset the ref

    // 3. Determine Start Node
    let startNode;
    if (startNodeId) {
      startNode = nodesRef.current.find(n => n.id === startNodeId);
    } else {
      console.log("--- ANIMATION START ---");
      startNode = nodesRef.current.find(n => n.data.nodeType === 'Start');
      
      if (startNode) {
        setIsPlaying(true);
        setView('debug'); // Switch to debug view

        // --- GENERATE FUNCTION DEFINITIONS ---
        let initialCode = "// --- Function Definitions ---\n";
        const functionNodes = nodesRef.current.filter(n => 
            n.data.nodeType === 'CustomFunction' || 
            (allNodeTemplates[n.data.nodeType]?.isExtensible)
        );

        functionNodes.forEach(funcNode => {
             const template = allNodeTemplates[funcNode.data.nodeType];
             if(!template) return;
             let functionWrapper = '';
             if (funcNode.data.nodeType === 'CustomFunction') {
                const params = funcNode.data.params || {};
                const funcName = params.functionName || 'myFunction';
                const funcParams = params.functionParams || '';
                functionWrapper = `function ${funcName}(${funcParams}) {\n  // Custom Logic...\n  return ...;\n}`;
             } else {
                functionWrapper = template.functionTemplate || '';
             }
             initialCode += functionWrapper + "\n\n";
        });

        initialCode += "// --- Main Flow ---\n// --- Animation Started ---\n\n";
        setGeneratedCode(initialCode);
        
        setNodes(nds => nds.map(n => ({ ...n, selected: false })));
        setEdges(eds => eds.map(e => ({ ...e, selected: false })));
      }
    }

    if (!startNode) {
      if (!startNodeId) alert("No 'Start' node found to begin animation.");
      setIsPlaying(false);
      return;
    }

    // 4. Define the Animation Step Logic
    const animateStep = (nodeId, onDone) => {
      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;

      const node = currentNodes.find(n => n.id === nodeId);
      if (!node) {
        if (onDone) onDone();
        return;
      }

      // --- SIMULATE LOGIC (FIXED) ---
      // 1. Run simulation using the Ref (Synchronous)
      const { newVariables, logMessage, error } = simulateNodeExecution(node, flowVarsRef.current);
      
      // 2. Update the Ref for the next step
      flowVarsRef.current = newVariables;

      // 3. Update the UI (Debugger Panel)
      setDebugVariables({ ...newVariables }); // Copy to trigger re-render

      if (logMessage) {
        setDebugLogs(prevLogs => [...prevLogs, {
          time: new Date().toLocaleTimeString().split(' ')[0],
          message: logMessage,
          type: error ? 'error' : 'info'
        }]);
      }
      // -------------------------------

      console.log(`Animating step for main node: ${nodeId}`);
      setNodes(nds => nds.map(n => ({ ...n, selected: n.id === nodeId })));
      setEdges(eds => eds.map(e => ({ ...e, selected: false })));

      const isExtensible = allNodeTemplates[node.data.nodeType]?.isExtensible;
      const hasCustomLogic = node.data.userNodes && node.data.userNodes.length > 0;
      const isIf = node.data.nodeType === 'If';

      const proceedToNext = () => {
        const outgoingEdge = currentEdges.find(e => e.source === nodeId);
        if (!outgoingEdge) {
          if (onDone) onDone();
          return;
        }

        animationTimeoutRef.current = setTimeout(() => {
          setEdges(eds => eds.map(e => ({ ...e, selected: e.id === outgoingEdge.id })));
          setNodes(nds => nds.map(n => ({ ...n, selected: false })));

          const nextNode = currentNodes.find(n => n.id === outgoingEdge.target);
          if (nextNode) {
            setTimeout(() => {
              animateStep(nextNode.id, onDone);
            }, 800);
          } else {
            if (onDone) onDone();
          }
        }, 800);
      };

      if (isExtensible && hasCustomLogic) {
        const startCode = generateNodeCode(node, allNodeTemplates, 'start');
        setGeneratedCode(prevCode => prevCode + startCode + '\n');
        resumeCallbackRef.current = proceedToNext;
        animationTimeoutRef.current = setTimeout(() => {
          setAnimatingNode(node);
          setIsAnimationModalOpen(true);
        }, 800);

      } else if (isIf) {
        const startCode = generateNodeCode(node, allNodeTemplates, 'start');
        setGeneratedCode(prevCode => prevCode + startCode + '\n');

        const trueEdge = currentEdges.find(e => e.source === nodeId);
        if (trueEdge) {
          animationTimeoutRef.current = setTimeout(() => {
            setEdges(eds => eds.map(e => ({ ...e, selected: e.id === trueEdge.id })));
            setNodes(nds => nds.map(n => ({ ...n, selected: false })));

            const nextNode = currentNodes.find(n => n.id === trueEdge.target);
            if (nextNode) {
              setTimeout(() => {
                animateStep(nextNode.id, () => {
                  setGeneratedCode(prev => prev + '}\n');
                  if (onDone) onDone();
                });
              }, 800);
            } else {
              setGeneratedCode(prev => prev + '}\n');
              if (onDone) onDone();
            }
          }, 800);
          return;
        } else {
          setGeneratedCode(prev => prev + '}\n');
          proceedToNext();
        }

      } else {
        const code = generateNodeCode(node, allNodeTemplates, 'all');
        setGeneratedCode(prevCode => prevCode + code + '\n');
        proceedToNext();
      }
    };

    animateStep(startNode.id, () => {
      console.log("Animation Complete.");
      setIsPlaying(false);
      setNodes(nds => nds.map(n => ({ ...n, selected: false })));
      setEdges(eds => eds.map(e => ({ ...e, selected: false })));
    });

  }, [allNodeTemplates]);

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
          {/* --- TOP TOOLBAR --- */}
          <div className="flex items-center justify-between p-3 border-b">
            <h2 className="text-lg font-semibold">Rule Builder</h2>
            <div className="flex items-center gap-2">
              {!isPlaying ? (
                <button
                  className="px-3 py-1 rounded text-white transition-colors bg-blue-600 hover:bg-blue-700 flex items-center gap-1"
                  onClick={() => playFlowAnimation(null)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M10.804 8 5 4.633v6.734zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m15 0A7 7 0 1 0 1 8a7 7 0 0 0 14 0" />
                  </svg>
                  Play
                </button>
              ) : (
                <button
                  className="px-3 py-1 rounded text-white transition-colors bg-red-600 hover:bg-red-700 flex items-center gap-1"
                  onClick={stopAnimation}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m15 0A7 7 0 1 0 1 8a7 7 0 0 0 14 0M5 5.5A1.5 1.5 0 0 1 6.5 4h3A1.5 1.5 0 0 1 11 5.5v5A1.5 1.5 0 0 1 9.5 12h-3A1.5 1.5 0 0 1 5 10.5z" />
                  </svg>
                  Stop
                </button>
              )}

              <button
                className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={displayJson}
                disabled={isPlaying}
              >
                Display JSON
              </button>
              <button
                className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                onClick={handleDownload}
                disabled={isPlaying}
              >
                Download TS
              </button>
              <button
                className="px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-700"
                onClick={generateTypescriptFromFlow}
                disabled={isPlaying}
              >
                Generate TypeScript
              </button>
            </div>
          </div>

          {/* --- MAIN CONTENT AREA --- */}
          <div className="flex-1 relative flex overflow-hidden">
            {isLoading && <LoadingSpinner />}
            
            {/* Left Side: The Canvas */}
            <div ref={reactFlowWrapper} className="flex-1 h-full">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onInit={onInit}
                onNodesChange={(changes) => { if (!isPlaying) { pushHistory(); setNodes((nds) => applyNodeChanges(changes, nds)); } }}
                onEdgesChange={(changes) => { if (!isPlaying) { pushHistory(); setEdges((eds) => applyEdgeChanges(changes, eds)); } }}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                onDrop={onDrop}
                onDragOver={onDragOver}
                multiSelectionKeyCode="Shift"
                selectionOnDrag
                nodesDraggable={!isPlaying}
                nodesConnectable={!isPlaying}
                elementsSelectable={!isPlaying}
                className="w-full h-full"
              >
                <Background />
                <Controls />
                <MiniMap />
              </ReactFlow>
            </div>

            {/* Right Side: Debugger OR Code Preview */}
            {/* Right Side: Tabbed Interface */}
            <div className="w-80 border-l bg-slate-50 flex flex-col h-full">
              
              {/* TABS HEADER */}
              <div className="flex items-center gap-1 p-2 border-b bg-gray-100 shrink-0">
                <button
                  onClick={() => setView('json')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    view === 'json' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  JSON
                </button>
                <button
                  onClick={() => setView('ts')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    view === 'ts' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  TypeScript
                </button>
                <button
                  onClick={() => setView('debug')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 ${
                    view === 'debug' ? 'bg-orange-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>🐞 Debugger</span>
                </button>
              </div>

              {/* TAB CONTENT */}
              <div className="flex-1 overflow-hidden relative">
                
                {/* VIEW 1: JSON */}
                {view === 'json' && (
                  <pre className="text-xs h-full overflow-auto bg-white p-2">
                    {exportJson ? JSON.stringify(exportJson, null, 2) : 'Click "Display JSON" first.'}
                  </pre>
                )}

                {/* VIEW 2: TYPESCRIPT */}
                {view === 'ts' && (
                  <pre className="text-xs h-full overflow-auto bg-white p-2">
                    {generatedCode || 'Click "Generate TypeScript" first.'}
                  </pre>
                )}

                {/* VIEW 3: DEBUGGER (Always rendered, just hidden via display if not active) */}
                <div className={`h-full flex flex-col ${view === 'debug' ? 'block' : 'hidden'}`}>
                   <DebuggerPanel 
                      variables={debugVariables} 
                      logs={debugLogs} 
                      currentNodeId={animatingNode?.id} 
                      isPlaying={isPlaying} 
                      // Pass 'true' to force render even if not playing, so you can see results after stop
                      alwaysVisible={true} 
                   />
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      <FunctionEditorModal
        isAnimating={isAnimationModalOpen}
        nodeToAnimate={animatingNode}
        onAnimationDone={handleModalAnimationDone}
        setGeneratedCode={setGeneratedCode}
        allNodeTemplates={allNodeTemplates}
        isOpen={isFunctionModalOpen}
        functionNode={editingFunction}
        onSave={handleSaveFunction}
        onClose={() => setIsFunctionModalOpen(false)}
      />
    </div>
  );
}