import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import './CharacterSheetPage.css'; // Reutilizando estilos

interface CreatureData {
  name: string;
  description: string;
  stats: string;
  imageUrl?: string;
}

const CreatureDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const [creatureData, setCreatureData] = useState<CreatureData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreatureData = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'bestiary', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setCreatureData(docSnap.data() as CreatureData);
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCreatureData();
  }, [id]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!creatureData) {
    return <div>Criatura não encontrada.</div>;
  }

  return (
    <div className="sheet-container">
      <main className="sheet-main">
        <div className="sheet-header">
          {creatureData.imageUrl && <img src={creatureData.imageUrl} alt={creatureData.name} className="character-image" />}
          <div>
            <h1>{creatureData.name}</h1>
          </div>
          {currentUser?.role === 'gm' && (
            <Link to={`/edit-creature/${id}`} className="edit-button">
              Editar
            </Link>
          )}
        </div>
        <div className="sheet-section">
          <h2>Descrição</h2>
          <pre className="sheet-pre">{creatureData.description}</pre>
        </div>
        <div className="sheet-section">
          <h2>Estatísticas</h2>
          <pre className="sheet-pre">{creatureData.stats}</pre>
        </div>
      </main>
    </div>
  );
};

export default CreatureDetailPage;
