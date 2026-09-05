import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            STB SmartCredit Agent
          </Link>
          <nav className="flex space-x-4 text-xs font-semibold">
            <Link to="/agent" className="hover:text-emerald-400 transition-colors">Portal Agent</Link>
            <Link to="/login" className="hover:text-emerald-400 transition-colors">Connexion</Link>
          </nav>
        </div>
      </header>
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Outlet />
      </main>
      <footer className="border-t border-slate-900 bg-black/30 py-6 text-center text-slate-500 text-sm">
        &copy; {new Date().getFullYear()} STB Bank. Tous droits réservés.
      </footer>
    </div>
  );
};
