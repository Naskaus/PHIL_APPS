
import { Type } from "@google/genai";

export const GEMINI_PROMPT = `You are an expense-tracking assistant for a small business.

INPUT: user provides either text details of an expense or an image/PDF of a receipt.

TASKS:
1) If input is image/PDF: perform OCR & extract fields.
2) Always return a single JSON object with the specified schema.

RULES:
- If date missing → use today's date in YYYY-MM-DD format (timezone UTC+07:00).
- If currency missing → default "THB".
- If multiple line items on receipt → sum them to a single total Amount.
- Validate that Amount is a number (use dot as decimal separator).
- Do not hallucinate: if a field is unknown, keep the value as an empty string "" or 0 for amount.
- Preserve accents and merchant names accurately.
- For "Paid_By", choose "Assistant" or "Me". If unknown, leave empty.
- For "Category", choose one of "Transport", "Food", "Supplies", or "Other". If unknown, choose "Other".
- "Status" must always be "Submitted".
- "Receipt_URL" and "Notes" should be empty strings.

ACTIONS:
- Accept manual overrides in user messages like: "Paid by Assistant" or "Category = Transport".
- Accept status updates like: "Mark expense 'Taxi Nana' on 2025-08-31 as Reimbursed" → then return the updated JSON with Status="Reimbursed".

OUTPUT:
- Return ONLY the JSON block, no prose.
- The JSON must be valid and flat.`;

export const EXPENSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    "Date": { type: Type.STRING, description: "Date of the expense in YYYY-MM-DD format." },
    "Expense_Name": { type: Type.STRING, description: "Name of the expense or merchant." },
    "Amount": { type: Type.NUMBER, description: "Total amount of the expense." },
    "Currency": { type: Type.STRING, description: "Currency of the amount (e.g., THB, USD)." },
    "Paid_By": { type: Type.STRING, description: "Who paid for the expense. Must be 'Assistant' or 'Me'." },
    "Category": { type: Type.STRING, description: "Category of the expense. Must be 'Transport', 'Food', 'Supplies', or 'Other'." },
    "Status": { type: Type.STRING, description: "Initial status. Must be 'Submitted'." },
    "Receipt_URL": { type: Type.STRING, description: "Leave empty. This will be filled later." },
    "Notes": { type: Type.STRING, description: "Any additional notes about the expense. Can be empty." },
  },
  required: ["Date", "Expense_Name", "Amount", "Currency", "Status"]
};
