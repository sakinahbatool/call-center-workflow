import React, { useMemo, useState } from 'react';
import nodeTemplates, { getNodeFields, getSubtypeDisplay } from '../utils/nodeTemplates';
import { getByPath } from '../utils/objectPath';
import { uploadDocument } from '../utils/apiClient';
import Toast from './Toast';

function FieldLabel({ field }) {
  return (
    <label className="block text-xs font-semibold text-gray-700 mb-1">
      {field.label}
      {field.required && <span className="text-red-500 ml-1">*</span>}
      {field.sensitive && <span className="text-amber-600 ml-2 font-normal">sensitive</span>}
    </label>
  );
}

function StringArrayInput({ value, onChange, placeholder }) {
  const textValue = Array.isArray(value) ? value.join('\n') : '';
  return (
    <textarea
      className="w-full border rounded-lg px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={textValue}
      placeholder={placeholder || 'One item per line'}
      onChange={(e) => {
        const next = e.target.value
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean);
        onChange(next);
      }}
    />
  );
}

function JsonObjectInput({ value, onChange }) {
  const [draft, setDraft] = useState(() => JSON.stringify(value || {}, null, 2));
  const [error, setError] = useState('');

  return (
    <div>
      <textarea
        className={`w-full border rounded-lg px-3 py-2 text-sm font-mono min-h-[120px] focus:outline-none focus:ring-2 ${error ? 'border-red-400 focus:ring-red-300' : 'focus:ring-blue-500'}`}
        value={draft}
        onChange={(e) => {
          const nextDraft = e.target.value;
          setDraft(nextDraft);
          try {
            const parsed = JSON.parse(nextDraft || '{}');
            setError('');
            onChange(parsed);
          } catch {
            setError('Invalid JSON object');
          }
        }}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function FileArrayInput({ value, onChange, workflowId }) {
  const files = Array.isArray(value) ? value : [];
  const [uploadStatus, setUploadStatus] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (type, title, message, duration) => {
    setToast({ type, title, message, duration });
  };

  const handleFiles = async (event) => {
    const selected = Array.from(event.target.files || []);
    if (selected.length === 0) return;

    if (!workflowId?.trim()) {
      const message = 'Please enter Workflow ID before uploading Knowledge Base files.';
      setUploadStatus(message);
      showToast('error', 'Workflow ID required', message, 7000);
      event.target.value = '';
      return;
    }

    setUploadStatus(`Uploading ${selected.length} file(s)...`);

    const uploadedFiles = [];
    const failedFiles = [];

    for (const [index, file] of selected.entries()) {
      try {
        await uploadDocument({
          workflowId,
          file,
        });

        uploadedFiles.push({
          id: `file_${Date.now()}_${index}`,
          path: file.name,
          metadata: {
            title: file.name,
          },
        });
      } catch (error) {
        failedFiles.push(`${file.name}: ${error.message || 'upload failed'}`);
      }
    }

    if (uploadedFiles.length > 0) {
      onChange([...files, ...uploadedFiles]);
    }

    if (failedFiles.length > 0) {
      const message = `Uploaded ${uploadedFiles.length} file(s). Failed: ${failedFiles.join('; ')}`;
      setUploadStatus(message);
      showToast('error', 'Document upload failed', message, 10000);
    } else {
      const message = `Uploaded ${uploadedFiles.length} file(s) successfully.`;
      setUploadStatus(message);
      showToast('success', 'Document uploaded', message);
    }

    event.target.value = '';
  };

  const removeFile = (fileId) => {
    onChange(files.filter((file) => file.id !== fileId));
  };

  return (
    <div className="space-y-2">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <input
        type="file"
        multiple
        onChange={handleFiles}
        className="w-full text-sm border rounded-lg px-3 py-2 bg-white"
      />
      <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
Files are uploaded to the document API. The workflow JSON stores file metadata only.
      </p>
      {uploadStatus && (
        <p className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 break-words">
          {uploadStatus}
        </p>
      )}
      <div className="space-y-2">
        {files.map((file) => (
          <div key={file.id} className="flex items-center justify-between gap-2 border rounded-lg px-3 py-2 bg-gray-50">
            <div className="min-w-0">
              <div className="text-xs font-medium text-gray-800 truncate">{file.metadata?.title || file.path}</div>
              <div className="text-[10px] text-gray-500 truncate">{file.id}</div>
            </div>
            <button
              type="button"
              onClick={() => removeFile(file.id)}
              className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfigField({ field, value, onChange, workflowId }) {
  if (field.type === 'boolean') {
    return (
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        {field.label}
        {field.required && <span className="text-red-500">*</span>}
      </label>
    );
  }

  return (
    <div>
      <FieldLabel field={field} />
      {field.type === 'textarea' && (
        <textarea
          className="w-full border rounded-lg px-3 py-2 text-sm min-h-[90px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === 'select' && (
        <select
          className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        >
          {(field.options || []).map((option) => (
            <option key={option} value={option}>{option || 'Select'}</option>
          ))}
        </select>
      )}

      {field.type === 'number' && (
        <input
          type="number"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
      )}

      {field.type === 'time' && (
        <input
          type="time"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === 'password' && (
        <input
          type="password"
          autoComplete="off"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === 'stringArray' && (
        <StringArrayInput value={value} onChange={onChange} />
      )}

      {field.type === 'jsonObject' && (
        <JsonObjectInput value={value} onChange={onChange} />
      )}

      {field.type === 'fileArray' && (
        <FileArrayInput value={value} onChange={onChange} workflowId={workflowId} />
      )}

      {(!field.type || field.type === 'text') && (
        <input
          type="text"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

export default function ConfigSidebar({ width, workflowMeta, onWorkflowMetaChange, selectedNode, onNodeConfigChange }) {
  const template = selectedNode ? nodeTemplates[selectedNode.data?.nodeType] : null;
  const nodeFields = selectedNode && template
    ? getNodeFields(selectedNode.data?.nodeType, selectedNode.data?.config || {})
    : [];
  const subtypeDisplay = selectedNode && template
    ? getSubtypeDisplay(selectedNode.data?.nodeType, selectedNode.data?.config || {})
    : '';

  const metaFields = useMemo(() => [
    { key: 'schema_version', label: 'Schema Version' },
    { key: 'workflow_id', label: 'Workflow ID' },
    { key: 'name', label: 'Workflow Name' },
    { key: 'company_name', label: 'Company Name' },
    { key: 'company_description', label: 'Company Description' },
    { key: 'phone_number', label: 'Phone Number' },
  ], []);

  return (
    <aside
      style={{ width }}
      className="shrink-0 border-l bg-white flex flex-col min-w-[320px] max-w-[620px]"
    >
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Configuration</h2>
        <p className="text-xs text-gray-500 mt-1">Workflow and selected-node settings</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <section className="p-4 border-b bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Workflow</h3>
          <div className="space-y-3">
            {metaFields.map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{field.label}</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={workflowMeta[field.key] || ''}
                  onChange={(e) => onWorkflowMetaChange(field.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="p-4">
          {!selectedNode && (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">
              Select a node to edit its configuration.
            </div>
          )}

          {selectedNode && template && (
            <>
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{template.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{template.displayName}</h3>
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">
                      {selectedNode.id}{subtypeDisplay ? ` • ${subtypeDisplay}` : ''}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">{template.description}</p>
              </div>

              <div className="space-y-4">
                {nodeFields.map((field) => (
                  <ConfigField
                    key={field.key}
                    field={field}
                    value={getByPath(selectedNode.data.config, field.key)}
                    onChange={(value) => onNodeConfigChange(selectedNode.id, field.key, value)}
                    workflowId={workflowMeta.workflow_id}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </aside>
  );
}
