import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import GMActionModal from '../components/GMActionModal';
import { convertGoogleDriveLink } from '../utils/imageUtils';
import './Mesa.css'; // Usar o CSS unificado

interface MapData {
  id: string;
  name: string;
  ownerId: string;
  imageUrl?: string;
  description?: string;
}

const MapsListPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [maps, setMaps] = useState<MapData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMap, setSelectedMap] = useState<MapData | null>(null);

  useEffect(() => {
    const fetchMaps = async () => {
      if (!currentUser) return;
      try {
        const q = query(collection(db, "maps"), where("ownerId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        const mapsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MapData));
        setMaps(mapsList);
      } catch (error) {
        console.error("Erro ao buscar mapas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaps();
  }, [currentUser]);

  const handleCardClick = (map: MapData) => {
    setSelectedMap(map);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMap(null);
  };

  const createNewMap = async () => {
    const mapName = prompt("Digite o nome do novo mapa:");
    if (!mapName) return;

    const imageUrl = prompt("Digite a URL da imagem para o mapa (opcional):");
    const description = prompt("Digite uma breve descrição ou história para o mapa (opcional):");

    if (currentUser) {
      try {
        const newMapRef = await addDoc(collection(db, "maps"), {
          name: mapName,
          ownerId: currentUser.uid,
          imageUrl: imageUrl || '',
          description: description || '',
          mapState: JSON.stringify({ tokens: [], assets: [], lines: [] }) // Estado inicial vazio
        });
        const newMapData = { id: newMapRef.id, name: mapName, ownerId: currentUser.uid, imageUrl: imageUrl || '', description: description || '' };
        setMaps(prevMaps => [...prevMaps, newMapData]);
      } catch (error) {
        console.error("Erro ao criar novo mapa:", error);
      }
    }
  };

  const deleteMap = async (mapId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este mapa?")) {
      try {
        await deleteDoc(doc(db, "maps", mapId));
        setMaps(maps.filter(map => map.id !== mapId));
      } catch (error) {
        console.error("Erro ao excluir mapa:", error);
      }
    }
  };

  const editMapDetails = async (mapId: string) => {
    const mapToEdit = maps.find(m => m.id === mapId);
    if (!mapToEdit) return;

    const newName = prompt("Digite o novo nome do mapa:", mapToEdit.name);
    if (!newName) return;

    const newImageUrl = prompt("Digite a nova URL da imagem:", mapToEdit.imageUrl || '');
    const newDescription = prompt("Digite a nova descrição:", mapToEdit.description || '');

    try {
      const mapRef = doc(db, "maps", mapId);
      await updateDoc(mapRef, {
        name: newName,
        imageUrl: newImageUrl || '',
        description: newDescription || ''
      });
      setMaps(maps.map(m => m.id === mapId ? { ...m, name: newName, imageUrl: newImageUrl || '', description: newDescription || '' } : m));
      handleCloseModal();
    } catch (error) {
      console.error("Erro ao editar o mapa:", error);
    }
  };

  if (loading) {
    return <div>Carregando mapas...</div>;
  }

  return (
    <div className="maps-list-container">
      <div className="mesa-header">
        <h1>Meus Mapas</h1>
        <button onClick={createNewMap}>Criar Novo Mapa</button>
      </div>
      {maps.length > 0 ? (
        <div className="character-list">
          {maps.map(map => (
            <div
              key={map.id}
              className="character-card"
              style={{
                backgroundImage: map.imageUrl
                  ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${convertGoogleDriveLink(map.imageUrl)})`
                  : 'none'
              }}
              onClick={() => handleCardClick(map)}
            >
              <div className="character-card-info">
                <h3>{map.name}</h3>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>Você ainda não criou nenhum mapa.</p>
      )}

      {selectedMap && (
        <GMActionModal isOpen={isModalOpen} onClose={handleCloseModal}>
          <Link to={`/map-details/${selectedMap.id}`} className="control-button">
            Ver Detalhes
          </Link>
          <Link to={`/map/${selectedMap.id}`} className="control-button">
            Abrir Mapa Interativo
          </Link>
          <button onClick={() => editMapDetails(selectedMap.id)} className="control-button">
            Editar Detalhes
          </button>
          <button onClick={() => {
            deleteMap(selectedMap.id);
            handleCloseModal();
          }} className="control-button delete">
            Excluir Mapa
          </button>
        </GMActionModal>
      )}
    </div>
  );
};

export default MapsListPage;
