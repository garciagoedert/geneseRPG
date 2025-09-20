import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { convertGoogleDriveLink } from '../utils/imageUtils';
import GMActionModal from '../components/GMActionModal';
import './Mesa.css'; // Estilo centralizado

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const handleCardClick = (item: Item) => {
    if (currentUser?.role === 'gm') {
      setSelectedItem(item);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

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
            <div
              key={item.id}
              className="character-card"
              style={{
                backgroundImage: item.imageUrl
                  ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${convertGoogleDriveLink(item.imageUrl)})`
                  : 'none'
              }}
              onClick={() => handleCardClick(item)}
            >
              <div className="character-card-info">
                <Link to={`/item/${item.id}`} className="character-card-link">
                  <h3>{item.name}</h3>
                  <p>Tipo: {item.type} | Raridade: {item.rarity}</p>
                  <p>{item.description.substring(0, 100)}...</p>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <p>Nenhum item encontrado.</p>
        )}
      </div>

      {selectedItem && (
        <GMActionModal isOpen={isModalOpen} onClose={handleCloseModal}>
          <button onClick={() => {
            toggleVisibility(selectedItem.id, selectedItem.visibleToPlayers);
            handleCloseModal();
          }}>
            {selectedItem.visibleToPlayers ? 'Ocultar dos Jogadores' : 'Revelar aos Jogadores'}
          </button>
          <Link to={`/edit-item/${selectedItem.id}`} className="control-button">
            Editar
          </Link>
          <button onClick={() => {
            deleteItem(selectedItem.id);
            handleCloseModal();
          }} className="control-button delete">
            Deletar
          </button>
        </GMActionModal>
      )}
    </div>
  );
};

export default ItemsPage;
