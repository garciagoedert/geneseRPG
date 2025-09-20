import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { convertGoogleDriveLink } from '../utils/imageUtils';
import './DetailsPage.css'; // Estilo genérico para páginas de detalhes

interface MapDetails {
  name: string;
  description: string;
  imageUrl?: string;
}

const MapDetailsPage: React.FC = () => {
  const { mapId } = useParams<{ mapId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [map, setMap] = useState<MapDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedImageUrl, setEditedImageUrl] = useState('');
  const [editedDescription, setEditedDescription] = useState('');

  useEffect(() => {
    const fetchMap = async () => {
      if (!mapId) return;
      try {
        const mapRef = doc(db, 'maps', mapId);
        const mapSnap = await getDoc(mapRef);
        if (mapSnap.exists()) {
          const mapData = mapSnap.data() as MapDetails;
          setMap(mapData);
          setEditedName(mapData.name || '');
          setEditedImageUrl(mapData.imageUrl || '');
          setEditedDescription(mapData.description || '');
        } else {
          console.error("Mapa não encontrado!");
        }
      } catch (error) {
        console.error("Erro ao buscar detalhes do mapa:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMap();
  }, [mapId]);

  const handleSave = async () => {
    if (!mapId) return;
    const mapRef = doc(db, 'maps', mapId);
    try {
      await updateDoc(mapRef, {
        name: editedName,
        imageUrl: editedImageUrl,
        description: editedDescription
      });
      setMap({
        name: editedName,
        imageUrl: editedImageUrl,
        description: editedDescription
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao salvar as alterações:", error);
    }
  };

  if (loading) {
    return <p>Carregando detalhes do mapa...</p>;
  }

  if (!map) {
    return <p>Mapa não encontrado.</p>;
  }

  return (
    <div className="details-container">
      {isEditing ? (
        <input
          type="text"
          value={editedImageUrl}
          onChange={(e) => setEditedImageUrl(e.target.value)}
          placeholder="URL da Imagem"
          className="details-input"
        />
      ) : (
        map.imageUrl && <img src={convertGoogleDriveLink(map.imageUrl)} alt={map.name} className="details-image" />
      )}

      {isEditing ? (
        <input
          type="text"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          className="details-input title-input"
        />
      ) : (
        <h1>{map.name}</h1>
      )}
      
      <div className="details-section">
        <h2>História e Detalhes</h2>
        {isEditing ? (
          <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            className="details-textarea"
          />
        ) : (
          <p className="details-description">{map.description || 'Nenhuma descrição fornecida.'}</p>
        )}
      </div>

      <div className="details-actions">
        {currentUser?.role === 'gm' && !isEditing && (
          <button onClick={() => setIsEditing(true)}>Editar Detalhes</button>
        )}
        {isEditing && (
          <>
            <button onClick={handleSave}>Salvar Alterações</button>
            <button onClick={() => setIsEditing(false)} className="cancel-button">Cancelar</button>
          </>
        )}
        <button onClick={() => navigate(`/map/${mapId}`)}>Abrir Mapa Interativo</button>
      </div>
    </div>
  );
};

export default MapDetailsPage;
