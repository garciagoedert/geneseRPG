import React, { useState, useEffect } from 'react';
import './Modal.css';
import './TokenEditModal.css'; // Reutilizando estilos

interface AssetEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newWidth: number, newHeight: number) => void;
  asset: {
    width: number;
    height: number;
  } | null;
}

const AssetEditModal: React.FC<AssetEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  asset,
}) => {
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(100);

  useEffect(() => {
    if (asset) {
      setWidth(asset.width);
      setHeight(asset.height);
    }
  }, [asset]);

  if (!isOpen || !asset) {
    return null;
  }

  const handleSave = () => {
    onSave(width, height);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Editar Tamanho do Asset</h2>
        <div className="form-group">
          <label htmlFor="asset-width">Largura (px)</label>
          <input
            id="asset-width"
            type="number"
            value={width}
            onChange={(e) => setWidth(parseInt(e.target.value, 10) || 0)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="asset-height">Altura (px)</label>
          <input
            id="asset-height"
            type="number"
            value={height}
            onChange={(e) => setHeight(parseInt(e.target.value, 10) || 0)}
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

export default AssetEditModal;
