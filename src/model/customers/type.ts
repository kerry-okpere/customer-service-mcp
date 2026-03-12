export interface Customer {
  id: string;
  name: string;
  email: string;
  tier: "Platinum" | "Gold" | "Silver";
  total_spend: number;
  open_tickets: number;
  latest_issue: string;
  issue_category: "billing" | "fulfillment" | "account_access";
  waiting_since_minutes: number;
  lifetime_orders: number;
  avatar_initials: string;
  avatar_color: string;
}

export interface Customers {
  customers: Customer[];
}