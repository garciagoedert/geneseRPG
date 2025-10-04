import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { convertGoogleDriveLink } from '../utils/imageUtils';
import GMActionModal from '../components/GMActionModal';
import './Mesa.css'; // Estilo centralizado

interface Spell {
  id: string;
  name: string;
  type: 'magia' | 'habilidade';
  level: number;
  mpCost: number;
  className: string;
  description: string;
  visibleToPlayers: boolean;
  imageUrl?: string;
}

const SpellsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [spells, setSpells] = useState<Spell[]>([]);
  const [filteredSpells, setFilteredSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);

  const handleCardClick = (spell: Spell) => {
    if (currentUser?.role === 'gm') {
      setSelectedSpell(spell);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSpell(null);
  };

  const fetchSpells = async () => {
    try {
      let finalSpellList: Spell[] = [];

      if (currentUser && currentUser.role !== 'gm') {
        const characterQuery = query(collection(db, 'characterSheets'), where('ownerId', '==', currentUser.uid));
        const characterSnapshot = await getDocs(characterQuery);
        const playerClass = characterSnapshot.empty ? null : characterSnapshot.docs[0].data().class;

        // Fetch all visible spells and filter on the client-side
        const allVisibleSpellsQuery = query(
          collection(db, 'spellsAndAbilities'),
          where('visibleToPlayers', '==', true)
        );
        const allVisibleSpellsSnapshot = await getDocs(allVisibleSpellsQuery);
        const allVisibleSpells = allVisibleSpellsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Spell));
        
        // Filter for spells that are generic (no class) or match the player's class, case-insensitively and trimming whitespace
        finalSpellList = allVisibleSpells.filter(spell => 
          !spell.className || (playerClass && spell.className.trim().toLowerCase() === playerClass.trim().toLowerCase())
        );

      } else {
        // GM sees all spells
        const gmQuery = query(collection(db, 'spellsAndAbilities'));
        const querySnapshot = await getDocs(gmQuery);
        finalSpellList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Spell));
      }
      
      const uniqueClasses = Array.from(
        new Set(
          finalSpellList
            .flatMap(spell => spell.className ? spell.className.split(',').map(c => c.trim()) : [])
            .filter(Boolean)
        )
      );
      setClasses(uniqueClasses.sort());
      setSpells(finalSpellList);
      setFilteredSpells(finalSpellList);
    } catch (error) {
      console.error("Erro ao buscar magias:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpells();
  }, [currentUser]);

  useEffect(() => {
    const results = spells.filter(spell => {
      const searchTermMatch = spell.name.toLowerCase().includes(searchTerm.toLowerCase());
      const classMatch = selectedClass 
        ? spell.className && spell.className.split(',').map(c => c.trim()).includes(selectedClass)
        : true;
      return searchTermMatch && classMatch;
    });
    setFilteredSpells(results);
  }, [searchTerm, selectedClass, spells]);

  const toggleVisibility = async (id: string, currentVisibility: boolean) => {
    const spellRef = doc(db, 'spellsAndAbilities', id);
    await updateDoc(spellRef, { visibleToPlayers: !currentVisibility });
    fetchSpells();
  };

  const deleteSpell = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar?')) {
      const spellRef = doc(db, 'spellsAndAbilities', id);
      await deleteDoc(spellRef);
      fetchSpells();
    }
  };

  if (loading) {
    return <p>Carregando...</p>;
  }

  return (
    <div className="mesa-container">
      <div className="mesa-header">
        <h1>Magias e Habilidades</h1>
        {currentUser?.role === 'gm' && (
          <Link to="/add-spell">
            <button>Adicionar Novo</button>
          </Link>
        )}
      </div>
      <input
        type="text"
        placeholder="Buscar..."
        className="search-bar"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <select onChange={(e) => setSelectedClass(e.target.value)} value={selectedClass} className="filter-dropdown">
        <option value="">Todas as Classes</option>
        {classes.map(className => (
          <option key={className} value={className}>{className}</option>
        ))}
      </select>
      <div className="character-list">
        {filteredSpells.length > 0 ? (
          filteredSpells.map(spell => (
            <div
              key={spell.id}
              className="character-card"
              style={{
                backgroundImage: spell.imageUrl
                  ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${convertGoogleDriveLink(spell.imageUrl)})`
                  : 'none'
              }}
              onClick={() => handleCardClick(spell)}
            >
              <div className="character-card-info">
                <Link to={`/spell/${spell.id}`} className="character-card-link">
                  <h3>{spell.name} ({spell.type})</h3>
                  <p>Nível: {spell.level} | Custo de MP: {spell.mpCost}</p>
                  <p>{spell.description.substring(0, 100)}...</p>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <p>Nenhuma magia ou habilidade encontrada.</p>
        )}
      </div>

      {selectedSpell && (
        <GMActionModal isOpen={isModalOpen} onClose={handleCloseModal}>
          <button onClick={() => {
            toggleVisibility(selectedSpell.id, selectedSpell.visibleToPlayers);
            handleCloseModal();
          }}>
            {selectedSpell.visibleToPlayers ? 'Ocultar dos Jogadores' : 'Revelar aos Jogadores'}
          </button>
          <Link to={`/edit-spell/${selectedSpell.id}`} className="control-button">
            Editar
          </Link>
          <button onClick={() => {
            deleteSpell(selectedSpell.id);
            handleCloseModal();
          }} className="control-button delete">
            Deletar
          </button>
        </GMActionModal>
      )}
    </div>
  );
};

export default SpellsPage;
