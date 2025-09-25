import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { convertGoogleDriveLink } from '../utils/imageUtils';
import './CharacterDetails.css';

// Interface expandida para incluir todos os dados
interface CharacterData {
  id: string;
  name: string;
  class: string;
  level: number;
  currentHp: number;
  maxHp: number;
  armorClass: number;
  imageUrl?: string;
  attributes: {
    [key: string]: { score: number; bonus: number };
  };
  inventory?: string[];
  equipment?: string[];
  abilities?: string[];
  spells?: string[];
}

interface DetailItem {
  id: string;
  name: string;
}

const CharacterDetails = ({ character }: { character: CharacterData }) => {
  const [activeTab, setActiveTab] = useState('attributes');
  const [inventoryDetails, setInventoryDetails] = useState<DetailItem[]>([]);
  const [equipmentDetails, setEquipmentDetails] = useState<DetailItem[]>([]);
  const [abilitiesDetails, setAbilitiesDetails] = useState<DetailItem[]>([]);
  const [spellsDetails, setSpellsDetails] = useState<DetailItem[]>([]);

  useEffect(() => {
    const fetchDetails = async (collectionName: string, ids?: string[]) => {
      if (!ids || ids.length === 0) return [];
      try {
        const detailsQuery = query(collection(db, collectionName), where('__name__', 'in', ids));
        const snapshot = await getDocs(detailsQuery);
        return snapshot.docs.map(d => ({ id: d.id, name: d.data().name }));
      } catch (error) {
        console.error(`Error fetching details from ${collectionName}:`, error);
        return [];
      }
    };

    if (character) {
      fetchDetails('items', character.inventory).then(setInventoryDetails);
      fetchDetails('items', character.equipment).then(setEquipmentDetails);
      fetchDetails('spellsAndAbilities', character.abilities).then(setAbilitiesDetails);
      fetchDetails('spellsAndAbilities', character.spells).then(setSpellsDetails);
    }
  }, [character]);

  const renderDetailList = (title: string, items: DetailItem[]) => (
    <div className="details-section">
      <h4>{title}</h4>
      {items.length > 0 ? (
        <ul className="details-list">
          {items.map(item => <li key={item.id}>{item.name}</li>)}
        </ul>
      ) : (
        <p className="details-empty-text">Nenhum item.</p>
      )}
    </div>
  );

  return (
    <div className="character-details-container">
      {character.imageUrl && (
        <div className="character-details-header">
          <img 
            src={convertGoogleDriveLink(character.imageUrl)} 
            alt={character.name} 
            className="character-details-avatar"
          />
          <div className="character-details-overlay">
            <div className="character-details-nameplate">
              <h1>{character.name}</h1>
              <p>{character.class} - Nível {character.level}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="details-tabs">
        <button onClick={() => setActiveTab('attributes')} className={activeTab === 'attributes' ? 'active' : ''}>Atributos</button>
        <button onClick={() => setActiveTab('combat')} className={activeTab === 'combat' ? 'active' : ''}>Combate</button>
        <button onClick={() => setActiveTab('inventory')} className={activeTab === 'inventory' ? 'active' : ''}>Inventário</button>
      </div>

      <div className="details-content">
        {activeTab === 'attributes' && character.attributes && (
          <div className="character-details-grid">
            {Object.entries(character.attributes).map(([attr, value]) => (
              <div key={attr} className="attribute-item">
                <span className="attribute-name">{attr.substring(0, 3).toUpperCase()}</span>
                <span className="attribute-value">{value.score}</span>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'combat' && (
          <>
            {renderDetailList("Habilidades", abilitiesDetails)}
            {renderDetailList("Magias", spellsDetails)}
          </>
        )}
        {activeTab === 'inventory' && (
          <>
            {renderDetailList("Equipamentos", equipmentDetails)}
            {renderDetailList("Inventário", inventoryDetails)}
          </>
        )}
      </div>
    </div>
  );
};

export default CharacterDetails;
