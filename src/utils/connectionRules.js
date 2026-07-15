export const TRIGGER_NODE_TYPES = [
  'schedule',
  'webhook',
  'call_trigger',
  'whatsapp_trigger',
  'sms_trigger',
  'slack_trigger',
  'email_trigger',
];

export const SEND_MESSAGE_NODE_TYPES = [
  'whatsapp_message',
  'sms_message',
  'slack_message',
  'email_send',
  // Backward-compatible grouped UI node.
  'messaging_app',
];

export const DB_CONNECTION_NODE_TYPES = [
  'mysql_connection',
  'postgresql_connection',
  'microsoft_sql_connection',
  // Backward-compatible grouped UI node.
  'database_connection',
];

const sendMessageNodes = [...SEND_MESSAGE_NODE_TYPES];
const databaseConnectionNodes = [...DB_CONNECTION_NODE_TYPES];

export const ALLOWED_CONNECTIONS = {
  schedule: ['voice_agent_start'],
  webhook: ['voice_agent_start'],
  call_trigger: ['voice_agent_start'],
  whatsapp_trigger: ['voice_agent_start'],
  sms_trigger: ['voice_agent_start'],
  slack_trigger: ['voice_agent_start'],
  email_trigger: ['voice_agent_start'],

  voice_agent_start: ['initial_message', 'memory', 'data_capture_verification', 'agent'],
  initial_message: ['memory', 'data_capture_verification', 'agent'],
  memory: ['data_capture_verification', 'agent'],

  data_capture_verification: ['db_query', 'agent', 'message', 'if_condition'],

  db_query: [
    ...databaseConnectionNodes,
    'tool_call',
    'message',
    'if_condition',
    'end_agent',
    'llm',
    'crm',
    'ticketing',
    'external_api',
    'routing',
    ...sendMessageNodes,
  ],

  agent: ['tool_call', 'message', 'if_condition', 'fallback', 'end_agent', 'last_message', 'end_call'],

  tool_call: [
    'knowledge_base',
    'db_query',
    'crm',
    'ticketing',
    'external_api',
    'routing',
    ...sendMessageNodes,
    'llm',
    'message',
    'data_capture_verification',
    'fallback',
    'end_agent',
    'end_call',
  ],

  knowledge_base: ['tool_call'],

  crm: [
    'tool_call',
    'message',
    'if_condition',
    'end_agent',
    'llm',
    'ticketing',
    'external_api',
    'routing',
    ...sendMessageNodes,
  ],

  ticketing: [
    'tool_call',
    'message',
    'if_condition',
    'end_agent',
    'crm',
    'external_api',
    'routing',
    ...sendMessageNodes,
    'llm',
  ],

  external_api: [
    'tool_call',
    'message',
    'if_condition',
    'end_agent',
    'crm',
    'ticketing',
    'routing',
    ...sendMessageNodes,
    'llm',
  ],

  routing: ['tool_call', 'end_agent', 'message', 'fallback', 'end_call', 'llm', ...sendMessageNodes],

  fallback: ['agent', 'routing', 'end_agent', 'message', 'end_call'],

  message: [
    'tool_call',
    'if_condition',
    'end_agent',
    'last_message',
    'end_call',
    ...sendMessageNodes,
    'llm',
  ],

  if_condition: [
    'tool_call',
    'message',
    'fallback',
    'end_agent',
    'last_message',
    'end_call',
    'crm',
    'ticketing',
    'external_api',
    'routing',
    'db_query',
    'llm',
    ...sendMessageNodes,
  ],

  end_agent: [
    'agent',
    'llm',
    'db_query',
    'crm',
    'ticketing',
    'external_api',
    'routing',
    'message',
    ...sendMessageNodes,
    'end_call',
    'last_message',
    'if_condition',
  ],

  llm: [
    'agent',
    'db_query',
    'crm',
    'ticketing',
    'external_api',
    'routing',
    'message',
    ...sendMessageNodes,
    'if_condition',
    'last_message',
    'end_call',
    'db_logs',
  ],

  whatsapp_message: ['tool_call', 'message', 'if_condition', 'end_agent', 'last_message', 'end_call', 'llm'],
  sms_message: ['tool_call', 'message', 'if_condition', 'end_agent', 'last_message', 'end_call', 'llm'],
  slack_message: ['tool_call', 'message', 'if_condition', 'end_agent', 'last_message', 'end_call', 'llm'],
  email_send: ['tool_call', 'message', 'if_condition', 'end_agent', 'last_message', 'end_call', 'llm'],
  messaging_app: ['tool_call', 'message', 'if_condition', 'end_agent', 'last_message', 'end_call', 'llm'],

  last_message: ['end_call'],

  end_call: ['transcription', 'summarizer', 'llm', 'db_logs', ...sendMessageNodes],

  transcription: ['summarizer', 'llm', 'db_logs'],

  summarizer: ['llm', 'db_logs', 'crm', 'ticketing', 'external_api', ...sendMessageNodes],

  db_logs: ['crm', 'ticketing', 'external_api', ...sendMessageNodes],
};

export function isConnectionAllowed(sourceType, targetType) {
  if (!sourceType || !targetType) return false;
  return ALLOWED_CONNECTIONS[sourceType]?.includes(targetType) ?? false;
}

export function getConnectionError(sourceType, targetType) {
  return `${sourceType || 'Unknown source'} cannot connect to ${targetType || 'unknown target'} according to the latest allowed connection rules.`;
}
