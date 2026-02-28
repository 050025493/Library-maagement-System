// src/pages/results.tsx
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, Settings, BookOpen, ChevronLeft, ChevronRight, SlidersHorizontal,
} from 'lucide-react';
import { useBooks } from '../hooks/useBooks';
import BookList from '../components/BookList';
import BookDetail from '../components/BookDetail';
import FilterSidebar from '../components/FilterSidebar';
import type { BookGroup } from '../types/book';

const SEARCH_FIELDS = ['Keyword', 'Title', 'Author', 'Publisher', 'Subject', 'ISBN', 'Barcode'];

export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const initialField = searchParams.get('field') ?? 'Keyword';

  const {
    groups, loading, error,
    page, totalPages, totalResults, setPage,
    facets, filters, handleFilterChange, clearFilters,
    searchTerm, setSearchTerm,
    searchField, setSearchField,
  } = useBooks(initialQuery, initialField);

  const [selectedBook,      setSelectedBook]      = useState<BookGroup | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Sync URL params → hook when user navigates back/forward
  useEffect(() => {
    setSearchTerm(searchParams.get('q') ?? '');
    setSearchField(searchParams.get('field') ?? 'Keyword');
  }, [searchParams]); // eslint-disable-line

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-gray-900 pb-12">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
        <Link
          to="/search"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          onClick={() => setSelectedBook(null)}
        >
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
            <BookOpen className="text-white" size={18} />
          </div>
          <span className="font-bold text-lg hidden md:block">VIT Library</span>
        </Link>

        {!selectedBook && (
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex-1 max-w-3xl mx-8 flex items-center bg-[#f1f5f9] rounded-lg border border-transparent focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all overflow-hidden"
          >
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="bg-transparent text-gray-600 text-sm py-2 pl-3 pr-1 border-r border-gray-300 outline-none cursor-pointer hover:text-gray-900"
            >
              {SEARCH_FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <div className="pl-3 text-gray-400"><Search size={16} /></div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search books, authors, subjects..."
              className="w-full bg-transparent border-none pl-2 pr-4 py-2 text-sm outline-none"
            />
            {/* Clear button */}
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="pr-3 text-gray-400 hover:text-gray-700 text-lg leading-none"
              >
                ×
              </button>
            )}
          </form>
        )}

        <div className="flex items-center gap-4 text-gray-600">
          {!selectedBook && (
            <button className="md:hidden p-2" onClick={() => setShowMobileFilters(!showMobileFilters)}>
              <SlidersHorizontal size={20} />
            </button>
          )}
          <Settings size={20} className="cursor-pointer hover:text-gray-900 hidden md:block" />
          <div className="w-8 h-8 bg-orange-200 rounded-full border border-gray-300" />
        </div>
      </header>

      {/* ── Main ── */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">

        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-6">
          <Link to="/search" className="hover:text-blue-600">Home</Link>
          <span className="mx-2">/</span>
          {selectedBook ? (
            <>
              <button onClick={() => setSelectedBook(null)} className="hover:text-blue-600">
                Search Results
              </button>
              <span className="mx-2">/</span>
              <span className="text-gray-800 truncate">{selectedBook.title}</span>
            </>
          ) : (
            <span>Search Results</span>
          )}
        </div>

        {selectedBook ? (
          <BookDetail bookGroup={selectedBook} onBack={() => setSelectedBook(null)} />
        ) : (
          <div className="flex gap-8">

            {/* Sidebar */}
            <aside className={`w-64 flex-shrink-0 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto ${showMobileFilters ? 'block' : 'hidden md:block'}`}>
              <FilterSidebar
                facets={facets}
                selectedFilters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
              />
            </aside>

            {/* Results */}
            <main className="flex-1 min-w-0">

              {/* Result count + page */}
              <div className="flex justify-between items-end mb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Library Catalog</h2>
                  <p className="text-gray-500 text-sm mt-0.5">
                    {loading ? (
                      <span className="animate-pulse">Searching…</span>
                    ) : searchTerm ? (
                      <>
                        <span className="font-medium text-gray-700">{totalResults.toLocaleString()}</span>
                        {' '}result{totalResults !== 1 ? 's' : ''} for{' '}
                        <span className="font-semibold text-blue-600">"{searchTerm}"</span>
                      </>
                    ) : (
                      'Enter a search term to begin'
                    )}
                  </p>
                </div>
                {!loading && totalResults > 0 && (
                  <span className="text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                    Page {page} of {totalPages}
                  </span>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-5 text-sm">
                  ⚠ {error}
                </div>
              )}

              {/* Empty state — no search yet */}
              {!loading && !searchTerm && (
                <div className="text-center py-24 text-gray-400">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-lg font-medium text-gray-500">Start typing to search 105,000+ titles</p>
                  <p className="text-sm mt-1">Try a title, author name, or subject area</p>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                  <p className="text-gray-400 animate-pulse">Searching catalog…</p>
                </div>
              )}

              {/* Results — pass searchTerm for highlighting */}
              {!loading && searchTerm && (
                <BookList
                  books={groups}
                  onBookClick={setSelectedBook}
                  searchQuery={searchTerm}   // ← this drives highlighting
                />
              )}

              {/* Pagination */}
              {!loading && groups.length > 0 && (
                <div className="mt-8 flex justify-center gap-3">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm font-medium text-gray-700"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm font-medium text-gray-700"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}