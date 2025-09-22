import React, { useState, useEffect } from 'react';
import './Modal.css';

interface TokenEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newName: string, newRadius: number) => void;
  token: {
    name: string;
    radius: number;
  } | null;
}

const TokenEditModal: React.FC<TokenEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  token,
}) => {
  const [name, setName] = useState('');
  const [radius, setRadius] = useState(20);

  useEffect(() => {
    if (token) {
      setName(token.name);
      setRadius(token.radius);
    }
  }, [token]);

  if (!isOpen || !token) {
    return null;
  }

  const handleSave = () => {
    onSave(name, radius);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Editar Token</h2>
        <div className="form-group">
          <label htmlFor="token-name">Nome</label>
          <input
            id="token-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do Token"
          />
        </div>
        <div className="form-group">
          <label htmlFor="token-radius">Tamanho (Raio)</label>
          <input
            id="token-radius"
            type="number"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value, 10) || 0)}
            placeholder="Tamanho do Token"
          />
        </div>
        <div className="modal-actions">
          <button onClick={onClose} className="button-secondary">
            Cancelar
          </button>
          <button onClick={handleSave} className="button-primary">
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TokenEditModal;
