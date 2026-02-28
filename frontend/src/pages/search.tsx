// src/pages/search.tsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Cpu, FlaskConical, Building2, Calculator, Leaf, Layers } from 'lucide-react';

// Quick-access subject chips
const SUBJECTS = [
  { label: 'Computer Science', icon: Cpu,          color: 'bg-blue-50 text-blue-700 border-blue-200    hover:bg-blue-100' },
  { label: 'Management',       icon: Building2,     color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
  { label: 'Electronics',      icon: Layers,        color: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' },
  { label: 'Mechanical',       icon: Cpu,           color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' },
  { label: 'Mathematics',      icon: Calculator,    color: 'bg-green-50 text-green-700 border-green-200  hover:bg-green-100' },
  { label: 'Biotechnology',    icon: FlaskConical,  color: 'bg-teal-50 text-teal-700 border-teal-200    hover:bg-teal-100' },
  { label: 'Civil',            icon: Building2,     color: 'bg-stone-50 text-stone-700 border-stone-200  hover:bg-stone-100' },
  { label: 'General',         icon: Leaf,           color: 'bg-lime-50 text-lime-700 border-lime-200    hover:bg-lime-100' },
];

const SEARCH_FIELDS = ['Keyword', 'Title', 'Author', 'Publisher', 'Subject', 'ISBN'];

export default function SearchPage() {
  const [query,       setQuery]       = useState('');
  const [field,       setField]       = useState('Keyword');
  const [focused,     setFocused]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSearch = () => {
    const q = query.trim();
    if (!q) return;
    navigate(`/results?q=${encodeURIComponent(q)}&field=${encodeURIComponent(field)}`);
  };

  const handleSubjectClick = (subject: string) => {
    navigate(`/results?q=${encodeURIComponent(subject)}&field=Subject`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col">

      {/* ── Top bar ── */}
      <header className="px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <BookOpen className="text-white w-4 h-4" />
          </div>
          <span className="font-bold text-gray-800 text-base tracking-tight">VIT Library</span>
        </div>
        <div className="text-xs text-gray-400 hidden md:block">
          271,000+ books · 105,000+ unique titles
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-24 pt-8">

        {/* Logo mark */}
        <div
          className="mb-8 relative"
          style={{ animation: 'float 4s ease-in-out infinite' }}
        >
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-200">
            <BookOpen className="text-white w-10 h-10" />
          </div>
          {/* Decorative ring */}
          <div className="absolute -inset-2 rounded-[2rem] border-2 border-blue-200 border-dashed opacity-60" />
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight text-center mb-3">
          Find your next read
        </h1>
        <p className="text-gray-500 text-base md:text-lg text-center mb-10 max-w-md">
          Search the VIT library catalog — books, theses, references, and more.
        </p>

        {/* ── Search bar ── */}
        <div
          className={`w-full max-w-2xl bg-white rounded-2xl shadow-lg border transition-all duration-200 ${
            focused ? 'border-blue-400 shadow-blue-100 shadow-xl' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-0">
            {/* Field selector */}
            <div className="pl-4 pr-1 flex-shrink-0">
              <select
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="bg-transparent text-gray-500 text-sm py-4 outline-none cursor-pointer border-r border-gray-200 pr-3 appearance-none"
              >
                {SEARCH_FIELDS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Search input */}
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Search by keyword, title, author..."
                className="flex-1 py-4 text-gray-900 placeholder-gray-400 bg-transparent outline-none text-base"
              />
            </div>

            {/* Search button */}
            <div className="pr-2 py-2 flex-shrink-0">
              <button
                onClick={handleSearch}
                disabled={!query.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-150 text-sm flex items-center gap-2 disabled:cursor-not-allowed"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Subject quick-access ── */}
        <div className="mt-10 w-full max-w-2xl">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-4">
            Browse by Subject
          </p>
          <div className="flex flex-wrap gap-2.5 justify-center">
            {SUBJECTS.map(({ label, icon: Icon, color }) => (
              <button
                key={label}
                onClick={() => handleSubjectClick(label)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all duration-150 ${color}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="text-center text-xs text-gray-400 pb-8">
        VIT Library Catalog · Vellore Institute of Technology
      </footer>

      {/* Float animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}