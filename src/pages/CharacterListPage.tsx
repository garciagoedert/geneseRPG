import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where, doc, deleteDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { convertGoogleDriveLink } from '../utils/imageUtils';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import './Mesa.css'; // Estilo centralizado

interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  imageUrl?: string;
}

const CharacterListPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [filteredCharacters, setFilteredCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  const fetchCharacters = async () => {
    if (!currentUser) return;
    try {
      const charactersQuery = query(collection(db, 'characterSheets'), where('ownerId', '==', currentUser.uid));
      const querySnapshot = await getDocs(charactersQuery);
      const characterList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Character));
      
      setCharacters(characterList);
      setFilteredCharacters(characterList);
    } catch (error) {
      console.error("Erro ao buscar fichas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, [currentUser]);

  useEffect(() => {
    const results = characters.filter(character =>
      character.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCharacters(results);
  }, [searchTerm, characters]);

  const handleDeleteClick = (character: Character) => {
    setSelectedCharacter(character);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCharacter(null);
  };

  const handleConfirmDelete = async () => {
    if (selectedCharacter) {
      const characterRef = doc(db, 'characterSheets', selectedCharacter.id);
      await deleteDoc(characterRef);
      fetchCharacters(); // Recarrega as fichas
      handleCloseModal();
    }
  };

  if (loading) {
    return <p>Carregando fichas...</p>;
  }

  return (
    <div className="mesa-container">
      <div className="mesa-header">
        <h1>Minhas Fichas</h1>
        <Link to="/create-character">
          <button>Criar Nova Ficha</button>
        </Link>
      </div>
      <input
        type="text"
        placeholder="Buscar ficha..."
        className="search-bar"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="character-list">
        {filteredCharacters.length > 0 ? (
          filteredCharacters.map(character => (
            <div
              key={character.id}
              className="character-card"
              style={{
                backgroundImage: character.imageUrl
                  ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${convertGoogleDriveLink(character.imageUrl)})`
                  : 'none'
              }}
            >
              <div className="character-card-info">
                <Link to={`/character/${character.id}`} className="character-card-link">
                  <h3>{character.name}</h3>
                  <p>{character.class} - Nível {character.level}</p>
                </Link>
              </div>
              <button onClick={() => handleDeleteClick(character)} className="delete-button-card">
                Deletar
              </button>
            </div>
          ))
        ) : (
          <p>Nenhuma ficha encontrada.</p>
        )}
      </div>

      {selectedCharacter && (
        <DeleteConfirmationModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onConfirm={handleConfirmDelete}
          itemName={selectedCharacter.name}
        />
      )}
    </div>
  );
};

export default CharacterListPage;
