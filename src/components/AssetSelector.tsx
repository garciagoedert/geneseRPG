import React from 'react';
import './AssetSelector.css';

interface Asset {
  name: string;
  src: string;
  width: number;
  height: number;
}

// Lista de assets de exemplo. No futuro, isso pode vir de um banco de dados.
const assets: Asset[] = [
  { name: 'Árvore', src: 'https://placehold.co/100x120/228B22/white?text=Tree', width: 100, height: 120 },
  { name: 'Árvore (Pequena)', src: 'https://placehold.co/80x100/228B22/white?text=Tree', width: 80, height: 100 },
  { name: 'Baú', src: 'https://placehold.co/80x60/8B4513/white?text=Chest', width: 80, height: 60 },
  { name: 'Rocha', src: 'https://placehold.co/90x90/808080/white?text=Rock', width: 90, height: 90 },
  { name: 'Mesa', src: 'https://placehold.co/120x70/A0522D/white?text=Table', width: 120, height: 70 },
  { name: 'Pilar', src: 'https://placehold.co/60x150/D2B48C/white?text=Pillar', width: 60, height: 150 },
  { name: 'Porta', src: 'https://placehold.co/80x110/663300/white?text=Door', width: 80, height: 110 },
  { name: 'Armadilha', src: 'https://placehold.co/60x60/FF0000/white?text=Trap', width: 60, height: 60 },
];

interface AssetSelectorProps {
  onSelectAsset: (asset: Asset) => void;
  onClose: () => void;
}

const AssetSelector: React.FC<AssetSelectorProps> = ({ onSelectAsset, onClose }) => {
  return (
    <div className="asset-selector-modal">
      <div className="asset-selector-content">
        <div className="asset-selector-header">
          <h3>Adicionar Asset</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="asset-grid">
          {assets.map(asset => (
            <div key={asset.name} className="asset-item" onClick={() => onSelectAsset(asset)}>
              <img src={asset.src} alt={asset.name} />
              <span>{asset.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssetSelector;
