import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './CharacterSheetPage.css'; // Reutilizando estilos

interface ItemData {
  name: string;
  type: string;
  rarity: string;
  description: string;
}

const ItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
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
    <div className="sheet-container">
      <main className="sheet-main">
        <div className="sheet-header">
          <h1>{itemData.name}</h1>
          <p>Tipo: {itemData.type} | Raridade: {itemData.rarity}</p>
        </div>
        <div className="sheet-section">
          <h2>Descrição</h2>
          <pre className="sheet-pre">{itemData.description}</pre>
        </div>
      </main>
    </div>
  );
};

export default ItemDetailPage;
