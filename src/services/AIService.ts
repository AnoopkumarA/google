import { GoogleGenAI } from '@google/genai';

const getApiKey = () => {
    // Check Electron env first, then React env variables
    if (typeof window !== 'undefined' && (window as any).electron?.env?.API_KEY) {
        return (window as any).electron.env.API_KEY;
    }
    return process.env.REACT_APP_GEMINI_API_KEY || process.env.API_KEY || '';
};

export const analyzeText = async (text: string, prompt?: string): Promise<string> => {
    try {
        const apiKey = getApiKey();
        if (!apiKey) throw new Error("API Key not found");

        const ai = new GoogleGenAI({ apiKey });


        const defaultPrompt = "Analyze the following text from a screen capture. Provide a concise summary and highlight any key actions or insights.";
        const strictRules = `
        STRICT OUTPUT RULES:
        - Do NOT include conversational fillers like "Of course", "Here is the solution", etc. Start directly with the content.
        - Do NOT use "###" headers. Use bold text (**Title**) for headers instead.
        - Keep the response concise and formatted in Markdown.
        `;
        const finalPrompt = (prompt || defaultPrompt) + strictRules;

        const modelsToTry = [
            'gemini-2.5-pro',
            'gemini-2.0-flash-exp',
            'gemini-1.5-flash',
            'gemini-1.5-flash-001',
            'gemini-1.5-flash-002',
            'gemini-1.5-pro',
            'gemini-1.5-pro-001',
            'gemini-1.5-pro-002',
            'gemini-1.0-pro'
        ];

        for (const model of modelsToTry) {
            try {
                console.log(`Attempting analysis with model: ${model}`);
                const response = await ai.models.generateContent({
                    model,
                    contents: {
                        parts: [
                            { text: finalPrompt },
                            { text: `\n\n---\n\n${text}` }
                        ]
                    }
                });
                return response.text || "No analysis generated.";
            } catch (error: any) {
                console.warn(`Model ${model} failed:`, error.message);

                if (error.status === 429 || error.code === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
                    console.log(`Rate limit hit for ${model}. Retrying in 2 seconds...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    try {
                        const response = await ai.models.generateContent({
                            model,
                            contents: {
                                parts: [
                                    { text: finalPrompt },
                                    { text: `\n\n---\n\n${text}` }
                                ]
                            }
                        });
                        return response.text || "No analysis generated.";
                    } catch (retryError: any) {
                        console.warn(`Retry failed for ${model}:`, retryError.message);
                    }
                }

                if (model === modelsToTry[modelsToTry.length - 1]) throw error;
            }
        }
        return "Error analyzing text.";
    } catch (error) {
        console.error("AI Analysis Error:", error);
        throw error;
    }
};
