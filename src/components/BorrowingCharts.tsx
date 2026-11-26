import { useState } from 'react';
import type { CategoryStat, DailyTrendPoint } from '../types/library';

interface BorrowingChartsProps {
  dailyTrends: DailyTrendPoint[];
  categoryStats: CategoryStat[];
}

export function BorrowingCharts({ dailyTrends, categoryStats }: BorrowingChartsProps) {
  const [range, setRange] = useState<'7d' | '14d'>('14d');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const visiblePoints = range === '7d' ? dailyTrends.slice(-7) : dailyTrends;
  const maxVal = Math.max(
    4,
    ...visiblePoints.map((p) => Math.max(p.borrows, p.returns))
  );

  const totalBorrowsInRange = visiblePoints.reduce((s, p) => s + p.borrows, 0);
  const totalReturnsInRange = visiblePoints.reduce((s, p) => s + p.returns, 0);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Left 8 cols: Daily Borrowing vs Return Trend */}
      <section className="xl:col-span-8 bg-white border border-[#EDD8DC] rounded-xl p-6 flex flex-col justify-between">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#241418]">
              Statistik Sirkulasi Peminjaman
            </h2>
            <p className="text-sm text-[#6C5258] mt-0.5 tabular-nums">
              {totalBorrowsInRange} peminjaman · {totalReturnsInRange} pengembalian pada periode ini
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Legend */}
            <div className="hidden sm:flex items-center gap-4 text-xs text-[#6C5258]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#6D1A36]" />
                Peminjaman
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#E59BB0]" />
                Pengembalian
              </span>
            </div>

            {/* Segmented Range Selector */}
            <div className="flex items-center gap-1 p-1 bg-[#F9EEF0] rounded-lg border border-[#EDD8DC]">
              <button
                type="button"
                onClick={() => setRange('7d')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  range === '7d'
                    ? 'bg-white text-[#6D1A36] shadow-xs'
                    : 'text-[#6C5258] hover:text-[#241418]'
                }`}
              >
                7 Hari
              </button>
              <button
                type="button"
                onClick={() => setRange('14d')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  range === '14d'
                    ? 'bg-white text-[#6D1A36] shadow-xs'
                    : 'text-[#6C5258] hover:text-[#241418]'
                }`}
              >
                14 Hari
              </button>
            </div>
          </div>
        </div>

        {/* Chart Area */}
        <div className="relative h-56 flex items-end gap-2 pt-6 pb-2 border-b border-[#EDD8DC]">
          {/* Horizontal guide lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-2 pt-6">
            {[1, 0.5, 0].map((ratio) => (
              <div
                key={ratio}
                className="w-full border-t border-dashed border-[#F3E2E5] flex items-center"
              >
                <span className="text-[10px] font-mono tabular-nums text-[#9A7F86] -mt-4 bg-white pr-1">
                  {Math.round(maxVal * ratio)}
                </span>
              </div>
            ))}
          </div>

          {visiblePoints.map((pt, idx) => {
            const borrowHeight = Math.round((pt.borrows / maxVal) * 100);
            const returnHeight = Math.round((pt.returns / maxVal) * 100);
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={pt.date}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="relative flex-1 h-full flex flex-col justify-end items-center group z-10"
              >
                {isHovered && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full bg-[#241418] text-white text-[11px] rounded-md px-2.5 py-1.5 whitespace-nowrap z-20 pointer-events-none shadow-md tabular-nums">
                    <div className="font-medium text-[#F3D5DE]">{pt.label}</div>
                    <div>Pinjam: {pt.borrows} · Kembali: {pt.returns}</div>
                  </div>
                )}

                <div className="w-full flex items-end justify-center gap-1 h-full px-0.5">
                  <div
                    style={{ height: `${Math.max(borrowHeight, pt.borrows > 0 ? 8 : 2)}%` }}
                    className={`w-full max-w-[14px] rounded-t-sm transition-all duration-200 ${
                      pt.borrows > 0
                        ? isHovered
                          ? 'bg-[#531228]'
                          : 'bg-[#6D1A36]'
                        : 'bg-[#F3E6E9]'
                    }`}
                  />
                  <div
                    style={{ height: `${Math.max(returnHeight, pt.returns > 0 ? 8 : 2)}%` }}
                    className={`w-full max-w-[14px] rounded-t-sm transition-all duration-200 ${
                      pt.returns > 0
                        ? isHovered
                          ? 'bg-[#D67895]'
                          : 'bg-[#E59BB0]'
                        : 'bg-[#F8EFF1]'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* X-Axis labels */}
        <div className="flex items-center justify-between gap-2 mt-2.5">
          {visiblePoints.map((pt, idx) => (
            <div
              key={pt.date}
              className={`flex-1 text-center text-[11px] font-mono tabular-nums truncate ${
                range === '14d' && idx % 2 === 1 ? 'hidden sm:block text-[#9A7F86]' : 'text-[#6C5258]'
              }`}
            >
              {pt.label}
            </div>
          ))}
        </div>
      </section>

      {/* Right 4 cols: Category Distribution */}
      <section className="xl:col-span-4 bg-white border border-[#EDD8DC] rounded-xl p-6 flex flex-col justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-[#241418]">
            Minat Kategori
          </h2>
          <p className="text-sm text-[#6C5258] mt-0.5">
            Proporsi peminjaman kumulatif per subjek
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {categoryStats.map((cat, idx) => (
            <div key={cat.category} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium text-[#241418] truncate">
                  {cat.category}
                </span>
                <span className="text-xs font-mono tabular-nums text-[#6C5258] shrink-0">
                  {cat.totalBorrows}x · {cat.percentage}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#F9EEF0] overflow-hidden">
                <div
                  style={{ width: `${Math.max(4, cat.percentage)}%` }}
                  className={`h-full rounded-full transition-all duration-300 ${
                    idx === 0
                      ? 'bg-[#6D1A36]'
                      : idx === 1
                        ? 'bg-[#9C3556]'
                        : idx === 2
                          ? 'bg-[#C96B88]'
                          : 'bg-[#E59BB0]'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-[#8A6E75] pt-4 mt-4 border-t border-[#F3E5E8] tabular-nums">
          Total {categoryStats.length} kategori aktif di katalog Acelivre
        </p>
      </section>
    </div>
  );
}
