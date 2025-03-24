import { FC } from 'react';
import { ProtectedRoute } from '../../components/protected-route/ProtectedRoute.tsx';

export const DashboardPage: FC = () => {
  return <h1>Welcome to the Dashboard</h1>;
};

export const ProtectedDashboardPage = ProtectedRoute(DashboardPage);
