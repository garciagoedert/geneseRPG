import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { convertGoogleDriveLink } from '../utils/imageUtils';
import './DetailsPage.css'; // Usando o novo estilo padrão

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
    <div className="details-container">
      <header className="details-hero">
        {creatureData.imageUrl && (
          <img 
            src={convertGoogleDriveLink(creatureData.imageUrl)} 
            alt={creatureData.name} 
            className="details-hero-image" 
          />
        )}
        <div className="details-hero-content">
          <h1>{creatureData.name}</h1>
          {currentUser?.role === 'gm' && (
            <Link to={`/edit-creature/${id}`} className="details-edit-button">
              Editar
            </Link>
          )}
        </div>
      </header>

      <div className="details-card">
        <h2 className="details-card-title">Descrição</h2>
        <pre className="details-pre">{creatureData.description}</pre>
      </div>

      <div className="details-card">
        <h2 className="details-card-title">Estatísticas</h2>
        <pre className="details-pre">{creatureData.stats}</pre>
      </div>
    </div>
  );
};

export default CreatureDetailPage;
