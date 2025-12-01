
import { createWorker } from 'tesseract.js';

export const recognizeText = async (imagePathOrBuffer: string): Promise<string> => {
    const worker = await createWorker('eng');
    const ret = await worker.recognize(imagePathOrBuffer);
    await worker.terminate();
    return ret.data.text;
};
