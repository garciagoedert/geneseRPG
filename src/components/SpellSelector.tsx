import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import './SpellSelector.css';

interface Spell {
  id: string;
  name: string;
  type: 'magia' | 'habilidade';
}

interface SpellSelectorProps {
  selectedIds: string[];
  onChange: (newSelectedIds: string[]) => void;
  typeToShow: 'magia' | 'habilidade';
}

const SpellSelector: React.FC<SpellSelectorProps> = ({ selectedIds, onChange, typeToShow }) => {
  const [allItems, setAllItems] = useState<Spell[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const q = query(collection(db, 'spellsAndAbilities'), where('type', '==', typeToShow));
        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Spell));
        setAllItems(items);
      } catch (error) {
        console.error(`Erro ao buscar ${typeToShow}s:`, error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [typeToShow]);

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
    return <p>Carregando...</p>;
  }

  return (
    <div className="spell-selector-container">
      <fieldset>
        <legend>{typeToShow === 'magia' ? 'Magias' : 'Habilidades'}</legend>
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
          placeholder={`Buscar ${typeToShow}...`}
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

export default SpellSelector;
