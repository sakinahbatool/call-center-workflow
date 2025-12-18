import React, { useEffect, useRef } from 'react';

export default function DebuggerPanel({ variables, logs, currentNodeId, isPlaying, alwaysVisible }) {
  const scrollRef = useRef(null);

  // Auto-scroll logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // REMOVED THE "if (!isPlaying) return null;" CHECK
  
  return (
    <div className="flex flex-col h-full bg-gray-900 text-white font-mono text-xs">
      {/* Header */}
      <div className="bg-gray-800 p-2 border-b border-gray-700 flex justify-between items-center shrink-0">
        <span className="font-bold text-orange-400">STATUS: {isPlaying ? 'RUNNING' : 'IDLE'}</span>
        {currentNodeId && isPlaying && (
          <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px]">
            Node: {currentNodeId}
          </span>
        )}
      </div>

      {/* Variables Table */}
      <div className="flex-1 overflow-auto border-b border-gray-700">
        <div className="bg-gray-800 px-2 py-1 text-[10px] text-gray-400 uppercase tracking-wider sticky top-0">
          Variables Scope
        </div>
        {Object.keys(variables).length === 0 ? (
          <div className="p-4 text-gray-500 italic text-center">
            No variables captured yet. <br/> Run the flow to populate.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <tbody className="divide-y divide-gray-800">
              {Object.entries(variables).map(([key, value]) => (
                <tr key={key} className="hover:bg-gray-800/50">
                  <td className="py-2 pl-2 text-blue-300 w-1/3 align-top">{key}</td>
                  <td className="py-2 pr-2 text-green-300 break-all font-mono">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Console Logs */}
      <div className="h-1/3 bg-black flex flex-col shrink-0">
        <div className="bg-gray-800 px-2 py-1 text-[10px] text-gray-400 uppercase tracking-wider border-t border-b border-gray-700">
          Console Output
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-1 font-mono">
          {logs.length === 0 && <span className="text-gray-600 italic">Waiting for logs...</span>}
          {logs.map((log, index) => (
            <div key={index} className="flex gap-2">
              <span className="text-gray-500 shrink-0">[{log.time}]</span>
              <span className={`${log.type === 'error' ? 'text-red-400' : 'text-gray-300'}`}>
                {log.message}
              </span>
            </div>
          ))}
          <div ref={scrollRef}></div>
        </div>
      </div>
    </div>
  );
}