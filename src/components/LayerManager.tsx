import React from 'react';
import './LayerManager.css';

interface Layer {
  id: string;
  name: string;
  isVisible: boolean;
}

interface LayerManagerProps {
  layers: Layer[];
  activeLayerId: string | null;
  isMaster: boolean;
  onLayerSelect: (id: string) => void;
  onLayerToggleVisibility: (id: string) => void;
  onAddLayer: () => void;
  onRenameLayer: (id: string, newName: string) => void;
  onDeleteLayer: (id: string) => void;
}

const LayerManager: React.FC<LayerManagerProps> = ({
  layers,
  activeLayerId,
  isMaster,
  onLayerSelect,
  onLayerToggleVisibility,
  onAddLayer,
  onRenameLayer,
  onDeleteLayer,
}) => {
  return (
    <div className="layer-manager">
      <h4>Camadas</h4>
      <ul className="layer-list">
        {layers.map((layer) => (
          <li
            key={layer.id}
            className={`layer-item ${layer.id === activeLayerId ? 'active' : ''}`}
            onClick={() => onLayerSelect(layer.id)}
          >
            <button onClick={(e) => { e.stopPropagation(); onLayerToggleVisibility(layer.id); }}>
              {layer.isVisible ? '👁️' : '🙈'}
            </button>
            <span className="layer-name">{layer.name}</span>
            {isMaster && (
              <>
                <button onClick={(e) => {
                  e.stopPropagation();
                  const newName = prompt('Novo nome da camada:', layer.name);
                  if (newName) {
                    onRenameLayer(layer.id, newName);
                  }
                }}>✏️</button>
                <button onClick={(e) => { e.stopPropagation(); onDeleteLayer(layer.id); }}>🗑️</button>
              </>
            )}
          </li>
        ))}
      </ul>
      {isMaster && (
        <button onClick={onAddLayer} className="add-layer-btn">
          + Adicionar Camada
        </button>
      )}
    </div>
  );
};

export default LayerManager;
