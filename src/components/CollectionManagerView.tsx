import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type { Book, CoverTheme, Loan } from '../types/library';
import { formatDateId, formatRupiah } from '../utils/formatters';

interface CollectionManagerViewProps {
  books: Book[];
  loans: Loan[];
  onCreateBook: (payload: Partial<Book>) => Promise<void>;
  onUpdateBook: (bookId: string, payload: Partial<Book>) => Promise<void>;
  onDeleteBook: (bookId: string) => Promise<void>;
  onReturnLoan: (loanId: string) => Promise<void>;
  onRenewLoan: (loanId: string) => Promise<void>;
}

const CATEGORIES = [
  'Fiksi Sastra',
  'Desain & Seni',
  'Teknologi',
  'Psikologi',
  'Sejarah',
  'Bisnis',
];

const COVER_THEMES: { value: CoverTheme; label: string }[] = [
  { value: 'maroon-linen', label: 'Maroon Linen' },
  { value: 'blush-arch', label: 'Soft Pink Blush' },
  { value: 'rose-editorial', label: 'Dusty Rose' },
  { value: 'espresso-ivory', label: 'Ivory & Burgundy' },
];

export function CollectionManagerView({
  books,
  loans,
  onCreateBook,
  onUpdateBook,
  onDeleteBook,
  onReturnLoan,
  onRenewLoan,
}: CollectionManagerViewProps) {
  const [subTab, setSubTab] = useState<'books' | 'loans'>('books');
  const [search, setSearch] = useState('');
  const [loanFilter, setLoanFilter] = useState<'all' | 'active' | 'overdue' | 'returned'>('all');

  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [publisher, setPublisher] = useState('');
  const [year, setYear] = useState(2025);
  const [pages, setPages] = useState(240);
  const [totalCopies, setTotalCopies] = useState(3);
  const [synopsis, setSynopsis] = useState('');
  const [coverTheme, setCoverTheme] = useState<CoverTheme>('blush-arch');

  const openAddModal = () => {
    setEditingBook(null);
    setTitle('');
    setAuthor('');
    setIsbn(`978-602-412-${Math.floor(100 + Math.random() * 899)}-${Math.floor(Math.random() * 9)}`);
    setCategory('Fiksi Sastra');
    setPublisher('Pustaka Acelivre');
    setYear(2025);
    setPages(240);
    setTotalCopies(4);
    setSynopsis('');
    setCoverTheme('blush-arch');
    setIsAddOpen(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setTitle(book.title);
    setAuthor(book.author);
    setIsbn(book.isbn);
    setCategory(book.category);
    setPublisher(book.publisher);
    setYear(book.year);
    setPages(book.pages);
    setTotalCopies(book.totalCopies);
    setSynopsis(book.synopsis);
    setCoverTheme(book.coverTheme);
    setIsAddOpen(true);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: Partial<Book> = {
        title,
        author,
        isbn,
        category,
        publisher,
        year: Number(year),
        pages: Number(pages),
        totalCopies: Number(totalCopies),
        synopsis,
        coverTheme,
      };
      if (editingBook) {
        await onUpdateBook(editingBook.id, payload);
      } else {
        await onCreateBook(payload);
      }
      setIsAddOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBook) return;
    setIsSaving(true);
    try {
      await onDeleteBook(deletingBook.id);
      setDeletingBook(null);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return books;
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
    );
  }, [books, search]);

  const filteredLoans = useMemo(() => {
    const q = search.trim().toLowerCase();
    return loans.filter((l) => {
      if (loanFilter !== 'all' && l.status !== loanFilter) return false;
      if (!q) return true;
      return (
        l.bookTitle.toLowerCase().includes(q) ||
        l.userName.toLowerCase().includes(q) ||
        l.userCode.toLowerCase().includes(q)
      );
    });
  }, [loans, loanFilter, search]);

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="bg-white border border-[#EDD8DC] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-[#F9EEF0] rounded-lg border border-[#EDD8DC] self-start">
          <button
            type="button"
            onClick={() => setSubTab('books')}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'books'
                ? 'bg-white text-[#6D1A36] shadow-xs'
                : 'text-[#6C5258] hover:text-[#241418]'
            }`}
          >
            Manajemen Koleksi ({books.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('loans')}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'loans'
                ? 'bg-white text-[#6D1A36] shadow-xs'
                : 'text-[#6C5258] hover:text-[#241418]'
            }`}
          >
            Riwayat &amp; Sirkulasi ({loans.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8A6E75] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                subTab === 'books'
                  ? 'Filter judul / penulis / ISBN...'
                  : 'Filter nama anggota / buku...'
              }
              className="pl-9 pr-4 py-2 text-xs bg-[#FDF8F8] border border-[#EDD8DC] rounded-lg text-[#241418] placeholder:text-[#9A7F86] focus:outline-none focus:border-[#6D1A36] w-60"
            />
          </div>

          {subTab === 'books' && (
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#6D1A36] hover:bg-[#531228] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Koleksi
            </button>
          )}
        </div>
      </div>

      {/* Books Table */}
      {subTab === 'books' && (
        <section className="bg-white border border-[#EDD8DC] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EDD8DC] bg-[#FDF8F8] text-[12px] font-medium text-[#6C5258]">
                  <th className="py-3.5 px-5">Judul &amp; Penulis</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">ISBN</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Kategori</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Stok Tersedia</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Dipinjam</th>
                  <th className="py-3.5 px-5 text-right whitespace-nowrap">Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F6E9EC] text-sm">
                {filteredBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-[#FDF8F8] transition-colors">
                    <td className="py-3.5 px-5">
                      <p className="font-medium text-[#241418]">{book.title}</p>
                      <p className="text-xs text-[#6C5258] mt-0.5">
                        {book.author} · {book.publisher} ({book.year})
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs tabular-nums text-[#5D474D] whitespace-nowrap">
                      {book.isbn}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#5D474D] whitespace-nowrap">
                      {book.category}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs tabular-nums whitespace-nowrap">
                      <span
                        className={
                          book.availableCopies > 0
                            ? 'text-[#15803D] font-medium'
                            : 'text-[#9F1239] font-medium'
                        }
                      >
                        {book.availableCopies} / {book.totalCopies}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs tabular-nums text-[#241418] whitespace-nowrap">
                      {book.borrowCount}x
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(book)}
                          aria-label={`Edit ${book.title}`}
                          className="p-2 text-[#6C5258] hover:text-[#6D1A36] hover:bg-[#F9EEF0] rounded-lg transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingBook(book)}
                          aria-label={`Hapus ${book.title}`}
                          className="p-2 text-[#6C5258] hover:text-[#9F1239] hover:bg-[#F9EEF0] rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Loans Table */}
      {subTab === 'loans' && (
        <section className="bg-white border border-[#EDD8DC] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#F3E5E8] flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'all', label: 'Semua' },
                { id: 'active', label: 'Sedang Dipinjam' },
                { id: 'overdue', label: 'Terlambat' },
                { id: 'returned', label: 'Sudah Dikembalikan' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setLoanFilter(opt.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                  loanFilter === opt.id
                    ? 'bg-[#6D1A36] text-white border-[#6D1A36]'
                    : 'bg-white text-[#5D474D] border-[#EDD8DC] hover:border-[#C96B88]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EDD8DC] bg-[#FDF8F8] text-[12px] font-medium text-[#6C5258]">
                  <th className="py-3.5 px-5">Buku &amp; Peminjam</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Tgl Pinjam</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Jatuh Tempo</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Denda</th>
                  <th className="py-3.5 px-5 text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F6E9EC] text-sm">
                {filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-[#FDF8F8] transition-colors">
                    <td className="py-3.5 px-5">
                      <p className="font-medium text-[#241418]">{loan.bookTitle}</p>
                      <p className="text-xs text-[#6C5258] mt-0.5">
                        {loan.userName} · <span className="font-mono">{loan.userCode}</span>
                      </p>
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
                        <span className="text-[#B45309]">Dipinjam</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs tabular-nums text-[#241418] whitespace-nowrap">
                      {loan.fineAmount > 0 ? formatRupiah(loan.fineAmount) : '—'}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      {loan.status !== 'returned' ? (
                        <div className="inline-flex items-center gap-2">
                          {loan.status === 'active' && loan.renewCount < 2 && (
                            <button
                              type="button"
                              onClick={() => onRenewLoan(loan.id)}
                              className="px-2.5 py-1.5 text-xs font-medium text-[#6D1A36] bg-[#F9EEF0] hover:bg-[#F3D5DE] rounded-md transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <span className="inline-flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" />
                                +7 Hari
                              </span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onReturnLoan(loan.id)}
                            className="px-2.5 py-1.5 text-xs font-medium text-white bg-[#6D1A36] hover:bg-[#531228] rounded-md transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <span className="inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Konfirmasi Kembali
                            </span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-[#8A6E75]">Selesai</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Add / Edit Book Modal */}
      {isAddOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#241418]/45 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => setIsAddOpen(false)}
        >
          <div
            className="bg-white border border-[#EDD8DC] rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#F3E5E8]">
              <h2 className="font-display text-xl font-semibold text-[#241418]">
                {editingBook ? 'Ubah Detail Koleksi' : 'Tambah Koleksi Baru'}
              </h2>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 text-[#6C5258] hover:text-[#241418] rounded-lg hover:bg-[#F9EEF0] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-[#5D474D] mb-1">
                  Judul Buku
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#FDF8F8] border border-[#EDD8DC] rounded-lg focus:outline-none focus:border-[#6D1A36]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#5D474D] mb-1">
                    Penulis
                  </label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#FDF8F8] border border-[#EDD8DC] rounded-lg focus:outline-none focus:border-[#6D1A36]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5D474D] mb-1">
                    ISBN
                  </label>
                  <input
                    type="text"
                    required
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-[#FDF8F8] border border-[#EDD8DC] rounded-lg focus:outline-none focus:border-[#6D1A36]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#5D474D] mb-1">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#FDF8F8] border border-[#EDD8DC] rounded-lg focus:outline-none focus:border-[#6D1A36]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5D474D] mb-1">
                    Penerbit
                  </label>
                  <input
                    type="text"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#FDF8F8] border border-[#EDD8DC] rounded-lg focus:outline-none focus:border-[#6D1A36]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#5D474D] mb-1">
                    Tahun
                  </label>
                  <input
                    type="number"
                    min={1900}
                    max={2030}
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono bg-[#FDF8F8] border border-[#EDD8DC] rounded-lg focus:outline-none focus:border-[#6D1A36]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5D474D] mb-1">
                    Halaman
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={3000}
                    value={pages}
                    onChange={(e) => setPages(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono bg-[#FDF8F8] border border-[#EDD8DC] rounded-lg focus:outline-none focus:border-[#6D1A36]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5D474D] mb-1">
                    Total Stok
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={totalCopies}
                    onChange={(e) => setTotalCopies(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono bg-[#FDF8F8] border border-[#EDD8DC] rounded-lg focus:outline-none focus:border-[#6D1A36]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5D474D] mb-1">
                  Tema Sampul Editorial
                </label>
                <select
                  value={coverTheme}
                  onChange={(e) => setCoverTheme(e.target.value as CoverTheme)}
                  className="w-full px-3 py-2 text-sm bg-[#FDF8F8] border border-[#EDD8DC] rounded-lg focus:outline-none focus:border-[#6D1A36]"
                >
                  {COVER_THEMES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5D474D] mb-1">
                  Sinopsis Singkat
                </label>
                <textarea
                  rows={3}
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#FDF8F8] border border-[#EDD8DC] rounded-lg focus:outline-none focus:border-[#6D1A36]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#5D474D] bg-[#F9EEF0] rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#6D1A36] hover:bg-[#531228] rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Menyimpan...' : editingBook ? 'Simpan Perubahan' : 'Simpan Koleksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBook && (
        <div
          className="fixed inset-0 z-50 bg-[#241418]/45 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => setDeletingBook(null)}
        >
          <div
            className="bg-white border border-[#EDD8DC] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-xl font-semibold text-[#241418]">
              Hapus Koleksi Buku?
            </h2>
            <p className="text-sm text-[#5D474D] leading-relaxed">
              Koleksi <span className="font-semibold text-[#241418]">"{deletingBook.title}"</span> akan dihapus dari katalog Acelivre. Tindakan ini hanya berhasil jika tidak ada eksemplar yang sedang dipinjam.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBook(null)}
                className="px-4 py-2 text-xs font-medium text-[#5D474D] bg-[#F9EEF0] rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#9F1239] hover:bg-[#881337] rounded-lg disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Menghapus...' : 'Ya, Hapus Koleksi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
