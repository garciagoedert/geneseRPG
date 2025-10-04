import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { convertGoogleDriveLink } from '../utils/imageUtils';
import './DetailsPage.css'; // Usando o novo estilo padrão

interface CreatureData {
  name: string;
  level: number;
  description: string;
  hp: number;
  mp: number;
  atk: string;
  ca: number;
  inc: number;
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
          <div>
            <h1>{creatureData.name}</h1>
            <p style={{ margin: 0, color: '#ccc' }}>Nível {creatureData.level}</p>
          </div>
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
              <h2 className="details-card-title">Recursos</h2>
              <div className="resources-grid">
                <div className="resource-item" style={{ background: 'linear-gradient(to top, #2a0a0a, #5a1a1a)' }}>
                  <div className="resource-content">
                    <span className="resource-icon">❤️</span>
                    <span className="resource-value">{creatureData.hp}</span>
                    <span className="resource-label">HP</span>
                  </div>
                </div>
                <div className="resource-item" style={{ background: 'linear-gradient(to top, #0a2a2a, #1a5a5a)' }}>
                  <div className="resource-content">
                    <span className="resource-icon">💧</span>
                    <span className="resource-value">{creatureData.mp}</span>
                    <span className="resource-label">MP</span>
                  </div>
                </div>
                <div className="resource-item" style={{ background: 'linear-gradient(to top, #2a2a0a, #5a5a1a)' }}>
                  <div className="resource-content">
                    <span className="resource-icon">⚔️</span>
                    <span className="resource-value">{creatureData.atk}</span>
                    <span className="resource-label">ATK</span>
                  </div>
                </div>
                <div className="resource-item" style={{ background: 'linear-gradient(to top, #2a0a2a, #5a1a5a)' }}>
                  <div className="resource-content">
                    <span className="resource-icon">🛡️</span>
                    <span className="resource-value">{creatureData.ca}</span>
                    <span className="resource-label">CA</span>
                  </div>
                </div>
                <div className="resource-item" style={{ background: 'linear-gradient(to top, #0a2a0a, #1a5a1a)' }}>
                  <div className="resource-content">
                    <span className="resource-icon">✨</span>
                    <span className="resource-value">{creatureData.inc}</span>
                    <span className="resource-label">INC</span>
                  </div>
                </div>
              </div>
      </div>

      <div className="details-card">
        <h2 className="details-card-title">Bloco de detalhes</h2>
        <pre className="details-pre">{creatureData.stats}</pre>
      </div>
    </div>
  );
};

export default CreatureDetailPage;
