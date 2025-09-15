import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import './CharacterSheetPage.css';

// Definindo uma interface para a estrutura da ficha
interface CharacterSheetData {
  name: string;
  class: string;
  level: number;
  attributes: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  inventory: string;
  abilities: string;
  spells: string;
  ownerId: string;
}

const CharacterSheetPage: React.FC = () => {
  const { sheetId } = useParams<{ sheetId: string }>();
  const { currentUser } = useAuth();
  const [sheetData, setSheetData] = useState<CharacterSheetData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSheetData = async () => {
      if (!sheetId) return;
      try {
        const docRef = doc(db, 'characterSheets', sheetId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setSheetData(docSnap.data() as CharacterSheetData);
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSheetData();
  }, [sheetId]);

  if (loading) {
    return <div>Carregando ficha...</div>;
  }

  if (!sheetData) {
    return <div>Ficha não encontrada.</div>;
  }

  return (
    <div className="sheet-container">
      <aside className="sheet-sidebar">
        <div className="sheet-section">
          <h2>Atributos</h2>
          <ul className="attributes-list">
            {Object.entries(sheetData.attributes).map(([key, value]) => (
              <li key={key}>
                <strong>{key.charAt(0).toUpperCase() + key.slice(1)}</strong>
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="sheet-main">
        <div className="sheet-header">
          <div>
            <h1>{sheetData.name}</h1>
            <p>Classe: {sheetData.class} | Nível: {sheetData.level}</p>
          </div>
          {currentUser && currentUser.uid === sheetData.ownerId && (
            <Link to={`/edit-character/${sheetId}`} className="edit-button">
              Editar Ficha
            </Link>
          )}
        </div>

        <div className="sheet-section">
          <h2>Habilidades e Talentos</h2>
          <pre className="sheet-pre">{sheetData.abilities}</pre>
        </div>

        <div className="sheet-section">
          <h2>Magias</h2>
          <pre className="sheet-pre">{sheetData.spells}</pre>
        </div>

        <div className="sheet-section">
          <h2>Inventário</h2>
          <pre className="sheet-pre">{sheetData.inventory}</pre>
        </div>
      </main>
    </div>
  );
};

export default CharacterSheetPage;
