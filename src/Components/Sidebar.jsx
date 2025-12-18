import React, { useState } from 'react';
import { predefinedFunctions } from '../utils/nodeTemplates';

const basicNodes = [
  { type: 'Start', label: 'Start', description: 'Program entry point' },
  { type: 'Import', label: 'Import', description: 'Import modules' },
  { type: 'SetVariable', label: 'Set Variable', description: 'Assign value to variable' },
  { type: 'Log', label: 'Print Log', description: 'Output to console' },
  { type: 'If', label: 'If Condition', description: 'Conditional branch' },
  { type: 'Code', label: 'Custom Code', description: 'Execute custom code' },
  { type: 'FetchDB', label: 'Fetch from DB', description: 'Database query' },
  { type: 'ThrowError', label: 'Throw Error', description: 'Raise an error' },
  { type: 'End', label: 'End', description: 'Program exit point' },
];

const modalNodes = basicNodes.filter(n => 
  n.type !== 'Start' && 
  n.type !== 'End' && 
  n.type !== 'Import'
);
                                                                        
const functionNodes = Object.entries(predefinedFunctions).map(([key, func]) => ({
  type: key,
  label: func.displayName,
  description: func.description,
  isFunction: true
}));

export default function Sidebar({ mode = 'main' }) {
  const [activeTab, setActiveTab] = useState('basic');

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const getNodesToShow = () => {
    if (mode === 'modal') {
      switch(activeTab) {
        case 'functions':
          return functionNodes;
        case 'basic':
        default:
          return modalNodes; 
      }
    } else {
      switch(activeTab) {
        case 'functions': 
          return functionNodes;
        case 'basic': 
        default: 
          return basicNodes; 
      }
    }
  };

  const getTabButtonClass = (tabName) => {
    return `flex-1 px-3 py-2 text-sm font-medium text-center transition-colors ${
      activeTab === tabName 
        ? 'bg-white text-blue-600 border-b-2 border-blue-500' 
        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
    }`;
  };

  const asideClass = mode === 'main' 
    ? "w-1/4 bg-gray-100 border-r flex flex-col"
    : "w-64 bg-gray-100 border-r flex flex-col"; 

  return (
    <aside className={asideClass}>
      {mode === 'main' && (
        <div className="p-4 border-b bg-white">
          <h2 className="text-xl font-semibold">Node Palette</h2>
          <p className="text-sm text-gray-600 mt-1">
            Drag nodes to the canvas
          </p>
        </div>
      )}

      {mode === 'modal' && (
         <div className="p-4 border-b bg-white">
           <h2 className="text-lg font-semibold text-center">Add Nodes</h2>
         </div>
      )}

      <div className="flex border-b bg-gray-50">
        <button
          className={getTabButtonClass('basic')}
          onClick={() => setActiveTab('basic')}
        >
          Basic Nodes
        </button>
        <button
          className={getTabButtonClass('functions')}
          onClick={() => setActiveTab('functions')}
        >
          Functions
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {getNodesToShow().map((it) => (
          <div
            key={it.type}
            className="p-3 rounded-lg shadow-sm bg-white cursor-grab hover:shadow-md border-l-4 transition-all duration-200 hover:translate-x-1"
            style={{
              borderLeftColor: getNodeColor(it.type)
            }}
            draggable
            onDragStart={(e) => onDragStart(e, it.type)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{it.label}</div>
                <div className="text-xs text-gray-500 mt-1">{it.description}</div>
              </div>
              {it.isFunction && (
                <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded-full ml-2">
                  Function
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-2 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Drag to canvas
            </div>
          </div>
        ))}

        {activeTab === 'functions' && functionNodes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p>No functions available</p>
            <p className="text-xs mt-1">Add functions to nodeTemplates.js</p>
          </div>
        )}
      </div>

      {mode === 'main' && (
        <div className="p-3 border-t bg-gray-50 text-xs text-gray-500">
          {activeTab === 'basic' && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Basic building blocks for your flow
            </div>
          )}
          {activeTab === 'functions' && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Reusable functions with custom logic
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

function getNodeColor(nodeType) {
  const colors = {
    // Basic nodes
    'Start': '#10b981', // green-400
    'Import': '#8b5cf6', // indigo-400
    'SetVariable': '#60a5fa', // blue-400
    'Log': '#fbbf24', // yellow-400
    'If': '#ec4899', // pink-400
    'Code': '#a78bfa', // purple-400
    'FetchDB': '#fb923c', // orange-400
    'ThrowError': '#9ca3af', // gray-400
    'End': '#f87171', // red-400
    
    // Function nodes - all teal
    
    'CustomFunction': '#14b8a6', 
    'addTwoNumbers': '#14b8a6',
    'multiplyNumbers': '#14b8a6', 
    'fetchUserData': '#14b8a6',
    'validateEmail': '#14b8a6',
    'calculateDiscount': '#14b8a6',
    'HandleTransaction': '#14b8a6',
  };
  return colors[nodeType] || '#6b7280'; // default gray
}