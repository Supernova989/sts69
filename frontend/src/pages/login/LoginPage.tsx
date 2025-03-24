import { FC } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { REDIRECT_URL_PARAM_NAME } from '../../constants.ts';
import { useAuthStore } from '../../stores';

export const LoginPage: FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleLogin = () => {
    login();
    const redirectTo = searchParams.get(REDIRECT_URL_PARAM_NAME) || '/app';
    navigate(decodeURIComponent(redirectTo), { replace: true });
  };

  return (
    <div>
      <h1>Login page</h1>
      <button onClick={handleLogin}>Log In</button>
    </div>
  );
};
