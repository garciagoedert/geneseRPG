import React from 'react';
import './Toolbar.css';

interface ToolbarProps {
  isOpen: boolean;
  onAddCharacter: () => void;
  onAddCreature: () => void;
  onNextTurn: () => void;
  onAddItem: () => void;
  onSelectMap: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  isOpen,
  onAddCharacter,
  onAddCreature,
  onNextTurn,
  onAddItem,
  onSelectMap,
}) => {
  return (
    <div className={`toolbar-actions ${isOpen ? 'open' : ''}`}>
        <button onClick={onSelectMap} className="toolbar-button">
          Selecionar Mapa
        </button>
        <button onClick={onAddCharacter} className="toolbar-button">
          Add Personagem
        </button>
        <button onClick={onAddCreature} className="toolbar-button">
          Add Criatura
        </button>
        <button onClick={onNextTurn} className="toolbar-button">
          Próximo Turno
        </button>
        <button onClick={onAddItem} className="toolbar-button">
          Adicionar Item
        </button>
    </div>
  );
};

export default Toolbar;
