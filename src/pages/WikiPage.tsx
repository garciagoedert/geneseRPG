import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { convertGoogleDriveLink } from '../utils/imageUtils';
import GMActionModal from '../components/GMActionModal';
import './Mesa.css'; // Estilo centralizado

interface WikiEntry {
  id: string;
  title: string;
  content: string;
  visibleToPlayers: boolean;
  imageUrl?: string;
}

const WikiPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [entries, setEntries] = useState<WikiEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<WikiEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<WikiEntry | null>(null);

  const handleCardClick = (entry: WikiEntry) => {
    if (currentUser?.role === 'gm') {
      setSelectedEntry(entry);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEntry(null);
  };

  const fetchEntries = async () => {
    try {
      let entriesQuery = query(collection(db, 'wiki'));
      if (currentUser?.role !== 'gm') {
        entriesQuery = query(collection(db, 'wiki'), where('visibleToPlayers', '==', true));
      }
      
      const querySnapshot = await getDocs(entriesQuery);
      const entryList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as WikiEntry));
      
      setEntries(entryList);
      setFilteredEntries(entryList);
    } catch (error) {
      console.error("Erro ao buscar entradas da wiki:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [currentUser]);

  useEffect(() => {
    const results = entries.filter(entry =>
      entry.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEntries(results);
  }, [searchTerm, entries]);

  const toggleVisibility = async (id: string, currentVisibility: boolean) => {
    const entryRef = doc(db, 'wiki', id);
    await updateDoc(entryRef, {
      visibleToPlayers: !currentVisibility
    });
    fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar este artigo?')) {
      const entryRef = doc(db, 'wiki', id);
      await deleteDoc(entryRef);
      fetchEntries();
    }
  };

  if (loading) {
    return <p>Carregando Wiki...</p>;
  }

  return (
    <div className="mesa-container">
      <div className="mesa-header">
        <h1>Wiki</h1>
        {currentUser?.role === 'gm' && (
          <Link to="/add-wiki-entry">
            <button>Adicionar Artigo</button>
          </Link>
        )}
      </div>
      <input
        type="text"
        placeholder="Buscar artigo..."
        className="search-bar"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="character-list">
        {filteredEntries.length > 0 ? (
          filteredEntries.map(entry => (
            <div
              key={entry.id}
              className="character-card"
              style={{
                backgroundImage: entry.imageUrl
                  ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${convertGoogleDriveLink(entry.imageUrl)})`
                  : 'none'
              }}
              onClick={() => handleCardClick(entry)}
            >
              <div className="character-card-info">
                <Link to={`/wiki/${entry.id}`} className="character-card-link">
                  <h3>{entry.title}</h3>
                  <p>{entry.content.substring(0, 100)}...</p>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <p>Nenhum artigo encontrado.</p>
        )}
      </div>

      {selectedEntry && (
        <GMActionModal isOpen={isModalOpen} onClose={handleCloseModal}>
          <button onClick={() => {
            toggleVisibility(selectedEntry.id, selectedEntry.visibleToPlayers);
            handleCloseModal();
          }}>
            {selectedEntry.visibleToPlayers ? 'Ocultar dos Jogadores' : 'Revelar aos Jogadores'}
          </button>
          <Link to={`/edit-wiki-entry/${selectedEntry.id}`} className="control-button">
            Editar
          </Link>
          <button onClick={() => {
            deleteEntry(selectedEntry.id);
            handleCloseModal();
          }} className="control-button delete">
            Deletar
          </button>
        </GMActionModal>
      )}
    </div>
  );
};

export default WikiPage;
