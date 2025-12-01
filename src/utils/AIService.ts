import { GoogleGenAI } from "@google/genai";

export const analyzeScreenText = async (text: string, apiKey: string): Promise<string> => {
    if (!text || text.trim().length === 0) {
        return "No text detected on screen to analyze.";
    }

    const ai = new GoogleGenAI({ apiKey });


    const prompt = `
    You are an expert technical interviewer and coding assistant.
    
    I have captured the following text from my screen (OCR output). 
    It may contain code snippets, interview questions, or technical diagrams descriptions.
    
    SCREEN CONTENT:
    """
    ${text}
    """
    
    TASKS:
    1. Identify the core problem or question.
    2. If it is a coding problem, provide a concise, optimal solution (code + brief explanation).
    3. If it is a conceptual question, provide a clear, professional answer.
    4. Ignore UI garbage text (menu items, timestamps, etc.).
    
    STRICT OUTPUT RULES:
    - Do NOT include conversational fillers like "Of course", "Here is the solution", etc. Start directly with the content.
    - Do NOT use "###" headers. Use bold text (**Title**) for headers instead.
    - Keep the response concise and formatted in Markdown.
  `;

    const modelsToTry = [
        'gemini-2.5-pro',
        'gemini-2.0-flash-exp', // Prioritize the one that exists
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
                    parts: [{ text: prompt }]
                }
            });
            return response.text || "Unable to generate analysis.";
        } catch (error: any) {
            console.warn(`Model ${model} failed:`, error.message);

            // Handle Rate Limiting (429) with a retry
            if (error.status === 429 || error.code === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
                console.log(`Rate limit hit for ${model}. Retrying in 2 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                try {
                    const response = await ai.models.generateContent({
                        model,
                        contents: {
                            parts: [{ text: prompt }]
                        }
                    });
                    return response.text || "Unable to generate analysis.";
                } catch (retryError: any) {
                    console.warn(`Retry failed for ${model}:`, retryError.message);
                }
            }

            // If this was the last model, throw the error
            if (model === modelsToTry[modelsToTry.length - 1]) {
                console.error("All models failed.");
                throw error;
            }
            // Otherwise continue to next model
        }
    }
    return "Error analyzing screen content.";
};
