import React, { useState } from 'react';
import './CharacterSelectorPanel.css';

// Usando a interface completa para garantir a compatibilidade de tipos
interface CharacterData {
  id: string;
  userId?: string;
  name: string;
  class: string;
  level: number;
  currentHp: number;
  maxHp: number;
  armorClass: number;
  imageUrl?: string;
  attributes: {
    [key: string]: { score: number; bonus: number };
  };
  inventory?: string[];
  equipment?: string[];
  abilities?: string[];
  spells?: string[];
}

interface CharacterSelectorPanelProps {
  characters: CharacterData[];
  onSelect: (character: CharacterData) => void;
}

const CharacterSelectorPanel: React.FC<CharacterSelectorPanelProps> = ({ characters, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCharacters = characters.filter(char =>
    char.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="character-selector-panel">
      <h3>Personagens</h3>
      <input
        type="text"
        placeholder="Buscar personagem..."
        className="character-search-input"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <ul className="character-list">
        {filteredCharacters.map(char => (
          <li key={char.id} onClick={() => onSelect(char)}>
            {char.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CharacterSelectorPanel;
