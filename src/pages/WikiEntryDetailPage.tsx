import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { convertGoogleDriveLink } from '../utils/imageUtils';
import './DetailsPage.css'; // Usando o novo estilo padrão

interface WikiEntryData {
  title: string;
  content: string;
  imageUrl?: string;
}

const WikiEntryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const [entryData, setEntryData] = useState<WikiEntryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntryData = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'wiki', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setEntryData(docSnap.data() as WikiEntryData);
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntryData();
  }, [id]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!entryData) {
    return <div>Artigo não encontrado.</div>;
  }

  return (
    <div className="details-container">
      <header className="details-hero">
        {entryData.imageUrl && (
          <img 
            src={convertGoogleDriveLink(entryData.imageUrl)} 
            alt={entryData.title} 
            className="details-hero-image" 
          />
        )}
        <div className="details-hero-content">
          <h1>{entryData.title}</h1>
          {currentUser?.role === 'gm' && (
            <Link to={`/edit-wiki-entry/${id}`} className="details-edit-button">
              Editar
            </Link>
          )}
        </div>
      </header>

      <div className="details-card">
        <h2 className="details-card-title">Conteúdo</h2>
        <pre className="details-pre">{entryData.content}</pre>
      </div>
    </div>
  );
};

export default WikiEntryDetailPage;
