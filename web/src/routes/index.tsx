import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { LoginForm } from '../features/auth/components/LoginForm';

const Home = () => (
  <div class="space-y-6 text-center py-20">
    <h1 class="text-5xl font-extrabold tracking-tight sm:text-6xl bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
      Architecture Modulaire React
    </h1>
    <p class="max-w-2xl mx-auto text-lg text-slate-400">
      React.js, Vite, TypeScript, Tailwind, TanStack Query, Redux Toolkit, React Router et Hook Form.
    </p>
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <LoginForm /> },
    ],
  },
]);

export const AppRoutes = () => {
  return <RouterProvider router={router} />;
};
