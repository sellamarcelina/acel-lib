import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import type { CoverTheme } from '../types/library';

interface BookCoverProps {
  title: string;
  author: string;
  category: string;
  coverImage?: string;
  coverTheme?: CoverTheme;
  className?: string;
  compact?: boolean;
}

const THEME_STYLES: Record<
  CoverTheme,
  { bg: string; spine: string; text: string; accent: string; line: string }
> = {
  'maroon-linen': {
    bg: 'bg-[#6D1A36]',
    spine: 'bg-[#4E1025]',
    text: 'text-[#FDF8F8]',
    accent: 'text-[#F3D5DE]',
    line: 'border-[#A64D69]',
  },
  'blush-arch': {
    bg: 'bg-[#F5DCE3]',
    spine: 'bg-[#6D1A36]',
    text: 'text-[#3A1522]',
    accent: 'text-[#6D1A36]',
    line: 'border-[#D9A7B5]',
  },
  'rose-editorial': {
    bg: 'bg-[#E9BAC6]',
    spine: 'bg-[#7A2340]',
    text: 'text-[#2D1019]',
    accent: 'text-[#6D1A36]',
    line: 'border-[#C78598]',
  },
  'espresso-ivory': {
    bg: 'bg-[#F7EFEA]',
    spine: 'bg-[#5A182E]',
    text: 'text-[#241418]',
    accent: 'text-[#6D1A36]',
    line: 'border-[#DFC9C2]',
  },
};

export function BookCover({
  title,
  author,
  category,
  coverImage,
  coverTheme = 'blush-arch',
  className = '',
  compact = false,
}: BookCoverProps) {
  const [imgError, setImgError] = useState(false);
  const theme = THEME_STYLES[coverTheme] ?? THEME_STYLES['blush-arch'];

  if (coverImage && !imgError) {
    return (
      <div
        className={`relative overflow-hidden bg-[#F3E5E8] border border-[#EDD8DC] ${className}`}
      >
        <img
          src={coverImage}
          alt={`Sampul buku ${title} karya ${author}`}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden border border-[#EDD8DC] flex ${theme.bg} ${className}`}
      aria-label={`Sampul buku ${title}`}
    >
      {/* Book spine */}
      <div className={`${compact ? 'w-1.5' : 'w-3'} shrink-0 h-full ${theme.spine}`} />

      {/* Editorial cover layout */}
      <div
        className={`flex-1 flex flex-col justify-between ${
          compact ? 'p-2' : 'p-4'
        }`}
      >
        <div className={`border-b pb-1.5 ${theme.line}`}>
          <p
            className={`${
              compact ? 'text-[9px]' : 'text-[11px]'
            } font-medium tracking-wide truncate ${theme.accent}`}
          >
            {category}
          </p>
        </div>

        <div className="my-auto py-1">
          <p
            className={`font-display font-semibold leading-tight line-clamp-3 ${
              compact ? 'text-xs' : 'text-base'
            } ${theme.text}`}
          >
            {title}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1.5">
          <p
            className={`${
              compact ? 'text-[9px]' : 'text-xs'
            } truncate opacity-85 ${theme.text}`}
          >
            {author}
          </p>
          {!compact && <BookOpen className={`w-3.5 h-3.5 shrink-0 opacity-70 ${theme.accent}`} />}
        </div>
      </div>
    </div>
  );
}
