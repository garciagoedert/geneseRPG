import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import './CharacterSheetPage.css'; // Reutilizando estilos

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
    <div className="sheet-container">
      <main className="sheet-main">
        <div className="sheet-header">
          <div>
            <h1>{entryData.title}</h1>
          </div>
          {currentUser?.role === 'gm' && (
            <Link to={`/edit-wiki-entry/${id}`} className="edit-button">
              Editar
            </Link>
          )}
        </div>
        {entryData.imageUrl && (
          <div className="sheet-section">
            <img src={entryData.imageUrl} alt={entryData.title} style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }} />
          </div>
        )}
        <div className="sheet-section">
          <h2>Conteúdo</h2>
          <pre className="sheet-pre">{entryData.content}</pre>
        </div>
      </main>
    </div>
  );
};

export default WikiEntryDetailPage;
