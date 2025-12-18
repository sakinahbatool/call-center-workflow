export const simulateNodeExecution = (node, currentVariables) => {
  const type = node.data.nodeType;
  const params = node.data.params || {};

  // Debug log to see exactly what's happening in the console
  console.log(`[Simulator] Node: ${type}`, params);

  let newVariables = { ...currentVariables };
  let logMessage = null;
  let error = null;

  // --- HELPER: Resolve a value (Is it a number or a variable name?) ---
  const resolve = (val) => {
    if (val === undefined || val === null || val === '') return 0;
    
    // 1. Check if it's a number
    if (!isNaN(val) && val.toString().trim() !== '') return parseFloat(val);

    // 2. Check if it's a variable name
    const key = val.toString().trim();
    if (currentVariables[key] !== undefined) return currentVariables[key];

    return 0; // Default fallback
  };

  // --- HELPER: Safe lookup for params ---
  const getParam = (keys) => {
    for (const key of keys) {
      if (params[key] !== undefined && params[key] !== "") return params[key];
    }
    return null;
  };

  try {
    switch (type) {
      // -----------------------------
      // 1. BASIC NODES
      // -----------------------------
      case 'Start':
        logMessage = "Process Started";
        break;

      case 'Import':
        logMessage = `Imported module: ${params.importStatement || 'default'}`;
        break;

      case 'SetVariable':
        // Template uses: 'name' and 'value'
        const varName = getParam(['name', 'variableName']);
        const varValueRaw = getParam(['value', 'variableValue']);

        if (varName) {
           // Check if the value input is actually a variable reference (e.g. 'item1')
           let finalValue = varValueRaw;
           
           // If it exists in variables, use that value
           if (currentVariables[varValueRaw] !== undefined) {
               finalValue = currentVariables[varValueRaw];
           } 
           // Else if it's a number, parse it
           else if (!isNaN(varValueRaw)) {
               finalValue = parseFloat(varValueRaw);
           }
           
           newVariables[varName] = finalValue;
           logMessage = `Set ${varName} = ${finalValue}`;
        }
        break;

      case 'Log':
        let msg = getParam(['text', 'message']) || '';
        // Replace {{variable}} placeholders
        Object.keys(currentVariables).forEach(key => {
            msg = msg.replace(new RegExp(`{{${key}}}`, 'g'), currentVariables[key]);
        });
        // Check if message is just a variable name
        if (currentVariables[msg] !== undefined) msg = `${msg}: ${currentVariables[msg]}`;
        
        logMessage = `LOG: ${msg}`;
        break;

      // -----------------------------
      // 2. YOUR SPECIFIC FUNCTIONS
      // -----------------------------
      
      case 'addTwoNumbers':
        // Template uses: 'param1', 'param2', 'resultVar'
        const val1 = resolve(getParam(['param1', 'a'])); 
        const val2 = resolve(getParam(['param2', 'b']));
        const sumResult = getParam(['resultVar', 'output']) || 'sum';

        const sum = val1 + val2;
        newVariables[sumResult] = sum;
        logMessage = `Add: ${val1} + ${val2} = ${sum}`;
        break;

      case 'calculateDiscount':
        // Template uses: 'price', 'discountPercent', 'resultVar'
        const price = resolve(getParam(['price', 'amount']));
        const percent = resolve(getParam(['discountPercent', 'discount']));
        const discResult = getParam(['resultVar', 'output']) || 'finalPrice';

        const discountAmount = price * (percent / 100);
        const finalPrice = price - discountAmount;
        
        newVariables[discResult] = finalPrice;
        logMessage = `Discount: ${price} - ${percent}% = ${finalPrice}`;
        break;

      case 'validateEmail':
        const email = getParam(['email']);
        const validRes = getParam(['resultVar']) || 'isValid';
        const isValid = String(email).includes('@');
        newVariables[validRes] = isValid;
        logMessage = `Validate Email (${email}) -> ${isValid}`;
        break;

      // -----------------------------
      // 3. GENERIC & LOGIC
      // -----------------------------
      
      case 'CustomFunction':
        const funcName = getParam(['functionName']);
        const resVar = getParam(['resultVar']) || 'result';
        
        // Handle generic custom functions
        newVariables[resVar] = "MOCK_RESULT";
        logMessage = `Executed ${funcName}, result saved to ${resVar}`;
        break;

      case 'FetchDB':
        // Template uses: 'variable' (NOT resultVar)
        const dbVar = getParam(['variable', 'resultVar']) || 'dbResult';
        newVariables[dbVar] = { membership_level: 'GOLD', id: 123 };
        logMessage = `Fetched DB -> ${dbVar}`;
        break;

      case 'Code':
         // Just a pass-through for visualizer
         logMessage = "Custom Code Validated";
         break;

      case 'ThrowError':
         error = getParam(['text', 'message']) || "Error Occurred";
         break;

      default:
        logMessage = `[Skipped] Node Type: ${type}`;
        break;
    }

  } catch (e) {
    error = e.message;
    console.error("Simulator Error", e);
  }

  return { newVariables, logMessage, error };
};