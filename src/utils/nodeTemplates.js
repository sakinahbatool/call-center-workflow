const nodeTemplates = {
    'Start': {
        displayName: 'Start',
        inputs: [],
        codeTemplate: `// Program Start\n`,
        handles: { source: true, target: false },
        bgColor: 'bg-green-50 border-green-400'
    },
    'SetVariable': {
        displayName: 'Set Variable',
        inputs: [
            { key: 'name', label: 'Variable Name', defaultValue: 'x' },
            { key: 'value', label: 'Value', defaultValue: '10' }
        ],
        codeTemplate: `const {{name}} = {{value}};\n`,
        handles: { source: true, target: true },
        bgColor: 'bg-blue-50 border-blue-400'
    },
    'Log': {
        displayName: 'Print Log',
        inputs: [
            { key: 'text', label: 'Message', defaultValue: "'Some log message'" }
        ],
        codeTemplate: `console.log({{text}});\n`,
        handles: { source: true, target: true },
        bgColor: 'bg-yellow-50 border-yellow-400'
    },
    'Code': {
        displayName: 'Custom Code',
        inputs: [
            { key: 'code', label: 'Code', defaultValue: "console.log('Hello');" }
        ],
        codeTemplate: `{{code}}\n`,
        handles: { source: true, target: true },
        bgColor: 'bg-purple-50 border-purple-400'
    },
    'FetchDB': {
        displayName: 'Fetch from DB',
        inputs: [
            { key: 'variable', label: 'Variable', defaultValue: 'transHistory' },
            { key: 'query', label: 'SQL Query', defaultValue: 'SELECT * FROM transactionHistory' }
        ],
        codeTemplate: `const {{variable}} = await db.query("{{query}}");\n`,
        handles: { source: true, target: true },
        bgColor: 'bg-orange-50 border-orange-400'
    },
    'ThrowError': {
        displayName: 'Throw Error',
        inputs: [
            { key: 'text', label: 'Error Message', defaultValue: "'Error occurred'" }
        ],
        codeTemplate: `throw new Error({{text}});\n`,
        handles: { source: true, target: true },
        bgColor: 'bg-red-50 border-red-400'
    },
    'Import': {
        displayName: 'Import',
        inputs: [
            { key: 'importStatement', label: 'Import Statement', defaultValue: "import { something } from 'module'" }
        ],
        codeTemplate: `{{importStatement}};\n`,
        handles: { source: true, target: true },
        bgColor: 'bg-indigo-50 border-indigo-400'
    },
    'If': {
        displayName: 'If Condition',
        inputs: [
            { key: 'condition', label: 'Condition', defaultValue: 'x > 5' }
        ],
        codeTemplate: `if ({{condition}}) {\n{{TRUE_BRANCH}}\n}`,
        handles: { source: true, target: true },
        bgColor: 'bg-pink-50 border-pink-400'
    },
    'End': {
        displayName: 'End',
        inputs: [],
        codeTemplate: `// Program End\n`,
        handles: { source: false, target: true },
        bgColor: 'bg-gray-50 border-gray-400'
    }
};

