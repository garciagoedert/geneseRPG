import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import DiceRoller from '../components/DiceRoller';
import './Dashboard.css';

interface CharacterSheet {
  id: string;
  name: string;
  class: string;
}

interface UserData {
  email: string;
  role: 'jogador' | 'gm';
  uid: string;
}

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [characterSheets, setCharacterSheets] = useState<CharacterSheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      try {
        // Buscar dados do usuário
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserData(userDocSnap.data() as UserData);
        } else {
          console.error("Documento do usuário não encontrado no Firestore!");
        }

        // Buscar fichas de personagem
        const q = query(collection(db, "characterSheets"), where("ownerId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        const sheets: CharacterSheet[] = [];
        querySnapshot.forEach((doc) => {
          sheets.push({ id: doc.id, ...doc.data() } as CharacterSheet);
        });
        setCharacterSheets(sheets);

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
    <div className="dashboard-container">
      {userData ? (
        <div>
          <h2>Minhas Fichas</h2>
          {characterSheets.length > 0 ? (
            <ul className="character-list">
              {characterSheets.map(sheet => (
                <Link to={`/character/${sheet.id}`} key={sheet.id} style={{ textDecoration: 'none' }}>
                  <li className="character-list-item">
                    <h3>{sheet.name}</h3>
                    <span>{sheet.class}</span>
                  </li>
                </Link>
              ))}
            </ul>
          ) : (
            <p>Você ainda não criou nenhuma ficha.</p>
          )}
        </div>
      ) : (
        <p>Não foi possível carregar os dados do usuário.</p>
      )}

      <DiceRoller />
    </div>
  );
};

export default DashboardPage;
