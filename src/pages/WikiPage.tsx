import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './WikiPage.css';

interface WikiEntry {
  id: string;
  title: string;
  content: string;
  visibleToPlayers: boolean;
}

const WikiPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [entries, setEntries] = useState<WikiEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<WikiEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
            <div key={entry.id} className="character-card">
              <div className="card-content">
                <h3>{entry.title}</h3>
                <p>{entry.content.substring(0, 100)}...</p>
              </div>
              {currentUser?.role === 'gm' && (
                <div className="gm-controls">
                  <button onClick={() => toggleVisibility(entry.id, entry.visibleToPlayers)}>
                    {entry.visibleToPlayers ? 'Ocultar' : 'Revelar'}
                  </button>
                  <Link to={`/edit-wiki-entry/${entry.id}`} className="control-button">Editar</Link>
                  <button onClick={() => deleteEntry(entry.id)} className="control-button delete">Deletar</button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p>Nenhum artigo encontrado.</p>
        )}
      </div>
    </div>
  );
};

export default WikiPage;
