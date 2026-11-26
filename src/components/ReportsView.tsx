import { useState } from 'react';
import { CalendarClock, Download, FileText, Printer } from 'lucide-react';
import type { AutoReport, AutoReportPeriod, ReportScheduleConfig } from '../types/library';
import { formatDateId, formatRupiah, formatTimeId } from '../utils/formatters';

interface ReportsViewProps {
  reports: AutoReport[];
  schedule: ReportScheduleConfig;
  onGenerateReport: (period: AutoReportPeriod) => Promise<void>;
  onUpdateSchedule: (payload: Partial<ReportScheduleConfig>) => Promise<void>;
}

export function ReportsView({
  reports,
  schedule,
  onGenerateReport,
  onUpdateSchedule,
}: ReportsViewProps) {
  const [selectedReportId, setSelectedReportId] = useState<string>(reports[0]?.id ?? '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  const activeReport =
    reports.find((r) => r.id === selectedReportId) ?? reports[0] ?? null;

  const handleGenerate = async (period: AutoReportPeriod) => {
    setIsGenerating(true);
    try {
      await onGenerateReport(period);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleAuto = async () => {
    setIsSavingSchedule(true);
    try {
      await onUpdateSchedule({ enabled: !schedule.enabled });
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleChangeFrequency = async (frequency: AutoReportPeriod) => {
    setIsSavingSchedule(true);
    try {
      await onUpdateSchedule({ frequency });
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleChangeTime = async (timeOfDay: string) => {
    setIsSavingSchedule(true);
    try {
      await onUpdateSchedule({ timeOfDay });
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleDownloadCsv = (report: AutoReport) => {
    const rows = [
      ['Kode Laporan', report.code],
      ['Periode', report.periodLabel],
      ['Mode Penerbitan', report.triggerMode === 'auto' ? 'Otomatis' : 'Manual'],
      ['Tanggal Terbit', report.generatedAt],
      [],
      ['Ringkasan Metrik', 'Nilai'],
      ['Total Sirkulasi Tercatat', String(report.summary.totalCirculation)],
      ['Peminjaman Baru pada Periode', String(report.summary.newLoans)],
      ['Pengembalian pada Periode', String(report.summary.returnedLoans)],
      ['Transaksi Terlambat Saat Ini', String(report.summary.overdueCount)],
      ['Anggota Aktif', String(report.summary.activeMembersCount)],
      ['Tingkat Pengembalian Tepat Waktu', `${report.summary.onTimeRate}%`],
      ['Total Denda Terkumpul (IDR)', String(report.summary.totalFinesCollected)],
      [],
      ['Buku Terpopuler', 'Penulis', 'Total Dipinjam'],
      ...report.topBooks.map((b) => [b.title, b.author, String(b.count)]),
      [],
      ['Anggota Teraktif', 'Kode Anggota', 'Total Pinjam'],
      ...report.topMembers.map((m) => [m.name, m.memberCode, String(m.count)]),
    ];

    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.code.toLowerCase()}-acelivre.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Automated Schedule & Instant Trigger Strip */}
      <section className="no-print bg-white border border-[#EDD8DC] rounded-xl p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center gap-2.5">
            <CalendarClock className="w-5 h-5 text-[#6D1A36]" />
            <h2 className="font-display text-xl font-semibold text-[#241418]">
              Sistem Pelaporan Otomatis
            </h2>
          </div>
          <p className="text-sm text-[#5D474D] leading-relaxed">
            Kompilasi statistik sirkulasi, daftar keterlambatan, buku terpopuler, dan rekap denda secara otomatis sesuai jadwal atau diterbitkan seketika.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              disabled={isSavingSchedule}
              onClick={handleToggleAuto}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                schedule.enabled
                  ? 'bg-[#6D1A36] text-white border-[#6D1A36]'
                  : 'bg-[#F9EEF0] text-[#5D474D] border-[#EDD8DC]'
              }`}
            >
              {schedule.enabled ? 'Jadwal Otomatis: Aktif' : 'Jadwal Otomatis: Nonaktif'}
            </button>

            <select
              disabled={isSavingSchedule}
              value={schedule.frequency}
              onChange={(e) => handleChangeFrequency(e.target.value as AutoReportPeriod)}
              className="px-3 py-2 text-xs font-medium bg-[#FDF8F8] border border-[#EDD8DC] rounded-lg text-[#241418] focus:outline-none focus:border-[#6D1A36]"
            >
              <option value="daily">Frekuensi: Harian</option>
              <option value="weekly">Frekuensi: Mingguan</option>
              <option value="monthly">Frekuensi: Bulanan</option>
            </select>

            <input
              type="time"
              disabled={isSavingSchedule}
              value={schedule.timeOfDay}
              onChange={(e) => handleChangeTime(e.target.value)}
              className="px-3 py-2 text-xs font-mono bg-[#FDF8F8] border border-[#EDD8DC] rounded-lg text-[#241418] focus:outline-none focus:border-[#6D1A36]"
            />

            {schedule.lastRunAt && (
              <span className="text-xs text-[#8A6E75] tabular-nums">
                Terakhir terbit: {formatDateId(schedule.lastRunAt)}
              </span>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 lg:border-l lg:border-[#F3E5E8] lg:pl-6 space-y-2.5">
          <p className="text-xs font-medium text-[#6C5258]">
            Terbitkan Laporan Instan Sekarang
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'daily', label: 'Harian' },
                { id: 'weekly', label: 'Mingguan' },
                { id: 'monthly', label: 'Bulanan' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={isGenerating}
                onClick={() => handleGenerate(p.id)}
                className="px-3 py-2.5 text-xs font-semibold text-[#6D1A36] bg-[#F9EEF0] hover:bg-[#F3D5DE] border border-[#EDD8DC] rounded-lg transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                + {p.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Split: Archive List (4 cols) + Formal Report Preview (8 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <aside className="no-print xl:col-span-4 bg-white border border-[#EDD8DC] rounded-xl p-5">
          <h3 className="font-display text-lg font-semibold text-[#241418] pb-3 border-b border-[#F3E5E8]">
            Arsip Laporan ({reports.length})
          </h3>

          {reports.length === 0 ? (
            <p className="py-8 text-sm text-center text-[#6C5258]">
              Belum ada laporan yang diterbitkan.
            </p>
          ) : (
            <ul className="divide-y divide-[#F6E9EC] mt-2">
              {reports.map((rep) => {
                const isSelected = activeReport?.id === rep.id;
                return (
                  <li key={rep.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedReportId(rep.id)}
                      className={`w-full text-left py-3.5 px-3 rounded-lg transition-colors cursor-pointer my-1 ${
                        isSelected
                          ? 'bg-[#F9EEF0] border border-[#DFB9C3]'
                          : 'hover:bg-[#FDF8F8] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-[#6D1A36]">
                          {rep.code}
                        </span>
                        <span className="text-[11px] text-[#6C5258]">
                          {rep.triggerMode === 'auto' ? 'Otomatis' : 'Manual'} · {formatTimeId(rep.generatedAt)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[#241418] mt-1 truncate">
                        {rep.periodLabel}
                      </p>
                      <p className="text-xs text-[#6C5258] mt-0.5 tabular-nums">
                        {rep.summary.newLoans} pinjam · {rep.summary.returnedLoans} kembali · {rep.summary.overdueCount} terlambat
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section className="xl:col-span-8 print-only-full bg-white border border-[#EDD8DC] rounded-xl p-6 sm:p-8">
          {!activeReport ? (
            <div className="py-16 text-center space-y-2">
              <FileText className="w-8 h-8 text-[#C96B88] mx-auto" />
              <p className="text-sm text-[#6C5258]">
                Pilih atau terbitkan laporan untuk melihat pratinjau dokumen.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Editorial Letterhead */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-[#6D1A36]">
                <div>
                  <p className="font-display text-2xl font-bold text-[#6D1A36]">
                    acelivre
                  </p>
                  <p className="text-xs text-[#6C5258] mt-1">
                    Laporan Sirkulasi &amp; Manajemen Koleksi Perpustakaan Digital
                  </p>
                </div>

                <div className="sm:text-right space-y-1">
                  <p className="font-mono text-xs font-semibold text-[#241418]">
                    Dokumen {activeReport.code}
                  </p>
                  <p className="text-xs text-[#6C5258] tabular-nums">
                    Diterbitkan {formatDateId(activeReport.generatedAt)} · {formatTimeId(activeReport.generatedAt)}
                  </p>
                  <div className="no-print flex sm:justify-end items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadCsv(activeReport)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#6D1A36] bg-[#F9EEF0] hover:bg-[#F3D5DE] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#6D1A36] hover:bg-[#531228] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Cetak Laporan
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-display text-xl font-semibold text-[#241418]">
                  {activeReport.periodLabel}
                </h3>
                <p className="text-xs text-[#6C5258] mt-0.5">
                  Metode Kompilasi: {activeReport.triggerMode === 'auto' ? 'Otomatis Terjadwal' : 'Permintaan Admin'}
                </p>

                {/* Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
                  <div className="p-4 rounded-lg bg-[#FDF8F8] border border-[#EDD8DC]">
                    <p className="text-xs text-[#6C5258]">Peminjaman Periode</p>
                    <p className="font-display text-2xl font-semibold text-[#6D1A36] mt-1 tabular-nums">
                      {activeReport.summary.newLoans}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#FDF8F8] border border-[#EDD8DC]">
                    <p className="text-xs text-[#6C5258]">Pengembalian</p>
                    <p className="font-display text-2xl font-semibold text-[#241418] mt-1 tabular-nums">
                      {activeReport.summary.returnedLoans}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#FDF8F8] border border-[#EDD8DC]">
                    <p className="text-xs text-[#6C5258]">Tepat Waktu</p>
                    <p className="font-display text-2xl font-semibold text-[#15803D] mt-1 tabular-nums">
                      {activeReport.summary.onTimeRate}%
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#FDF8F8] border border-[#EDD8DC]">
                    <p className="text-xs text-[#6C5258]">Denda Terkumpul</p>
                    <p className="font-display text-xl font-semibold text-[#241418] mt-1 tabular-nums">
                      {formatRupiah(activeReport.summary.totalFinesCollected)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Top Books & Top Members */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-semibold text-[#6D1A36] uppercase tracking-wider pb-2 border-b border-[#EDD8DC]">
                    Koleksi Paling Banyak Dipinjam
                  </h4>
                  <ul className="divide-y divide-[#F6E9EC] mt-1">
                    {activeReport.topBooks.map((b, i) => (
                      <li key={b.bookId} className="py-2.5 flex items-baseline justify-between gap-3 text-sm">
                        <span className="truncate text-[#241418]">
                          <span className="font-mono text-xs text-[#8A6E75] mr-2">0{i + 1}.</span>
                          {b.title}
                        </span>
                        <span className="font-mono text-xs tabular-nums text-[#6D1A36] shrink-0">
                          {b.count}x
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-[#6D1A36] uppercase tracking-wider pb-2 border-b border-[#EDD8DC]">
                    Pembaca Teraktif
                  </h4>
                  <ul className="divide-y divide-[#F6E9EC] mt-1">
                    {activeReport.topMembers.map((m, i) => (
                      <li key={m.userId} className="py-2.5 flex items-baseline justify-between gap-3 text-sm">
                        <span className="truncate text-[#241418]">
                          <span className="font-mono text-xs text-[#8A6E75] mr-2">0{i + 1}.</span>
                          {m.name} <span className="text-xs text-[#8A6E75]">({m.memberCode})</span>
                        </span>
                        <span className="font-mono text-xs tabular-nums text-[#6D1A36] shrink-0">
                          {m.count} buku
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Overdue Snapshot */}
              <div>
                <h4 className="text-xs font-semibold text-[#6D1A36] uppercase tracking-wider pb-2 border-b border-[#EDD8DC]">
                  Daftar Keterlambatan Aktif ({activeReport.overdueItems.length})
                </h4>
                {activeReport.overdueItems.length === 0 ? (
                  <p className="text-sm text-[#15803D] py-3">
                    Tidak terdapat peminjaman yang melewati jatuh tempo saat laporan ini disusun.
                  </p>
                ) : (
                  <table className="w-full text-left border-collapse mt-2 text-sm">
                    <thead>
                      <tr className="border-b border-[#F3E5E8] text-xs text-[#6C5258]">
                        <th className="py-2 pr-3">Judul Buku</th>
                        <th className="py-2 px-3">Peminjam</th>
                        <th className="py-2 px-3 text-right">Keterlambatan</th>
                        <th className="py-2 pl-3 text-right">Estimasi Denda</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F6E9EC]">
                      {activeReport.overdueItems.map((ov) => (
                        <tr key={ov.loanId}>
                          <td className="py-2.5 pr-3 text-[#241418]">{ov.bookTitle}</td>
                          <td className="py-2.5 px-3 text-[#5D474D]">{ov.userName}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-xs tabular-nums text-[#9F1239]">
                            {ov.daysLate} hari
                          </td>
                          <td className="py-2.5 pl-3 text-right font-mono text-xs tabular-nums text-[#241418]">
                            {formatRupiah(ov.fineAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
