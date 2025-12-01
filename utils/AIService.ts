
import { GoogleGenAI } from "@google/genai";
import { MODEL_NAME } from "../constants";

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
    
    Keep the response concise and formatted in Markdown.
  `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
        });
        return response.text || "Unable to generate analysis.";
    } catch (error) {
        console.error("AI Analysis Failed:", error);
        return "Error analyzing screen content.";
    }
};
