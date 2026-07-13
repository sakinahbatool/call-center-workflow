import { normalizeNodeForExport } from './nodeTemplates.js';

export const DEFAULT_WORKFLOW_META = {
  schema_version: '0.1',
  workflow_id: 'new_voice_workflow',
  name: 'New Voice Workflow',
  phone_number: '',
};

export function compileWorkflow({ workflowMeta, nodes, edges }) {
  return {
    schema_version: workflowMeta.schema_version || '0.1',
    workflow_id: workflowMeta.workflow_id || '',
    name: workflowMeta.name || '',
    nodes: nodes.map((node) => normalizeNodeForExport(node)),
    connections: edges.map((edge) => ({
      id: edge.id,
      from_node_id: edge.source,
      to_node_id: edge.target,
    })),
    phone_number: workflowMeta.phone_number || '',
  };
}

export function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
