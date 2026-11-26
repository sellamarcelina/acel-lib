import {
  ArrowDownLeft,
  ArrowUpRight,
  BookPlus,
  FileCheck2,
  RefreshCw,
  UserPlus,
} from 'lucide-react';
import type { ActivityEvent } from '../types/library';
import { formatRelativeTime, formatTimeId } from '../utils/formatters';

interface LiveActivityFeedProps {
  activities: ActivityEvent[];
  isRealtimeConnected: boolean;
  limit?: number;
}

function getActivityIcon(type: ActivityEvent['type']) {
  switch (type) {
    case 'borrow':
      return <ArrowUpRight className="w-4 h-4 text-[#6D1A36]" />;
    case 'return':
      return <ArrowDownLeft className="w-4 h-4 text-[#15803D]" />;
    case 'renew':
      return <RefreshCw className="w-4 h-4 text-[#9C3556]" />;
    case 'report_auto':
    case 'report_manual':
      return <FileCheck2 className="w-4 h-4 text-[#6D1A36]" />;
    case 'member_join':
      return <UserPlus className="w-4 h-4 text-[#6D1A36]" />;
    default:
      return <BookPlus className="w-4 h-4 text-[#6D1A36]" />;
  }
}

export function LiveActivityFeed({
  activities,
  isRealtimeConnected,
  limit = 8,
}: LiveActivityFeedProps) {
  const visible = activities.slice(0, limit);

  return (
    <section className="bg-white border border-[#EDD8DC] rounded-xl p-6 flex flex-col">
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#F3E5E8]">
        <div>
          <h2 className="font-display text-xl font-semibold text-[#241418]">
            Aktivitas Transaksi Real-Time
          </h2>
          <p className="text-sm text-[#6C5258] mt-0.5">
            {isRealtimeConnected
              ? 'Tersinkronisasi langsung dengan server sirkulasi'
              : 'Menyambungkan ulang aliran pembaruan langsung...'}
          </p>
        </div>
        <span className="text-xs font-mono tabular-nums text-[#6D1A36] shrink-0">
          {visible.length} terbaru
        </span>
      </div>

      {visible.length === 0 ? (
        <div className="py-12 text-center text-sm text-[#6C5258]">
          Belum ada aktivitas transaksi tercatat.
        </div>
      ) : (
        <ul className="divide-y divide-[#F6E9EC] mt-1">
          {visible.map((item) => (
            <li key={item.id} className="py-3.5 flex items-start gap-3">
              <div className="mt-0.5 w-8 h-8 rounded-lg bg-[#F9EEF0] border border-[#EDD8DC] flex items-center justify-center shrink-0">
                {getActivityIcon(item.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-[#241418] truncate">
                    {item.title}
                  </p>
                  <span className="text-xs font-mono tabular-nums text-[#8A6E75] shrink-0">
                    {formatTimeId(item.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-[#5D474D] mt-0.5 leading-relaxed">
                  {item.detail}
                </p>
                <p className="text-[11px] text-[#8A6E75] mt-1">
                  {item.actorName} · {formatRelativeTime(item.timestamp)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
