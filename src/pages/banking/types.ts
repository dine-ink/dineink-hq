// Shared types for the Account & Bank Integration page — mirrors the
// backend contracts under /api/banking exactly (see AccountBankIntegration.tsx
// for the endpoint list). Kept in one place so the four tabs agree on shape.

export interface BankAccount {
  id: number | string;
  restaurantId: number | string;
  branchId: number | string | null;
  accountHolderName: string;
  bankName: string;
  accountNumberMasked: string;
  ifsc: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface UpiConfig {
  id: number | string;
  restaurantId: number | string;
  branchId: number | string;
  upiId: string;
  displayName: string;
  isActive: boolean;
}

export interface UpiQrData {
  upiId: string;
  displayName: string;
  qrCodeDataUrl: string;
  upiLink: string;
}

export type ReconciliationStatus = "UNMATCHED" | "MATCHED" | "IGNORED";
export type TransactionType = "CREDIT" | "DEBIT";

export interface BankTransactionEntry {
  id: number | string;
  restaurantId: number | string;
  branchId: number | string;
  bankAccountId: number | string | null;
  entryDate: string;
  description: string | null;
  amount: number;
  type: TransactionType;
  reconciliationStatus: ReconciliationStatus;
  matchedBillId: number | string | null;
  matchedVendorPaymentId: number | string | null;
  notes: string | null;
  createdAt: string;
}

export interface ReconcileResult {
  matched: number;
  stillUnmatched: number;
}
