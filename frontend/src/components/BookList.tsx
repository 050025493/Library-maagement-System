// src/components/BookList.tsx
import { MapPin, Layers, CheckCircle2, Clock, BookOpen, AlertCircle } from 'lucide-react';
import type { BookGroup, CopyStatus } from '../types/book';
import { Highlight } from '../utils/highlight';

interface Props {
  books: BookGroup[];
  onBookClick: (group: BookGroup) => void;
  searchQuery?: string;   // pass the active search term for highlighting
}

const StatusChip = ({
  status,
  availableCopies,
  totalCopies,
}: {
  status: CopyStatus;
  availableCopies: number;
  totalCopies: number;
}) => {
  switch (status) {
    case 'Available':
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-green-600">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {availableCopies} of {totalCopies} available
        </span>
      );
    case 'Checked Out':
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-orange-500">
          <Clock className="w-3.5 h-3.5" /> Checked Out
        </span>
      );
    case 'Reference Only':
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-blue-500">
          <BookOpen className="w-3.5 h-3.5" /> Reference Only
        </span>
      );
    case 'Lost':
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-red-400">
          <AlertCircle className="w-3.5 h-3.5" /> Lost
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-gray-400">
          <Clock className="w-3.5 h-3.5" /> Not Available
        </span>
      );
  }
};

export default function BookList({ books, onBookClick, searchQuery = '' }: Props) {
  if (books.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
        <div className="text-4xl mb-3">📚</div>
        <h3 className="text-xl font-semibold text-gray-700">No matching materials found.</h3>
        <p className="text-gray-400 mt-2 text-sm">
          Try different keywords or check your spelling.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {books.map((group, idx) => (
        <div
          key={idx}
          onClick={() => onBookClick(group)}
          className="bg-white px-5 py-4 rounded-2xl border border-gray-100 shadow-sm flex gap-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer group"
        >
          {/* Cover placeholder */}
          <div className="w-12 h-[4.5rem] bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg shadow-sm flex-shrink-0 flex items-center justify-center overflow-hidden">
            <span className="text-blue-400 text-[8px] font-bold text-center px-1 leading-tight line-clamp-4">
              {group.title?.substring(0, 18)}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title — highlighted */}
            <h3 className="text-[0.95rem] font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
              <Highlight text={group.title} query={searchQuery} />
            </h3>

            {/* Subtitle */}
            {group.subtitle && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                <Highlight text={group.subtitle} query={searchQuery} />
              </p>
            )}

            {/* Author — highlighted */}
            <p className="text-sm text-blue-600 mt-0.5 truncate">
              <Highlight text={group.author ?? '—'} query={searchQuery} />
            </p>

            {/* Publisher + year */}
            <div className="flex items-center gap-1 mt-0.5">
              {group.publisher && (
                <p className="text-xs text-gray-400 truncate">
                  <Highlight text={group.publisher} query={searchQuery} />
                </p>
              )}
              {group.pub_year && (
                <p className="text-xs text-gray-400 flex-shrink-0">· {group.pub_year}</p>
              )}
            </div>

            {/* Meta chips */}
            <div className="flex items-center gap-3 mt-2.5 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Layers className="w-3 h-3" />
                {group.totalCopies} {group.totalCopies === 1 ? 'copy' : 'copies'}
              </span>

              <span className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin className="w-3 h-3" />
                {group.shelf ?? 'N/A'}
              </span>

              {group.subject && (
                <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  <Highlight text={group.subject} query={searchQuery} />
                </span>
              )}

              <StatusChip
                status={group.status}
                availableCopies={group.availableCopies}
                totalCopies={group.totalCopies}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}