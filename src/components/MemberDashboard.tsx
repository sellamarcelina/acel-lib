import { useState } from 'react';
import { ArrowRight, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import type { ActivityEvent, Book, Loan, User } from '../types/library';
import { formatDateId, formatRupiah, getDaysRemaining } from '../utils/formatters';
import { BookCover } from './BookCover';
import { LiveActivityFeed } from './LiveActivityFeed';

interface MemberDashboardProps {
  currentUser: User;
  books: Book[];
  loans: Loan[];
  activities: ActivityEvent[];
  isRealtimeConnected: boolean;
  onReturnLoan: (loanId: string) => Promise<void>;
  onRenewLoan: (loanId: string) => Promise<void>;
  onSelectBook: (book: Book) => void;
  onOpenCatalog: () => void;
}

export function MemberDashboard({
  currentUser,
  books,
  loans,
  activities,
  isRealtimeConnected,
  onReturnLoan,
  onRenewLoan,
  onSelectBook,
  onOpenCatalog,
}: MemberDashboardProps) {
  const [busyLoanId, setBusyLoanId] = useState<string | null>(null);

  const myLoans = loans.filter((l) => l.userId === currentUser.id);
  const myActiveLoans = myLoans.filter((l) => l.status !== 'returned');
  const myReturnedLoans = myLoans.filter((l) => l.status === 'returned');
  const myOverdueCount = myActiveLoans.filter((l) => l.status === 'overdue').length;
  const myTotalFine = myActiveLoans.reduce((s, l) => s + l.fineAmount, 0);
  const quotaRemaining = Math.max(0, 5 - myActiveLoans.length);

  const bookMap = new Map(books.map((b) => [b.id, b]));
  const recommendedBooks = books
    .filter((b) => b.availableCopies > 0 && !myActiveLoans.some((l) => l.bookId === b.id))
    .slice(0, 4);

  const handleReturn = async (loanId: string) => {
    setBusyLoanId(loanId);
    try {
      await onReturnLoan(loanId);
    } finally {
      setBusyLoanId(null);
    }
  };

  const handleRenew = async (loanId: string) => {
    setBusyLoanId(loanId);
    try {
      await onRenewLoan(loanId);
    } finally {
      setBusyLoanId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Editorial Member Welcome Hero */}
      <section className="relative overflow-hidden rounded-xl border border-[#EDD8DC] min-h-[220px] flex items-end">
        <img
          src="/src/assets/images/acelivre_library_hero_1795659684345.jpg"
          alt="Meja baca perpustakaan digital Acelivre bernuansa soft pink dan maroon"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2E0B17]/90 via-[#4A1224]/75 to-[#2E0B17]/40" />

        <div className="relative z-10 w-full p-6 sm:p-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-xs font-medium text-[#F3D5DE] tracking-wide">
              Ruang Baca Member · {currentUser.memberCode}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white mt-1.5 text-balance">
              Selamat membaca kembali, {currentUser.name}
            </h2>
            <p className="text-sm text-[#F8E7EC] mt-2 leading-relaxed">
              Pantau masa pinjam buku Anda secara real-time, perpanjang durasi baca sekali klik, atau temukan judul baru di katalog Acelivre.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenCatalog}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#FDF8F8] text-[#6D1A36] hover:bg-[#F3D5DE] text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start md:self-auto"
          >
            Jelajahi Katalog
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Personal 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-[#EDD8DC] rounded-xl p-5">
          <p className="text-xs font-medium text-[#6C5258]">Sedang Dipinjam</p>
          <p className="font-display text-3xl font-semibold text-[#6D1A36] mt-2 tabular-nums">
            {myActiveLoans.length} <span className="text-base font-sans font-normal text-[#6C5258]">buku</span>
          </p>
          <p className="text-xs text-[#8A6E75] mt-2 tabular-nums">
            Dari batas maksimal 5 buku aktif
          </p>
        </div>

        <div className="bg-white border border-[#EDD8DC] rounded-xl p-5">
          <p className="text-xs font-medium text-[#6C5258]">Sisa Kuota Pinjam</p>
          <p className="font-display text-3xl font-semibold text-[#241418] mt-2 tabular-nums">
            {quotaRemaining} <span className="text-base font-sans font-normal text-[#6C5258]">slot</span>
          </p>
          <p className="text-xs text-[#8A6E75] mt-2">
            {quotaRemaining > 0 ? 'Siap digunakan meminjam koleksi' : 'Kembalikan 1 buku untuk kuota baru'}
          </p>
        </div>

        <div className="bg-white border border-[#EDD8DC] rounded-xl p-5">
          <p className="text-xs font-medium text-[#6C5258]">Selesai Dibaca</p>
          <p className="font-display text-3xl font-semibold text-[#241418] mt-2 tabular-nums">
            {myReturnedLoans.length} <span className="text-base font-sans font-normal text-[#6C5258]">judul</span>
          </p>
          <p className="text-xs text-[#8A6E75] mt-2">
            Total riwayat pengembalian tercatat
          </p>
        </div>

        <div className="bg-white border border-[#EDD8DC] rounded-xl p-5">
          <p className="text-xs font-medium text-[#6C5258]">Status Keterlambatan</p>
          <p
            className={`font-display text-3xl font-semibold mt-2 tabular-nums ${
              myOverdueCount > 0 ? 'text-[#9F1239]' : 'text-[#15803D]'
            }`}
          >
            {myOverdueCount > 0 ? formatRupiah(myTotalFine) : 'Nihil'}
          </p>
          <p className="text-xs text-[#8A6E75] mt-2 tabular-nums">
            {myOverdueCount > 0
              ? `${myOverdueCount} buku perlu segera dikembalikan`
              : 'Seluruh pinjaman dalam status aman'}
          </p>
        </div>
      </div>

      {/* Main Split: Active Member Loans + Real-Time Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <section className="xl:col-span-7 bg-white border border-[#EDD8DC] rounded-xl p-6">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#F3E5E8]">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#241418]">
                Pinjaman Saya Saat Ini
              </h2>
              <p className="text-sm text-[#6C5258] mt-0.5 tabular-nums">
                {myActiveLoans.length} buku aktif · Perpanjangan +7 hari tersedia maksimal 2x
              </p>
            </div>
          </div>

          {myActiveLoans.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm text-[#6C5258]">
                Anda belum memiliki pinjaman buku yang sedang berjalan.
              </p>
              <button
                type="button"
                onClick={onOpenCatalog}
                className="px-4 py-2 text-xs font-medium text-white bg-[#6D1A36] hover:bg-[#531228] rounded-lg transition-colors cursor-pointer"
              >
                Pinjam Buku Pertama
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-[#F6E9EC] mt-2">
              {myActiveLoans.map((loan) => {
                const book = bookMap.get(loan.bookId);
                const daysLeft = getDaysRemaining(loan.dueDate);
                const isOverdue = loan.status === 'overdue';
                const isBusy = busyLoanId === loan.id;

                return (
                  <li key={loan.id} className="py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <BookCover
                      title={loan.bookTitle}
                      author={loan.bookAuthor}
                      category={book?.category ?? 'Koleksi'}
                      coverImage={book?.coverImage}
                      coverTheme={book?.coverTheme}
                      compact
                      className="w-16 h-22 rounded-md shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[#241418] truncate">
                        {loan.bookTitle}
                      </h3>
                      <p className="text-xs text-[#6C5258] mt-0.5">
                        {loan.bookAuthor} · Jatuh tempo{' '}
                        <span className="font-mono tabular-nums text-[#241418]">
                          {formatDateId(loan.dueDate)}
                        </span>
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs tabular-nums">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 font-medium text-[#9F1239]">
                            <Clock className="w-3.5 h-3.5" />
                            Terlambat · Denda {formatRupiah(loan.fineAmount)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-[#B45309]">
                            <Clock className="w-3.5 h-3.5" />
                            Sisa {Math.max(1, daysLeft)} hari
                          </span>
                        )}
                        <span className="text-[#8A6E75]">
                          Perpanjangan {loan.renewCount}/2
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isOverdue && loan.renewCount < 2 && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleRenew(loan.id)}
                          className="px-3 py-2 text-xs font-medium text-[#6D1A36] bg-[#F9EEF0] hover:bg-[#F3D5DE] rounded-lg transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <RefreshCw className="w-3.5 h-3.5" />
                            Perpanjang
                          </span>
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleReturn(loan.id)}
                        className="px-3 py-2 text-xs font-medium text-white bg-[#6D1A36] hover:bg-[#531228] rounded-lg transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Kembalikan
                        </span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="xl:col-span-5">
          <LiveActivityFeed
            activities={activities}
            isRealtimeConnected={isRealtimeConnected}
            limit={6}
          />
        </div>
      </div>

      {/* Recommended Books */}
      <section className="bg-white border border-[#EDD8DC] rounded-xl p-6">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#F3E5E8]">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#241418]">
              Kurasi Tersedia Untuk Dipinjam
            </h2>
            <p className="text-sm text-[#6C5258] mt-0.5">
              Pilihan buku populer yang siap dipinjam hari ini
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenCatalog}
            className="text-xs font-medium text-[#6D1A36] hover:text-[#531228] whitespace-nowrap cursor-pointer"
          >
            Lihat semua koleksi
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
          {recommendedBooks.map((book) => (
            <button
              key={book.id}
              type="button"
              onClick={() => onSelectBook(book)}
              className="group text-left flex flex-col border border-[#EDD8DC] rounded-xl p-4 hover:border-[#C96B88] hover:bg-[#FDF8F8] transition-colors cursor-pointer"
            >
              <BookCover
                title={book.title}
                author={book.author}
                category={book.category}
                coverImage={book.coverImage}
                coverTheme={book.coverTheme}
                className="w-full aspect-[3/4] rounded-lg mb-3.5"
              />
              <p className="text-xs text-[#6C5258] truncate">
                {book.category} · {book.year}
              </p>
              <h3 className="font-display text-base font-semibold text-[#241418] mt-1 line-clamp-1">
                {book.title}
              </h3>
              <p className="text-xs text-[#6C5258] mt-0.5 truncate">{book.author}</p>
              <p className="text-xs font-medium text-[#15803D] mt-3 tabular-nums">
                Tersedia {book.availableCopies} dari {book.totalCopies} eksemplar
              </p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
