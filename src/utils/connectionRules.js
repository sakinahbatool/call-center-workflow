// Temporary sequence rules inferred from latest.json and updated for grouped UI nodes.
// Replace once AI team provides final sequence vs attachment rules.
export const ALLOWED_CONNECTIONS = {
  memory: ['voice_agent'],
  schedule: ['voice_agent'],
  summarizer: ['voice_agent'],
  knowledge_base: ['voice_agent'],
  voice_agent: [
    'tool_call',
    'message',
    'db_logs',
    'llm',
    'messaging_app',
  ],
  tool_call: ['knowledge_base', 'end_call', 'database_connection'],
  webhook: ['voice_agent'],
  llm: ['tool_call'],
  whatsapp_trigger: ['voice_agent'],
  sms_trigger: ['voice_agent'],
  slack_trigger: ['voice_agent'],
  email_trigger: ['voice_agent'],
};

export function isConnectionAllowed(sourceType, targetType) {
  if (!sourceType || !targetType) return false;
  return ALLOWED_CONNECTIONS[sourceType]?.includes(targetType) ?? false;
}

export function getConnectionError(sourceType, targetType) {
  return `${sourceType || 'Unknown source'} cannot connect to ${targetType || 'unknown target'} in the current rules.`;
}
