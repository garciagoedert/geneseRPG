import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import './CharacterSheetPage.css';

// Definindo uma interface para a estrutura da ficha
interface Attribute {
  score: number;
  bonus: number;
}

interface CharacterSheetData {
  name: string;
  class: string;
  level: number;
  attributes: {
    strength: Attribute | number;
    dexterity: Attribute | number;
    constitution: Attribute | number;
    intelligence: Attribute | number;
    wisdom: Attribute | number;
    charisma: Attribute | number;
  };
  inventory: string[];
  abilities: string[];
  spells: string[];
  ownerId: string;
  imageUrl?: string; // Adiciona o campo opcional para a imagem
  history?: string;
  appearance?: string;
  personality?: string;
  notes?: string;
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

  const getAttributeDisplay = (attr: Attribute | number) => {
    if (typeof attr === 'number') {
      const bonus = Math.floor((attr - 10) / 2);
      return {
        score: attr,
        bonus: bonus,
        bonusDisplay: `(${bonus >= 0 ? '+' : ''}${bonus})`,
      };
    }
    return {
      score: attr.score,
      bonus: attr.bonus,
      bonusDisplay: `(${attr.bonus >= 0 ? '+' : ''}${attr.bonus})`,
    };
  };

  return (
    <div className="sheet-container">
      <aside className="sheet-sidebar">
        <div className="sheet-section">
          <h2>Atributos</h2>
          <ul className="attributes-list">
            {Object.entries(sheetData.attributes).map(([key, value]) => {
              const { score, bonusDisplay } = getAttributeDisplay(value);
              return (
                <li key={key}>
                  <strong>{attributeTranslations[key] || key}</strong>
                  <div className="attribute-values">
                    <span className="attribute-score">{score}</span>
                    <span className="attribute-bonus">{bonusDisplay}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      <main className="sheet-main">
        <div className="sheet-header">
          <div className="character-info">
            {sheetData.imageUrl && (
              <img src={sheetData.imageUrl} alt={sheetData.name} className="character-image" />
            )}
            <div>
              <h1>{sheetData.name}</h1>
              <p>Classe: {sheetData.class} | Nível: {sheetData.level}</p>
            </div>
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

        <div className="sheet-section">
          <h2>Detalhes do Personagem</h2>
          {sheetData.history && (
            <>
              <h3>História</h3>
              <p>{sheetData.history}</p>
            </>
          )}
          {sheetData.appearance && (
            <>
              <h3>Aparência</h3>
              <p>{sheetData.appearance}</p>
            </>
          )}
          {sheetData.personality && (
            <>
              <h3>Personalidade</h3>
              <p>{sheetData.personality}</p>
            </>
          )}
          {sheetData.notes && (
            <>
              <h3>Anotações</h3>
              <p>{sheetData.notes}</p>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default CharacterSheetPage;
