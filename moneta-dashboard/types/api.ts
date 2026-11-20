export type TransactionType = "INCOME" | "EXPENSE";

export type TransactionStatus = "COMPLETED" | "PENDING" | "CANCELED";

export interface TransactionRequest {
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  categoryId: number;
  status?: TransactionStatus;
  paymentMethod?: string | null;
  notes?: string | null;
  accountId?: number | null;
}

export interface TransactionResponse {
  id: number;
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  categoryId: number;
  categoryName: string;
  status?: TransactionStatus;
  paymentMethod?: string | null;
  notes?: string | null;
  accountId?: number | null;
  accountName?: string | null;
}

export interface CategoryRequest {
  name: string;
  colorToken?: string;
  monthlyCeiling?: number | null;
  kind?: string;
}

export interface CategoryResponse {
  id: number;
  name: string;
  colorToken?: string;
  monthlyCeiling?: number | null;
  kind?: string;
}

export interface Contact {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
}

export interface ContactRequest {
  name: string;
  email?: string | null;
  phone?: string | null;
}

export interface Account {
  id: number;
  name: string;
  segment?: string | null;
  tier: string;
  city?: string | null;
  uf?: string | null;
  openingBalance: number;
  contact?: Contact | null;
  movement: number;
  transactionCount: number;
  lastOperationDate: string;
  regularityPct: number;
  archivedAt?: string | null;
}

export interface AccountRequest {
  name: string;
  segment?: string | null;
  tier: string;
  city?: string | null;
  uf?: string | null;
  openingBalance: number;
  contact?: ContactRequest | null;
}

export interface AccountBreakdown {
  accountId: number;
  name: string;
  value: number;
  transactionCount: number;
}

export interface AccountSummary {
  totalAccounts: number;
  accumulatedBalance: number;
  regularityIndex: number;
  activeTransactions: number;
  breakdown: AccountBreakdown[];
  formula: string;
}

export interface Appointment {
  id: number;
  accountId: number;
  title: string;
  scheduledAt: string;
  note?: string | null;
  createdAt: string;
}

export interface AppointmentRequest {
  title: string;
  scheduledAt: string;
  note?: string | null;
}

export interface CostCenter {
  categoryId: number;
  name: string;
  kind: string;
  colorToken: string;
  ceiling: number;
  spent: number;
  count: number;
  usagePct: number;
  changePct: number;
  contact?: Contact | null;
}

export interface BudgetResponse {
  consolidatedSpend: number;
  transactionCount: number;
  avgCeilingAdherence: number;
  costCenters: CostCenter[];
  formula: string;
}

export interface CostCenterUpdateRequest {
  name: string;
  kind?: string;
  colorToken?: string;
  monthlyCeiling?: number;
  contact?: ContactRequest | null;
}

export interface ReferencePeriodResponse {
  year: number;
  month: number;
}

export interface MonthlySummaryResponse {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface CategoryTotal {
  categoryId: number;
  categoryName: string;
  totalIncome: number;
  totalExpense: number;
}

export interface CategoryReportResponse {
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpense: number;
  categories: CategoryTotal[];
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: Array<{ field: string; message: string }>;
}

export interface ForecastKpis {
  forecastT2: number;
  forecastT2Ceiling: number;
  accuracyPct: number;
  balanceCoverage: number | null;
  openExpensesAmount: number;
  openExpensesCount: number;
  formulas: Record<string, string>;
}

export interface ProjectionMonth {
  month: string;
  actual: number | null;
  forecast: number;
  target: number;
}

export interface QuarterlyForecast {
  quarter: string;
  committed?: number;
  bestCase?: number;
  pipeline?: number;
  pessimistic?: number;
  realistic?: number;
  optimistic?: number;
}

export interface ForecastScenario {
  name: string;
  probability: number;
  revenue?: number;
  forecast?: number;
  color?: string;
  colorToken?: string;
}

export interface RiskFactor {
  key: string;
  id: number | null;
  title: string;
  category: string;
  severity: string;
  estimatedAmount: number;
  description: string;
  origin: string; // "AUTOMATIC" | "MANUAL"
  relatedDeals: string[];
  deadline: string;
}

export interface MitigationPlan {
  id: number | null;
  riskKey: string;
  actions: string;
  owner: string;
  dueDate: string;
  status: string;
  ruleReason: string;
  ruleSuggestions: string[];
}

export interface MitigationPlanRequest {
  actions: string;
  owner: string;
  dueDate: string;
  status: string;
}

export interface RiskFactorCreateRequest {
  title: string;
  category: string;
  severity: string;
  estimatedAmount: number;
  description?: string;
  relatedDeals?: string[];
}

export interface ForecastResponse {
  kpis: ForecastKpis;
  projectionChart: ProjectionMonth[];
  quarterlyForecast: QuarterlyForecast[];
  scenarios: ForecastScenario[];
  riskFactors: RiskFactor[];
  methodology: string;
}

export interface CompanyProfile {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  footerText: string;
  hasLogo: boolean;
  logoBase64: string | null;
}

export interface CompanyProfileUpdateRequest {
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  footerText?: string;
}

export interface GeneratedReport {
  id: number;
  title: string;
  reportType: string;
  period: string;
  fileFormat: string;
  status: string; // "ready" | "generating" | "COMPLETED"
  fileSizeBytes: number;
  formattedSize: string;
  createdAt: string;
  downloadCount: number;
}

export interface GenerateReportRequest {
  title: string;
  reportType: string;
  year?: number;
  month?: number;
  categoryId?: number;
  accountId?: number;
}

export interface IncomeSource {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface SavingsRateEvolution {
  month: string;
  rate: number | null;
}

export interface ReportDashboard {
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyBalance: number;
  savingsRate: number;
  totalSpent: number;
  totalCeiling: number;
  revenueSources: IncomeSource[];
  savingsRateEvolution: SavingsRateEvolution[];
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  createdAt: string;
  relativeTime: string;
}

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  type: string;
  section: string;
}

export interface SearchResponse {
  results: SearchResultItem[];
  totalCount: number;
  query: string;
}

export interface NotificationPreferenceItem {
  id: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
}




