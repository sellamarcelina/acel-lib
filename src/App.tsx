import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  BookMarked,
  BookOpen,
  FileBarChart2,
  History,
  LayoutDashboard,
  Library,
  Menu,
  Radio,
  X,
} from 'lucide-react';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { CatalogView } from './components/CatalogView';
import { CollectionManagerView } from './components/CollectionManagerView';
import { MemberDashboard } from './components/MemberDashboard';
import { ReportsView } from './components/ReportsView';
import { libraryApi } from './services/libraryApi';
import type {
  AutoReportPeriod,
  Book,
  BootstrapPayload,
  ReportScheduleConfig,
} from './types/library';
import { formatDateId, formatRupiah } from './utils/formatters';

type ActiveTab = 'dashboard' | 'catalog' | 'collection' | 'reports' | 'history';

interface ToastMessage {
  id: number;
  text: string;
  tone: 'neutral' | 'error';
}

const STORAGE_USER_KEY = 'acelivre_active_user_id';

export default function App() {
  const [data, setData] = useState<BootstrapPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  const [activeUserId, setActiveUserId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_USER_KEY) || 'usr_admin_1';
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback((text: string, tone: 'neutral' | 'error' = 'neutral') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev.slice(-2), { id, text, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const fetchBootstrap = useCallback(async () => {
    try {
      const res = await libraryApi.getBootstrap();
      setData(res);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Gagal memuat data perpustakaan.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBootstrap();

    const unsubscribe = libraryApi.subscribeRealtime({
      onConnected: () => setIsRealtimeConnected(true),
      onDisconnected: () => setIsRealtimeConnected(false),
      onSync: ({ bootstrap, activity }) => {
        setData(bootstrap);
        setIsRealtimeConnected(true);
        if (activity) {
          pushToast(`${activity.title}: ${activity.detail}`);
        }
      },
    });

    return () => unsubscribe();
  }, [fetchBootstrap, pushToast]);

  const currentUser = useMemo(() => {
    if (!data || data.users.length === 0) return null;
    return data.users.find((u) => u.id === activeUserId) ?? data.users[0];
  }, [data, activeUserId]);

  const isAdmin = currentUser?.role === 'admin';

  // Ensure restricted tabs redirect gracefully when switching from Admin to Member
  useEffect(() => {
    if (!currentUser) return;
    if (!isAdmin && (activeTab === 'collection' || activeTab === 'reports')) {
      setActiveTab('dashboard');
    }
    if (isAdmin && activeTab === 'history') {
      setActiveTab('dashboard');
    }
  }, [currentUser, isAdmin, activeTab]);

  const handleSwitchUser = async (userId: string) => {
    try {
      const { user } = await libraryApi.login({ userId });
      setActiveUserId(user.id);
      localStorage.setItem(STORAGE_USER_KEY, user.id);
      setActiveTab('dashboard');
      pushToast(`Masuk sebagai ${user.name} (${user.role === 'admin' ? 'Admin' : 'Member'})`);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Gagal mengganti akun', 'error');
    }
  };

  const handleRegisterMember = async (name: string, email: string) => {
    try {
      const { user } = await libraryApi.registerMember({ name, email });
      setActiveUserId(user.id);
      localStorage.setItem(STORAGE_USER_KEY, user.id);
      setActiveTab('dashboard');
      await fetchBootstrap();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Gagal mendaftar member', 'error');
      throw err;
    }
  };

  const handleBorrowBook = async (payload: {
    bookId: string;
    userId: string;
    durationDays: 7 | 14;
  }) => {
    if (!currentUser) return;
    try {
      await libraryApi.borrowBook({ ...payload, actorId: currentUser.id });
      await fetchBootstrap();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Gagal meminjam buku', 'error');
      throw err;
    }
  };

  const handleReturnLoan = async (loanId: string) => {
    if (!currentUser) return;
    try {
      await libraryApi.returnLoan(loanId, currentUser.id);
      await fetchBootstrap();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Gagal mengembalikan buku', 'error');
    }
  };

  const handleRenewLoan = async (loanId: string) => {
    if (!currentUser) return;
    try {
      await libraryApi.renewLoan(loanId, currentUser.id);
      await fetchBootstrap();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Gagal memperpanjang masa pinjam', 'error');
    }
  };

  const handleCreateBook = async (payload: Partial<Book>) => {
    if (!currentUser) return;
    try {
      await libraryApi.createBook({ ...payload, actorId: currentUser.id });
      await fetchBootstrap();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Gagal menambah koleksi', 'error');
      throw err;
    }
  };

  const handleUpdateBook = async (bookId: string, payload: Partial<Book>) => {
    if (!currentUser) return;
    try {
      await libraryApi.updateBook(bookId, { ...payload, actorId: currentUser.id });
      await fetchBootstrap();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Gagal memperbarui koleksi', 'error');
      throw err;
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!currentUser) return;
    try {
      await libraryApi.deleteBook(bookId, currentUser.id);
      await fetchBootstrap();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Gagal menghapus koleksi', 'error');
      throw err;
    }
  };

  const handleGenerateReport = async (period: AutoReportPeriod) => {
    if (!currentUser) return;
    try {
      await libraryApi.generateReport(period, currentUser.id);
      await fetchBootstrap();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Gagal menerbitkan laporan', 'error');
    }
  };

  const handleUpdateSchedule = async (payload: Partial<ReportScheduleConfig>) => {
    if (!currentUser) return;
    try {
      await libraryApi.updateSchedule({ ...payload, actorId: currentUser.id });
      await fetchBootstrap();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Gagal memperbarui jadwal', 'error');
    }
  };

  const navItems: { id: ActiveTab; label: string; icon: typeof LayoutDashboard }[] = isAdmin
    ? [
        { id: 'dashboard', label: 'Dashboard Admin', icon: LayoutDashboard },
        { id: 'catalog', label: 'Katalog Buku', icon: BookOpen },
        { id: 'collection', label: 'Koleksi & Sirkulasi', icon: Library },
        { id: 'reports', label: 'Pelaporan Otomatis', icon: FileBarChart2 },
      ]
    : [
        { id: 'dashboard', label: 'Dashboard Member', icon: LayoutDashboard },
        { id: 'catalog', label: 'Katalog & Pinjam', icon: BookOpen },
        { id: 'history', label: 'Riwayat Pinjaman', icon: History },
      ];

  const pageTitleMap: Record<ActiveTab, string> = {
    dashboard: isAdmin ? 'Dashboard Admin' : 'Dashboard Member',
    catalog: 'Katalog & Peminjaman Buku',
    collection: 'Manajemen Koleksi & Sirkulasi',
    reports: 'Sistem Pelaporan Otomatis',
    history: 'Riwayat Peminjaman Saya',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDF8F8] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-[#EDD8DC] rounded-2xl p-8 text-center space-y-3">
          <p className="font-display text-2xl font-bold text-[#6D1A36]">acelivre</p>
          <p className="text-sm text-[#6C5258]">Menyiapkan ruang baca dan data sirkulasi...</p>
        </div>
      </div>
    );
  }

  if (loadError || !data || !currentUser) {
    return (
      <div className="min-h-screen bg-[#FDF8F8] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-[#EDD8DC] rounded-2xl p-8 text-center space-y-4">
          <p className="font-display text-2xl font-bold text-[#6D1A36]">acelivre</p>
          <p className="text-sm text-[#9F1239]">
            {loadError || 'Koneksi ke server perpustakaan terputus.'}
          </p>
          <button
            type="button"
            onClick={fetchBootstrap}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#6D1A36] rounded-lg cursor-pointer"
          >
            Muat Ulang Data
          </button>
        </div>
      </div>
    );
  }

  const memberLoansHistory = data.loans.filter((l) => l.userId === currentUser.id);

  return (
    <div className="min-h-screen bg-[#FDF8F8] text-[#241418] flex">
      {/* Desktop Sidebar (256px) */}
      <aside className="no-print hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-[#EDD8DC] justify-between">
        <div>
          {/* Brand Header */}
          <div className="h-16 px-6 flex items-center border-b border-[#F3E5E8]">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="font-display text-2xl font-bold tracking-tight text-[#6D1A36] whitespace-nowrap shrink-0 cursor-pointer"
            >
              acelivre
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#F9EEF0] text-[#6D1A36]'
                      : 'text-[#5D474D] hover:bg-[#FDF8F8] hover:text-[#241418]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Account Footer */}
        <div className="p-4 border-t border-[#F3E5E8] space-y-3">
          <div className="p-3 rounded-xl bg-[#FDF8F8] border border-[#EDD8DC]">
            <p className="text-xs font-semibold text-[#241418] truncate">
              {currentUser.name}
            </p>
            <p className="text-[11px] text-[#6C5258] mt-0.5 truncate">
              {isAdmin ? 'Admin Pustakawan' : 'Member Perpustakaan'} · {currentUser.memberCode}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-[#6D1A36] bg-[#F9EEF0] hover:bg-[#F3D5DE] rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Ganti Peran / Akun
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileNavOpen && (
        <div
          className="no-print fixed inset-0 z-40 lg:hidden bg-[#241418]/45"
          onClick={() => setIsMobileNavOpen(false)}
        >
          <aside
            className="w-64 h-full bg-white border-r border-[#EDD8DC] flex flex-col justify-between p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#F3E5E8]">
                <span className="font-display text-2xl font-bold text-[#6D1A36]">
                  acelivre
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="p-1.5 text-[#6C5258] rounded-lg hover:bg-[#F9EEF0]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav className="mt-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileNavOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[#F9EEF0] text-[#6D1A36]'
                          : 'text-[#5D474D] hover:bg-[#FDF8F8]'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsMobileNavOpen(false);
                setIsAuthModalOpen(true);
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-[#6D1A36] bg-[#F9EEF0] rounded-lg"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Ganti Peran / Akun
            </button>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="no-print sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-xs border-b border-[#EDD8DC] px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              aria-label="Buka menu navigasi"
              className="lg:hidden p-2 text-[#6D1A36] bg-[#F9EEF0] rounded-lg cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-[#8A6E75]">Acelivre</span>
              <span className="hidden sm:inline text-[#C9A8B0]">/</span>
              <h1 className="font-display text-lg font-semibold text-[#241418] truncate">
                {pageTitleMap[activeTab]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <span
              className={`hidden md:inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${
                isRealtimeConnected ? 'text-[#15803D]' : 'text-[#8A6E75]'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              {isRealtimeConnected ? 'Real-time Aktif' : 'Menghubungkan...'}
            </span>

            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#6D1A36] bg-[#F9EEF0] hover:bg-[#F3D5DE] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{currentUser.name} ·</span>{' '}
              {isAdmin ? 'Mode Admin' : 'Mode Member'}
            </button>
          </div>
        </header>

        {/* Viewport Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-[1440px] w-full mx-auto">
          {activeTab === 'dashboard' &&
            (isAdmin ? (
              <AdminDashboard
                stats={data.stats}
                loans={data.loans}
                activities={data.activities}
                isRealtimeConnected={isRealtimeConnected}
                onReturnLoan={handleReturnLoan}
                onRenewLoan={handleRenewLoan}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            ) : (
              <MemberDashboard
                currentUser={currentUser}
                books={data.books}
                loans={data.loans}
                activities={data.activities}
                isRealtimeConnected={isRealtimeConnected}
                onReturnLoan={handleReturnLoan}
                onRenewLoan={handleRenewLoan}
                onSelectBook={(book) => {
                  setSelectedBook(book);
                  setActiveTab('catalog');
                }}
                onOpenCatalog={() => setActiveTab('catalog')}
              />
            ))}

          {activeTab === 'catalog' && (
            <CatalogView
              books={data.books}
              loans={data.loans}
              users={data.users}
              currentUser={currentUser}
              selectedBook={selectedBook}
              onSelectBook={setSelectedBook}
              onBorrowBook={handleBorrowBook}
            />
          )}

          {activeTab === 'collection' && isAdmin && (
            <CollectionManagerView
              books={data.books}
              loans={data.loans}
              onCreateBook={handleCreateBook}
              onUpdateBook={handleUpdateBook}
              onDeleteBook={handleDeleteBook}
              onReturnLoan={handleReturnLoan}
              onRenewLoan={handleRenewLoan}
            />
          )}

          {activeTab === 'reports' && isAdmin && (
            <ReportsView
              reports={data.reports}
              schedule={data.schedule}
              onGenerateReport={handleGenerateReport}
              onUpdateSchedule={handleUpdateSchedule}
            />
          )}

          {activeTab === 'history' && !isAdmin && (
            <section className="bg-white border border-[#EDD8DC] rounded-xl overflow-hidden">
              <div className="p-6 border-b border-[#F3E5E8] flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-semibold text-[#241418]">
                    Riwayat Peminjaman Saya
                  </h2>
                  <p className="text-sm text-[#6C5258] mt-0.5 tabular-nums">
                    Total {memberLoansHistory.length} transaksi atas nama {currentUser.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#6D1A36] hover:bg-[#531228] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  Pinjam Buku Baru
                </button>
              </div>

              {memberLoansHistory.length === 0 ? (
                <div className="py-12 text-center text-sm text-[#6C5258]">
                  Belum ada riwayat peminjaman untuk akun ini.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#EDD8DC] bg-[#FDF8F8] text-[12px] font-medium text-[#6C5258]">
                        <th className="py-3.5 px-5">Judul Buku</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">Tanggal Pinjam</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">Jatuh Tempo</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                        <th className="py-3.5 px-5 text-right whitespace-nowrap">Denda</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F6E9EC] text-sm">
                      {memberLoansHistory.map((loan) => (
                        <tr key={loan.id} className="hover:bg-[#FDF8F8]">
                          <td className="py-3.5 px-5">
                            <p className="font-medium text-[#241418]">{loan.bookTitle}</p>
                            <p className="text-xs text-[#6C5258]">{loan.bookAuthor}</p>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs tabular-nums text-[#5D474D] whitespace-nowrap">
                            {formatDateId(loan.borrowedAt)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs tabular-nums text-[#241418] whitespace-nowrap">
                            {formatDateId(loan.dueDate)}
                          </td>
                          <td className="py-3.5 px-4 text-xs font-medium whitespace-nowrap">
                            {loan.status === 'returned' ? (
                              <span className="text-[#15803D]">
                                Dikembalikan ({formatDateId(loan.returnedAt)})
                              </span>
                            ) : loan.status === 'overdue' ? (
                              <span className="text-[#9F1239]">Terlambat</span>
                            ) : (
                              <span className="text-[#B45309]">Sedang Dipinjam</span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-right font-mono text-xs tabular-nums text-[#241418] whitespace-nowrap">
                            {loan.fineAmount > 0 ? formatRupiah(loan.fineAmount) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {/* Account & Role Switcher Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        users={data.users}
        currentUser={currentUser}
        onClose={() => setIsAuthModalOpen(false)}
        onSwitchUser={handleSwitchUser}
        onRegisterMember={handleRegisterMember}
      />

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="no-print fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto px-4 py-3 rounded-xl border shadow-lg text-xs font-medium transition-opacity ${
                toast.tone === 'error'
                  ? 'bg-[#9F1239] text-white border-[#881337]'
                  : 'bg-[#241418] text-[#FDF8F8] border-[#4A2631]'
              }`}
            >
              {toast.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
