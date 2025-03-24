import { FC } from 'react';
import { Outlet } from 'react-router';

export const PublicLayout: FC = () => {
  return (
    <div>
      <header style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <h1>Public layout</h1>
        <nav>
          <ul>
            <li>Link 1</li>
            <li>Link 2</li>
          </ul>
        </nav>
      </header>

      <main style={{ padding: '1rem' }}>
        <Outlet />
      </main>

      <footer style={{ padding: '1rem', borderTop: '1px solid #ccc' }}>
        <p>Public Footer © 2025</p>
      </footer>
    </div>
  );
};
