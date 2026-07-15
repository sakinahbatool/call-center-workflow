import React, { useState } from 'react';
import { downloadJson } from '../utils/workflowCompiler';
import { uploadWorkflowJson } from '../utils/apiClient';
import Toast from './Toast';

function getValidationMessage(result) {
  if (!result?.errors?.length) return '';

  const visibleErrors = result.errors.slice(0, 6);
  const remainingCount = result.errors.length - visibleErrors.length;

  return [
    ...visibleErrors.map((error) => `• ${error}`),
    remainingCount > 0 ? `• +${remainingCount} more issue(s)` : '',
  ].filter(Boolean).join('\n');
}

export default function WorkflowActions({ workflowJson, onValidate, saveEndpoint }) {
  const [status, setStatus] = useState('');
  const [showJson, setShowJson] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const filename = `${workflowJson.workflow_id || 'workflow'}.json`;

  const showToast = (type, title, message, duration) => {
    setToast({ type, title, message, duration });
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(workflowJson, null, 2));
      setStatus('JSON copied to clipboard.');
      showToast('success', 'Copied', 'Workflow JSON copied to clipboard.');
    } catch (error) {
      const message = error.message || 'Could not copy JSON to clipboard.';
      setStatus(message);
      showToast('error', 'Copy failed', message);
    }
  };

  const download = () => {
    try {
      downloadJson(filename, workflowJson);
      setStatus('JSON downloaded.');
      showToast('success', 'Downloaded', `${filename} downloaded successfully.`);
    } catch (error) {
      const message = error.message || 'Could not download JSON.';
      setStatus(message);
      showToast('error', 'Download failed', message);
    }
  };

  const generateAndSave = async () => {
    const result = onValidate?.();
    if (result && result.errors.length > 0) {
      const message = getValidationMessage(result);
      setStatus(`Cannot save. Fix ${result.errors.length} validation issue(s).`);
      showToast('error', 'Validation failed', message, 9000);
      return;
    }

    setSaving(true);
    setStatus('Uploading workflow JSON...');
    try {
      await uploadWorkflowJson({
        workflowId: workflowJson.workflow_id,
        workflowJson,
        endpoint: saveEndpoint,
      });

      setStatus('Workflow JSON uploaded successfully.');
      showToast('success', 'Workflow saved', 'Workflow JSON uploaded successfully.');
    } catch (error) {
      const message = error.message || 'JSON upload failed.';
      setStatus(message);
      showToast('error', 'JSON upload failed', message, 9000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t bg-white">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-900">Workflow Output</div>
          <div className="text-xs text-gray-500 truncate">
            Live preview is hidden. Use copy, download, or generate/save when needed.
          </div>
          {status && <div className="text-xs text-blue-700 mt-1">{status}</div>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowJson((value) => !value)}
            className="px-3 py-2 text-sm rounded-lg border bg-white hover:bg-gray-50"
          >
            {showJson ? 'Hide JSON' : 'View JSON'}
          </button>
          <button
            type="button"
            onClick={copyJson}
            className="px-3 py-2 text-sm rounded-lg border bg-white hover:bg-gray-50"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={download}
            className="px-3 py-2 text-sm rounded-lg border bg-white hover:bg-gray-50"
          >
            Download
          </button>
          <button
            type="button"
            onClick={generateAndSave}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Generate / Save'}
          </button>
        </div>
      </div>

      {showJson && (
        <pre className="mx-4 mb-4 max-h-[260px] overflow-auto rounded-xl bg-gray-950 text-gray-100 text-xs p-4">
          {JSON.stringify(workflowJson, null, 2)}
        </pre>
      )}
    </div>
  );
}
