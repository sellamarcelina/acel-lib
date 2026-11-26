import express from 'express';
import fs from 'fs';
import path from 'path';
import type { Request, Response } from 'express';
import type {
  ActivityEvent,
  AutoReport,
  AutoReportPeriod,
  Book,
  BootstrapPayload,
  CategoryStat,
  DailyTrendPoint,
  LibraryStats,
  Loan,
  ReportScheduleConfig,
  User,
} from './src/types/library.ts';

interface DatabaseState {
  users: User[];
  books: Book[];
  loans: Loan[];
  activities: ActivityEvent[];
  reports: AutoReport[];
  schedule: ReportScheduleConfig;
}

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const DB_PATH = path.join(DATA_DIR, 'acelivre-db.json');
const FINE_PER_DAY = 2000;
const MAX_ACTIVE_LOANS_PER_MEMBER = 5;
const MAX_RENEWALS = 2;

const sseClients = new Set<Response>();

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function daysAgoIso(days: number, hourOffset = 10): string {
  const d = new Date(Date.now() - days * 86400000);
  d.setHours(hourOffset, 15, 0, 0);
  return d.toISOString();
}

function daysFromNowIso(days: number): string {
  const d = new Date(Date.now() + days * 86400000);
  d.setHours(23, 59, 0, 0);
  return d.toISOString();
}

