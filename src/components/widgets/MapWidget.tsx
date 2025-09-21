import React from 'react';
import { convertGoogleDriveLink } from '../../utils/imageUtils';
import './MapWidget.css';

interface MapData {
  id: string;
  name: string;
  imageUrl?: string;
}

interface MapWidgetProps {
  map: MapData | null;
}

const MapWidget: React.FC<MapWidgetProps> = ({ map }) => {
  return (
    <div className="widget map-widget">
      <div className="widget-header">
        <h2>Mapa Ativo</h2>
      </div>
      <div className="widget-content">
        {map && map.imageUrl ? (
          <div 
            className="map-card-display"
            style={{
              backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.2)), url(${convertGoogleDriveLink(map.imageUrl)})`
            }}
          >
            <div className="map-card-info">
              <h3>{map.name}</h3>
            </div>
          </div>
        ) : (
          <div className="map-card-placeholder">
            <p>Nenhum mapa selecionado.</p>
            <p className="placeholder-instruction">Use a barra de ferramentas para selecionar um mapa.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapWidget;
