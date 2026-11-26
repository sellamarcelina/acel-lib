import { useState } from 'react';
import { ArrowRight, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import type { ActivityEvent, LibraryStats, Loan } from '../types/library';
import { formatDateId, formatRupiah, getDaysRemaining } from '../utils/formatters';
import { BorrowingCharts } from './BorrowingCharts';
import { LiveActivityFeed } from './LiveActivityFeed';

interface AdminDashboardProps {
  stats: LibraryStats;
  loans: Loan[];
  activities: ActivityEvent[];
  isRealtimeConnected: boolean;
  onReturnLoan: (loanId: string) => Promise<void>;
  onRenewLoan: (loanId: string) => Promise<void>;
  onNavigate: (tab: 'catalog' | 'collection' | 'reports') => void;
}

export function AdminDashboard({
  stats,
  loans,
  activities,
  isRealtimeConnected,
  onReturnLoan,
  onRenewLoan,
  onNavigate,
}: AdminDashboardProps) {
  const [busyLoanId, setBusyLoanId] = useState<string | null>(null);

  const openLoans = loans.filter((l) => l.status !== 'returned');
  const sortedOpenLoans = [...openLoans].sort((a, b) => {
    if (a.status === 'overdue' && b.status !== 'overdue') return -1;
    if (a.status !== 'overdue' && b.status === 'overdue') return 1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const handleReturn = async (id: string) => {
    setBusyLoanId(id);
    try {
      await onReturnLoan(id);
    } finally {
      setBusyLoanId(null);
    }
  };

  const handleRenew = async (id: string) => {
    setBusyLoanId(id);
    try {
      await onRenewLoan(id);
    } finally {
      setBusyLoanId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Strip — 4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-[#EDD8DC] rounded-xl p-5">
          <p className="text-xs font-medium text-[#6C5258]">Total Koleksi Pustaka</p>
          <p className="font-display text-3xl font-semibold text-[#241418] mt-2 tabular-nums">
            {stats.totalTitles} <span className="text-base font-sans font-normal text-[#6C5258]">judul</span>
          </p>
          <p className="text-xs text-[#8A6E75] mt-2 tabular-nums">
            {stats.availableCopies} tersedia dari {stats.totalCopies} eksemplar
          </p>
        </div>

        <div className="bg-white border border-[#EDD8DC] rounded-xl p-5">
          <p className="text-xs font-medium text-[#6C5258]">Sedang Dipinjam</p>
          <p className="font-display text-3xl font-semibold text-[#6D1A36] mt-2 tabular-nums">
            {stats.activeLoansCount} <span className="text-base font-sans font-normal text-[#6C5258]">transaksi</span>
          </p>
          <p className="text-xs text-[#8A6E75] mt-2 tabular-nums">
            {stats.overdueLoansCount > 0
              ? `${stats.overdueLoansCount} transaksi melewati jatuh tempo`
              : 'Seluruh pinjaman masih dalam batas waktu'}
          </p>
        </div>

        <div className="bg-white border border-[#EDD8DC] rounded-xl p-5">
          <p className="text-xs font-medium text-[#6C5258]">Ketepatan Pengembalian</p>
          <p className="font-display text-3xl font-semibold text-[#241418] mt-2 tabular-nums">
            {stats.onTimeReturnRate}%
          </p>
          <p className="text-xs text-[#8A6E75] mt-2 tabular-nums">
            {stats.returnedLoansCount} selesai · Denda {formatRupiah(stats.totalFinesCollected)}
          </p>
        </div>

        <div className="bg-white border border-[#EDD8DC] rounded-xl p-5">
          <p className="text-xs font-medium text-[#6C5258]">Anggota Aktif</p>
          <p className="font-display text-3xl font-semibold text-[#241418] mt-2 tabular-nums">
            {stats.activeMembersCount} <span className="text-base font-sans font-normal text-[#6C5258]">member</span>
          </p>
          <p className="text-xs text-[#8A6E75] mt-2">
            Maksimal 5 buku aktif per anggota
          </p>
        </div>
      </div>

      {/* Borrowing Statistics Charts */}
      <BorrowingCharts
        dailyTrends={stats.dailyTrends}
        categoryStats={stats.categoryStats}
      />

      {/* Bottom Split: Active Loans Table + Real-Time Stream */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <section className="xl:col-span-7 bg-white border border-[#EDD8DC] rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#F3E5E8]">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#241418]">
                Sirkulasi Aktif &amp; Jatuh Tempo
              </h2>
              <p className="text-sm text-[#6C5258] mt-0.5 tabular-nums">
                {sortedOpenLoans.length} buku sedang berada di tangan pembaca
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('collection')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6D1A36] hover:text-[#531228] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Kelola Semua Transaksi
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {sortedOpenLoans.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-[#6C5258]">
                Tidak ada peminjaman aktif saat ini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#EDD8DC] text-[12px] font-medium text-[#6C5258]">
                    <th className="py-3 pr-4">Judul Buku &amp; Anggota</th>
                    <th className="py-3 px-3 whitespace-nowrap">Jatuh Tempo</th>
                    <th className="py-3 px-3 whitespace-nowrap">Status</th>
                    <th className="py-3 pl-3 text-right whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F6E9EC] text-sm">
                  {sortedOpenLoans.slice(0, 6).map((loan) => {
                    const daysLeft = getDaysRemaining(loan.dueDate);
                    const isOverdue = loan.status === 'overdue';
                    const isBusy = busyLoanId === loan.id;

                    return (
                      <tr key={loan.id} className="hover:bg-[#FDF8F8] transition-colors">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-[#241418] line-clamp-1">
                            {loan.bookTitle}
                          </p>
                          <p className="text-xs text-[#6C5258] mt-0.5">
                            {loan.userName} · <span className="font-mono">{loan.userCode}</span>
                          </p>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-mono text-xs tabular-nums text-[#241418]">
                          {formatDateId(loan.dueDate)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {isOverdue ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#9F1239] tabular-nums">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              Terlambat ({formatRupiah(loan.fineAmount)})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#B45309] tabular-nums">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              Sisa {Math.max(1, daysLeft)} hari
                            </span>
                          )}
                        </td>
                        <td className="py-3 pl-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            {!isOverdue && loan.renewCount < 2 && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleRenew(loan.id)}
                                title="Perpanjang 7 hari"
                                className="px-2.5 py-1.5 text-xs font-medium text-[#6D1A36] bg-[#F9EEF0] hover:bg-[#F3D5DE] rounded-md transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
                              >
                                <span className="inline-flex items-center gap-1">
                                  <RefreshCw className="w-3 h-3" />
                                  +7 Hari
                                </span>
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleReturn(loan.id)}
                              className="px-2.5 py-1.5 text-xs font-medium text-white bg-[#6D1A36] hover:bg-[#531228] rounded-md transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
                            >
                              <span className="inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Kembali
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="xl:col-span-5">
          <LiveActivityFeed
            activities={activities}
            isRealtimeConnected={isRealtimeConnected}
            limit={7}
          />
        </div>
      </div>
    </div>
  );
}
