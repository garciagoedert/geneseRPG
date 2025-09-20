import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './Dashboard.css'; // Reutilizando estilos
import './BestiaryPage.css'; // Novo CSS

interface Creature {
  id: string;
  name: string;
  description: string;
  stats: string;
  visibleToPlayers: boolean;
  imageUrl?: string;
}

const BestiaryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [filteredCreatures, setFilteredCreatures] = useState<Creature[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCreatures = async () => {
    try {
      let creaturesQuery = query(collection(db, 'bestiary'));
      if (currentUser?.role !== 'gm') {
        creaturesQuery = query(collection(db, 'bestiary'), where('visibleToPlayers', '==', true));
      }
      
      const querySnapshot = await getDocs(creaturesQuery);
      const creatureList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Creature));
      
      setCreatures(creatureList);
      setFilteredCreatures(creatureList);
    } catch (error) {
      console.error("Erro ao buscar criaturas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreatures();
  }, [currentUser]);

  useEffect(() => {
    const results = creatures.filter(creature =>
      creature.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCreatures(results);
  }, [searchTerm, creatures]);

  const toggleVisibility = async (id: string, currentVisibility: boolean) => {
    const creatureRef = doc(db, 'bestiary', id);
    await updateDoc(creatureRef, {
      visibleToPlayers: !currentVisibility
    });
    fetchCreatures(); // Recarrega as criaturas para refletir a mudança
  };

  const deleteCreature = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar esta criatura?')) {
      const creatureRef = doc(db, 'bestiary', id);
      await deleteDoc(creatureRef);
      fetchCreatures(); // Recarrega as criaturas
    }
  };

  if (loading) {
    return <p>Carregando bestiário...</p>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Bestiário</h1>
        {currentUser?.role === 'gm' && (
          <Link to="/add-creature">
            <button>Adicionar Criatura</button>
          </Link>
        )}
      </div>
      <input
        type="text"
        placeholder="Buscar criatura..."
        className="search-bar"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="character-list">
        {filteredCreatures.length > 0 ? (
          filteredCreatures.map(creature => (
            <div key={creature.id} className="character-card">
              {creature.imageUrl && <img src={creature.imageUrl} alt={creature.name} className="card-image" />}
              <div className="card-content">
                <h3>{creature.name}</h3>
                <p>{creature.description.substring(0, 100)}...</p>
              </div>
              {currentUser?.role === 'gm' && (
                <div className="gm-controls">
                  <button onClick={() => toggleVisibility(creature.id, creature.visibleToPlayers)}>
                    {creature.visibleToPlayers ? 'Ocultar' : 'Revelar'}
                  </button>
                  <Link to={`/edit-creature/${creature.id}`} className="control-button">Editar</Link>
                  <button onClick={() => deleteCreature(creature.id)} className="control-button delete">Deletar</button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p>Nenhuma criatura encontrada.</p>
        )}
      </div>
    </div>
  );
};

export default BestiaryPage;
