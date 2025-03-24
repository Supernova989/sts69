import { ComponentType, FC } from 'react';
import { Navigate } from 'react-router';
import { REDIRECT_URL_PARAM_NAME } from '../../constants.ts';
import { useAuthStore } from '../../stores';

export function ProtectedRoute<P extends object>(Component: ComponentType<P>): FC<P> {
  const WrappedComponent: FC<P> = (props: P) => {
    const { isAuthenticated } = useAuthStore();

    if (!isAuthenticated) {
      const from = encodeURIComponent(location.pathname + location.search);
      return <Navigate to={`/login?${REDIRECT_URL_PARAM_NAME}=${from}`} replace />;
    }
    return <Component {...props} />;
  };

  WrappedComponent.displayName = `Protected(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}
