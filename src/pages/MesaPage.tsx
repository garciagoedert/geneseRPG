import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import DiceRoller from '../components/DiceRoller';
import { convertGoogleDriveLink } from '../utils/imageUtils';
import './Mesa.css';

interface CharacterSheet {
  id: string;
  name: string;
  class: string;
  imageUrl?: string;
}

interface MapData {
  id: string;
  name: string;
  imageUrl?: string;
}

interface UserData {
  email: string;
  role: 'jogador' | 'gm';
  uid: string;
}

const MesaPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [characterSheets, setCharacterSheets] = useState<CharacterSheet[]>([]);
  const [maps, setMaps] = useState<MapData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as UserData;
          setUserData(userData);

          const q = query(collection(db, "characterSheets"), where("ownerId", "==", currentUser.uid));
          const querySnapshot = await getDocs(q);
          const sheets: CharacterSheet[] = [];
          querySnapshot.forEach((doc) => {
            sheets.push({ id: doc.id, ...doc.data() } as CharacterSheet);
          });
          setCharacterSheets(sheets);

          let mapsQuery;
          if (userData.role === 'gm') {
            mapsQuery = query(collection(db, "maps"), where("ownerId", "==", currentUser.uid));
          } else {
            mapsQuery = query(collection(db, "maps"), where("visibleToPlayers", "==", true));
          }
          const mapsSnapshot = await getDocs(mapsQuery);
          const mapsList: MapData[] = [];
          mapsSnapshot.forEach((doc) => {
            mapsList.push({ id: doc.id, ...doc.data() } as MapData);
          });
          setMaps(mapsList);
        } else {
          console.error("Documento do usuário não encontrado no Firestore!");
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="mesa-container">
      {userData ? (
        <div>
          <h2>Minhas Fichas</h2>
          {characterSheets.length > 0 ? (
            <div className="character-list">
              {characterSheets.map(sheet => (
                <div
                  key={sheet.id}
                  className="character-card"
                  style={{
                    backgroundImage: sheet.imageUrl
                      ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${convertGoogleDriveLink(sheet.imageUrl)})`
                      : 'none'
                  }}
                >
                  <div className="character-card-info">
                    <Link to={`/character/${sheet.id}`} className="character-card-link">
                      <h3>{sheet.name}</h3>
                      <p>{sheet.class}</p>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Você ainda não criou nenhuma ficha.</p>
          )}
        </div>
      ) : (
        <p>Não foi possível carregar os dados do usuário.</p>
      )}

      <div className="mesa-section">
        <h2>Mapas da Campanha</h2>
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
              >
                <div className="character-card-info">
                  <Link to={`/map-details/${map.id}`} className="character-card-link">
                    <h3>{map.name}</h3>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>Nenhum mapa encontrado para esta campanha.</p>
        )}
      </div>

      <DiceRoller />
    </div>
  );
};

export default MesaPage;
