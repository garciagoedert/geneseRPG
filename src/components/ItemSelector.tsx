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
  label?: string; // Adiciona a propriedade label opcional
}

const ItemSelector: React.FC<ItemSelectorProps> = ({ selectedIds, onChange, label = 'Inventário' }) => {
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
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

  const handleSelectItem = (item: Item) => {
    setSelectedItem(item);
    setSearchTerm(item.name);
  };

  const handleAdd = () => {
    if (selectedItem && !selectedIds.includes(selectedItem.id)) {
      onChange([...selectedIds, selectedItem.id]);
      setSearchTerm('');
      setSelectedItem(null);
    }
  };

  const handleDeselect = (id: string) => {
    onChange(selectedIds.filter(selectedId => selectedId !== id));
  };

  const filteredItems = searchTerm
    ? allItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) && !selectedIds.includes(item.id)
      )
    : [];

  const selectedItemsDisplay = allItems.filter(item => selectedIds.includes(item.id));

  if (loading) {
    return <p>Carregando itens...</p>;
  }

  return (
    <div className="spell-selector-container">
      <fieldset>
        <legend>{label}</legend>
        <div className="selected-items">
          {selectedItemsDisplay.map(item => (
            <div key={item.id} className="selected-item">
              <span>{item.name}</span>
              <button type="button" onClick={() => handleDeselect(item.id)} className="remove-button">X</button>
            </div>
          ))}
        </div>
        <div className="search-add-container">
          <input
            type="text"
            placeholder="Buscar item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="button" onClick={handleAdd} className="add-button">Adicionar</button>
        </div>
        {searchTerm && (
          <div className="available-items">
            {filteredItems.map(item => (
              <div key={item.id} className="available-item" onClick={() => handleSelectItem(item)}>
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        )}
      </fieldset>
    </div>
  );
};

export default ItemSelector;
