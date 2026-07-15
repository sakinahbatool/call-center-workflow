const DEFAULT_API_BASE_URL = import.meta.env.VITE_WORKFLOW_API_BASE_URL || 'http://10.0.150.83:8002';

function joinUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

async function readError(response, fallbackMessage) {
  try {
    const body = await response.text();
    return body || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export async function uploadDocument({ workflowId, file }) {
  const formData = new FormData();
  formData.append('workflow_id', workflowId || 'workflow');
  formData.append('file', file);

  const response = await fetch(joinUrl(DEFAULT_API_BASE_URL, '/documents/upload'), {
    method: 'POST',
    headers: {
      accept: 'application/json',
    },
    body: formData,
  });

  if (!response.ok) {
    const message = await readError(response, `Document upload failed: ${response.status}`);
    throw new Error(message);
  }

  return response.json();
}

export async function uploadWorkflowJson({ workflowId, workflowJson, endpoint }) {
  const safeWorkflowId = workflowId || 'workflow';
  const jsonBlob = new Blob([JSON.stringify(workflowJson, null, 2)], {
    type: 'application/json',
  });

  const jsonFile = new File([jsonBlob], `${safeWorkflowId}.json`, {
    type: 'application/json',
  });

  const formData = new FormData();
  formData.append('workflow_id', safeWorkflowId);
  formData.append('file', jsonFile);

  const response = await fetch(endpoint || joinUrl(DEFAULT_API_BASE_URL, '/json/upload'), {
    method: 'POST',
    headers: {
      accept: 'application/json',
    },
    body: formData,
  });

  if (!response.ok) {
    const message = await readError(response, `JSON upload failed: ${response.status}`);
    throw new Error(message);
  }

  return response.json();
}
