import React, { type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div>
          <div className="sidebar-header">
            <h2>Gênese RPG</h2>
          </div>
          <nav className="sidebar-nav">
            <NavLink to="/dashboard">Mesa</NavLink>
            <NavLink to="/create-character">Criar Ficha</NavLink>
            <NavLink to="/map">Mapa</NavLink>
            <NavLink to="/bestiary">Bestiário</NavLink>
            <NavLink to="/spells">Magias e Habilidades</NavLink>
            <NavLink to="/items">Itens</NavLink>
            <NavLink to="/wiki">Wiki</NavLink>
            {currentUser?.role === 'gm' && (
              <NavLink to="/gm-view">Visão do Mestre</NavLink>
            )}
          </nav>
        </div>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
