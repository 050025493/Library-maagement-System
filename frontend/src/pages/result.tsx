import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MOCK_BOOKS } from '../data/mock'; // Adjusted to match your import
import { 
  Search, Settings, BookOpen, Calendar, CheckCircle2, 
  Clock, Cloud, Bookmark, List, LayoutGrid, ChevronLeft, ChevronRight 
} from 'lucide-react';

const SEARCH_FIELDS = [
  'Keyword', 'Subject', 'Title', 'Author', 'Publisher', 
  'Publisher Location', 'ISBN', 'Barcode'
];

// --- COMPLETE FILTER LISTS ---
const FILTER_OPTIONS = {
  audiences: ['Preschool', 'Primary', 'Pre - adolescent', 'Adult', 'Specialized', 'General', 'Juvenile'],
  contents: ['Fiction', 'Non-fiction', 'Biography', 'Musical recording', 'Non-musical recording'],
  formats: ['Regular print', 'Large print', 'Braille', 'CD audio', 'Cassette recording', 'VHS tape / Videocassette', 'DVD video / Videodisc', 'CD software', 'Website'],
  languages: ['English', 'Hindi', 'Tamil', 'German', 'French']
};

export default function ResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read both keyword and field from URL
  const keywordParam = searchParams.get('keyword') || '';
  const fieldParam = searchParams.get('field') || 'Keyword';

  // Local state for the top search bar
  const [searchInput, setSearchInput] = useState(keywordParam);
  const [searchField, setSearchField] = useState(fieldParam);

  // Keep inputs synced if URL changes externally
  useEffect(() => {
    setSearchInput(keywordParam);
    setSearchField(fieldParam);
  }, [keywordParam, fieldParam]);

  const handleTopSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    
    if (searchInput.trim()) {
      params.set('keyword', searchInput.trim());
      params.set('field', searchField);
    } else {
      params.delete('keyword');
      params.delete('field');
    }
    
    setSearchParams(params);
  };

  // --- SMART FILTERING LOGIC ---
  const filteredBooks = MOCK_BOOKS.filter(book => {
    if (!keywordParam) return true;
    
    const query = keywordParam.toLowerCase();
    
    switch (fieldParam) {
      case 'Title':
        return book.title.toLowerCase().includes(query);
      case 'Author':
        return book.author.toLowerCase().includes(query);
      case 'Publisher':
        return book.publisher?.toLowerCase().includes(query);
      case 'ISBN':
        return book.tags?.some(tag => tag.toLowerCase().includes(query)); 
      case 'Keyword':
      default:
        return (
          book.title.toLowerCase().includes(query) || 
          book.author.toLowerCase().includes(query) ||
          book.tags?.some(tag => tag.toLowerCase().includes(query))
        );
    }
  });

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-gray-900 pb-12">
      
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
            <BookOpen className="text-white" size={18} />
          </div>
          <span className="font-bold text-lg hidden md:block">My Library</span>
        </Link>

        {/* Top Search Form with Dropdown */}
        <form onSubmit={handleTopSearch} className="flex-1 max-w-3xl mx-8 flex items-center bg-[#f1f5f9] rounded-lg border border-transparent focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all overflow-hidden">
          
          <select 
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
            className="bg-transparent text-gray-600 text-sm py-2 pl-3 pr-1 border-r border-gray-300 outline-none cursor-pointer hover:text-gray-900"
          >
            {SEARCH_FIELDS.map(field => (
              <option key={field} value={field}>{field}</option>
            ))}
          </select>

          <div className="pl-3 text-gray-400">
            <Search size={16} />
          </div>

          <input 
            type="text" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search..."
            className="w-full bg-transparent border-none pl-2 pr-4 py-2 text-sm outline-none"
          />
          <button type="submit" className="hidden">Search</button>
        </form>

        <div className="flex items-center gap-4 text-gray-600">
          <Settings size={20} className="cursor-pointer hover:text-gray-900" />
          <div className="w-8 h-8 bg-orange-200 rounded-full border border-gray-300"></div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-blue-600">Home</Link> <span className="mx-2">/</span> Search Results
        </div>

        <div className="flex gap-8">
          
          {/* LEFT SIDEBAR: ADVANCED FILTERS (FULLY RESTORED) */}
          <aside className="w-64 flex-shrink-0">
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-xl font-bold">Filters</h2>
              <button className="text-sm text-blue-600 hover:underline">Clear All</button>
            </div>

            {/* Publication Date Range */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Publication Date Range</h3>
              <div className="space-y-3">
                <select className="w-full text-sm border-gray-300 rounded-md p-2 bg-white shadow-sm outline-none focus:ring-1 focus:ring-blue-500 border">
                  <option>Between two dates</option>
                  <option>After date</option>
                  <option>Before date</option>
                </select>
                <div className="flex gap-2">
                  <input type="number" placeholder="YYYY" className="w-full text-sm border p-2 rounded-md focus:ring-1 focus:ring-blue-500 outline-none" />
                  <span className="text-gray-400 self-center">-</span>
                  <input type="number" placeholder="YYYY" className="w-full text-sm border p-2 rounded-md focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </div>

            {/* Content Filter */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Content</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2 pb-2">
                {FILTER_OPTIONS.contents.map((item) => (
                  <label key={item} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Format Filter */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Format</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2 pb-2">
                {FILTER_OPTIONS.formats.map((item) => (
                  <label key={item} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 truncate" title={item}>{item}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Audience Filter */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Audience</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2 pb-2">
                {FILTER_OPTIONS.audiences.map((item) => (
                  <label key={item} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{item}</span>
                  </label>
                ))}
              </div>
            </div>

             {/* Language Filter */}
             <div className="mb-8">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Language</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2 pb-2">
                {FILTER_OPTIONS.languages.map((item) => (
                  <label key={item} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* RIGHT SIDE: SEARCH RESULTS */}
          <main className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-700">
                Showing <span className="font-bold">{filteredBooks.length}</span> results 
                {keywordParam && <span> for <span className="font-bold">"{keywordParam}"</span> in {fieldParam}</span>}
              </p>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                  <span className="text-gray-500">Sort by:</span>
                  <select className="border-none bg-transparent font-medium text-gray-900 cursor-pointer focus:ring-0 outline-none">
                    <option>Relevance</option>
                    <option>Popularity</option>
                    <option>Author</option>
                  </select>
                </div>
                
                <div className="flex bg-white rounded border border-gray-200">
                  <button className="p-1.5 bg-blue-50 text-blue-600 border-r border-gray-200"><List size={18} /></button>
                  <button className="p-1.5 text-gray-400 hover:text-gray-600"><LayoutGrid size={18} /></button>
                </div>
              </div>
            </div>

            {/* Connected Cards List */}
            <div className="flex flex-col gap-4">
              {filteredBooks.length > 0 ? filteredBooks.map((book) => {
                const availableCopies = book.copies.filter(c => c.status === 'Available').length;
                const isDigital = book.format === 'E-Book' || book.format === 'Website';
                
                return (
                  <div key={book.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex gap-6 hover:-translate-y-1 transition-transform duration-200 ease-out">
                    
                    <div className={`w-28 h-40 ${book.coverColor} rounded-md shadow-inner flex-shrink-0 relative overflow-hidden flex flex-col items-center justify-center p-2 text-center`}>
                      <span className="text-[10px] font-serif font-bold text-black/60 uppercase">{book.title.substring(0, 30)}</span>
                    </div>

                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 leading-tight">{book.title}</h3>
                          <p className="text-sm text-blue-600 mt-1">{book.author}</p>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600"><Bookmark size={20} /></button>
                      </div>

                      <div className="flex items-center gap-6 mt-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5"><Calendar size={14} /> {book.publicationYear}</div>
                        <div className="flex items-center gap-1.5"><BookOpen size={14} /> {book.format}</div>
                        <div className="flex items-center gap-1.5"> {book.publisher}</div>
                      </div>

                      <div className="mt-auto pt-4 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {isDigital ? (
                             <><Cloud size={16} className="text-blue-500"/> <span className="text-blue-600">Digital Access</span></>
                          ) : availableCopies > 0 ? (
                             <><CheckCircle2 size={16} className="text-green-500"/> <span className="text-green-600">{availableCopies} Available</span></>
                          ) : (
                             <><Clock size={16} className="text-orange-500"/> <span className="text-orange-500">All Loaned Out</span></>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-700">No matching materials found.</h3>
                  <p className="text-gray-500 mt-2">Try adjusting your field or search term.</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}