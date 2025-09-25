import React, { useState, useEffect, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FaTh, FaUserPlus, FaMap, FaBook, FaMagic, FaBox, FaFileAlt, FaChalkboardTeacher, FaDiceD20, FaPlus, FaTimes, FaBars
} from 'react-icons/fa';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import DiceRoller from './DiceRoller';
import CharacterDetails from './CharacterDetails';
import CharacterSelectorPanel from './CharacterSelectorPanel';
import { auth, db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import './Layout.css';

// Definindo a interface para os dados do personagem aqui para referência
interface CharacterData {
  id: string;
  userId?: string;
  name: string;
  class: string;
  level: number;
  currentHp: number;
  maxHp: number;
  armorClass: number;
  imageUrl?: string;
  attributes: {
    [key: string]: { score: number; bonus: number };
  };
  inventory?: string[];
  equipment?: string[];
  abilities?: string[];
  spells?: string[];
}

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const { toggleToolbar } = useUI();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isDiceRollerOpen, setDiceRollerOpen] = useState(false);
  const [playerCharacter, setPlayerCharacter] = useState<CharacterData | null>(null);
  const [allCharacters, setAllCharacters] = useState<CharacterData[]>([]);
  const [isFabMenuOpen, setFabMenuOpen] = useState(false);
  const location = useLocation();
  const isMesaPage = location.pathname === '/dashboard';

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  // Efeito para buscar todos os personagens uma vez, sem real-time para evitar lentidão.
  useEffect(() => {
    const fetchCharacters = async () => {
      const charactersRef = collection(db, 'characterSheets');
      const querySnapshot = await getDocs(charactersRef);
      const charactersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CharacterData));
      setAllCharacters(charactersList);
    };
    if (currentUser) {
      fetchCharacters();
    }
  }, [currentUser]);

  // Efeito para encontrar o personagem do usuário quando a lista ou o usuário mudar
  useEffect(() => {
    if (currentUser && allCharacters.length > 0) {
      const userChar = allCharacters.find(char => char.userId === currentUser.uid);
      if (userChar) {
        setPlayerCharacter(userChar);
      }
    }
  }, [currentUser, allCharacters]);

  const handleSelectCharacter = (character: CharacterData) => {
    setPlayerCharacter(character);
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
            <NavLink to="/character-list" onClick={toggleSidebar}><FaUserPlus /> Minhas Fichas</NavLink>
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

      <div className={`fab-container ${isFabMenuOpen ? 'open' : ''}`}>
        <div className="fab-options">
          {isMesaPage && (
            <button className="fab" onClick={() => { toggleToolbar(); setFabMenuOpen(false); }}>
              <FaBars />
            </button>
          )}
          <button className="fab" onClick={() => { setDiceRollerOpen(true); setFabMenuOpen(false); }}>
            <FaDiceD20 />
          </button>
        </div>
        <button className="fab fab-main" onClick={() => setFabMenuOpen(!isFabMenuOpen)}>
          {isFabMenuOpen ? <FaTimes /> : <FaPlus />}
        </button>
      </div>

      {isDiceRollerOpen && (
        <div className="modal-overlay" onClick={() => setDiceRollerOpen(false)}>
          <div className="modal-content triple-modal" onClick={(e) => e.stopPropagation()}>
            <div className="triple-modal-main-content">
              <CharacterSelectorPanel characters={allCharacters} onSelect={handleSelectCharacter} />
              <div className="dice-roller-panel">
                <DiceRoller />
              </div>
              {playerCharacter && (
                <div className="character-details-panel">
                  <CharacterDetails character={playerCharacter} />
                </div>
              )}
            </div>
            <button className="close-button" onClick={() => setDiceRollerOpen(false)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
