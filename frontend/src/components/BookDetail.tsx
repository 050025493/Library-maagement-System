// src/components/BookDetail.tsx
import { ArrowLeft, MapPin, CheckCircle, XCircle, BookOpen, Clock, AlertCircle } from 'lucide-react';
import type { BookGroup, BookRow, CopyStatus } from '../types/book';
import { getStatus } from '../utils/shelfUtils';
import { ITEM_TYPE_LABELS } from '../types/book';

interface Props {
  bookGroup: BookGroup;
  onBack: () => void;
}

// ─── Status badge for individual copies ──────────────────────────────────────
const StatusBadge = ({ status }: { status: CopyStatus }) => {
  const styles: Record<CopyStatus, string> = {
    'Available':       'bg-green-50 text-green-700 border-green-200',
    'Checked Out':     'bg-orange-50 text-orange-700 border-orange-200',
    'Reference Only':  'bg-blue-50 text-blue-700 border-blue-200',
    'Lost':            'bg-red-50 text-red-400 border-red-200',
    'Not Available':   'bg-gray-50 text-gray-500 border-gray-200',
  };
  const icons: Record<CopyStatus, React.ReactNode> = {
    'Available':       <CheckCircle className="w-3.5 h-3.5" />,
    'Checked Out':     <Clock className="w-3.5 h-3.5" />,
    'Reference Only':  <BookOpen className="w-3.5 h-3.5" />,
    'Lost':            <AlertCircle className="w-3.5 h-3.5" />,
    'Not Available':   <XCircle className="w-3.5 h-3.5" />,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${styles[status]}`}
    >
      {icons[status]} {status}
    </span>
  );
};

export default function BookDetail({ bookGroup, onBack }: Props) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium p-2 -ml-2 rounded-lg active:bg-gray-100 text-sm md:text-base"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Search
      </button>

      {/* Book header card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-8 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-6">
          <div className="p-2.5 md:p-4 bg-blue-100 rounded-lg text-blue-600 w-fit">
            <BookOpen className="w-6 h-6 md:w-10 md:h-10" />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-0.5 leading-snug">
              {bookGroup.title}
            </h1>
            {bookGroup.subtitle && (
              <p className="text-gray-400 text-sm md:text-base mb-1">{bookGroup.subtitle}</p>
            )}
            <p className="text-base md:text-xl text-gray-600 mb-3">{bookGroup.author ?? 'Unknown Author'}</p>

            <div className="flex flex-wrap gap-2 text-xs md:text-sm text-gray-500">
              {bookGroup.publisher && (
                <span className="bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                  {bookGroup.publisher}
                </span>
              )}
              {bookGroup.pub_year && (
                <span className="bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                  {bookGroup.pub_year}
                </span>
              )}
              {bookGroup.edition && (
                <span className="bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                  Edition: {bookGroup.edition}
                </span>
              )}
              {bookGroup.subject && (
                <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full border border-blue-100">
                  {bookGroup.subject}
                </span>
              )}
              <span className="bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                {bookGroup.availableCopies} / {bookGroup.totalCopies} available
              </span>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 px-1">
        All Copies ({bookGroup.totalCopies})
      </h3>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-900">Call Number</th>
                <th className="px-6 py-4 font-medium text-gray-900">Shelf Location</th>
                <th className="px-6 py-4 font-medium text-gray-900">Type</th>
                <th className="px-6 py-4 font-medium text-gray-900">Edition</th>
                <th className="px-6 py-4 font-medium text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookGroup.variants.map((v: BookRow, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-blue-600 text-sm">
                    {v.call_number ?? 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <span className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                      {v.shelf ?? 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {ITEM_TYPE_LABELS[v.item_type ?? ''] ?? v.item_type ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {v.edition ?? '—'}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={getStatus(v)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {bookGroup.variants.map((v: BookRow, i) => (
          <div
            key={i}
            className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">
                  Call Number
                </div>
                <div className="font-mono text-blue-600 font-medium text-base">
                  {v.call_number ?? 'N/A'}
                </div>
              </div>
              <StatusBadge status={getStatus(v)} />
            </div>

            <div className="flex gap-4 pt-2 border-t border-gray-100">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-gray-400 mb-0.5">Shelf Location</div>
                <div className="text-sm text-gray-700 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                  <span className="truncate">{v.shelf ?? 'N/A'}</span>
                </div>
              </div>
              <div className="shrink-0">
                <div className="text-[10px] text-gray-400 mb-0.5 text-right">Type</div>
                <div className="text-sm text-gray-700">
                  {ITEM_TYPE_LABELS[v.item_type ?? ''] ?? v.item_type ?? '—'}
                </div>
              </div>
              {v.edition && (
                <div className="shrink-0">
                  <div className="text-[10px] text-gray-400 mb-0.5 text-right">Edition</div>
                  <div className="text-sm text-gray-700">{v.edition}</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}