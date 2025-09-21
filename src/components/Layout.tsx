import React, { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaTh, FaUserPlus, FaMap, FaBook, FaMagic, FaBox, FaFileAlt, FaChalkboardTeacher, FaDiceD20
} from 'react-icons/fa';
import { signOut } from 'firebase/auth';
import DiceRoller from './DiceRoller';
import { auth } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isDiceRollerOpen, setDiceRollerOpen] = useState(false);

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
            <NavLink to="/dashboard" onClick={toggleSidebar}><FaTh /> Mesa</NavLink>
            <NavLink to="/create-character" onClick={toggleSidebar}><FaUserPlus /> Criar Ficha</NavLink>
            <NavLink to="/maps" onClick={toggleSidebar}><FaMap /> Mapa</NavLink>
            <NavLink to="/bestiary" onClick={toggleSidebar}><FaBook /> Bestiário</NavLink>
            <NavLink to="/spells" onClick={toggleSidebar}><FaMagic /> Magias e Habilidades</NavLink>
            <NavLink to="/items" onClick={toggleSidebar}><FaBox /> Itens</NavLink>
            <NavLink to="/wiki" onClick={toggleSidebar}><FaFileAlt /> Wiki</NavLink>
            {currentUser?.role === 'gm' && (
              <NavLink to="/gm-view" onClick={toggleSidebar}><FaChalkboardTeacher /> Visão do Mestre</NavLink>
            )}
          </nav>
        </div>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </aside>
      
      {isSidebarOpen && <div className="overlay" onClick={toggleSidebar}></div>}

      <main className="main-content">
        {children}
      </main>

      <button className="fab" onClick={() => setDiceRollerOpen(true)}>
        <FaDiceD20 />
      </button>

      {isDiceRollerOpen && (
        <div className="modal-overlay" onClick={() => setDiceRollerOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <DiceRoller />
            <button className="close-button" onClick={() => setDiceRollerOpen(false)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
