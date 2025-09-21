import React from 'react';
import './CharacterWidget.css';

// Definindo a interface aqui para o componente saber o que esperar
interface Character {
  id: string;
  name: string;
  class: string;
  currentHp: number;
  maxHp: number;
  armorClass: number;
  imageUrl?: string;
  attributes: {
    strength: { score: number; bonus: number };
    dexterity: { score: number; bonus: number };
    constitution: { score: number; bonus: number };
    intelligence: { score: number; bonus: number };
    wisdom: { score: number; bonus: number };
    charisma: { score: number; bonus: number };
  };
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
