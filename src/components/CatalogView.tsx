import { useMemo, useState } from 'react';
import { BookOpen, Search, X } from 'lucide-react';
import type { Book, Loan, User } from '../types/library';
import { BookCover } from './BookCover';

interface CatalogViewProps {
  books: Book[];
  loans: Loan[];
  users: User[];
  currentUser: User;
  selectedBook: Book | null;
  onSelectBook: (book: Book | null) => void;
  onBorrowBook: (payload: {
    bookId: string;
    userId: string;
    durationDays: 7 | 14;
  }) => Promise<void>;
}

export function CatalogView({
  books,
  loans,
  users,
  currentUser,
  selectedBook,
  onSelectBook,
  onBorrowBook,
}: CatalogViewProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available'>('all');

  const [durationDays, setDurationDays] = useState<7 | 14>(7);
  const [targetMemberId, setTargetMemberId] = useState<string>(
    currentUser.role === 'member'
      ? currentUser.id
      : users.find((u) => u.role === 'member')?.id ?? currentUser.id
  );
  const [isBorrowing, setIsBorrowing] = useState(false);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(books.map((b) => b.category)));
    return ['Semua', ...unique];
  }, [books]);

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return books.filter((b) => {
      if (categoryFilter !== 'Semua' && b.category !== categoryFilter) return false;
      if (availabilityFilter === 'available' && b.availableCopies <= 0) return false;
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q)
      );
    });
  }, [books, search, categoryFilter, availabilityFilter]);

  const members = useMemo(() => users.filter((u) => u.role === 'member'), [users]);

  const effectiveBorrowerId =
    currentUser.role === 'member' ? currentUser.id : targetMemberId;

  const alreadyBorrowedByTarget = useMemo(() => {
    if (!selectedBook) return false;
    return loans.some(
      (l) =>
        l.bookId === selectedBook.id &&
        l.userId === effectiveBorrowerId &&
        l.status !== 'returned'
    );
  }, [selectedBook, loans, effectiveBorrowerId]);

  const handleConfirmBorrow = async () => {
    if (!selectedBook) return;
    setIsBorrowing(true);
    try {
      await onBorrowBook({
        bookId: selectedBook.id,
        userId: effectiveBorrowerId,
        durationDays,
      });
      onSelectBook(null);
    } finally {
      setIsBorrowing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter & Search Toolbar */}
      <section className="bg-white border border-[#EDD8DC] rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#8A6E75] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul buku, penulis, atau ISBN..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#FDF8F8] border border-[#EDD8DC] rounded-lg text-[#241418] placeholder:text-[#9A7F86] focus:outline-none focus:border-[#6D1A36]"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#F9EEF0] rounded-lg border border-[#EDD8DC] self-start">
            <button
              type="button"
              onClick={() => setAvailabilityFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                availabilityFilter === 'all'
                  ? 'bg-white text-[#6D1A36] shadow-xs'
                  : 'text-[#6C5258] hover:text-[#241418]'
              }`}
            >
              Semua Koleksi ({books.length})
            </button>
            <button
              type="button"
              onClick={() => setAvailabilityFilter('available')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                availabilityFilter === 'available'
                  ? 'bg-white text-[#6D1A36] shadow-xs'
                  : 'text-[#6C5258] hover:text-[#241418]'
              }`}
            >
              Tersedia Sekarang
            </button>
          </div>
        </div>

        {/* Category Segmented Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-[#6D1A36] text-white border-[#6D1A36]'
                  : 'bg-white text-[#5D474D] border-[#EDD8DC] hover:border-[#C96B88] hover:text-[#241418]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Catalog Grid */}
      {filteredBooks.length === 0 ? (
        <div className="bg-white border border-[#EDD8DC] rounded-xl p-12 text-center space-y-3">
          <BookOpen className="w-8 h-8 text-[#C96B88] mx-auto" />
          <h3 className="font-display text-lg font-semibold text-[#241418]">
            Tidak ada buku yang cocok
          </h3>
          <p className="text-sm text-[#6C5258]">
            Ubah kata kunci pencarian atau pilih kategori koleksi lainnya.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setCategoryFilter('Semua');
              setAvailabilityFilter('all');
            }}
            className="px-4 py-2 text-xs font-medium text-[#6D1A36] bg-[#F9EEF0] hover:bg-[#F3D5DE] rounded-lg transition-colors cursor-pointer"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredBooks.map((book) => {
            const isAvailable = book.availableCopies > 0;
            return (
              <article
                key={book.id}
                className="group bg-white border border-[#EDD8DC] rounded-xl p-4 flex flex-col justify-between hover:border-[#C96B88] transition-colors"
              >
                <div>
                  <button
                    type="button"
                    onClick={() => onSelectBook(book)}
                    className="w-full text-left cursor-pointer"
                  >
                    <BookCover
                      title={book.title}
                      author={book.author}
                      category={book.category}
                      coverImage={book.coverImage}
                      coverTheme={book.coverTheme}
                      className="w-full aspect-[3/4] rounded-lg mb-4"
                    />
                  </button>

                  <p className="text-xs text-[#6C5258] truncate">
                    {book.category} · {book.year} · <span className="font-mono tabular-nums">{book.pages} hlm</span>
                  </p>

                  <h3 className="font-display text-lg font-semibold text-[#241418] mt-1 leading-snug line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-xs text-[#5D474D] mt-1 truncate">
                    {book.author}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#F3E5E8] flex items-center justify-between gap-3">
                  <span
                    className={`text-xs font-medium tabular-nums ${
                      isAvailable ? 'text-[#15803D]' : 'text-[#9F1239]'
                    }`}
                  >
                    {isAvailable
                      ? `Tersedia ${book.availableCopies}/${book.totalCopies}`
                      : 'Stok Dipinjam'}
                  </span>

                  <button
                    type="button"
                    onClick={() => onSelectBook(book)}
                    className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isAvailable
                        ? 'bg-[#6D1A36] text-white hover:bg-[#531228]'
                        : 'bg-[#F9EEF0] text-[#6C5258] hover:bg-[#F3D5DE]'
                    }`}
                  >
                    {isAvailable ? 'Pinjam Buku' : 'Detail Buku'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Book Detail & Borrowing Modal */}
      {selectedBook && (
        <div
          className="fixed inset-0 z-50 bg-[#241418]/45 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => onSelectBook(null)}
        >
          <div
            className="bg-white border border-[#EDD8DC] rounded-2xl max-w-2xl w-full overflow-hidden shadow-xl grid grid-cols-1 md:grid-cols-12"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="md:col-span-5 bg-[#F9EEF0] p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-[#EDD8DC]">
              <BookCover
                title={selectedBook.title}
                author={selectedBook.author}
                category={selectedBook.category}
                coverImage={selectedBook.coverImage}
                coverTheme={selectedBook.coverTheme}
                className="w-44 sm:w-48 aspect-[3/4] rounded-lg shadow-sm"
              />
            </div>

            <div className="md:col-span-7 p-6 flex flex-col justify-between gap-5">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-medium text-[#6D1A36]">
                    {selectedBook.category} · {selectedBook.year}
                  </p>
                  <button
                    type="button"
                    onClick={() => onSelectBook(null)}
                    aria-label="Tutup modal buku"
                    className="p-1.5 text-[#6C5258] hover:text-[#241418] rounded-lg hover:bg-[#F9EEF0] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <h2 className="font-display text-2xl font-semibold text-[#241418] mt-1 leading-tight">
                  {selectedBook.title}
                </h2>
                <p className="text-sm text-[#5D474D] mt-1">
                  Oleh {selectedBook.author} · {selectedBook.publisher}
                </p>

                <div className="mt-3 text-xs text-[#6C5258] font-mono tabular-nums">
                  ISBN {selectedBook.isbn} · {selectedBook.pages} halaman · Dipinjam {selectedBook.borrowCount}x
                </div>

                <p className="mt-4 text-sm text-[#3F2A30] leading-relaxed">
                  {selectedBook.synopsis}
                </p>
              </div>

              <div className="pt-4 border-t border-[#F3E5E8] space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6C5258]">Ketersediaan Eksemplar</span>
                  <span
                    className={`font-semibold tabular-nums ${
                      selectedBook.availableCopies > 0 ? 'text-[#15803D]' : 'text-[#9F1239]'
                    }`}
                  >
                    {selectedBook.availableCopies} dari {selectedBook.totalCopies} tersedia
                  </span>
                </div>

                {selectedBook.availableCopies > 0 && (
                  <>
                    {currentUser.role === 'admin' && members.length > 0 && (
                      <div>
                        <label className="block text-xs font-medium text-[#5D474D] mb-1.5">
                          Pinjamkan Atas Nama Anggota
                        </label>
                        <select
                          value={targetMemberId}
                          onChange={(e) => setTargetMemberId(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-[#FDF8F8] border border-[#EDD8DC] rounded-lg text-[#241418] focus:outline-none focus:border-[#6D1A36]"
                        >
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.memberCode})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <span className="block text-xs font-medium text-[#5D474D] mb-1.5">
                        Durasi Peminjaman
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDurationDays(7)}
                          className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                            durationDays === 7
                              ? 'bg-[#F9EEF0] border-[#6D1A36] text-[#6D1A36]'
                              : 'bg-white border-[#EDD8DC] text-[#5D474D]'
                          }`}
                        >
                          7 Hari Standar
                        </button>
                        <button
                          type="button"
                          onClick={() => setDurationDays(14)}
                          className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                            durationDays === 14
                              ? 'bg-[#F9EEF0] border-[#6D1A36] text-[#6D1A36]'
                              : 'bg-white border-[#EDD8DC] text-[#5D474D]'
                          }`}
                        >
                          14 Hari Riset
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => onSelectBook(null)}
                    className="px-4 py-2 text-xs font-medium text-[#5D474D] hover:text-[#241418] bg-[#F9EEF0] rounded-lg transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>

                  {selectedBook.availableCopies > 0 && (
                    <button
                      type="button"
                      disabled={isBorrowing || alreadyBorrowedByTarget}
                      onClick={handleConfirmBorrow}
                      className="px-5 py-2 text-xs font-semibold text-white bg-[#6D1A36] hover:bg-[#531228] rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {alreadyBorrowedByTarget
                        ? 'Sedang Dipinjam Anggota Ini'
                        : isBorrowing
                          ? 'Memproses...'
                          : 'Konfirmasi Peminjaman'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
