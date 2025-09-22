import React, { useState, useEffect } from 'react';
import './Modal.css';
import './TokenEditModal.css'; // Reutilizando estilos

interface Asset {
  id?: string;
  name: string;
  src: string;
  width: number;
  height: number;
}

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (asset: Asset) => void;
  asset: Asset | null;
}

const AssetFormModal: React.FC<AssetFormModalProps> = ({ isOpen, onClose, onSave, asset }) => {
  const [name, setName] = useState('');
  const [src, setSrc] = useState('');
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(100);

  useEffect(() => {
    if (asset) {
      setName(asset.name);
      setSrc(asset.src);
      setWidth(asset.width);
      setHeight(asset.height);
    } else {
      setName('');
      setSrc('');
      setWidth(100);
      setHeight(100);
    }
  }, [asset]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    onSave({ id: asset?.id, name, src, width, height });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{asset ? 'Editar Asset' : 'Adicionar Novo Asset'}</h2>
        <div className="form-group">
          <label htmlFor="asset-name">Nome</label>
          <input
            id="asset-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do Asset"
          />
        </div>
        <div className="form-group">
          <label htmlFor="asset-src">URL da Imagem</label>
          <input
            id="asset-src"
            type="text"
            value={src}
            onChange={(e) => setSrc(e.target.value)}
            placeholder="https://exemplo.com/imagem.png"
          />
        </div>
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

export default AssetFormModal;
