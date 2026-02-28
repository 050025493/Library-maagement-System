// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SearchPage from './pages/search';
import ResultsPage from './pages/result';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">

        <main className="pb-12">
          <Routes>
            <Route path="/" element={<Navigate to="/search" replace />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/results" element={<ResultsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}