import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import './CharacterSheetPage.css'; // Reutilizando estilos

interface SpellData {
  name: string;
  type: 'magia' | 'habilidade';
  level: number;
  school: string;
  description: string;
  imageUrl?: string;
}

const SpellDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const [spellData, setSpellData] = useState<SpellData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpellData = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'spellsAndAbilities', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setSpellData(docSnap.data() as SpellData);
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpellData();
  }, [id]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!spellData) {
    return <div>Magia ou Habilidade não encontrada.</div>;
  }

  return (
    <div className="sheet-container">
      <main className="sheet-main">
        <div className="sheet-header">
          {spellData.imageUrl && <img src={spellData.imageUrl} alt={spellData.name} className="character-image" />}
          <div>
            <h1>{spellData.name}</h1>
            <p>Nível: {spellData.level} | Escola: {spellData.school}</p>
          </div>
          {currentUser?.role === 'gm' && (
            <Link to={`/edit-spell/${id}`} className="edit-button">
              Editar
            </Link>
          )}
        </div>
        <div className="sheet-section">
          <h2>Descrição</h2>
          <pre className="sheet-pre">{spellData.description}</pre>
        </div>
      </main>
    </div>
  );
};

export default SpellDetailPage;
