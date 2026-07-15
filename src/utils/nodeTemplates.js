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
  slack_message: ['workspace', 'channel_or_user', 'message_text'],
  email_send: ['to', 'cc', 'bcc', 'subject', 'body'],
};

const databaseExportKeys = {
  mysql_connection: ['connection_string', 'connection_timeout_seconds', 'ssl_enabled', 'read_only'],
  postgresql_connection: ['connection_string', 'connection_timeout_seconds', 'ssl_enabled', 'read_only'],
  microsoft_sql_connection: ['connection_string', 'connection_timeout_seconds', 'encrypt_connection', 'trust_server_certificate', 'read_only'],
};

export const nodeTemplates = {
  // Legacy node kept for backward compatibility only. Latest workflows should use voice_agent_start + agent.
  voice_agent: {
    displayName: 'Voice Agent',
    description: 'Legacy full voice agent node. Latest workflows should use Voice Agent Start plus Agent.',
    category: 'Core',
    icon: '🎙️',
    shape: 'agent',
    accent: 'border-slate-500 bg-slate-50',
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

  voice_agent_start: {
    displayName: 'Voice Agent Start',
    description: 'Initializes global voice and speech settings for the complete live call.',
    category: 'Core',
    icon: '🎙️',
    shape: 'agent',
    accent: 'border-blue-500 bg-blue-50',
    defaultConfig: {
      voice_agent_name: '',
      agent_gender: '',
      voice_id: '',
      language: 'en-PK',
      speaking_speed: 1.0,
    },
    fields: [
      { key: 'voice_agent_name', label: 'Voice Agent Name', type: 'text', required: true },
      { key: 'agent_gender', label: 'Agent Gender', type: 'select', required: true, options: ['male', 'female', 'neutral'] },
      { key: 'voice_id', label: 'Voice ID', type: 'text', required: true },
      { key: 'language', label: 'Language', type: 'text', required: true },
      { key: 'speaking_speed', label: 'Speaking Speed', type: 'number', required: true },
    ],
  },

  initial_message: {
    displayName: 'Initial Message',
    description: 'Plays the first fixed message after the voice agent starts.',
    category: 'Core',
    icon: '👋',
    shape: 'bubble',
    accent: 'border-sky-500 bg-sky-50',
    defaultConfig: { message: '' },
    fields: [
      { key: 'message', label: 'Message', type: 'textarea', required: true },
    ],
  },

  agent: {
    displayName: 'Agent',
    description: 'Defines one active conversational phase and its prompt behavior.',
    category: 'Core',
    icon: '🤖',
    shape: 'agent',
    accent: 'border-blue-600 bg-blue-50',
    defaultConfig: { prompt: '', purpose: '', dos: [], donts: [] },
    fields: [
      { key: 'prompt', label: 'Prompt', type: 'textarea', required: true },
      { key: 'purpose', label: 'Purpose', type: 'textarea', required: true },
      { key: 'dos', label: "Do's", type: 'stringArray', required: true },
      { key: 'donts', label: "Don'ts", type: 'stringArray', required: true },
    ],
  },

  end_agent: {
    displayName: 'End Agent',
    description: 'Ends only the current agent phase and exposes selected fields downstream.',
    category: 'Core',
    icon: '🔁',
    shape: 'hexagon',
    accent: 'border-cyan-600 bg-cyan-50',
    defaultConfig: { condition: '', return_fields: [] },
    fields: [
      { key: 'condition', label: 'Condition', type: 'textarea', required: false },
      { key: 'return_fields', label: 'Return Fields', type: 'stringArray', required: true },
    ],
  },

  memory: {
    displayName: 'Memory',
    description: 'Controls conversation memory and saved conversation history.',
    category: 'Core',
    icon: '🧠',
    shape: 'capsule',
    accent: 'border-purple-500 bg-purple-50',
    defaultConfig: { use_memory: true, context_last_messages: 8, save_conversation_history: true },
    fields: [
      { key: 'use_memory', label: 'Use Memory', type: 'boolean', required: false },
      { key: 'context_last_messages', label: 'Context Last Messages', type: 'number', required: false },
      { key: 'save_conversation_history', label: 'Save Conversation History', type: 'boolean', required: false },
    ],
  },

  schedule: {
    displayName: 'Schedule',
    description: 'Starts the workflow according to a configured schedule.',
    category: 'Triggers',
    icon: '📅',
    shape: 'hexagon',
    accent: 'border-amber-500 bg-amber-50',
    defaultConfig: { schedule_type: 'immediately', day_of_week: '', time: '', timezone: 'Asia/Karachi', total_calls: 1 },
    fields: [
      { key: 'schedule_type', label: 'Schedule Type', type: 'select', required: true, options: ['immediately', 'daily', 'weekly', 'monthly', 'once'] },
      { key: 'day_of_week', label: 'Day of Week', type: 'select', required: false, options: ['', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
      { key: 'time', label: 'Time', type: 'time', required: false },
      { key: 'timezone', label: 'Timezone', type: 'text', required: true },
      { key: 'total_calls', label: 'Total Calls', type: 'number', required: false },
    ],
  },

  webhook: {
    displayName: 'Webhook',
    description: 'Starts the workflow from an approved webhook request.',
    category: 'Triggers',
    icon: '⚡',
    shape: 'hexagon',
    accent: 'border-yellow-500 bg-yellow-50',
    defaultConfig: {
      webhook_url: '',
      active_time_window: { timezone: 'Asia/Karachi', start_time: '09:00', end_time: '18:00', days: [] },
      allowed_trigger_source: '',
      trigger_action: '',
    },
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', type: 'text', required: true },
      { key: 'active_time_window.timezone', label: 'Timezone', type: 'text', required: true },
      { key: 'active_time_window.start_time', label: 'Start Time', type: 'time', required: true },
      { key: 'active_time_window.end_time', label: 'End Time', type: 'time', required: true },
      { key: 'active_time_window.days', label: 'Active Days', type: 'stringArray', required: true },
      { key: 'allowed_trigger_source', label: 'Allowed Trigger Source', type: 'text', required: true },
      { key: 'trigger_action', label: 'Trigger Action', type: 'text', required: true },
    ],
  },

  call_trigger: {
    displayName: 'Call Trigger',
    description: 'Starts the workflow when an inbound or outbound call event is received.',
    category: 'Triggers',
    icon: '📞',
    shape: 'hexagon',
    accent: 'border-emerald-500 bg-emerald-50',
    defaultConfig: { from: '', to: '', purpose: '' },
    fields: [
      { key: 'from', label: 'From', type: 'text', required: true },
      { key: 'to', label: 'To', type: 'text', required: true },
      { key: 'purpose', label: 'Purpose', type: 'textarea', required: true },
    ],
  },

  whatsapp_trigger: {
    displayName: 'WhatsApp Trigger',
    description: 'Starts workflow when a WhatsApp message is received.',
    category: 'Triggers',
    icon: '🟢',
    shape: 'hexagon',
    accent: 'border-green-500 bg-green-50',
    defaultConfig: { whatsapp_number: '', incoming_message_condition: '', customer_phone_number: '', message_content: '' },
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

  data_capture_verification: {
    displayName: 'Data Capture',
    description: 'Collects user-provided fields and passes structured values for verification or lookup.',
    category: 'Knowledge & Tools',
    icon: '🧾',
    shape: 'document',
    accent: 'border-orange-500 bg-orange-50',
    defaultConfig: { fields: [], prompt: '', operation: 'verify' },
    fields: [
      { key: 'fields', label: 'Fields JSON Array', type: 'jsonObject', required: true },
      { key: 'prompt', label: 'Prompt', type: 'textarea', required: true },
      { key: 'operation', label: 'Operation', type: 'select', required: true, options: ['verify', 'find', 'insert', 'update'] },
    ],
  },

  tool_call: {
    displayName: 'Tool Call',
    description: 'Defines when the active agent may invoke one connected tool or action.',
    category: 'Knowledge & Tools',
    icon: '🛠️',
    shape: 'diamond',
    accent: 'border-orange-500 bg-orange-50',
    defaultConfig: { condition: '' },
    fields: [
      { key: 'condition', label: 'Condition', type: 'textarea', required: true },
    ],
  },

  knowledge_base: {
    displayName: 'Knowledge Base',
    description: 'Contains uploaded files used as knowledge for retrieval-augmented answers.',
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

  db_query: {
    displayName: 'DB Query',
    description: 'Executes a parameterized database operation using one connected DB connection.',
    category: 'Knowledge & Tools',
    icon: '🔎',
    shape: 'document',
    accent: 'border-slate-600 bg-slate-50',
    defaultConfig: { operation: 'verify', query: '', parameters: {} },
    fields: [
      { key: 'operation', label: 'Operation', type: 'select', required: true, options: ['verify', 'find', 'insert', 'update', 'query'] },
      { key: 'query', label: 'Query', type: 'textarea', required: true },
      { key: 'parameters', label: 'Parameters', type: 'jsonObject', required: true },
    ],
  },

  mysql_connection: {
    displayName: 'MySQL',
    description: 'Stores secure connection configuration for a MySQL database.',
    category: 'Database Connections',
    icon: '🐬',
    shape: 'database',
    accent: 'border-orange-500 bg-orange-50',
    defaultConfig: { connection_string: '${SECRET:MYSQL_CONNECTION_STRING}', connection_timeout_seconds: 30, ssl_enabled: true, read_only: true },
    fields: databaseFieldsByType.mysql_connection,
  },

  postgresql_connection: {
    displayName: 'PostgreSQL',
    description: 'Stores secure connection configuration for a PostgreSQL database.',
    category: 'Database Connections',
    icon: '🐘',
    shape: 'database',
    accent: 'border-blue-600 bg-blue-50',
    defaultConfig: { connection_string: '${SECRET:POSTGRESQL_CONNECTION_STRING}', connection_timeout_seconds: 30, ssl_enabled: true, read_only: true },
    fields: databaseFieldsByType.postgresql_connection,
  },

  microsoft_sql_connection: {
    displayName: 'Microsoft SQL',
    description: 'Stores secure connection configuration for Microsoft SQL Server.',
    category: 'Database Connections',
    icon: '🧱',
    shape: 'database',
    accent: 'border-indigo-600 bg-indigo-50',
    defaultConfig: { connection_string: '${SECRET:MICROSOFT_SQL_CONNECTION_STRING}', connection_timeout_seconds: 30, encrypt_connection: true, trust_server_certificate: false, read_only: true },
    fields: databaseFieldsByType.microsoft_sql_connection,
  },

  crm: {
    displayName: 'CRM',
    description: 'Reads or updates customer records in a CRM.',
    category: 'Knowledge & Tools',
    icon: '👥',
    shape: 'appCard',
    accent: 'border-teal-600 bg-teal-50',
    defaultConfig: { crm_type: '', customer_identifier: '', action: 'search', fields_to_update: {}, save_result_as: '' },
    fields: [
      { key: 'crm_type', label: 'CRM Type', type: 'text', required: true },
      { key: 'customer_identifier', label: 'Customer Identifier', type: 'text', required: true },
      { key: 'action', label: 'Action', type: 'select', required: true, options: ['create', 'update', 'search'] },
      { key: 'fields_to_update', label: 'Fields To Update', type: 'jsonObject', required: true },
      { key: 'save_result_as', label: 'Save Result As', type: 'text', required: true },
    ],
  },

  ticketing: {
    displayName: 'Ticketing',
    description: 'Creates or updates a support ticket.',
    category: 'Knowledge & Tools',
    icon: '🎫',
    shape: 'document',
    accent: 'border-rose-500 bg-rose-50',
    defaultConfig: { ticket_system: '', customer_name: '', customer_phone: '', issue_title: '', issue_description: '', priority: '', assigned_team: '', status: '' },
    fields: [
      { key: 'ticket_system', label: 'Ticket System', type: 'text', required: true },
      { key: 'customer_name', label: 'Customer Name', type: 'text', required: true },
      { key: 'customer_phone', label: 'Customer Phone', type: 'text', required: true },
      { key: 'issue_title', label: 'Issue Title', type: 'text', required: true },
      { key: 'issue_description', label: 'Issue Description', type: 'textarea', required: true },
      { key: 'priority', label: 'Priority', type: 'text', required: true },
      { key: 'assigned_team', label: 'Assigned Team', type: 'text', required: true },
      { key: 'status', label: 'Status', type: 'text', required: true },
    ],
  },

  external_api: {
    displayName: 'External API',
    description: 'Calls an external API to send data or retrieve information.',
    category: 'Knowledge & Tools',
    icon: '🌐',
    shape: 'appCard',
    accent: 'border-cyan-600 bg-cyan-50',
    defaultConfig: { method: 'GET', url: '', headers: {}, query_parameters: {}, body: {}, authentication: {}, save_result_as: '' },
    fields: [
      { key: 'method', label: 'Method', type: 'select', required: true, options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
      { key: 'url', label: 'URL', type: 'text', required: true },
      { key: 'headers', label: 'Headers', type: 'jsonObject', required: true },
      { key: 'query_parameters', label: 'Query Parameters', type: 'jsonObject', required: true },
      { key: 'body', label: 'Body', type: 'jsonObject', required: true },
      { key: 'authentication', label: 'Authentication', type: 'jsonObject', required: true },
      { key: 'save_result_as', label: 'Save Result As', type: 'text', required: true },
    ],
  },

  routing: {
    displayName: 'Routing',
    description: 'Routes the call to the correct department, queue, agent group, or workflow.',
    category: 'Knowledge & Tools',
    icon: '🧭',
    shape: 'diamond',
    accent: 'border-amber-600 bg-amber-50',
    defaultConfig: { routing_condition: '', department: '', queue: '', agent_group: '', fallback_route: '' },
    fields: [
      { key: 'routing_condition', label: 'Routing Condition', type: 'textarea', required: true },
      { key: 'department', label: 'Department', type: 'text', required: true },
      { key: 'queue', label: 'Queue', type: 'text', required: true },
      { key: 'agent_group', label: 'Agent Group', type: 'text', required: true },
      { key: 'fallback_route', label: 'Fallback Route', type: 'text', required: true },
    ],
  },

  fallback: {
    displayName: 'Fallback',
    description: 'Defines what to say or do when the active agent cannot understand or answer confidently.',
    category: 'Messaging',
    icon: '🛟',
    shape: 'bubble',
    accent: 'border-amber-500 bg-amber-50',
    defaultConfig: { condition: '', message: '' },
    fields: [
      { key: 'condition', label: 'Condition', type: 'textarea', required: false },
      { key: 'message', label: 'Message', type: 'textarea', required: true },
    ],
  },

  message: {
    displayName: 'Message',
    description: 'Produces a fixed workflow message when its condition is met.',
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

  if_condition: {
    displayName: 'If Condition',
    description: 'Routes execution through true or false graph connections using workflow data.',
    category: 'Knowledge & Tools',
    icon: '◇',
    shape: 'diamond',
    accent: 'border-violet-600 bg-violet-50',
    defaultConfig: { left_value: '', operator: 'equals', right_value: '' },
    fields: [
      { key: 'left_value', label: 'Left Value', type: 'text', required: true },
      { key: 'operator', label: 'Operator', type: 'select', required: true, options: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'exists'] },
      { key: 'right_value', label: 'Right Value', type: 'text', required: true },
    ],
  },

  whatsapp_message: {
    displayName: 'WhatsApp Message',
    description: 'Sends a WhatsApp message to a recipient.',
    category: 'Messaging',
    icon: '🟢',
    shape: 'appCard',
    accent: 'border-green-500 bg-green-50',
    defaultConfig: { recipient_number: '', message_text: '', template_name: '', variables: {} },
    fields: messagingFieldsByType.whatsapp_message,
  },

  sms_message: {
    displayName: 'SMS Message',
    description: 'Sends an SMS to a recipient.',
    category: 'Messaging',
    icon: '📲',
    shape: 'appCard',
    accent: 'border-lime-500 bg-lime-50',
    defaultConfig: { recipient_number: '', message_text: '' },
    fields: messagingFieldsByType.sms_message,
  },

  slack_message: {
    displayName: 'Slack Message',
    description: 'Sends a message to a Slack channel or user.',
    category: 'Messaging',
    icon: '💜',
    shape: 'appCard',
    accent: 'border-violet-500 bg-violet-50',
    defaultConfig: { workspace: '', channel_or_user: '', message_text: '' },
    fields: messagingFieldsByType.slack_message,
  },

  email_send: {
    displayName: 'Email Send',
    description: 'Sends an email without attachment fields.',
    category: 'Messaging',
    icon: '📧',
    shape: 'appCard',
    accent: 'border-sky-500 bg-sky-50',
    defaultConfig: { to: [], cc: [], bcc: [], subject: '', body: '' },
    fields: messagingFieldsByType.email_send,
  },

  last_message: {
    displayName: 'Last Message',
    description: 'Plays the final fixed message immediately before the call ends.',
    category: 'Call Control',
    icon: '👋',
    shape: 'bubble',
    accent: 'border-rose-500 bg-rose-50',
    defaultConfig: { message: '' },
    fields: [
      { key: 'message', label: 'Message', type: 'textarea', required: true },
    ],
  },

  end_call: {
    displayName: 'End Call',
    description: 'Terminates the complete live call when reached or when its optional condition is met.',
    category: 'Call Control',
    icon: '⛔',
    shape: 'octagon',
    accent: 'border-red-500 bg-red-50',
    defaultConfig: { condition: '' },
    fields: [
      { key: 'condition', label: 'Condition', type: 'textarea', required: false },
    ],
  },

  transcription: {
    displayName: 'Transcription',
    description: 'Creates or stores the completed call transcription after the call.',
    category: 'Storage & Logs',
    icon: '📝',
    shape: 'document',
    accent: 'border-slate-500 bg-slate-50',
    defaultConfig: { instruction: '' },
    fields: [
      { key: 'instruction', label: 'Instruction', type: 'textarea', required: false },
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

  llm: {
    displayName: 'LLM',
    description: 'Runs a separate user-provided LLM instruction as a workflow-processing step.',
    category: 'AI',
    icon: '✨',
    shape: 'crystal',
    accent: 'border-fuchsia-500 bg-fuchsia-50',
    defaultConfig: { prompt: '' },
    fields: [
      { key: 'prompt', label: 'Prompt', type: 'textarea', required: true },
    ],
  },

  db_logs: {
    displayName: 'DB Logs',
    description: 'Selects which call fields should be saved in workflow logs.',
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

  // Backward-compatible grouped UI nodes. Latest example/export uses actual node types above.
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
      database_type: 'postgresql_connection',
      connection_string: '${SECRET:POSTGRESQL_CONNECTION_STRING}',
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

  if (nodeType === 'messaging_app') {
    return MESSAGING_APP_TYPES.find((item) => item.value === value)?.label || value || '';
  }

  if (nodeType === 'database_connection') {
    return DATABASE_CONNECTION_TYPES.find((item) => item.value === value)?.label || value || '';
  }

  return value || '';
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
    const exportType = config.database_type || 'postgresql_connection';
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
