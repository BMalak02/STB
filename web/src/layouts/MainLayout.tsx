import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export const MainLayout = () => {
  return (
    <div class="min-h-screen flex flex-col">
      <header class="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" class="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            BrandApp
          </Link>
          <nav class="flex space-x-4">
            <Link to="/" class="hover:text-blue-400 transition-colors">Accueil</Link>
            <Link to="/login" class="hover:text-blue-400 transition-colors">Connexion</Link>
          </nav>
        </div>
      </header>
      <main class="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Outlet />
      </main>
      <footer class="border-t border-slate-900 bg-black/30 py-6 text-center text-slate-500 text-sm">
        &copy; {new Date().getFullYear()} BrandApp. Tous droits réservés.
      </footer>
    </div>
  );
};
