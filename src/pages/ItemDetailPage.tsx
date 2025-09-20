import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { convertGoogleDriveLink } from '../utils/imageUtils';
import './DetailsPage.css'; // Usando o novo estilo padrão

interface ItemData {
  name: string;
  type: string;
  rarity: string;
  description: string;
  imageUrl?: string;
}

const ItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const [itemData, setItemData] = useState<ItemData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItemData = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'items', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setItemData(docSnap.data() as ItemData);
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItemData();
  }, [id]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!itemData) {
    return <div>Item não encontrado.</div>;
  }

  return (
    <div className="details-container">
      <header className="details-hero">
        {itemData.imageUrl && (
          <img 
            src={convertGoogleDriveLink(itemData.imageUrl)} 
            alt={itemData.name} 
            className="details-hero-image" 
          />
        )}
        <div className="details-hero-content">
          <div>
            <h1>{itemData.name}</h1>
            <p style={{ margin: 0, color: '#ccc' }}>Tipo: {itemData.type} | Raridade: {itemData.rarity}</p>
          </div>
          {currentUser?.role === 'gm' && (
            <Link to={`/edit-item/${id}`} className="details-edit-button">
              Editar
            </Link>
          )}
        </div>
      </header>

      <div className="details-card">
        <h2 className="details-card-title">Descrição</h2>
        <pre className="details-pre">{itemData.description}</pre>
      </div>
    </div>
  );
};

export default ItemDetailPage;
