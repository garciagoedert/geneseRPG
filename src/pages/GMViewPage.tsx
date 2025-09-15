import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './Dashboard.css'; // Reutilizando estilos

interface CharacterSummary {
  id: string;
  name: string;
  class: string;
  level: number;
}

const GMViewPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCharacters = async () => {
      if (currentUser?.role !== 'gm') {
        setLoading(false);
        return;
      }
      try {
        const querySnapshot = await getDocs(collection(db, 'characterSheets'));
        const chars = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          class: doc.data().class,
          level: doc.data().level,
        }));
        setCharacters(chars);
      } catch (error) {
        console.error("Erro ao buscar fichas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCharacters();
  }, [currentUser]);

  if (loading) {
    return <p>Carregando...</p>;
  }

  if (currentUser?.role !== 'gm') {
    return (
      <div className="dashboard-container">
        <h1>Acesso Negado</h1>
        <p>Esta página é restrita aos Game Masters.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1>Visão do Mestre</h1>
      <div className="character-list">
        {characters.length > 0 ? (
          characters.map(char => (
            <div key={char.id} className="character-card">
              <h3>{char.name}</h3>
              <p>{char.class} - Nível {char.level}</p>
              <Link to={`/character/${char.id}`}>Ver Ficha</Link>
            </div>
          ))
        ) : (
          <p>Nenhuma ficha de personagem encontrada.</p>
        )}
      </div>
    </div>
  );
};

export default GMViewPage;