function createSeedDatabase(): DatabaseState {
  const users: User[] = [
    {
      id: 'usr_admin_1',
      name: 'Sella Celina',
      email: 'sella.celina@acelivre.id',
      role: 'admin',
      memberCode: 'ADM-001',
      joinedAt: daysAgoIso(180),
    },
    {
      id: 'usr_member_1',
      name: 'Nadia Putri',
      email: 'nadia.putri@acelivre.id',
      role: 'member',
      memberCode: 'ACL-1042',
      joinedAt: daysAgoIso(95),
    },
    {
      id: 'usr_member_2',
      name: 'Raka Pratama',
      email: 'raka.pratama@acelivre.id',
      role: 'member',
      memberCode: 'ACL-1088',
      joinedAt: daysAgoIso(62),
    },
    {
      id: 'usr_member_3',
      name: 'Keira Maharani',
      email: 'keira.m@acelivre.id',
      role: 'member',
      memberCode: 'ACL-1105',
      joinedAt: daysAgoIso(40),
    },
    {
      id: 'usr_member_4',
      name: 'Dimas Wijaya',
      email: 'dimas.w@acelivre.id',
      role: 'member',
      memberCode: 'ACL-1129',
      joinedAt: daysAgoIso(21),
    },
  ];

  const books: Book[] = [
    {
      id: 'bk_01',
      title: 'Estetika Ruang & Cahaya',
      author: 'Aruna Maheswari',
      isbn: '978-602-412-801-2',
      category: 'Desain & Seni',
      publisher: 'Pustaka Rupa',
      year: 2024,
      pages: 264,
      totalCopies: 5,
      availableCopies: 3,
      synopsis:
        'Eksplorasi puitis mengenai proporsi arsitektur minimalis, material alami, serta peran cahaya pagi dalam membentuk ketenangan ruang baca modern.',
      coverImage: '/src/assets/images/cover_seni_minimalis_1795659683864.jpg',
      coverTheme: 'blush-arch',
      addedAt: daysAgoIso(120),
      borrowCount: 18,
    },
    {
      id: 'bk_02',
      title: 'Catatan Senja di Taman Botani',
      author: 'Larasati Kirana',
      isbn: '978-602-412-802-9',
      category: 'Fiksi Sastra',
      publisher: 'Serambi Aksara',
      year: 2025,
      pages: 312,
      totalCopies: 4,
      availableCopies: 2,
      synopsis:
        'Kumpulan prosa liris tentang ingatan, surat-surat yang tak terkirim, dan perjumpaan singkat di balik rumah kaca tua kota Bandung.',
      coverImage: '/src/assets/images/cover_sastra_senja_1795659684368.jpg',
      coverTheme: 'rose-editorial',
      addedAt: daysAgoIso(110),
      borrowCount: 24,
    },
    {
      id: 'bk_03',
      title: 'Monograf Tangga & Proporsi',
      author: 'Bima Sakti Nugroho',
      isbn: '978-602-412-803-6',
      category: 'Desain & Seni',
      publisher: 'Atelier Press',
      year: 2023,
      pages: 228,
      totalCopies: 3,
      availableCopies: 2,
      synopsis:
        'Studi visual geometri tangga, bayangan tegas, dan ritme spasial pada bangunan museum kontemporer di Asia Tenggara.',
      coverImage: '/src/assets/images/cover_arsitektur_ruang_1795659684481.jpg',
      coverTheme: 'espresso-ivory',
      addedAt: daysAgoIso(100),
      borrowCount: 15,
    },
    {
      id: 'bk_04',
      title: 'Seni Melambat di Era Bising',
      author: 'Soraia Alatas',
      isbn: '978-602-412-804-3',
      category: 'Psikologi',
      publisher: 'Nirmala Pustaka',
      year: 2025,
      pages: 210,
      totalCopies: 6,
      availableCopies: 4,
      synopsis:
        'Esai reflektif tentang merawat fokus, membangun ritual membaca tanpa gangguan, dan menjaga kejernihan batin di tengah arus informasi.',
      coverImage: '/src/assets/images/cover_filosofi_tenang_1795659685624.jpg',
      coverTheme: 'maroon-linen',
      addedAt: daysAgoIso(90),
      borrowCount: 27,
    },
    {
      id: 'bk_05',
      title: 'Arsitektur Sistem Terdistribusi',
      author: 'Hendra Kusuma',
      isbn: '978-602-412-805-0',
      category: 'Teknologi',
      publisher: 'Informatika Nusantara',
      year: 2024,
      pages: 416,
      totalCopies: 4,
      availableCopies: 3,
      synopsis:
        'Panduan komprehensif merancang layanan web real-time, konsistensi data, dan toleransi kesalahan untuk skala jutaan pembaca.',
      coverImage: '',
      coverTheme: 'maroon-linen',
      addedAt: daysAgoIso(85),
      borrowCount: 14,
    },
    {
      id: 'bk_06',
      title: 'Tipografi Editorial Modern',
      author: 'Clarissa Tan',
      isbn: '978-602-412-806-7',
      category: 'Desain & Seni',
      publisher: 'Pustaka Rupa',
      year: 2024,
      pages: 248,
      totalCopies: 3,
      availableCopies: 3,
      synopsis:
        'Membedah anatomi huruf serif dan sans-serif, hierarki grid majalah sastra, serta tata letak halaman buku yang nyaman di mata.',
      coverImage: '',
      coverTheme: 'blush-arch',
      addedAt: daysAgoIso(72),
      borrowCount: 11,
    },
    {
      id: 'bk_07',
      title: 'Jejak Pelayaran Rempah',
      author: 'Prof. Darmawan Hadi',
      isbn: '978-602-412-807-4',
      category: 'Sejarah',
      publisher: 'Balai Pustaka Baru',
      year: 2022,
      pages: 380,
      totalCopies: 4,
      availableCopies: 4,
      synopsis:
        'Rekonstruksi sejarah maritim Nusantara abad ke-16 melalui arsip pelabuhan, catatan dagang, dan rute diplomasi budaya.',
      coverImage: '',
      coverTheme: 'espresso-ivory',
      addedAt: daysAgoIso(65),
      borrowCount: 9,
    },
    {
      id: 'bk_08',
      title: 'Ekonomi Kreatif & Kurasi Produk',
      author: 'Melati Kusumo',
      isbn: '978-602-412-808-1',
      category: 'Bisnis',
      publisher: 'Karya Mandiri',
      year: 2025,
      pages: 256,
      totalCopies: 5,
      availableCopies: 4,
      synopsis:
        'Strategi membangun jenama butik yang berkelanjutan melalui narasi autentik, desain kemasan, dan manajemen komunitas pembaca.',
      coverImage: '',
      coverTheme: 'rose-editorial',
      addedAt: daysAgoIso(50),
      borrowCount: 13,
    },
    {
      id: 'bk_09',
      title: 'Hujan di Bulan November',
      author: 'Senja Prameswari',
      isbn: '978-602-412-809-8',
      category: 'Fiksi Sastra',
      publisher: 'Serambi Aksara',
      year: 2024,
      pages: 294,
      totalCopies: 4,
      availableCopies: 4,
      synopsis:
        'Novel hangat tentang dua pustakawan muda yang menemukan manuskrip misterius terselip di antara koleksi sastra klasik.',
      coverImage: '',
      coverTheme: 'blush-arch',
      addedAt: daysAgoIso(45),
      borrowCount: 16,
    },
    {
      id: 'bk_10',
      title: 'Interaksi Manusia & Antarmuka Tenang',
      author: 'Rizky Ramadhan',
      isbn: '978-602-412-810-4',
      category: 'Teknologi',
      publisher: 'Informatika Nusantara',
      year: 2025,
      pages: 290,
      totalCopies: 4,
      availableCopies: 3,
      synopsis:
        'Prinsip calm technology, mikro-interaksi rendah latensi, dan aksesibilitas kontras tinggi dalam perancangan aplikasi web modern.',
      coverImage: '',
      coverTheme: 'maroon-linen',
      addedAt: daysAgoIso(30),
      borrowCount: 12,
    },
  ];

  const loans: Loan[] = [
    {
      id: 'ln_01',
      bookId: 'bk_02',
      bookTitle: 'Catatan Senja di Taman Botani',
      bookAuthor: 'Larasati Kirana',
      bookIsbn: '978-602-412-802-9',
      userId: 'usr_member_1',
      userName: 'Nadia Putri',
      userCode: 'ACL-1042',
      borrowedAt: daysAgoIso(4, 9),
      dueDate: daysFromNowIso(10),
      returnedAt: null,
      status: 'active',
      renewCount: 0,
      fineAmount: 0,
    },
    {
      id: 'ln_02',
      bookId: 'bk_04',
      bookTitle: 'Seni Melambat di Era Bising',
      bookAuthor: 'Soraia Alatas',
      bookIsbn: '978-602-412-804-3',
      userId: 'usr_member_1',
      userName: 'Nadia Putri',
      userCode: 'ACL-1042',
      borrowedAt: daysAgoIso(2, 14),
      dueDate: daysFromNowIso(5),
      returnedAt: null,
      status: 'active',
      renewCount: 1,
      fineAmount: 0,
    },
    {
      id: 'ln_03',
      bookId: 'bk_01',
      bookTitle: 'Estetika Ruang & Cahaya',
      bookAuthor: 'Aruna Maheswari',
      bookIsbn: '978-602-412-801-2',
      userId: 'usr_member_2',
      userName: 'Raka Pratama',
      userCode: 'ACL-1088',
      borrowedAt: daysAgoIso(11, 11),
      dueDate: daysAgoIso(2, 23),
      returnedAt: null,
      status: 'overdue',
      renewCount: 0,
      fineAmount: 4000,
    },
    {
      id: 'ln_04',
      bookId: 'bk_05',
      bookTitle: 'Arsitektur Sistem Terdistribusi',
      bookAuthor: 'Hendra Kusuma',
      bookIsbn: '978-602-412-805-0',
      userId: 'usr_member_3',
      userName: 'Keira Maharani',
      userCode: 'ACL-1105',
      borrowedAt: daysAgoIso(1, 16),
      dueDate: daysFromNowIso(13),
      returnedAt: null,
      status: 'active',
      renewCount: 0,
      fineAmount: 0,
    },
    {
      id: 'ln_05',
      bookId: 'bk_08',
      bookTitle: 'Ekonomi Kreatif & Kurasi Produk',
      bookAuthor: 'Melati Kusumo',
      bookIsbn: '978-602-412-808-1',
      userId: 'usr_member_4',
      userName: 'Dimas Wijaya',
      userCode: 'ACL-1129',
      borrowedAt: daysAgoIso(3, 13),
      dueDate: daysFromNowIso(4),
      returnedAt: null,
      status: 'active',
      renewCount: 0,
      fineAmount: 0,
    },
    {
      id: 'ln_06',
      bookId: 'bk_03',
      bookTitle: 'Monograf Tangga & Proporsi',
      bookAuthor: 'Bima Sakti Nugroho',
      bookIsbn: '978-602-412-803-6',
      userId: 'usr_member_2',
      userName: 'Raka Pratama',
      userCode: 'ACL-1088',
      borrowedAt: daysAgoIso(5, 10),
      dueDate: daysFromNowIso(9),
      returnedAt: null,
      status: 'active',
      renewCount: 0,
      fineAmount: 0,
    },
    {
      id: 'ln_07',
      bookId: 'bk_10',
      bookTitle: 'Interaksi Manusia & Antarmuka Tenang',
      bookAuthor: 'Rizky Ramadhan',
      bookIsbn: '978-602-412-810-4',
      userId: 'usr_member_3',
      userName: 'Keira Maharani',
      userCode: 'ACL-1105',
      borrowedAt: daysAgoIso(0, 9),
      dueDate: daysFromNowIso(7),
      returnedAt: null,
      status: 'active',
      renewCount: 0,
      fineAmount: 0,
    },
    {
      id: 'ln_08',
      bookId: 'bk_02',
      bookTitle: 'Catatan Senja di Taman Botani',
      bookAuthor: 'Larasati Kirana',
      bookIsbn: '978-602-412-802-9',
      userId: 'usr_member_4',
      userName: 'Dimas Wijaya',
      userCode: 'ACL-1129',
      borrowedAt: daysAgoIso(6, 15),
      dueDate: daysFromNowIso(8),
      returnedAt: null,
      status: 'active',
      renewCount: 0,
      fineAmount: 0,
    },
    {
      id: 'ln_09',
      bookId: 'bk_01',
      bookTitle: 'Estetika Ruang & Cahaya',
      bookAuthor: 'Aruna Maheswari',
      bookIsbn: '978-602-412-801-2',
      userId: 'usr_member_1',
      userName: 'Nadia Putri',
      userCode: 'ACL-1042',
      borrowedAt: daysAgoIso(14, 11),
      dueDate: daysAgoIso(7, 23),
      returnedAt: daysAgoIso(8, 16),
      status: 'returned',
      renewCount: 0,
      fineAmount: 0,
    },
    {
      id: 'ln_10',
      bookId: 'bk_09',
      bookTitle: 'Hujan di Bulan November',
      bookAuthor: 'Senja Prameswari',
      bookIsbn: '978-602-412-809-8',
      userId: 'usr_member_2',
      userName: 'Raka Pratama',
      userCode: 'ACL-1088',
      borrowedAt: daysAgoIso(12, 10),
      dueDate: daysAgoIso(5, 23),
      returnedAt: daysAgoIso(4, 11),
      status: 'returned',
      renewCount: 0,
      fineAmount: 2000,
    },
    {
      id: 'ln_11',
      bookId: 'bk_06',
      bookTitle: 'Tipografi Editorial Modern',
      bookAuthor: 'Clarissa Tan',
      bookIsbn: '978-602-412-806-7',
      userId: 'usr_member_1',
      userName: 'Nadia Putri',
      userCode: 'ACL-1042',
      borrowedAt: daysAgoIso(9, 13),
      dueDate: daysAgoIso(2, 23),
      returnedAt: daysAgoIso(3, 14),
      status: 'returned',
      renewCount: 0,
      fineAmount: 0,
    },
    {
      id: 'ln_12',
      bookId: 'bk_04',
      bookTitle: 'Seni Melambat di Era Bising',
      bookAuthor: 'Soraia Alatas',
      bookIsbn: '978-602-412-804-3',
      userId: 'usr_member_3',
      userName: 'Keira Maharani',
      userCode: 'ACL-1105',
      borrowedAt: daysAgoIso(8, 9),
      dueDate: daysAgoIso(1, 23),
      returnedAt: daysAgoIso(1, 17),
      status: 'returned',
      renewCount: 0,
      fineAmount: 0,
    },
  ];

  // Update available copies accurately from active/overdue loans
  const activeCountByBook = new Map<string, number>();
  for (const l of loans) {
    if (l.status !== 'returned') {
      activeCountByBook.set(l.bookId, (activeCountByBook.get(l.bookId) ?? 0) + 1);
    }
  }
  for (const b of books) {
    b.availableCopies = Math.max(0, b.totalCopies - (activeCountByBook.get(b.id) ?? 0));
  }

  const activities: ActivityEvent[] = [
    {
      id: 'act_01',
      type: 'borrow',
      actorName: 'Keira Maharani',
      actorRole: 'member',
      title: 'Peminjaman Buku Baru',
      detail: 'Meminjam "Interaksi Manusia & Antarmuka Tenang" (7 hari)',
      timestamp: daysAgoIso(0, 9),
    },
    {
      id: 'act_02',
      type: 'return',
      actorName: 'Keira Maharani',
      actorRole: 'member',
      title: 'Pengembalian Tepat Waktu',
      detail: 'Mengembalikan "Seni Melambat di Era Bising" tanpa denda',
      timestamp: daysAgoIso(1, 17),
    },
    {
      id: 'act_03',
      type: 'borrow',
      actorName: 'Keira Maharani',
      actorRole: 'member',
      title: 'Peminjaman Buku Baru',
      detail: 'Meminjam "Arsitektur Sistem Terdistribusi" (14 hari)',
      timestamp: daysAgoIso(1, 16),
    },
    {
      id: 'act_04',
      type: 'renew',
      actorName: 'Nadia Putri',
      actorRole: 'member',
      title: 'Perpanjangan Masa Pinjam',
      detail: 'Memperpanjang "Seni Melambat di Era Bising" (+7 hari)',
      timestamp: daysAgoIso(2, 14),
    },
    {
      id: 'act_05',
      type: 'return',
      actorName: 'Nadia Putri',
      actorRole: 'member',
      title: 'Pengembalian Tepat Waktu',
      detail: 'Mengembalikan "Tipografi Editorial Modern"',
      timestamp: daysAgoIso(3, 14),
    },
  ];

  const schedule: ReportScheduleConfig = {
    enabled: true,
    frequency: 'weekly',
    timeOfDay: '17:00',
    includeOverdueAlert: true,
    lastRunAt: daysAgoIso(1, 17),
  };

  const state: DatabaseState = {
    users,
    books,
    loans,
    activities,
    reports: [],
    schedule,
  };

  const initialReport = buildReportObject(state, 'weekly', 'auto', daysAgoIso(1, 17));
  state.reports.push(initialReport);

  return state;
}

