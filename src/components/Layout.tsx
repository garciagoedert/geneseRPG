import React, { useState, type ReactNode } from 'react';
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
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="layout-container">
      <header className="app-header">
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          ☰
        </button>
        <NavLink to="/dashboard" className="header-title-link">
          <h1>Gênese RPG</h1>
        </NavLink>
      </header>
      
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div>
          <div className="sidebar-header">
            <h2>Menu</h2>
          </div>
          <nav className="sidebar-nav">
            <NavLink to="/dashboard" onClick={toggleSidebar}>Mesa</NavLink>
            <NavLink to="/create-character" onClick={toggleSidebar}>Criar Ficha</NavLink>
            <NavLink to="/maps" onClick={toggleSidebar}>Mapa</NavLink>
            <NavLink to="/bestiary" onClick={toggleSidebar}>Bestiário</NavLink>
            <NavLink to="/spells" onClick={toggleSidebar}>Magias e Habilidades</NavLink>
            <NavLink to="/items" onClick={toggleSidebar}>Itens</NavLink>
            <NavLink to="/wiki" onClick={toggleSidebar}>Wiki</NavLink>
            {currentUser?.role === 'gm' && (
              <NavLink to="/gm-view" onClick={toggleSidebar}>Visão do Mestre</NavLink>
            )}
          </nav>
        </div>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </aside>
      
      {isSidebarOpen && <div className="overlay" onClick={toggleSidebar}></div>}

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
