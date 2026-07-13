export const NODE_CATEGORIES = [
  'Core',
  'Triggers',
  'Messaging',
  'Knowledge & Tools',
  'AI',
  'Storage & Logs',
  'Database Connections',
  'Call Control',
];

export const MESSAGING_APP_TYPES = [
  { value: 'whatsapp_message', label: 'WhatsApp Message' },
  { value: 'sms_message', label: 'SMS Message' },
  { value: 'slack_message', label: 'Slack Message' },
  { value: 'email_send', label: 'Email Send' },
];

export const DATABASE_CONNECTION_TYPES = [
  { value: 'mysql_connection', label: 'MySQL' },
  { value: 'postgresql_connection', label: 'PostgreSQL' },
  { value: 'microsoft_sql_connection', label: 'Microsoft SQL Server' },
];

const messagingFieldsByType = {
  whatsapp_message: [
    { key: 'recipient_number', label: 'Recipient Number', type: 'text', required: true },
    { key: 'message_text', label: 'Message Text', type: 'textarea', required: true },
    { key: 'template_name', label: 'Template Name', type: 'text', required: true },
    { key: 'variables', label: 'Variables', type: 'jsonObject', required: true },
  ],
  sms_message: [
    { key: 'recipient_number', label: 'Recipient Number', type: 'text', required: true },
    { key: 'message_text', label: 'Message Text', type: 'textarea', required: true },
  ],
  slack_message: [
    { key: 'workspace', label: 'Workspace', type: 'text', required: true },
    { key: 'channel_or_user', label: 'Channel Or User', type: 'text', required: true },
    { key: 'message_text', label: 'Message Text', type: 'textarea', required: true },
    { key: 'attach_call_summary', label: 'Attach Call Summary', type: 'boolean', required: true },
  ],
  email_send: [
    { key: 'to', label: 'To', type: 'stringArray', required: true },
    { key: 'cc', label: 'CC', type: 'stringArray', required: false },
    { key: 'bcc', label: 'BCC', type: 'stringArray', required: false },
    { key: 'subject', label: 'Subject', type: 'text', required: true },
    { key: 'body', label: 'Body', type: 'textarea', required: true },
  ],
};

const databaseFieldsByType = {
  mysql_connection: [
    { key: 'connection_string', label: 'Connection String', type: 'password', required: true, sensitive: true },
    { key: 'connection_timeout_seconds', label: 'Connection Timeout Seconds', type: 'number', required: false },
    { key: 'ssl_enabled', label: 'SSL Enabled', type: 'boolean', required: false },
    { key: 'read_only', label: 'Read Only', type: 'boolean', required: false },
  ],
  postgresql_connection: [
    { key: 'connection_string', label: 'Connection String', type: 'password', required: true, sensitive: true },
    { key: 'connection_timeout_seconds', label: 'Connection Timeout Seconds', type: 'number', required: false },
    { key: 'ssl_enabled', label: 'SSL Enabled', type: 'boolean', required: false },
    { key: 'read_only', label: 'Read Only', type: 'boolean', required: false },
  ],
  microsoft_sql_connection: [
    { key: 'connection_string', label: 'Connection String', type: 'password', required: true, sensitive: true },
    { key: 'connection_timeout_seconds', label: 'Connection Timeout Seconds', type: 'number', required: false },
    { key: 'encrypt_connection', label: 'Encrypt Connection', type: 'boolean', required: false },
    { key: 'trust_server_certificate', label: 'Trust Server Certificate', type: 'boolean', required: false },
    { key: 'read_only', label: 'Read Only', type: 'boolean', required: false },
  ],
};

const messagingExportKeys = {
  whatsapp_message: ['recipient_number', 'message_text', 'template_name', 'variables'],
  sms_message: ['recipient_number', 'message_text'],
  slack_message: ['workspace', 'channel_or_user', 'message_text', 'attach_call_summary'],
  email_send: ['to', 'cc', 'bcc', 'subject', 'body'],
};

const databaseExportKeys = {
  mysql_connection: ['connection_string', 'connection_timeout_seconds', 'ssl_enabled', 'read_only'],
  postgresql_connection: ['connection_string', 'connection_timeout_seconds', 'ssl_enabled', 'read_only'],
  microsoft_sql_connection: ['connection_string', 'connection_timeout_seconds', 'encrypt_connection', 'trust_server_certificate', 'read_only'],
};

