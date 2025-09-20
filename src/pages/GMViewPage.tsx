import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';

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

  const handleDelete = async (characterId: string) => {
    if (window.confirm('Tem certeza que deseja apagar esta ficha? Esta ação não pode ser desfeita.')) {
      try {
        await deleteDoc(doc(db, 'characterSheets', characterId));
        setCharacters(characters.filter(char => char.id !== characterId));
      } catch (error) {
        console.error("Erro ao apagar a ficha:", error);
      }
    }
  };

  if (loading) {
    return <p>Carregando...</p>;
  }

  if (currentUser?.role !== 'gm') {
    return (
      <div className="mesa-container">
        <h1>Acesso Negado</h1>
        <p>Esta página é restrita aos Game Masters.</p>
      </div>
    );
  }

  return (
    <div className="mesa-container">
      <h1>Visão do Mestre</h1>
      <div className="character-list">
        {characters.length > 0 ? (
          characters.map(char => (
            <div key={char.id} className="character-card">
              <Link to={`/character/${char.id}`} className="character-card-link">
                <h3>{char.name}</h3>
                <p>{char.class} - Nível {char.level}</p>
              </Link>
              <button onClick={() => handleDelete(char.id)} className="delete-button">
                Apagar
              </button>
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