function syncOverdueStatuses(state: DatabaseState): boolean {
  let changed = false;
  const now = Date.now();
  for (const loan of state.loans) {
    if (loan.status === 'returned') continue;
    const dueTime = new Date(loan.dueDate).getTime();
    if (now > dueTime) {
      const daysLate = Math.max(1, Math.ceil((now - dueTime) / 86400000));
      const newFine = daysLate * FINE_PER_DAY;
      if (loan.status !== 'overdue' || loan.fineAmount !== newFine) {
        loan.status = 'overdue';
        loan.fineAmount = newFine;
        changed = true;
      }
    } else if (loan.status === 'overdue') {
      loan.status = 'active';
      loan.fineAmount = 0;
      changed = true;
    }
  }
  return changed;
}

function computeStats(state: DatabaseState): LibraryStats {
  const totalTitles = state.books.length;
  const totalCopies = state.books.reduce((acc, b) => acc + b.totalCopies, 0);
  const availableCopies = state.books.reduce((acc, b) => acc + b.availableCopies, 0);

  const activeLoans = state.loans.filter((l) => l.status === 'active');
  const overdueLoans = state.loans.filter((l) => l.status === 'overdue');
  const returnedLoans = state.loans.filter((l) => l.status === 'returned');

  const onTimeReturned = returnedLoans.filter((l) => l.fineAmount === 0).length;
  const onTimeReturnRate =
    returnedLoans.length > 0
      ? Math.round((onTimeReturned / returnedLoans.length) * 100)
      : 100;

  const totalFinesCollected = returnedLoans.reduce((acc, l) => acc + l.fineAmount, 0);
  const activeMembersCount = state.users.filter((u) => u.role === 'member').length;

  // Build 14-day daily trend
  const dailyTrends: DailyTrendPoint[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateKey = `${yyyy}-${mm}-${dd}`;
    const label = `${d.getDate()} ${monthNames[d.getMonth()]}`;

    const borrows = state.loans.filter((l) => l.borrowedAt.slice(0, 10) === dateKey).length;
    const returns = state.loans.filter(
      (l) => l.returnedAt && l.returnedAt.slice(0, 10) === dateKey
    ).length;

    dailyTrends.push({ date: dateKey, label, borrows, returns });
  }

  // Category distribution
  const catMap = new Map<string, { totalBooks: number; totalBorrows: number }>();
  for (const b of state.books) {
    const prev = catMap.get(b.category) ?? { totalBooks: 0, totalBorrows: 0 };
    catMap.set(b.category, {
      totalBooks: prev.totalBooks + 1,
      totalBorrows: prev.totalBorrows + b.borrowCount,
    });
  }
  const totalBorrowsAll = Array.from(catMap.values()).reduce((s, c) => s + c.totalBorrows, 0);
  const categoryStats: CategoryStat[] = Array.from(catMap.entries())
    .map(([category, val]) => ({
      category,
      totalBooks: val.totalBooks,
      totalBorrows: val.totalBorrows,
      percentage: totalBorrowsAll > 0 ? Math.round((val.totalBorrows / totalBorrowsAll) * 100) : 0,
    }))
    .sort((a, b) => b.totalBorrows - a.totalBorrows);

  return {
    totalTitles,
    totalCopies,
    availableCopies,
    activeLoansCount: activeLoans.length + overdueLoans.length,
    overdueLoansCount: overdueLoans.length,
    returnedLoansCount: returnedLoans.length,
    activeMembersCount,
    onTimeReturnRate,
    totalFinesCollected,
    dailyTrends,
    categoryStats,
  };
}

