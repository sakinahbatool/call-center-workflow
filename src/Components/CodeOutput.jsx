
export async function generateTypescriptFromFlow(flowData) {
    try {
        const response = await fetch("http://localhost:5000/api/ts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ flowData }),
        }
    );

        const data = await response.json();
        return data.ts;
    } catch (err) {
        console.error(err);
        return "Error fetching code";
    } 
}
