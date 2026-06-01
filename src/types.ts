export enum Currency {
  INR = "INR",
  USD = "USD",
}

export interface Service {
  id: number;
  name: string;
  rate: number; // Rate per 1000 in INR. We will convert it on-the-fly to USD if needed.
  min: number;
  max: number;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // lucide icon name or emoji
  services: Service[];
}

export enum OrderStatus {
  COMPLETED = "Completed",
  PENDING = "Pending",
  IN_PROGRESS = "In Progress",
  PARTIAL = "Partial",
  CANCELLED = "Cancelled",
}

export interface Order {
  id: number;
  date: string;
  categoryName: string;
  serviceId: number;
  serviceName: string;
  link: string;
  quantity: number;
  charge: number; // in INR
  status: OrderStatus;
  startCount: number;
  refillCount: number;
}

export interface Transaction {
  id: string;
  date: string;
  method: string;
  utr: string;
  amount: number; // in INR
  status: "Completed" | "Pending" | "Failed";
}

export interface TicketMessage {
  sender: "user" | "support";
  message: string;
  time: string;
}

export interface SupportTicket {
  id: number;
  subject: string;
  requestType: "Order" | "Payment" | "Refill" | "Other";
  orderId?: string;
  status: "Open" | "Answered" | "Closed";
  lastUpdated: string;
  messages: TicketMessage[];
}

export interface ServiceUpdate {
  id: number;
  serviceId: number;
  serviceName: string;
  date: string;
  type: "INCREASE" | "DECREASE" | "ADD" | "NEW";
  oldRate?: number;
  newRate: number;
}

export interface WithdrawalRequest {
  id: string;
  username: string;
  date: string;
  method: "UPI" | "Bank";
  amount: number;
  upiId?: string;
  bankAccount?: string;
  bankIfsc?: string;
  bankName?: string;
  accountHolder?: string;
  status: "Pending" | "Completed" | "Rejected";
  rejectionReason?: string;
}

