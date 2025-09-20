import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import './MapsListPage.css';

interface MapData {
  id: string;
  name: string;
  ownerId: string;
}

const MapsListPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [maps, setMaps] = useState<MapData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  const createNewMap = async () => {
    const mapName = prompt("Digite o nome do novo mapa:");
    if (mapName && currentUser) {
      try {
        const newMapRef = await addDoc(collection(db, "maps"), {
          name: mapName,
          ownerId: currentUser.uid,
          mapState: JSON.stringify({ tokens: [], assets: [], lines: [] }) // Estado inicial vazio
        });
        navigate(`/map/${newMapRef.id}`);
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

  if (loading) {
    return <div>Carregando mapas...</div>;
  }

  return (
    <div className="maps-list-container">
      <h2>Meus Mapas</h2>
      <button onClick={createNewMap} className="create-map-btn">Criar Novo Mapa</button>
      {maps.length > 0 ? (
        <ul className="maps-list">
          {maps.map(map => (
            <li key={map.id} className="map-list-item">
              <span>{map.name}</span>
              <div className="map-actions">
                <Link to={`/map/${map.id}`} className="map-btn">Abrir</Link>
                <button onClick={() => deleteMap(map.id)} className="map-btn delete">Excluir</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>Você ainda não criou nenhum mapa.</p>
      )}
    </div>
  );
};

export default MapsListPage;
