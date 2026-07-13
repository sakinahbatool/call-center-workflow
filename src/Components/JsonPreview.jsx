import React, { useState } from 'react';
import { copyJsonToClipboard, downloadJsonFile } from '../utils/workflowCompiler';

export default function JsonPreview({ workflowJson, height = 288 }) {
  const [copyStatus, setCopyStatus] = useState('');
  const jsonText = JSON.stringify(workflowJson, null, 2);

  const handleCopy = async () => {
    try {
      await copyJsonToClipboard(workflowJson);
      setCopyStatus('Copied');
      setTimeout(() => setCopyStatus(''), 1200);
    } catch (error) {
      setCopyStatus('Copy failed');
      setTimeout(() => setCopyStatus(''), 1200);
    }
  };

  return (
    <section
      className="border-t bg-gray-950 text-gray-100 flex flex-col shrink-0"
      style={{ height }}
    >
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
        <div>
          <h2 className="text-sm font-semibold">Live JSON Preview</h2>
          <p className="text-[11px] text-gray-400">Compiled from current React Flow nodes and edges.</p>
        </div>
        <div className="flex items-center gap-2">
          {copyStatus && <span className="text-xs text-green-300">{copyStatus}</span>}
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-md border border-gray-700 px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-800"
          >
            Copy JSON
          </button>
          <button
            type="button"
            onClick={() => downloadJsonFile(workflowJson, `${workflowJson.workflow_id || 'workflow'}.json`)}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            Download JSON
          </button>
        </div>
      </div>
      <pre className="flex-1 overflow-auto p-4 text-xs leading-relaxed">
        {jsonText}
      </pre>
    </section>
  );
}
