import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AgentLoginForm } from '../features/auth/components/AgentLoginForm';
import { AgentDashboard } from '../features/agent/components/AgentDashboard';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AgentDashboard />,
  },
  {
    path: '/agent',
    element: <AgentDashboard />,
  },
  {
    path: '/login',
    element: <AgentLoginForm />,
  },
  {
    path: '*',
    element: <Navigate to="/agent" replace />,
  },
]);

export const AppRoutes = () => {
  return <RouterProvider router={router} />;
};
