import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import './SpellSelector.css'; // Reutilizando estilos

interface Item {
  id: string;
  name: string;
}

interface ItemSelectorProps {
  selectedIds: string[];
  onChange: (newSelectedIds: string[]) => void;
}

const ItemSelector: React.FC<ItemSelectorProps> = ({ selectedIds, onChange }) => {
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'items'));
        const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
        setAllItems(items);
      } catch (error) {
        console.error("Erro ao buscar itens:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const handleSelect = (id: string) => {
    if (!selectedIds.includes(id)) {
      onChange([...selectedIds, id]);
    }
  };

  const handleDeselect = (id: string) => {
    onChange(selectedIds.filter(selectedId => selectedId !== id));
  };

  const filteredItems = allItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) && !selectedIds.includes(item.id)
  );

  const selectedItems = allItems.filter(item => selectedIds.includes(item.id));

  if (loading) {
    return <p>Carregando itens...</p>;
  }

  return (
    <div className="spell-selector-container">
      <fieldset>
        <legend>Inventário</legend>
        <div className="selected-items">
          {selectedItems.map(item => (
            <div key={item.id} className="selected-item">
              <span>{item.name}</span>
              <button type="button" onClick={() => handleDeselect(item.id)}>Remover</button>
            </div>
          ))}
        </div>
        <input
          type="text"
          placeholder="Buscar item..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="available-items">
          {filteredItems.map(item => (
            <div key={item.id} className="available-item">
              <span>{item.name}</span>
              <button type="button" onClick={() => handleSelect(item.id)}>Adicionar</button>
            </div>
          ))}
        </div>
      </fieldset>
    </div>
  );
};

export default ItemSelector;
