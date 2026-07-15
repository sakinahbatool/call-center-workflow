import { normalizeNodeForExport } from './nodeTemplates.js';

export const DEFAULT_WORKFLOW_META = {
  schema_version: '0.5',
  workflow_id: 'new_end_agent_workflow',
  name: 'New End-Agent Workflow',
  company_name: '',
  company_description: '',
  phone_number: '',
};

export function compileWorkflow({ workflowMeta, nodes, edges }) {
  const nodeTypeById = new Map(nodes.map((node) => [node.id, node.data?.nodeType]));

  return {
    schema_version: workflowMeta.schema_version || '0.5',
    workflow_id: workflowMeta.workflow_id || '',
    name: workflowMeta.name || '',
    company_name: workflowMeta.company_name || '',
    company_description: workflowMeta.company_description || '',
    nodes: nodes.map((node) => normalizeNodeForExport(node)),
    connections: edges.map((edge) => {
      const connection = {
        id: edge.id,
        from_node_id: edge.source,
        to_node_id: edge.target,
      };

      const branch = edge.data?.branch || edge.sourceHandle;
      if (nodeTypeById.get(edge.source) === 'if_condition' && ['true', 'false'].includes(branch)) {
        connection.branch = branch;
      }

      return connection;
    }),
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
