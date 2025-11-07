import express from "express";
import cors from "cors";
import { HfInference } from "@huggingface/inference";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); // parse JSON body

const SYSTEM_PROMPT = `
You are a TypeScript code generation expert. Your task is to convert the provided flowchart JSON into runnable, type-safe TypeScript code.

INPUT: You will receive a JSON object representing a flowchart with nodes and edges.
- Nodes have 'id', 'label', and 'type' (e.g., "Input", "Process", "Decision").
- Edges define the flow, summarized in the 'flow' array (e.g., "A → B").

REQUIREMENTS:
1.  **Generate TypeScript interfaces/types** based on the node types.
2.  **Create a dedicated function for *each unique node type*** found in the JSON (e.g., \`handleInput\`, \`handleDecision\`, etc.).
3.  **Crucial Logic Guide:** For the body of these functions (e.g., \`handleInput\`):
    * If the node is a **"Process"** type, the function body must include a line that **performs a calculation or modifies a global state variable (e.g., \`state.result = state.input * 2;\`)**.
    * If the node is a **"Decision"** type, the function body must include an **\`if/else\` block** to simulate branching logic and return the appropriate next node ID or flow label.
    * If the node is an **"Input"** type, the function body must **initialize** a global state variable.
    * Use **meaningful mock logic** based on the node's label to make the code runnable.
4.  Implement a main \`executeFlowchart(flowchart: Flowchart)\` function that:
    * Uses a **state object** (e.g., \`let state = { input: 0, result: "" };\`) to pass data between steps.
    * Iterates through the \`flow\` array and calls the appropriate handler functions based on the current node type, modifying the state.
5.  Use proper TypeScript syntax with type safety and include meaningful comments.

Please provide **only** the executable TypeScript code without any additional explanation, introductory text, or markdown formatting. **Do not wrap the final output in three backticks . Start the response with two forward slashes //** (\`\`\`)
`
console.log("Token:", process.env.VITE_HF_ACCESS_TOKEN);

const hf = new HfInference(process.env.VITE_HF_ACCESS_TOKEN);


app.post("/api/ts", async (req, res) => {
  try {
    const { flowData } = req.body;
    if (!flowData) {
      return res.status(400).json({ error: "Invalid flowData" });
    }

    const response = await hf.chatCompletion({
      model: "Qwen/Qwen3-Coder-480B-A35B-Instruct",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        // { role: "user", content: "Hello, what is your name?" }
        { role: "user", content: `Here is the flowchart JSON:\n${JSON.stringify(flowData, null, 2)}` },
      ],
      max_tokens: 1024,
    });

    res.json({ ts: response.choices[0].message.content });
  } catch (err) {
    console.error(err); // Good

    // This will print the actual error message
    console.log(
      'Full error details:',
      JSON.stringify(err.httpResponse?.body, null, 2)
    );

    // This is the specific message:
    console.log(
      'HF Error Message:',
      err.httpResponse?.body?.error?.message
    );

    res.status(500).json({ error: "Something went wrong" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
