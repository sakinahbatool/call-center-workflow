const DEFAULT_API_BASE_URL = import.meta.env.VITE_WORKFLOW_API_BASE_URL || 'http://10.0.150.83:8002';

function joinUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function extractMessageFromJson(value) {
  if (!value) return '';

  if (typeof value === 'string') return value;

  if (Array.isArray(value)) {
    return value
      .map((item) => extractMessageFromJson(item))
      .filter(Boolean)
      .join('; ');
  }

  if (typeof value === 'object') {
    if (typeof value.detail === 'string') return value.detail;
    if (Array.isArray(value.detail)) return extractMessageFromJson(value.detail);
    if (typeof value.message === 'string') return value.message;
    if (typeof value.error === 'string') return value.error;

    const location = Array.isArray(value.loc) ? value.loc.join('.') : '';
    const message = value.msg || value.reason || '';
    if (location || message) return [location, message].filter(Boolean).join(': ');

    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }

  return String(value);
}

async function readError(response, fallbackMessage) {
  try {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const json = await response.json();
      return extractMessageFromJson(json) || fallbackMessage;
    }

    const body = await response.text();
    return body || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

async function parseSuccessResponse(response) {
  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) return response.json();
    const text = await response.text();
    return text ? { message: text } : {};
  } catch {
    return {};
  }
}

async function safeFetch(url, options, actionName) {
  try {
    return await fetch(url, options);
  } catch (error) {
    const message = error?.message || '';

    if (message.toLowerCase().includes('failed to fetch')) {
      throw new Error(
        `${actionName} could not reach the API or the browser blocked the response. `
        + 'Check that the backend is running, the API base URL is correct, and CORS is enabled.'
      );
    }

    throw new Error(message || `${actionName} failed.`);
  }
}

export async function uploadDocument({ workflowId, file }) {
  const formData = new FormData();
  formData.append('workflow_id', workflowId || 'workflow');
  formData.append('file', file);

  const response = await safeFetch(joinUrl(DEFAULT_API_BASE_URL, '/documents/upload'), {
    method: 'POST',
    headers: {
      accept: 'application/json',
    },
    body: formData,
  }, 'Document upload');

  if (!response.ok) {
    const message = await readError(response, `Document upload failed with status ${response.status}.`);
    throw new Error(message);
  }

  return parseSuccessResponse(response);
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

  const response = await safeFetch(endpoint || joinUrl(DEFAULT_API_BASE_URL, '/json/upload'), {
    method: 'POST',
    headers: {
      accept: 'application/json',
    },
    body: formData,
  }, 'JSON upload');

  if (!response.ok) {
    const message = await readError(response, `JSON upload failed with status ${response.status}.`);
    throw new Error(message);
  }

  return parseSuccessResponse(response);
}
