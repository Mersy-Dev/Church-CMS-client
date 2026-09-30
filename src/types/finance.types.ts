// ── Finance & Giving Types ────────────────────────────────────────────────────

export type ContributionType =
  | 'tithe' | 'sunday_offering' | 'midweek_offering' | 'special_donation'
  | 'building_fund' | 'partnership' | 'covenant_seed' | 'pledge_payment'
  | 'project_fund' | 'missions' | 'benevolence' | 'thanksgiving'
  | 'first_fruit' | 'other';

export type PaymentChannel =
  | 'cash' | 'bank_transfer' | 'card' | 'mobile_money'
  | 'paystack' | 'flutterwave' | 'ussd' | 'cheque' | 'crypto';

export type ContributionStatus = 'pending' | 'successful' | 'failed' | 'reversed';

export type Currency = 'NGN' | 'USD' | 'GBP' | 'EUR' | 'CAD' | 'GHS' | 'KES' | 'ZAR';

export interface Contribution {
  exchangeRate: import("react/jsx-runtime").JSX.Element;
  _id:              string;
  memberId?:        { _id: string; firstName: string; lastName: string; membershipId: string; photoUrl?: string } | null;
  donorName?:       string;
  donorEmail?:      string;
  donorPhone?:      string;
  isAnonymous:      boolean;
  contributionType: ContributionType;
  projectId?:       { _id: string; name: string; code: string } | null;
  pledgeId?:        { _id: string; totalAmount: number; paidAmount: number } | null;
  amount:           number;
  currency:         Currency;
  amountInNGN?:     number;
  paymentChannel:   PaymentChannel;
  paymentReference?: string;
  paystackRef?:     string;
  bankName?:        string;
  status:           ContributionStatus;
  receiptNumber:    string;
  serviceDate?:     string;
  notes?:           string;
  acknowledgementSentAt?: string;
  recordedBy?:      { email: string };
  createdAt:        string;
  updatedAt:        string;
}

export interface Pledge {
  _id:          string;
  memberId?:    { _id: string; firstName: string; lastName: string; membershipId: string; photoUrl?: string };
  donorName?:   string;
  donorEmail?:  string;
  donorPhone?:  string;
  pledgeType:   ContributionType;
  projectId?:   { _id: string; name: string; code: string } | null;
  description?: string;
  totalAmount:  number;
  paidAmount:   number;
  currency:     Currency;
  frequency:    'one_time' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate:    string;
  endDate?:     string;
  status:       'active' | 'completed' | 'defaulted' | 'cancelled';
  instalments:  PledgeInstalment[];
  notes?:       string;
  // virtuals
  balanceDue:        number;
  completionPercent: number;
  createdAt:    string;
  updatedAt:    string;
}

export interface PledgeInstalment {
  _id?:           string;
  dueDate:        string;
  amount:         number;
  paidDate?:      string;
  contributionId?: string;
  isPaid:         boolean;
}

export interface Project {
  _id:           string;
  name:          string;
  code:          string;
  description?:  string;
  category:      string;
  targetAmount:  number;
  raisedAmount:  number;
  currency:      Currency;
  status:        'active' | 'completed' | 'paused' | 'cancelled';
  startDate:     string;
  endDate?:      string;
  imageUrl?:     string;
  isPublic:      boolean;
  // virtuals
  progressPercent: number;
  isOpen:          boolean;
  createdAt:     string;
  updatedAt:     string;
}

export interface Budget {
  _id:           string;
  title:         string;
  fiscalYear:    number;
  period:        'annual' | 'quarterly' | 'monthly';
  startDate:     string;
  endDate:       string;
  currency:      Currency;
  totalAllocated: number;
  totalActual:   number;
  incomeItems:   BudgetLineItem[];
  expenseItems:  BudgetLineItem[];
  status:        'draft' | 'approved' | 'active' | 'closed';
  approvedBy?:   { email: string };
  approvedAt?:   string;
  notes?:        string;
  // virtuals
  variance:         number;
  variancePercent:  number;
  createdAt:     string;
  updatedAt:     string;
}

export interface BudgetLineItem {
  _id?:            string;
  category:        string;
  description:     string;
  allocatedAmount: number;
  actualAmount:    number;
  notes?:          string;
}

export interface Expense {
  _id:            string;
  title:          string;
  description?:   string;
  category:       string;
  amount:         number;
  currency:       Currency;
  expenseDate:    string;
  budgetId?:      string | null;
  projectId?:     { _id: string; name: string } | null;
  paymentChannel: string;
  paidTo:         string;
  receiptUrl?:    string;
  status:         'pending' | 'approved' | 'rejected' | 'paid';
  approvalChain:  ApprovalStep[];
  approvedBy?:    { email: string };
  rejectedBy?:    { email: string };
  rejectionReason?: string;
  isSalary:       boolean;
  notes?:         string;
  createdBy?:     { email: string };
  createdAt:      string;
  updatedAt:      string;
}

export interface ApprovalStep {
  _id?:       string;
  approvedBy: { email: string };
  action:     'approved' | 'rejected';
  comment?:   string;
  actionAt:   string;
}

export interface FinanceDashboard {
  monthlyIncome:      number;
  yearlyIncome:       number;
  monthlyExpenses:    number;
  netThisMonth:       number;
  pendingExpenses:    number;
  activePledges:      number;
  activeProjects:     number;
  recentContributions: Contribution[];
}

export interface FinancialSummary {
  period:     { startDate: string; endDate: string };
  income:     number;
  expenses:   number;
  netBalance: number;
  byType:     { _id: string; totalNGN: number; count: number }[];
  byChannel:  { _id: string; totalNGN: number; count: number }[];
  byMonth:    { _id: { year: number; month: number }; totalNGN: number; count: number }[];
  totalCount: number;
}

export interface MemberGivingHistory {
  member:        { id: string; name: string; membershipId: string; email: string };
  year:          number | 'all';
  contributions: Contribution[];
  totalByType:   Record<string, number>;
  grandTotal:    number;
  count:         number;
}