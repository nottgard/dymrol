import './Layout.css';
import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <>
      <header className="header">
        <nav>
          <NavLink to="/" end>
            Home
          </NavLink>
          {/* Añade aquí más enlaces */}
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </>
  );
}