export const nodeTemplates = {
  voice_agent: {
    displayName: 'Voice Agent',
    description: 'Main AI voice agent that handles the call or conversation.',
    category: 'Core',
    icon: '🎙️',
    shape: 'agent',
    accent: 'border-blue-500 bg-blue-50',
    defaultConfig: {
      company_name: '',
      company_description: '',
      voice_agent_name: '',
      agent_gender: '',
      main_prompt: '',
      dos: [],
      donts: [],
      initial_greeting: '',
      purpose: '',
    },
    fields: [
      { key: 'company_name', label: 'Company Name', type: 'text', required: true },
      { key: 'company_description', label: 'Company Description', type: 'textarea', required: true },
      { key: 'voice_agent_name', label: 'Voice Agent Name', type: 'text', required: true },
      { key: 'agent_gender', label: 'Agent Gender', type: 'select', required: true, options: ['male', 'female', 'neutral'] },
      { key: 'main_prompt', label: 'Main Prompt', type: 'textarea', required: true },
      { key: 'dos', label: "Do's", type: 'stringArray', required: true },
      { key: 'donts', label: "Don'ts", type: 'stringArray', required: true },
      { key: 'initial_greeting', label: 'Initial Greeting', type: 'textarea', required: true },
      { key: 'purpose', label: 'Purpose', type: 'textarea', required: true },
    ],
  },

  memory: {
    displayName: 'Memory',
    description: 'Controls conversation memory and saved conversation history.',
    category: 'Core',
    icon: '🧠',
    shape: 'capsule',
    accent: 'border-purple-500 bg-purple-50',
    defaultConfig: {
      use_memory: true,
      context_last_messages: 8,
      save_conversation_history: true,
    },
    fields: [
      { key: 'use_memory', label: 'Use Memory', type: 'boolean', required: false },
      { key: 'context_last_messages', label: 'Context Last Messages', type: 'number', required: false },
      { key: 'save_conversation_history', label: 'Save Conversation History', type: 'boolean', required: false },
    ],
  },

  schedule: {
    displayName: 'Schedule',
    description: 'Defines when and how often calls should happen.',
    category: 'Triggers',
    icon: '📅',
    shape: 'hexagon',
    accent: 'border-amber-500 bg-amber-50',
    defaultConfig: {
      schedule_type: 'immediately',
      day_of_week: '',
      time: '',
      timezone: 'Asia/Karachi',
      total_calls: 1,
    },
    fields: [
      { key: 'schedule_type', label: 'Schedule Type', type: 'select', required: true, options: ['immediately', 'daily', 'weekly', 'monthly', 'once'] },
      { key: 'day_of_week', label: 'Day of Week', type: 'select', required: false, options: ['', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
      { key: 'time', label: 'Time', type: 'time', required: false },
      { key: 'timezone', label: 'Timezone', type: 'text', required: true },
      { key: 'total_calls', label: 'Total Calls', type: 'number', required: false },
    ],
  },

  summarizer: {
    displayName: 'Summarizer',
    description: 'Summarizes the saved conversation after the call.',
    category: 'AI',
    icon: '📝',
    shape: 'document',
    accent: 'border-indigo-500 bg-indigo-50',
    defaultConfig: { instruction: '' },
    fields: [
      { key: 'instruction', label: 'Instruction', type: 'textarea', required: true },
    ],
  },

  knowledge_base: {
    displayName: 'Knowledge Base',
    description: 'Contains uploaded files used as knowledge for answers.',
    category: 'Knowledge & Tools',
    icon: '📚',
    shape: 'documentStack',
    accent: 'border-emerald-500 bg-emerald-50',
    defaultConfig: { description: '', files: [] },
    fields: [
      { key: 'description', label: 'Description', type: 'textarea', required: true },
      { key: 'files', label: 'Files', type: 'fileArray', required: true },
    ],
  },

  tool_call: {
    displayName: 'Tool Call',
    description: 'Defines the condition for using a connected tool/resource.',
    category: 'Knowledge & Tools',
    icon: '🛠️',
    shape: 'diamond',
    accent: 'border-orange-500 bg-orange-50',
    defaultConfig: { condition: '' },
    fields: [
      { key: 'condition', label: 'Condition', type: 'textarea', required: true },
    ],
  },

  message: {
    displayName: 'Message',
    description: 'Defines a fixed response when a condition is met.',
    category: 'Messaging',
    icon: '💬',
    shape: 'bubble',
    accent: 'border-cyan-500 bg-cyan-50',
    defaultConfig: { condition: '', message: '' },
    fields: [
      { key: 'condition', label: 'Condition', type: 'textarea', required: true },
      { key: 'message', label: 'Message', type: 'textarea', required: true },
    ],
  },

  db_logs: {
    displayName: 'DB Logs',
    description: 'Selects which call fields should be saved in logs.',
    category: 'Storage & Logs',
    icon: '🗄️',
    shape: 'database',
    accent: 'border-slate-500 bg-slate-50',
    defaultConfig: {
      save_fields: {
        call_from: true,
        call_to: true,
        call_transcription: true,
        call_summary: true,
        call_time_and_date: true,
        call_status: true,
      },
    },
    fields: [
      { key: 'save_fields.call_from', label: 'Save Call From', type: 'boolean', required: false },
      { key: 'save_fields.call_to', label: 'Save Call To', type: 'boolean', required: false },
      { key: 'save_fields.call_transcription', label: 'Save Call Transcription', type: 'boolean', required: false },
      { key: 'save_fields.call_summary', label: 'Save Call Summary', type: 'boolean', required: false },
      { key: 'save_fields.call_time_and_date', label: 'Save Call Time & Date', type: 'boolean', required: false },
      { key: 'save_fields.call_status', label: 'Save Call Status', type: 'boolean', required: false },
    ],
  },

  llm: {
    displayName: 'LLM',
    description: 'Runs a user-provided prompt as a separate LLM workflow step.',
    category: 'AI',
    icon: '✨',
    shape: 'crystal',
    accent: 'border-fuchsia-500 bg-fuchsia-50',
    defaultConfig: { prompt: '' },
    fields: [
      { key: 'prompt', label: 'Prompt', type: 'textarea', required: true },
    ],
  },

  webhook: {
    displayName: 'Webhook',
    description: 'Defines webhook trigger settings for starting or activating a workflow.',
    category: 'Triggers',
    icon: '⚡',
    shape: 'hexagon',
    accent: 'border-yellow-500 bg-yellow-50',
    defaultConfig: {
      webhook_url: '',
      active_time_window: { timezone: 'Asia/Karachi', start_time: '09:00', end_time: '18:00', days: [] },
      allowed_trigger_source: '',
      trigger_action: '',
      voice_agent_to_activate: '',
    },
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', type: 'text', required: true },
      { key: 'active_time_window.timezone', label: 'Timezone', type: 'text', required: true },
      { key: 'active_time_window.start_time', label: 'Start Time', type: 'time', required: true },
      { key: 'active_time_window.end_time', label: 'End Time', type: 'time', required: true },
      { key: 'active_time_window.days', label: 'Active Days', type: 'stringArray', required: true },
      { key: 'allowed_trigger_source', label: 'Allowed Trigger Source', type: 'text', required: true },
      { key: 'trigger_action', label: 'Trigger Action', type: 'text', required: true },
      { key: 'voice_agent_to_activate', label: 'Voice Agent To Activate', type: 'text', required: true },
    ],
  },

  end_call: {
    displayName: 'End Call',
    description: 'Defines when to end the call and what to say before ending it.',
    category: 'Call Control',
    icon: '⛔',
    shape: 'octagon',
    accent: 'border-red-500 bg-red-50',
    defaultConfig: { condition: '', message_before_ending: '' },
    fields: [
      { key: 'condition', label: 'Condition', type: 'textarea', required: true },
      { key: 'message_before_ending', label: 'Message Before Ending', type: 'textarea', required: false },
    ],
  },

  whatsapp_trigger: {
    displayName: 'WhatsApp Trigger',
    description: 'Starts workflow when a WhatsApp message is received.',
    category: 'Triggers',
    icon: '🟢',
    shape: 'hexagon',
    accent: 'border-green-500 bg-green-50',
    defaultConfig: {
      whatsapp_number: '',
      incoming_message_condition: '',
      customer_phone_number: '',
      message_content: '',
    },
    fields: [
      { key: 'whatsapp_number', label: 'WhatsApp Number', type: 'text', required: true },
      { key: 'incoming_message_condition', label: 'Incoming Message Condition', type: 'textarea', required: true },
      { key: 'customer_phone_number', label: 'Customer Phone Number', type: 'text', required: true },
      { key: 'message_content', label: 'Message Content', type: 'textarea', required: true },
    ],
  },

  sms_trigger: {
    displayName: 'SMS Trigger',
    description: 'Starts workflow when an SMS is received.',
    category: 'Triggers',
    icon: '📲',
    shape: 'hexagon',
    accent: 'border-lime-500 bg-lime-50',
    defaultConfig: { sms_number: '', incoming_message_condition: '' },
    fields: [
      { key: 'sms_number', label: 'SMS Number', type: 'text', required: true },
      { key: 'incoming_message_condition', label: 'Incoming Message Condition', type: 'textarea', required: true },
    ],
  },

  slack_trigger: {
    displayName: 'Slack Trigger',
    description: 'Starts workflow when a Slack message is received.',
    category: 'Triggers',
    icon: '💜',
    shape: 'hexagon',
    accent: 'border-violet-500 bg-violet-50',
    defaultConfig: { workspace: '', channel: '', trigger_keyword: '', sender: '', message_content: '' },
    fields: [
      { key: 'workspace', label: 'Workspace', type: 'text', required: true },
      { key: 'channel', label: 'Channel', type: 'text', required: true },
      { key: 'trigger_keyword', label: 'Trigger Keyword', type: 'text', required: true },
      { key: 'sender', label: 'Sender', type: 'text', required: true },
      { key: 'message_content', label: 'Message Content', type: 'textarea', required: true },
    ],
  },

  email_trigger: {
    displayName: 'Email Trigger',
    description: 'Starts workflow when an email is received.',
    category: 'Triggers',
    icon: '📧',
    shape: 'hexagon',
    accent: 'border-sky-500 bg-sky-50',
    defaultConfig: { email_inbox: '', sender_condition: '', subject_condition: '', body_condition: '' },
    fields: [
      { key: 'email_inbox', label: 'Email Inbox', type: 'text', required: true },
      { key: 'sender_condition', label: 'Sender Condition', type: 'textarea', required: true },
      { key: 'subject_condition', label: 'Subject Condition', type: 'textarea', required: true },
      { key: 'body_condition', label: 'Body Condition', type: 'textarea', required: true },
    ],
  },

  messaging_app: {
    displayName: 'Messaging Apps',
    description: 'Sends WhatsApp, SMS, Slack, or email messages based on selected app type.',
    category: 'Messaging',
    icon: '📨',
    shape: 'appCard',
    accent: 'border-teal-500 bg-teal-50',
    subtypeKey: 'app_type',
    subtypeLabel: 'App Type',
    defaultConfig: {
      app_type: 'whatsapp_message',
      recipient_number: '',
      message_text: '',
      template_name: '',
      variables: {},
      workspace: '',
      channel_or_user: '',
      attach_call_summary: true,
      to: [],
      cc: [],
      bcc: [],
      subject: '',
      body: '',
    },
    fields: [
      { key: 'app_type', label: 'Messaging App', type: 'select', required: true, options: MESSAGING_APP_TYPES.map((item) => item.value) },
    ],
    dynamicFieldsBySubtype: messagingFieldsByType,
  },

  database_connection: {
    displayName: 'DB Connection',
    description: 'Connects securely to MySQL, PostgreSQL, or Microsoft SQL Server.',
    category: 'Database Connections',
    icon: '🔐',
    shape: 'database',
    accent: 'border-blue-600 bg-blue-50',
    subtypeKey: 'database_type',
    subtypeLabel: 'Database Type',
    defaultConfig: {
      database_type: 'mysql_connection',
      connection_string: '${SECRET:MYSQL_CONNECTION_STRING}',
      connection_timeout_seconds: 30,
      ssl_enabled: true,
      encrypt_connection: true,
      trust_server_certificate: false,
      read_only: true,
    },
    fields: [
      { key: 'database_type', label: 'Database Type', type: 'select', required: true, options: DATABASE_CONNECTION_TYPES.map((item) => item.value) },
    ],
    dynamicFieldsBySubtype: databaseFieldsByType,
  },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function pickConfig(config, keys) {
  return keys.reduce((acc, key) => {
    acc[key] = config?.[key];
    return acc;
  }, {});
}

export function getNodeFields(nodeType, config = {}) {
  const template = nodeTemplates[nodeType];
  if (!template) return [];

  const fields = [...(template.fields || [])];
  const subtypeKey = template.subtypeKey;
  if (subtypeKey && template.dynamicFieldsBySubtype) {
    const subtype = config?.[subtypeKey];
    fields.push(...(template.dynamicFieldsBySubtype[subtype] || []));
  }
  return fields;
}

export function getSubtypeDisplay(nodeType, config = {}) {
  const template = nodeTemplates[nodeType];
  if (!template?.subtypeKey) return '';
  const value = config?.[template.subtypeKey];
  const list = nodeType === 'messaging_app' ? MESSAGING_APP_TYPES : DATABASE_CONNECTION_TYPES;
  return list.find((item) => item.value === value)?.label || value || '';
}

export function normalizeNodeForExport(node) {
  const nodeType = node.data?.nodeType || '';
  const config = clone(node.data?.config || {});

  if (nodeType === 'messaging_app') {
    const exportType = config.app_type || 'whatsapp_message';
    return {
      id: node.id,
      type: exportType,
      config: pickConfig(config, messagingExportKeys[exportType] || []),
    };
  }

  if (nodeType === 'database_connection') {
    const exportType = config.database_type || 'mysql_connection';
    return {
      id: node.id,
      type: exportType,
      config: pickConfig(config, databaseExportKeys[exportType] || []),
    };
  }

  return {
    id: node.id,
    type: nodeType,
    config,
  };
}

export default nodeTemplates;