function buildReportObject(
  state: DatabaseState,
  period: AutoReportPeriod,
  triggerMode: 'auto' | 'manual',
  customTimestamp?: string
): AutoReport {
  const now = customTimestamp ? new Date(customTimestamp) : new Date();
  const daysWindow = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
  const cutoff = now.getTime() - daysWindow * 86400000;

  const loansInWindow = state.loans.filter((l) => new Date(l.borrowedAt).getTime() >= cutoff);
  const returnsInWindow = state.loans.filter(
    (l) => l.returnedAt && new Date(l.returnedAt).getTime() >= cutoff
  );
  const overdueNow = state.loans.filter((l) => l.status === 'overdue');
  const returnedAll = state.loans.filter((l) => l.status === 'returned');
  const onTimeCount = returnedAll.filter((l) => l.fineAmount === 0).length;

  const topBooks = [...state.books]
    .sort((a, b) => b.borrowCount - a.borrowCount)
    .slice(0, 5)
    .map((b) => ({
      bookId: b.id,
      title: b.title,
      author: b.author,
      count: b.borrowCount,
    }));

  const memberCountMap = new Map<string, number>();
  for (const l of state.loans) {
    memberCountMap.set(l.userId, (memberCountMap.get(l.userId) ?? 0) + 1);
  }
  const topMembers = state.users
    .filter((u) => u.role === 'member')
    .map((u) => ({
      userId: u.id,
      name: u.name,
      memberCode: u.memberCode,
      count: memberCountMap.get(u.id) ?? 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const overdueItems = overdueNow.map((l) => {
    const daysLate = Math.max(
      1,
      Math.ceil((now.getTime() - new Date(l.dueDate).getTime()) / 86400000)
    );
    return {
      loanId: l.id,
      bookTitle: l.bookTitle,
      userName: l.userName,
      daysLate,
      fineAmount: l.fineAmount,
    };
  });

  const periodNames: Record<AutoReportPeriod, string> = {
    daily: 'Harian',
    weekly: 'Mingguan',
    monthly: 'Bulanan',
  };

  const formattedDate = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const codePrefix = period === 'daily' ? 'H' : period === 'weekly' ? 'M' : 'B';
  const reportCode = `ACL-${codePrefix}-${String(state.reports.length + 1).padStart(3, '0')}`;

  return {
    id: uid('rep'),
    code: reportCode,
    period,
    triggerMode,
    generatedAt: now.toISOString(),
    periodLabel: `Laporan ${periodNames[period]} · ${formattedDate}`,
    summary: {
      totalCirculation: state.loans.length,
      newLoans: loansInWindow.length,
      returnedLoans: returnsInWindow.length,
      overdueCount: overdueNow.length,
      activeMembersCount: state.users.filter((u) => u.role === 'member').length,
      totalFinesCollected: returnedAll.reduce((acc, l) => acc + l.fineAmount, 0),
      onTimeRate:
        returnedAll.length > 0 ? Math.round((onTimeCount / returnedAll.length) * 100) : 100,
    },
    topBooks,
    topMembers,
    overdueItems,
  };
}

function loadDatabase(): DatabaseState {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const seed = createSeedDatabase();
    saveDatabase(seed);
    return seed;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseState;
    if (syncOverdueStatuses(parsed)) {
      saveDatabase(parsed);
    }
    return parsed;
  } catch {
    const seed = createSeedDatabase();
    saveDatabase(seed);
    return seed;
  }
}

function saveDatabase(state: DatabaseState): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2), 'utf-8');
  fs.renameSync(tmpPath, DB_PATH);
}

