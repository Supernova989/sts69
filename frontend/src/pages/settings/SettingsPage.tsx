import { FC } from 'react';
import { ProtectedRoute } from '../../components/protected-route/ProtectedRoute.tsx';

export const SettingsPage: FC = () => {
  return <h1>Welcome to the Settings</h1>;
};

export const ProtectedSettingsPage = ProtectedRoute(SettingsPage);
