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
import EditableNode from './EditableNode';
import EditableEdge from './EditableEdge';
import Sidebar from './Sidebar';
import ExtensibleFunctionNode from './ExtensibleFunctionNode';

const nodeTypes = {
  editableNode: EditableNode,
  extensibleFunction: ExtensibleFunctionNode
};
const edgeTypes = { editableEdge: EditableEdge };

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


export default function FunctionEditorModal({
  isAnimating,
  nodeToAnimate,
  onAnimationDone,
  setGeneratedCode,
  allNodeTemplates,
  isOpen,
  onClose,
  functionNode,
  onSave
}) {

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const animationTimeoutRef = useRef(null);
  const animationHasStarted = useRef(false);

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  const active = isAnimating || isOpen;
  const activeNode = isAnimating ? nodeToAnimate : functionNode;

  useEffect(() => {
    if (active && activeNode) {
      setNodes(activeNode.data?.userNodes || []);
      setEdges(activeNode.data?.userEdges || []);
      if (isAnimating) {
        animationHasStarted.current = false;
      }
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [active, activeNode, isAnimating]);


  const playInternalAnimation = useCallback(() => {
    console.log(`--- MODAL ANIMATION START for ${activeNode?.id} ---`);
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    let startNode = nodesRef.current.find(n => n.data.nodeType === 'Start');

    if (!startNode) {
      const targetNodeIds = new Set(edgesRef.current.map(e => e.target));
      startNode = nodesRef.current.find(n => !targetNodeIds.has(n.id));

      if (!startNode) {
        startNode = nodesRef.current[0];
      }
    }

    if (!startNode) {
      onAnimationDone(activeNode.id);
      return;
    }

    setNodes(nds => nds.map(n => ({ ...n, selected: false })));
    setEdges(eds => eds.map(e => ({ ...e, selected: false })));

    const animateStep = (nodeId, onDone) => {
      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;
      const node = currentNodes.find(n => n.id === nodeId);

      if (!node) {
        if (onDone) onDone();
        return;
      }

      setNodes(nds => nds.map(n => ({ ...n, selected: n.id === nodeId })));
      setEdges(eds => eds.map(e => ({ ...e, selected: false })));

      const proceedToNext = () => {
        const outgoingEdge = currentEdges.find(e => e.source === nodeId);
        if (!outgoingEdge) {
          animationTimeoutRef.current = setTimeout(() => {
            setNodes(nds => nds.map(n => ({ ...n, selected: false })));
            if (onDone) onDone();
          }, 800);
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


      if (node.data.nodeType === 'If') {
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
                  setGeneratedCode(prev => prev + '  }\n');
                  if (onDone) onDone();
                });
              }, 800);
            } else {
              setGeneratedCode(prev => prev + '  }\n');
              if (onDone) onDone();
            }
          }, 800);
          return;
        } else {
          setGeneratedCode(prev => prev + '  }\n');
          proceedToNext();
        }
      }
      else {
        const code = generateNodeCode(node, allNodeTemplates, 'all');
        if (code.trim()) {
          setGeneratedCode(prevCode => prevCode + code + '\n');
        }
        proceedToNext();
      }
    };

    if (startNode.data.nodeType === 'Start') {
      const firstEdge = edgesRef.current.find(e => e.source === startNode.id);
      if (firstEdge) {
        const firstNode = nodesRef.current.find(n => n.id === firstEdge.target);
        if (firstNode) {
          setNodes(nds => nds.map(n => ({ ...n, selected: n.id === startNode.id })));
          setTimeout(() => {
            animateStep(firstNode.id, () => onAnimationDone(activeNode.id));
          }, 800);
        } else {
          onAnimationDone(activeNode.id);
        }
      } else {
        setNodes(nds => nds.map(n => ({ ...n, selected: n.id === startNode.id })));
        setTimeout(() => onAnimationDone(activeNode.id), 800);
      }
    } else {
      animateStep(startNode.id, () => onAnimationDone(activeNode.id));
    }

  }, [activeNode, onAnimationDone, setGeneratedCode, allNodeTemplates]);

  useEffect(() => {
    if (isAnimating && activeNode && nodes.length > 0 && !animationHasStarted.current) {

      animationHasStarted.current = true;

      const t = setTimeout(() => {
        playInternalAnimation();
      }, 100);
      return () => clearTimeout(t);
    }
  }, [isAnimating, activeNode, nodes, playInternalAnimation]);


  const onInternalNodeParamChange = useCallback((nodeId) => (paramKey, value) => {
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
        return { ...n, data: { ...n.data, params: updatedParams } };
      }
      return n;
    }));
  }, [setNodes]);

  const handleNodesChange = useCallback((changes) => {
    if (isAnimating) return;
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, [setNodes, isAnimating]);

  const handleEdgesChange = useCallback((changes) => {
    if (isAnimating) return;
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, [setEdges, isAnimating]);

  const onConnect = useCallback((params) => {
    if (isAnimating) return;
    const id = `internal_edge_${Date.now()}`;
    const newEdge = {
      id, source: params.source, target: params.target,
      type: 'editableEdge', data: { label: '' }, animated: false,
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges, isAnimating]);

  const onDrop = useCallback((event) => {
    if (isAnimating) return;
    event.preventDefault();
    if (!reactFlowWrapper.current || !reactFlowInstance) return;
    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;
    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });
    const id = `internal_${type}_${Date.now()}`;
    const template = allNodeTemplates[type];
    const isFunction = template?.isExtensible;
    const newNode = {
      id,
      type: isFunction ? 'extensibleFunction' : 'editableNode',
      position,
      data: {
        label: template?.displayName || type,
        nodeType: type,
        params: {},
        onParamChange: onInternalNodeParamChange(id)
      },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [reactFlowInstance, setNodes, allNodeTemplates, onInternalNodeParamChange, isAnimating]);

  const onDragOver = useCallback((event) => {
    if (isAnimating) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, [isAnimating]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen || isAnimating) return;
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isTyping = activeTag === 'input' || activeTag === 'textarea';
      if (isTyping) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        setNodes((nds) => nds.filter((n) => !n.selected));
        setEdges((eds) => eds.filter((e) => !e.selected));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setNodes, setEdges, isAnimating]);

  if (!active || !activeNode) return null;

  const functionDef = allNodeTemplates[activeNode.data.nodeType];
  if (!functionDef) return null;

  const handleSave = () => {
    onSave({
      ...activeNode,
      data: { ...activeNode.data, userNodes: nodes, userEdges: edges }
    });
    onClose();
  };

  const handleClose = () => {
    if (isAnimating) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-11/12 h-5/6 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">
              {isAnimating ? "Animating" : "Edit"} Function: {functionDef.displayName}
            </h2>
            <p className="text-sm text-gray-600">{functionDef.description}</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
              disabled={isAnimating}
            >
              Save
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-400"
              disabled={isAnimating}
            >
              Cancel
            </button>
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-row">
            <Sidebar mode="modal" />
            <div className="flex-1 flex flex-col">
              <div className="p-2 border-b bg-gray-100">
                <h3 className="font-medium text-center">
                  {isAnimating ? "Animating internal logic..." : "Drag nodes to build your function's logic"}
                </h3>
              </div>
              <div ref={reactFlowWrapper} className="flex-1">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={handleNodesChange}
                  onEdgesChange={handleEdgesChange}
                  onConnect={onConnect}
                  onInit={setReactFlowInstance}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  fitView
                  nodesDraggable={!isAnimating}
                  nodesConnectable={!isAnimating}
                  elementsSelectable={!isAnimating}
                >
                  <Background />
                  <Controls />
                  <MiniMap />
                </ReactFlow>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}