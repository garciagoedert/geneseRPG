import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import './BestiaryPage.css'; // Reutilizando estilos

interface Spell {
  id: string;
  name: string;
  type: 'magia' | 'habilidade';
  level: number;
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

  const fetchSpells = async () => {
    try {
      let spellsQuery = query(collection(db, 'spellsAndAbilities'));
      if (currentUser?.role !== 'gm') {
        spellsQuery = query(collection(db, 'spellsAndAbilities'), where('visibleToPlayers', '==', true));
      }
      
      const querySnapshot = await getDocs(spellsQuery);
      const spellList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Spell));
      
      setSpells(spellList);
      setFilteredSpells(spellList);
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
    const results = spells.filter(spell =>
      spell.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSpells(results);
  }, [searchTerm, spells]);

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
    <div className="dashboard-container">
      <div className="dashboard-header">
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
      <div className="character-list">
        {filteredSpells.length > 0 ? (
          filteredSpells.map(spell => (
            <div key={spell.id} className="character-card">
              {spell.imageUrl && <img src={spell.imageUrl} alt={spell.name} className="card-image" />}
              <div className="card-content">
                <h3>{spell.name} ({spell.type})</h3>
                <p>Nível: {spell.level}</p>
                <p>{spell.description.substring(0, 100)}...</p>
              </div>
              {currentUser?.role === 'gm' && (
                <div className="gm-controls">
                  <button onClick={() => toggleVisibility(spell.id, spell.visibleToPlayers)}>
                    {spell.visibleToPlayers ? 'Ocultar' : 'Revelar'}
                  </button>
                  <Link to={`/edit-spell/${spell.id}`} className="control-button">Editar</Link>
                  <button onClick={() => deleteSpell(spell.id)} className="control-button delete">Deletar</button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p>Nenhuma magia ou habilidade encontrada.</p>
        )}
      </div>
    </div>
  );
};

export default SpellsPage;
