import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { convertGoogleDriveLink } from '../utils/imageUtils';
import './DetailsPage.css'; // Usando o novo estilo padrão

interface SpellData {
  name: string;
  type: 'magia' | 'habilidade';
  level: number;
  className: string;
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
    <div className="details-container">
      <header className="details-hero">
        {spellData.imageUrl && (
          <img 
            src={convertGoogleDriveLink(spellData.imageUrl)} 
            alt={spellData.name} 
            className="details-hero-image" 
          />
        )}
        <div className="details-hero-content">
          <div>
            <h1>{spellData.name}</h1>
            <p style={{ margin: 0, color: '#ccc' }}>{spellData.type} de Nível {spellData.level} | Classe: {spellData.className}</p>
          </div>
          {currentUser?.role === 'gm' && (
            <Link to={`/edit-spell/${id}`} className="details-edit-button">
              Editar
            </Link>
          )}
        </div>
      </header>

      <div className="details-card">
        <h2 className="details-card-title">Descrição</h2>
        <pre className="details-pre">{spellData.description}</pre>
      </div>
    </div>
  );
};

export default SpellDetailPage;
