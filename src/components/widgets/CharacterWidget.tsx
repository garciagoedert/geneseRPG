import React from 'react';
import './CharacterWidget.css';

// Definindo a interface aqui para o componente saber o que esperar
interface Character {
  id: string;
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

interface CharacterWidgetProps {
  characters: Character[];
  onCharacterClick: (character: Character) => void;
}

const CharacterWidget: React.FC<CharacterWidgetProps> = ({ characters, onCharacterClick }) => {
  return (
    <div className="widget character-widget">
      <div className="widget-header">
        <h2>Personagens</h2>
      </div>
      <div className="widget-content">
        <div className="character-widget-list">
          {characters.length > 0 ? (
            characters.map(char => (
              <div key={char.id} className="character-widget-card" onClick={() => onCharacterClick(char)}>
                <div className="character-widget-info">
                  <h3>{char.name}</h3>
                  <p>{char.class}</p>
                  <div className="character-widget-stats">
                    <span>HP: {char.currentHp} / {char.maxHp}</span>
                    <span>CA: {char.armorClass}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>Nenhum personagem na sessão.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterWidget;
