
export enum PaidBy {
  Assistant = 'Assistant',
  Me = 'Me',
}

export enum Category {
  Transport = 'Transport',
  Food = 'Food',
  Supplies = 'Supplies',
  Other = 'Other',
}

export enum Status {
  Submitted = 'Submitted',
  Validated = 'Validated',
  Reimbursed = 'Reimbursed',
}

export interface Expense {
  id: number;
  paidBy: string;
  Date: string; // YYYY-MM-DD
  Expense_Name: string;
  Amount: number;
  Currency: string;
  Category: string;
  locations: string[];
  Status: Status;
  Receipt_URL: string;
  Notes: string;
}
