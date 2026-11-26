export type UserRole = 'admin' | 'member';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  memberCode: string;
  joinedAt: string;
}

export type CoverTheme =
  | 'maroon-linen'
  | 'blush-arch'
  | 'rose-editorial'
  | 'espresso-ivory';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  publisher: string;
  year: number;
  pages: number;
  totalCopies: number;
  availableCopies: number;
  synopsis: string;
  coverImage: string;
  coverTheme: CoverTheme;
  addedAt: string;
  borrowCount: number;
}

export type LoanStatus = 'active' | 'overdue' | 'returned';

export interface Loan {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookIsbn: string;
  userId: string;
  userName: string;
  userCode: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt: string | null;
  status: LoanStatus;
  renewCount: number;
  fineAmount: number;
}

export type ActivityType =
  | 'borrow'
  | 'return'
  | 'renew'
  | 'catalog_add'
  | 'catalog_update'
  | 'catalog_delete'
  | 'report_auto'
  | 'report_manual'
  | 'member_join';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  actorName: string;
  actorRole: UserRole | 'system';
  title: string;
  detail: string;
  timestamp: string;
}

export type AutoReportPeriod = 'daily' | 'weekly' | 'monthly';

export interface AutoReport {
  id: string;
  code: string;
  period: AutoReportPeriod;
  triggerMode: 'auto' | 'manual';
  generatedAt: string;
  periodLabel: string;
  summary: {
    totalCirculation: number;
    newLoans: number;
    returnedLoans: number;
    overdueCount: number;
    activeMembersCount: number;
    totalFinesCollected: number;
    onTimeRate: number;
  };
  topBooks: {
    bookId: string;
    title: string;
    author: string;
    count: number;
  }[];
  topMembers: {
    userId: string;
    name: string;
    memberCode: string;
    count: number;
  }[];
  overdueItems: {
    loanId: string;
    bookTitle: string;
    userName: string;
    daysLate: number;
    fineAmount: number;
  }[];
}

export interface ReportScheduleConfig {
  enabled: boolean;
  frequency: AutoReportPeriod;
  timeOfDay: string;
  includeOverdueAlert: boolean;
  lastRunAt: string | null;
}

export interface DailyTrendPoint {
  date: string;
  label: string;
  borrows: number;
  returns: number;
}

export interface CategoryStat {
  category: string;
  totalBooks: number;
  totalBorrows: number;
  percentage: number;
}

export interface LibraryStats {
  totalTitles: number;
  totalCopies: number;
  availableCopies: number;
  activeLoansCount: number;
  overdueLoansCount: number;
  returnedLoansCount: number;
  activeMembersCount: number;
  onTimeReturnRate: number;
  totalFinesCollected: number;
  dailyTrends: DailyTrendPoint[];
  categoryStats: CategoryStat[];
}

export interface BootstrapPayload {
  users: User[];
  books: Book[];
  loans: Loan[];
  activities: ActivityEvent[];
  reports: AutoReport[];
  schedule: ReportScheduleConfig;
  stats: LibraryStats;
  serverTime: string;
}
