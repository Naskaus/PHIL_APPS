
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { Expense, Category, Status } from '../types';
import { GEMINI_PROMPT, EXPENSE_SCHEMA } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const fileToGenerativePart = async (file: File): Promise<Part> => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        // Handle ArrayBuffer case if necessary, though for images it's usually data URL
        resolve('');
      }
    };
    reader.readAsDataURL(file);
  });
  const data = await base64EncodedDataPromise;
  return {
    inlineData: {
      mimeType: file.type,
      data,
    },
  };
};

const parseAndValidateExpense = (jsonString: string): Expense => {
    try {
        // Clean the string: remove ```json and ``` markdown fences
        const cleanedJsonString = jsonString.replace(/^```json\s*/, '').replace(/```\s*$/, '');
        const parsed = JSON.parse(cleanedJsonString);

        // Basic validation and type casting
        const expense: Expense = {
            id: 0,
            paidBy: typeof parsed.paid_by === 'string' ? parsed.paid_by : (typeof parsed.Paid_By === 'string' ? parsed.Paid_By : ''),
            Date: typeof parsed.Date === 'string' ? parsed.Date : new Date().toISOString().slice(0, 10),
            Expense_Name: typeof parsed.Expense_Name === 'string' ? parsed.Expense_Name : 'Unknown Expense',
            Amount: typeof parsed.Amount === 'number' ? parsed.Amount : 0,
            Currency: typeof parsed.Currency === 'string' ? parsed.Currency : 'THB',
            Category: Object.values(Category).includes(parsed.Category) ? parsed.Category : Category.Other,
            Status: Status.Submitted,
            Receipt_URL: '',
            Notes: typeof parsed.Notes === 'string' ? parsed.Notes : '',
        };
        return expense;
    } catch (error) {
        console.error("Failed to parse JSON response:", error);
        throw new Error("The AI returned an invalid format. Please try again.");
    }
};

export const extractExpenseData = async (file: File): Promise<Expense> => {
  const imagePart = await fileToGenerativePart(file);
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, { text: GEMINI_PROMPT }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: EXPENSE_SCHEMA,
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
        throw new Error("Received an empty response from the AI. The receipt might be unreadable.");
    }

    return parseAndValidateExpense(jsonText);
  } catch (error) {
    console.error('Gemini API call failed:', error);
    if (error instanceof Error && error.message.includes('API key')) {
        throw new Error("API Key is invalid or not configured correctly.");
    }
    throw new Error("Failed to extract expense data from the receipt.");
  }
};