const predefinedFunctions = {
    'CustomFunction': {
        displayName: 'Custom Function',
        inputs: [
            { key: 'functionName', label: 'Function Name', defaultValue: 'myFunction' },
            { key: 'functionParams', label: 'Parameters (e.g., a, b)', defaultValue: '' },
            { key: 'functionArgs', label: 'Arguments (e.g., var1, 10)', defaultValue: '' },
            { key: 'resultVar', label: 'Store Result In (Optional)', defaultValue: '' }
        ],
        handles: { source: true, target: true },
        bgColor: 'bg-teal-50 border-teal-400',
        isExtensible: true,
        description: 'Define a reusable function'
    },
    'HandleTransaction': {
        displayName: 'Handle Transaction',
        description: 'Main entry point for transaction logic',
        inputs: [],
        functionTemplate: `export async function handleTransaction(
  req: RuleRequest,
  determineOutcome: (value: number, ruleConfig: RuleConfig, ruleResult: RuleResult) => RuleResult,
  ruleRes: RuleResult,
  loggerService: LoggerService,
  ruleConfig: RuleConfig,
  databaseManager: DatabaseManagerInstance<RuleExecutorConfig>,
): Promise<RuleResult> {
  
  const context = \`Rule-\${ruleConfig.id ? ruleConfig.id : '<unresolved>'} handleTransaction()\`;
  const msgId = req.transaction.FIToFIPmtSts.GrpHdr.MsgId;
  
  loggerService.trace('Start - handle transaction', context, msgId);
  
  {{USER_CODE}}
  
  loggerService.trace('End - handle transaction', context, msgId);
  
  const finalOutcome = 0; 
  return determineOutcome(finalOutcome, ruleConfig, ruleRes);
}\n`,
        handles: { source: true, target: true },
        bgColor: 'bg-teal-50 border-teal-400',
        isExtensible: true
    },
    'addTwoNumbers': {
        displayName: 'Add Two Numbers',
        description: 'Adds two numbers with custom logic before return',
        inputs: [
            { key: 'param1', label: 'First Number', defaultValue: 'a' },
            { key: 'param2', label: 'Second Number', defaultValue: 'b' },
            { key: 'resultVar', label: 'Store Result In', defaultValue: 'sum' }
        ],
        functionTemplate: `function addTwoNumbers(a, b) {
  console.log("Num1=", a);
  console.log("Num2=", b);
  {{USER_CODE}}
  return a + b;
}
`,
        mainFlowTemplate: `const {{resultVar}} = addTwoNumbers({{param1}}, {{param2}});\n`,
        handles: { source: true, target: true },
        bgColor: 'bg-teal-50 border-teal-400',
        isExtensible: true
    },
    'validateEmail': {
        displayName: 'Validate Email',
        description: 'Validates email format with custom checks',
        inputs: [
            { key: 'email', label: 'Email to Validate', defaultValue: 'email' },
            { key: 'resultVar', label: 'Store Result In', defaultValue: 'isValid' }
        ],
        functionTemplate: `function validateEmail(email) {
  const basicCheck = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
  {{USER_CODE}}
  return basicCheck;
}
`,
        mainFlowTemplate: `const {{resultVar}} = validateEmail({{email}});\n`,
        handles: { source: true, target: true },
        bgColor: 'bg-teal-50 border-teal-400',
        isExtensible: true
    },
    'fetchUserData': {
        displayName: 'Fetch User Data',
        description: 'Fetches user data with preprocessing',
        inputs: [
            { key: 'userId', label: 'User ID', defaultValue: 'userId' },
            { key: 'resultVar', label: 'Store Result In', defaultValue: 'userData' }
        ],
        functionTemplate: `async function fetchUserData(userId) {
  console.log("Fetching data for user:", userId);
  {{USER_CODE}}
  const userData = await db.users.find(userId);
  return userData;
}
`,
        mainFlowTemplate: `const {{resultVar}} = await fetchUserData({{userId}});\n`,
        handles: { source: true, target: true },
        bgColor: 'bg-teal-50 border-teal-400',
        isExtensible: true
    },
    'calculateDiscount': {
        displayName: 'Calculate Discount',
        description: 'Calculates discount with custom rules',
        inputs: [
            { key: 'price', label: 'Original Price', defaultValue: 'price' },
            { key: 'discountPercent', label: 'Discount %', defaultValue: 'discount' },
            { key: 'resultVar', label: 'Store Result In', defaultValue: 'finalPrice' }
        ],
        functionTemplate: `function calculateDiscount(price, discountPercent) {
  const discountAmount = price * (discountPercent / 100);
  {{USER_CODE}}
  return price - discountAmount;
}
`,
        mainFlowTemplate: `const {{resultVar}} = calculateDiscount({{price}}, {{discountPercent}});\n`,
        handles: { source: true, target: true },
        bgColor: 'bg-teal-50 border-teal-400',
        isExtensible: true
    },

};

// Merge both for export
const allNodeTemplates = {
    ...nodeTemplates,
    ...predefinedFunctions
};

export default allNodeTemplates;
export { predefinedFunctions };