let db: DatabaseState = loadDatabase();

function getBootstrapPayload(): BootstrapPayload {
  syncOverdueStatuses(db);
  return {
    users: db.users,
    books: db.books,
    loans: [...db.loans].sort(
      (a, b) => new Date(b.borrowedAt).getTime() - new Date(a.borrowedAt).getTime()
    ),
    activities: [...db.activities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 40),
    reports: [...db.reports].sort(
      (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    ),
    schedule: db.schedule,
    stats: computeStats(db),
    serverTime: new Date().toISOString(),
  };
}

function addActivity(
  type: ActivityEvent['type'],
  actorName: string,
  actorRole: ActivityEvent['actorRole'],
  title: string,
  detail: string
): ActivityEvent {
  const ev: ActivityEvent = {
    id: uid('act'),
    type,
    actorName,
    actorRole,
    title,
    detail,
    timestamp: new Date().toISOString(),
  };
  db.activities.unshift(ev);
  if (db.activities.length > 80) {
    db.activities = db.activities.slice(0, 80);
  }
  return ev;
}

function broadcastUpdate(eventType: string, activity?: ActivityEvent): void {
  const payload = JSON.stringify({
    eventType,
    activity: activity ?? null,
    bootstrap: getBootstrapPayload(),
  });
  for (const client of sseClients) {
    try {
      client.write(`event: sync\ndata: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

function maybeRunScheduledReport(): void {
  const overdueUpdated = syncOverdueStatuses(db);
  let reportCreated: ActivityEvent | undefined;

  if (db.schedule.enabled) {
    const now = new Date();
    const lastRun = db.schedule.lastRunAt ? new Date(db.schedule.lastRunAt).getTime() : 0;
    const minIntervalMs =
      db.schedule.frequency === 'daily'
        ? 23 * 3600000
        : db.schedule.frequency === 'weekly'
          ? 6 * 86400000
          : 28 * 86400000;

    if (now.getTime() - lastRun >= minIntervalMs) {
      const report = buildReportObject(db, db.schedule.frequency, 'auto');
      db.reports.unshift(report);
      db.schedule.lastRunAt = now.toISOString();
      reportCreated = addActivity(
        'report_auto',
        'Sistem Pelaporan Acelivre',
        'system',
        'Laporan Otomatis Diterbitkan',
        `${report.code} (${report.periodLabel}) selesai dikompilasi otomatis`
      );
      saveDatabase(db);
      broadcastUpdate('report:generated', reportCreated);
      return;
    }
  }

  if (overdueUpdated) {
    saveDatabase(db);
    broadcastUpdate('loans:overdue_sync');
  }
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // SSE real-time stream
  app.get('/api/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseClients.add(res);
    res.write(
      `event: connected\ndata: ${JSON.stringify({ ok: true, serverTime: new Date().toISOString() })}\n\n`
    );

    const heartbeat = setInterval(() => {
      try {
        res.write(`event: ping\ndata: ${JSON.stringify({ t: Date.now() })}\n\n`);
      } catch {
        clearInterval(heartbeat);
        sseClients.delete(res);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  // Bootstrap full data
  app.get('/api/bootstrap', (_req: Request, res: Response) => {
    res.json(getBootstrapPayload());
  });

  // Login or switch account
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, userId } = req.body as { email?: string; userId?: string };
    const found = db.users.find(
      (u) =>
        (userId && u.id === userId) ||
        (email && u.email.toLowerCase() === email.trim().toLowerCase())
    );
    if (!found) {
      res.status(404).json({ error: 'Akun tidak ditemukan. Silakan daftar sebagai anggota baru.' });
      return;
    }
    res.json({ user: found });
  });

  // Register new member
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { name, email } = req.body as { name?: string; email?: string };
    const cleanName = (name ?? '').trim();
    const cleanEmail = (email ?? '').trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 80) {
      res.status(400).json({ error: 'Nama lengkap harus antara 2 hingga 80 karakter.' });
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      res.status(400).json({ error: 'Format email tidak valid.' });
      return;
    }
    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      res.status(409).json({ error: 'Email sudah terdaftar di Acelivre.' });
      return;
    }

    const memberNumber = 1130 + db.users.length;
    const newUser: User = {
      id: uid('usr'),
      name: cleanName,
      email: cleanEmail,
      role: 'member',
      memberCode: `ACL-${memberNumber}`,
      joinedAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    const act = addActivity(
      'member_join',
      newUser.name,
      'member',
      'Anggota Baru Bergabung',
      `${newUser.name} (${newUser.memberCode}) terdaftar sebagai member Acelivre`
    );
    saveDatabase(db);
    broadcastUpdate('member:registered', act);
    res.status(201).json({ user: newUser });
  });

  // Add new book (Admin)
  app.post('/api/books', (req: Request, res: Response) => {
    const {
      actorId,
      title,
      author,
      isbn,
      category,
      publisher,
      year,
      pages,
      totalCopies,
      synopsis,
      coverImage,
      coverTheme,
    } = req.body as Partial<Book> & { actorId?: string };

    const actor = db.users.find((u) => u.id === actorId);
    if (!actor || actor.role !== 'admin') {
      res.status(403).json({ error: 'Hanya Admin Pustakawan yang dapat menambah koleksi.' });
      return;
    }

    const cleanTitle = (title ?? '').trim();
    const cleanAuthor = (author ?? '').trim();
    const cleanIsbn = (isbn ?? '').trim();
    const copies = Number(totalCopies ?? 1);

    if (!cleanTitle || !cleanAuthor || !cleanIsbn) {
      res.status(400).json({ error: 'Judul, penulis, dan ISBN wajib diisi.' });
      return;
    }
    if (!Number.isInteger(copies) || copies < 1 || copies > 100) {
      res.status(400).json({ error: 'Jumlah eksemplar harus berupa bilangan bulat 1–100.' });
      return;
    }

    const newBook: Book = {
      id: uid('bk'),
      title: cleanTitle,
      author: cleanAuthor,
      isbn: cleanIsbn,
      category: (category ?? 'Fiksi Sastra').trim(),
      publisher: (publisher ?? 'Pustaka Acelivre').trim(),
      year: Number(year) || new Date().getFullYear(),
      pages: Number(pages) || 200,
      totalCopies: copies,
      availableCopies: copies,
      synopsis: (synopsis ?? 'Koleksi kurasi perpustakaan digital Acelivre.').trim(),
      coverImage: (coverImage ?? '').trim(),
      coverTheme: coverTheme ?? 'maroon-linen',
      addedAt: new Date().toISOString(),
      borrowCount: 0,
    };

    db.books.unshift(newBook);
    const act = addActivity(
      'catalog_add',
      actor.name,
      'admin',
      'Koleksi Baru Ditambahkan',
      `Menambahkan "${newBook.title}" (${newBook.totalCopies} eksemplar)`
    );
    saveDatabase(db);
    broadcastUpdate('book:created', act);
    res.status(201).json({ book: newBook });
  });

  // Update book (Admin)
  app.put('/api/books/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      actorId,
      title,
      author,
      isbn,
      category,
      publisher,
      year,
      pages,
      totalCopies,
      synopsis,
      coverTheme,
    } = req.body as Partial<Book> & { actorId?: string };

    const actor = db.users.find((u) => u.id === actorId);
    if (!actor || actor.role !== 'admin') {
      res.status(403).json({ error: 'Hanya Admin Pustakawan yang dapat mengubah koleksi.' });
      return;
    }

    const book = db.books.find((b) => b.id === id);
    if (!book) {
      res.status(404).json({ error: 'Buku tidak ditemukan.' });
      return;
    }

    const activeLoansForBook = db.loans.filter(
      (l) => l.bookId === book.id && l.status !== 'returned'
    ).length;

    const newTotal = totalCopies !== undefined ? Number(totalCopies) : book.totalCopies;
    if (!Number.isInteger(newTotal) || newTotal < activeLoansForBook) {
      res.status(400).json({
        error: `Jumlah total eksemplar tidak boleh kurang dari buku yang sedang dipinjam (${activeLoansForBook}).`,
      });
      return;
    }

    if (title !== undefined) book.title = title.trim();
    if (author !== undefined) book.author = author.trim();
    if (isbn !== undefined) book.isbn = isbn.trim();
    if (category !== undefined) book.category = category.trim();
    if (publisher !== undefined) book.publisher = publisher.trim();
    if (year !== undefined) book.year = Number(year);
    if (pages !== undefined) book.pages = Number(pages);
    if (synopsis !== undefined) book.synopsis = synopsis.trim();
    if (coverTheme !== undefined) book.coverTheme = coverTheme;
    book.totalCopies = newTotal;
    book.availableCopies = newTotal - activeLoansForBook;

    const act = addActivity(
      'catalog_update',
      actor.name,
      'admin',
      'Koleksi Diperbarui',
      `Memperbarui detail & stok "${book.title}" (Tersedia ${book.availableCopies}/${book.totalCopies})`
    );
    saveDatabase(db);
    broadcastUpdate('book:updated', act);
    res.json({ book });
  });

  // Delete book (Admin)
  app.delete('/api/books/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const actorId = (req.query.actorId as string | undefined) ?? (req.body as { actorId?: string })?.actorId;

    const actor = db.users.find((u) => u.id === actorId);
    if (!actor || actor.role !== 'admin') {
      res.status(403).json({ error: 'Hanya Admin Pustakawan yang dapat menghapus koleksi.' });
      return;
    }

    const idx = db.books.findIndex((b) => b.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Buku tidak ditemukan.' });
      return;
    }

    const activeLoansForBook = db.loans.filter(
      (l) => l.bookId === id && l.status !== 'returned'
    ).length;
    if (activeLoansForBook > 0) {
      res.status(400).json({
        error: `Buku masih dipinjam oleh ${activeLoansForBook} anggota. Selesaikan pengembalian terlebih dahulu.`,
      });
      return;
    }

    const [removed] = db.books.splice(idx, 1);
    const act = addActivity(
      'catalog_delete',
      actor.name,
      'admin',
      'Koleksi Dihapus',
      `Menghapus "${removed.title}" dari katalog Acelivre`
    );
    saveDatabase(db);
    broadcastUpdate('book:deleted', act);
    res.json({ ok: true });
  });

  // Borrow a book
  app.post('/api/loans', (req: Request, res: Response) => {
    const { bookId, userId, durationDays, actorId } = req.body as {
      bookId?: string;
      userId?: string;
      durationDays?: number;
      actorId?: string;
    };

    const book = db.books.find((b) => b.id === bookId);
    const borrower = db.users.find((u) => u.id === userId);
    const actor = db.users.find((u) => u.id === (actorId ?? userId));

    if (!book) {
      res.status(404).json({ error: 'Buku tidak ditemukan di katalog.' });
      return;
    }
    if (!borrower) {
      res.status(404).json({ error: 'Akun anggota tidak ditemukan.' });
      return;
    }
    if (book.availableCopies <= 0) {
      res.status(400).json({ error: 'Stok buku ini sedang habis dipinjam.' });
      return;
    }

    const memberActiveLoans = db.loans.filter(
      (l) => l.userId === borrower.id && l.status !== 'returned'
    );
    if (memberActiveLoans.length >= MAX_ACTIVE_LOANS_PER_MEMBER) {
      res.status(400).json({
        error: `Kuota peminjaman maksimal ${MAX_ACTIVE_LOANS_PER_MEMBER} buku aktif telah tercapai.`,
      });
      return;
    }
    if (memberActiveLoans.some((l) => l.bookId === book.id)) {
      res.status(400).json({ error: 'Anda sedang meminjam judul buku yang sama.' });
      return;
    }

    const days = durationDays === 14 ? 14 : 7;
    const newLoan: Loan = {
      id: uid('ln'),
      bookId: book.id,
      bookTitle: book.title,
      bookAuthor: book.author,
      bookIsbn: book.isbn,
      userId: borrower.id,
      userName: borrower.name,
      userCode: borrower.memberCode,
      borrowedAt: new Date().toISOString(),
      dueDate: daysFromNowIso(days),
      returnedAt: null,
      status: 'active',
      renewCount: 0,
      fineAmount: 0,
    };

    book.availableCopies -= 1;
    book.borrowCount += 1;
    db.loans.unshift(newLoan);

    const act = addActivity(
      'borrow',
      actor?.name ?? borrower.name,
      actor?.role ?? borrower.role,
      'Peminjaman Buku Baru',
      `${borrower.name} meminjam "${book.title}" selama ${days} hari`
    );

    saveDatabase(db);
    broadcastUpdate('loan:created', act);
    res.status(201).json({ loan: newLoan });
  });

  // Return a borrowed book
  app.post('/api/loans/:id/return', (req: Request, res: Response) => {
    const { id } = req.params;
    const { actorId } = req.body as { actorId?: string };

    syncOverdueStatuses(db);
    const loan = db.loans.find((l) => l.id === id);
    if (!loan) {
      res.status(404).json({ error: 'Transaksi peminjaman tidak ditemukan.' });
      return;
    }
    if (loan.status === 'returned') {
      res.status(400).json({ error: 'Buku ini sudah dikembalikan sebelumnya.' });
      return;
    }

    const actor = db.users.find((u) => u.id === actorId);
    if (actor && actor.role !== 'admin' && actor.id !== loan.userId) {
      res.status(403).json({ error: 'Tidak memiliki izin mengembalikan transaksi milik anggota lain.' });
      return;
    }

    const book = db.books.find((b) => b.id === loan.bookId);
    if (book) {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
    }

    loan.status = 'returned';
    loan.returnedAt = new Date().toISOString();

    const fineText =
      loan.fineAmount > 0
        ? ` (denda keterlambatan Rp ${loan.fineAmount.toLocaleString('id-ID')})`
        : ' tepat waktu';

    const act = addActivity(
      'return',
      actor?.name ?? loan.userName,
      actor?.role ?? 'member',
      'Pengembalian Buku',
      `${loan.userName} mengembalikan "${loan.bookTitle}"${fineText}`
    );

    saveDatabase(db);
    broadcastUpdate('loan:returned', act);
    res.json({ loan });
  });

  // Renew loan (+7 days)
  app.post('/api/loans/:id/renew', (req: Request, res: Response) => {
    const { id } = req.params;
    const { actorId } = req.body as { actorId?: string };

    syncOverdueStatuses(db);
    const loan = db.loans.find((l) => l.id === id);
    if (!loan) {
      res.status(404).json({ error: 'Transaksi peminjaman tidak ditemukan.' });
      return;
    }
    if (loan.status === 'returned') {
      res.status(400).json({ error: 'Buku yang sudah dikembalikan tidak dapat diperpanjang.' });
      return;
    }
    if (loan.status === 'overdue') {
      res.status(400).json({ error: 'Buku terlambat tidak dapat diperpanjang. Harap kembalikan dahulu.' });
      return;
    }
    if (loan.renewCount >= MAX_RENEWALS) {
      res.status(400).json({ error: `Batas maksimal perpanjangan (${MAX_RENEWALS} kali) telah tercapai.` });
      return;
    }

    const actor = db.users.find((u) => u.id === actorId);
    const currentDue = new Date(loan.dueDate).getTime();
    const extendedDue = new Date(currentDue + 7 * 86400000);
    loan.dueDate = extendedDue.toISOString();
    loan.renewCount += 1;

    const act = addActivity(
      'renew',
      actor?.name ?? loan.userName,
      actor?.role ?? 'member',
      'Perpanjangan Masa Pinjam',
      `${loan.userName} memperpanjang "${loan.bookTitle}" (+7 hari)`
    );

    saveDatabase(db);
    broadcastUpdate('loan:renewed', act);
    res.json({ loan });
  });

  // Generate automated/manual report
  app.post('/api/reports/generate', (req: Request, res: Response) => {
    const { period, actorId } = req.body as { period?: AutoReportPeriod; actorId?: string };
    const actor = db.users.find((u) => u.id === actorId);
    if (!actor || actor.role !== 'admin') {
      res.status(403).json({ error: 'Hanya Admin Pustakawan yang dapat menerbitkan laporan.' });
      return;
    }

    const validPeriod: AutoReportPeriod =
      period === 'daily' || period === 'weekly' || period === 'monthly' ? period : 'weekly';

    syncOverdueStatuses(db);
    const report = buildReportObject(db, validPeriod, 'manual');
    db.reports.unshift(report);

    const act = addActivity(
      'report_manual',
      actor.name,
      'admin',
      'Laporan Sirkulasi Diterbitkan',
      `${report.code} (${report.periodLabel}) berhasil dikompilasi`
    );

    saveDatabase(db);
    broadcastUpdate('report:generated', act);
    res.status(201).json({ report });
  });

  // Update automated report schedule
  app.put('/api/reports/schedule', (req: Request, res: Response) => {
    const { actorId, enabled, frequency, timeOfDay, includeOverdueAlert } = req.body as Partial<
      ReportScheduleConfig
    > & { actorId?: string };

    const actor = db.users.find((u) => u.id === actorId);
    if (!actor || actor.role !== 'admin') {
      res.status(403).json({ error: 'Hanya Admin Pustakawan yang dapat mengatur jadwal laporan.' });
      return;
    }

    if (typeof enabled === 'boolean') db.schedule.enabled = enabled;
    if (frequency === 'daily' || frequency === 'weekly' || frequency === 'monthly') {
      db.schedule.frequency = frequency;
    }
    if (typeof timeOfDay === 'string' && /^\d{2}:\d{2}$/.test(timeOfDay)) {
      db.schedule.timeOfDay = timeOfDay;
    }
    if (typeof includeOverdueAlert === 'boolean') {
      db.schedule.includeOverdueAlert = includeOverdueAlert;
    }

    const act = addActivity(
      'report_auto',
      actor.name,
      'admin',
      'Jadwal Pelaporan Otomatis Diperbarui',
      db.schedule.enabled
        ? `Aktif (${db.schedule.frequency === 'daily' ? 'Harian' : db.schedule.frequency === 'weekly' ? 'Mingguan' : 'Bulanan'} pukul ${db.schedule.timeOfDay})`
        : 'Penjadwalan otomatis dinonaktifkan'
    );

    saveDatabase(db);
    broadcastUpdate('schedule:updated', act);
    res.json({ schedule: db.schedule });
  });

  // Run periodic overdue & automated report check every 60s
  setInterval(maybeRunScheduledReport, 60000);

  // Vite dev middleware or static dist serving
  const distDir = path.resolve(process.cwd(), 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distDir);

  if (isProd) {
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Acelivre server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Acelivre server:', err);
  process.exit(1);
});
