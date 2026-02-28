import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
   BookOpen 
} from 'lucide-react';

// 1. Added the fields list
const SEARCH_FIELDS = [
  'Keyword', 'Subject', 'Title', 'Author', 'Publisher', 
  'Publisher Location', 'ISBN', 'Barcode'
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  
  // 2. Added state for the dropdown
  const [searchField, setSearchField] = useState('Keyword'); 
  
  // State to track your custom checkboxes
  const [filters, setFilters] = useState({
    books: false,
    journals: false,
    digitalResources: false
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.checked });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim() && !Object.values(filters).some(Boolean)) return;
    
    // Build the URL parameters based on user input
    const params = new URLSearchParams();
    if (keyword.trim()) {
      params.append('keyword', keyword.trim());
      // 3. Append the selected field to the URL
      params.append('field', searchField); 
    }
    
    // Grab all checked filters and join them (e.g., types=books,journals)
    const activeFilters = Object.entries(filters)
      .filter(([_, isChecked]) => isChecked)
      .map(([key]) => key)
      .join(',');
      
    if (activeFilters) params.append('types', activeFilters);

    // Navigate to results page with the new URL parameters
    navigate(`/results?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className=" flex  p-4 gap-3  items-center border-b border-slate-200/80 bg-white/90 backdrop-blur">
         
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
            <BookOpen className="text-white" size={18} />
            
          </div>
          <span className="font-bold text-lg hidden md:block">My Library</span>
        
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-6 py-12 md:py-16">
        <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-12 hover:-translate-y-1 transition-transform duration-200 ease-out">         
          
          <div className="mb-10 text-center">
            <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 mb-4 tracking-tight">
              Discover Global Knowledge
            </h1>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Search over 2 lakh books, journals and digital resources present in our university campus library.
            </p>
          </div>

          <form id="searchform" onSubmit={handleSearch} className="space-y-6 max-w-3xl mx-auto">
            
            {/* Search Box */}
            <div className="flex items-center bg-white rounded-2xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-slate-300 transition-all">
              
              {/* 4. INSERTED DROPDOWN HERE: Perfectly matches your slate theme */}
              <select 
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                className="bg-slate-50 border-r border-slate-300 text-slate-700 py-3.5 pl-5 pr-2 outline-none cursor-pointer hover:bg-slate-100 transition-colors font-medium h-full"
              >
                {SEARCH_FIELDS.map(field => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>

              <div className="pl-4 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
                </svg>
              </div>
              <input
                type="text"
                id="searchInput"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search by title, author or keyword"
                className="flex-1 py-3.5 px-4 text-base outline-none bg-transparent text-slate-800 placeholder-slate-400"
              />
              <button 
                type="submit" 
                className="bg-slate-900 hover:bg-slate-800  text-white font-medium py-3.5 px-8 h-full transition-colors cursor-pointer"
              >
                Search
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 pt-1">
              <span className="font-medium text-slate-600">Filter by:</span>
              
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900 transition-colors">
                <input 
                  type="checkbox" 
                  name="books"
                  checked={filters.books}
                  onChange={handleFilterChange}
                  className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-400 cursor-pointer" 
                />
                Books
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900 transition-colors">
                <input 
                  type="checkbox" 
                  name="journals"
                  checked={filters.journals}
                  onChange={handleFilterChange}
                  className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-400 cursor-pointer" 
                />
                Journals
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900 transition-colors">
                <input 
                  type="checkbox" 
                  name="digitalResources"
                  checked={filters.digitalResources}
                  onChange={handleFilterChange}
                  className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-400 cursor-pointer" 
                />
                Digital Resources
              </label>
            </div>

          </form>
        </div>
      </section>
    </div>
  );
}