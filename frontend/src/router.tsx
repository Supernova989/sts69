import { createBrowserRouter, RouteObject } from 'react-router';
import { AppLayout } from './layouts/app-layout/AppLayout.tsx';
import { PublicLayout } from './layouts/public-layout/PublicLayout.tsx';
import { ProtectedDashboardPage } from './pages/dashboard/DashboardPage.tsx';
import { LandingPage } from './pages/landing/LandingPage.tsx';
import { LoginPage } from './pages/login/LoginPage.tsx';
import { NotFoundPage } from './pages/not-found/NotFoundPage.tsx';
import { ProtectedSettingsPage } from './pages/settings/SettingsPage.tsx';

const routes: RouteObject[] = [
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'login', element: <LoginPage /> },
    ],
  },
  {
    path: '/app',
    element: <AppLayout />,
    children: [
      { index: true, element: <ProtectedDashboardPage /> },
      { path: 'settings', element: <ProtectedSettingsPage /> },
    ],
  },
  {
    path: '*',
    element: <PublicLayout />,
    children: [{ path: '*', element: <NotFoundPage /> }],
  },
];

export const router = createBrowserRouter(routes);
