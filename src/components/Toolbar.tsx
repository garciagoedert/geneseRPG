import React, { useState } from 'react';
import './Toolbar.css';

interface ToolbarProps {
  onAddCharacter: () => void;
  onAddCreature: () => void;
  onNextTurn: () => void;
  onAddItem: () => void;
  onSelectMap: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onAddCharacter,
  onAddCreature,
  onNextTurn,
  onAddItem,
  onSelectMap,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="toolbar-toggle-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M12 4h9" />
          <path d="M3 20h2" />
          <path d="M3 4h2" />
          <path d="M6 20h2" />
          <path d="M6 4h2" />
          <path d="M12 12h9" />
          <path d="M3 12h2" />
          <path d="M6 12h2" />
        </svg>
      </button>
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
    </>
  );
};

export default Toolbar;
