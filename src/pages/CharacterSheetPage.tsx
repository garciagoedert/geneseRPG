import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
  inventory: string[];
  abilities: string[];
  spells: string[];
  ownerId: string;
  imageUrl?: string; // Adiciona o campo opcional para a imagem
}

interface DetailItem {
  id: string;
  name: string;
}

const CharacterSheetPage: React.FC = () => {
  const { sheetId } = useParams<{ sheetId: string }>();
  const { currentUser } = useAuth();
  const [sheetData, setSheetData] = useState<CharacterSheetData | null>(null);
  const [abilitiesDetails, setAbilitiesDetails] = useState<DetailItem[]>([]);
  const [spellsDetails, setSpellsDetails] = useState<DetailItem[]>([]);
  const [inventoryDetails, setInventoryDetails] = useState<DetailItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSheetData = async () => {
      if (!sheetId) return;
      try {
        const docRef = doc(db, 'characterSheets', sheetId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as CharacterSheetData;
          setSheetData(data);

          // Buscar detalhes das habilidades
          if (data.abilities && data.abilities.length > 0) {
            const abilitiesQuery = query(collection(db, 'spellsAndAbilities'), where('__name__', 'in', data.abilities));
            const abilitiesSnapshot = await getDocs(abilitiesQuery);
            setAbilitiesDetails(abilitiesSnapshot.docs.map(d => ({ id: d.id, name: d.data().name })));
          }

          // Buscar detalhes das magias
          if (data.spells && data.spells.length > 0) {
            const spellsQuery = query(collection(db, 'spellsAndAbilities'), where('__name__', 'in', data.spells));
            const spellsSnapshot = await getDocs(spellsQuery);
            setSpellsDetails(spellsSnapshot.docs.map(d => ({ id: d.id, name: d.data().name })));
          }

          // Buscar detalhes do inventário
          if (data.inventory && data.inventory.length > 0) {
            const itemsQuery = query(collection(db, 'items'), where('__name__', 'in', data.inventory));
            const itemsSnapshot = await getDocs(itemsQuery);
            setInventoryDetails(itemsSnapshot.docs.map(d => ({ id: d.id, name: d.data().name })));
          }
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

  const attributeTranslations: { [key: string]: string } = {
    strength: 'Força',
    dexterity: 'Destreza',
    constitution: 'Constituição',
    intelligence: 'Inteligência',
    wisdom: 'Sabedoria',
    charisma: 'Carisma',
  };

  return (
    <div className="sheet-container">
      <aside className="sheet-sidebar">
        <div className="sheet-section">
          <h2>Atributos</h2>
          <ul className="attributes-list">
            {Object.entries(sheetData.attributes).map(([key, value]) => (
              <li key={key}>
                <strong>{attributeTranslations[key] || key}</strong>
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="sheet-main">
        <div className="sheet-header">
          {sheetData.imageUrl && (
            <img src={sheetData.imageUrl} alt={sheetData.name} className="character-image" />
          )}
          <div>
            <h1>{sheetData.name}</h1>
            <p>Classe: {sheetData.class} | Nível: {sheetData.level}</p>
          </div>
          {(currentUser?.uid === sheetData.ownerId || currentUser?.role === 'gm') && (
            <Link to={`/edit-character/${sheetId}`} className="edit-button">
              Editar Ficha
            </Link>
          )}
        </div>

        <div className="sheet-section">
          <h2>Habilidades e Talentos</h2>
          <ul className="link-list">
            {abilitiesDetails.map(ability => (
              <li key={ability.id}>
                <Link to={`/spell/${ability.id}`}>{ability.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="sheet-section">
          <h2>Magias</h2>
          <ul className="link-list">
            {spellsDetails.map(spell => (
              <li key={spell.id}>
                <Link to={`/spell/${spell.id}`}>{spell.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="sheet-section">
          <h2>Inventário</h2>
          <ul className="link-list">
            {inventoryDetails.map(item => (
              <li key={item.id}>
                <Link to={`/item/${item.id}`}>{item.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default CharacterSheetPage;
