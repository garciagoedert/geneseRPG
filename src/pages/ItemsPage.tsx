import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './BestiaryPage.css'; // Reutilizando estilos

interface Item {
  id: string;
  name: string;
  description: string;
  type: string;
  rarity: string;
  visibleToPlayers: boolean;
  imageUrl?: string;
}

const ItemsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchItems = async () => {
    try {
      let itemsQuery = query(collection(db, 'items'));
      if (currentUser?.role !== 'gm') {
        itemsQuery = query(collection(db, 'items'), where('visibleToPlayers', '==', true));
      }
      
      const querySnapshot = await getDocs(itemsQuery);
      const itemList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Item));
      
      setItems(itemList);
      setFilteredItems(itemList);
    } catch (error) {
      console.error("Erro ao buscar itens:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [currentUser]);

  useEffect(() => {
    const results = items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(results);
  }, [searchTerm, items]);

  const toggleVisibility = async (id: string, currentVisibility: boolean) => {
    const itemRef = doc(db, 'items', id);
    await updateDoc(itemRef, { visibleToPlayers: !currentVisibility });
    fetchItems();
  };

  const deleteItem = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar este item?')) {
      const itemRef = doc(db, 'items', id);
      await deleteDoc(itemRef);
      fetchItems();
    }
  };

  if (loading) {
    return <p>Carregando itens...</p>;
  }

  return (
    <div className="mesa-container">
      <div className="mesa-header">
        <h1>Itens</h1>
        {currentUser?.role === 'gm' && (
          <Link to="/add-item">
            <button>Adicionar Item</button>
          </Link>
        )}
      </div>
      <input
        type="text"
        placeholder="Buscar item..."
        className="search-bar"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="character-list">
        {filteredItems.length > 0 ? (
          filteredItems.map(item => (
            <div key={item.id} className="character-card">
              {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="card-image" />}
              <div className="card-content">
                <h3>{item.name}</h3>
                <p>Tipo: {item.type} | Raridade: {item.rarity}</p>
                <p>{item.description.substring(0, 100)}...</p>
              </div>
              {currentUser?.role === 'gm' && (
                <div className="gm-controls">
                  <button onClick={() => toggleVisibility(item.id, item.visibleToPlayers)}>
                    {item.visibleToPlayers ? 'Ocultar' : 'Revelar'}
                  </button>
                  <Link to={`/edit-item/${item.id}`} className="control-button">Editar</Link>
                  <button onClick={() => deleteItem(item.id)} className="control-button delete">Deletar</button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p>Nenhum item encontrado.</p>
        )}
      </div>
    </div>
  );
};

export default ItemsPage;
