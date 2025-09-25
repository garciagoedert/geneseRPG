import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { convertGoogleDriveLink } from '../utils/imageUtils';
import './DetailsPage.css';
import './CharacterSheetPage.css';

// Definindo uma interface para a estrutura da ficha
interface Skill {
  [key: string]: number;
}

interface Attribute {
  score: number;
  bonus: number;
  skills?: Skill;
}

interface CharacterSheetData {
  name: string;
  class: string;
  level: number;
  hp: number;
  mp: number;
  gold: number;
  attributes: {
    strength: Attribute | number;
    dexterity: Attribute | number;
    constitution: Attribute | number;
    intelligence: Attribute | number;
    wisdom: Attribute | number;
    charisma: Attribute | number;
  };
  inventory: string[];
  equipment: string[]; // Novo campo para equipamentos
  abilities: string[];
  spells: string[];
  ownerId: string;
  imageUrl?: string; // Adiciona o campo opcional para a imagem
  imagePositionY?: number; // Posição Y da imagem do herói
  history?: string;
  appearance?: string;
  personality?: string;
  notes?: string;
}

interface DetailItem {
  id: string;
  name: string;
  imageUrl?: string;
}

const CharacterSheetPage: React.FC = () => {
  const { sheetId } = useParams<{ sheetId: string }>();
  const { currentUser } = useAuth();
  const [sheetData, setSheetData] = useState<CharacterSheetData | null>(null);
  const [abilitiesDetails, setAbilitiesDetails] = useState<DetailItem[]>([]);
  const [spellsDetails, setSpellsDetails] = useState<DetailItem[]>([]);
  const [inventoryDetails, setInventoryDetails] = useState<DetailItem[]>([]);
  const [equipmentDetails, setEquipmentDetails] = useState<DetailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('main');
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [imagePosition, setImagePosition] = useState(50);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const fetchSheetData = async () => {
      if (!sheetId) return;
      try {
        const docRef = doc(db, 'characterSheets', sheetId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as CharacterSheetData;
          setSheetData(data);
          setImagePosition(data.imagePositionY || 50);

          const fetchDetails = async (collectionName: string, ids: string[]) => {
            if (!ids || ids.length === 0) return [];
            const detailsQuery = query(collection(db, collectionName), where('__name__', 'in', ids));
            const snapshot = await getDocs(detailsQuery);
            return snapshot.docs.map(d => ({ id: d.id, name: d.data().name, imageUrl: d.data().imageUrl }));
          };

          setAbilitiesDetails(await fetchDetails('spellsAndAbilities', data.abilities));
          setSpellsDetails(await fetchDetails('spellsAndAbilities', data.spells));
          setInventoryDetails(await fetchDetails('items', data.inventory));
          setEquipmentDetails(await fetchDetails('items', data.equipment));
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

  const handleMouseDown = () => {
    if (!isRepositioning || !imageRef.current) return;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!imageRef.current) return;
      const rect = imageRef.current.parentElement!.getBoundingClientRect();
      const newY = Math.max(0, Math.min(rect.height, moveEvent.clientY - rect.top));
      const newPosition = (newY / rect.height) * 100;
      setImagePosition(newPosition);
    };
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleSavePosition = async () => {
    if (!sheetId) return;
    const docRef = doc(db, 'characterSheets', sheetId);
    await updateDoc(docRef, { imagePositionY: imagePosition });
    setIsRepositioning(false);
    setSheetData(prev => prev ? { ...prev, imagePositionY: imagePosition } : null);
  };

  const handleCancelReposition = () => {
    setImagePosition(sheetData?.imagePositionY || 50);
    setIsRepositioning(false);
  };

  if (loading) return <div>Carregando ficha...</div>;
  if (!sheetData) return <div>Ficha não encontrada.</div>;

  const attributeTranslations: { [key: string]: string } = {
    strength: 'Força', dexterity: 'Destreza', constitution: 'Constituição',
    intelligence: 'Inteligência', wisdom: 'Sabedoria', charisma: 'Carisma',
  };

  const skillTranslations: { [key: string]: string } = {
    atletismo: 'Atletismo', briga: 'Briga', forcaDeVontade: 'Força de Vontade',
    acrobacia: 'Acrobacia', furtividade: 'Furtividade', performance: 'Performance',
    sobrevivencia: 'Sobrevivência', saude: 'Saúde', resistencia: 'Resistência',
    arcanismo: 'Arcanismo', historia: 'História', investigacao: 'Investigação', natureza: 'Natureza', religiao: 'Religião',
    intuicao: 'Intuição', medicina: 'Medicina', percepcao: 'Percepção', lideranca: 'Liderança',
    atuacao: 'Atuação', enganacao: 'Enganação', intimidacao: 'Intimidação', persuasao: 'Persuasão',
  };

  const getAttributeDisplay = (attr: Attribute | number) => {
    if (typeof attr === 'number') {
      const bonus = Math.floor((attr - 10) / 2);
      return { score: attr, bonus, bonusDisplay: `(${bonus >= 0 ? '+' : ''}${bonus})` };
    }
    return { score: attr.score, bonus: attr.bonus, bonusDisplay: `(${attr.bonus >= 0 ? '+' : ''}${attr.bonus})` };
  };

  const renderSafe = (content: any) => {
    if (typeof content === 'object' && content !== null) return JSON.stringify(content);
    return content;
  };

  const isOwnerOrGM = currentUser?.uid === sheetData.ownerId || currentUser?.role === 'gm';

  return (
    <div className="details-container">
      <header className="details-hero">
        {sheetData.imageUrl && (
          <img
            ref={imageRef}
            src={convertGoogleDriveLink(sheetData.imageUrl)}
            alt={sheetData.name}
            className={`details-hero-image ${isRepositioning ? 'repositioning' : ''}`}
            style={{ objectPosition: `50% ${imagePosition}%` }}
            onMouseDown={handleMouseDown}
            draggable="false"
          />
        )}
        <div className="details-hero-content">
          <div>
            <h1>{renderSafe(sheetData.name)}</h1>
            <p style={{ margin: 0, color: '#ccc' }}>{renderSafe(sheetData.class)} - Nível {renderSafe(sheetData.level)}</p>
          </div>
          <div className="hero-actions">
            {isOwnerOrGM && !isRepositioning && (
              <button onClick={() => setIsRepositioning(true)} className="reposition-button">
                Reposicionar
              </button>
            )}
            {isOwnerOrGM && (
              <Link to={`/edit-character/${sheetId}`} className="details-edit-button">
                Editar Ficha
              </Link>
            )}
          </div>
        </div>
        {isRepositioning && (
          <div className="reposition-controls">
            <button onClick={handleSavePosition} className="save-button">Salvar</button>
            <button onClick={handleCancelReposition} className="cancel-button">Cancelar</button>
          </div>
        )}
      </header>

      <div className="sheet-tabs">
        <button className={`tab-button ${activeTab === 'main' ? 'active' : ''}`} onClick={() => setActiveTab('main')}>Principal</button>
        <button className={`tab-button ${activeTab === 'attributes' ? 'active' : ''}`} onClick={() => setActiveTab('attributes')}>Atributos</button>
        <button className={`tab-button ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>Detalhes</button>
      </div>

      <div className="sheet-content-grid">
        {activeTab === 'main' && (
          <>
            <div className="details-card">
              <h2 className="details-card-title">Recursos</h2>
              <div className="resources-grid">
                <div className="resource-item" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(https://i.imgur.com/rnwnDxF.png)` }}>
                  <div className="resource-content">
                    <span className="resource-icon">❤️</span>
                    <span className="resource-value">{renderSafe(sheetData.hp)}</span>
                    <span className="resource-label">HP</span>
                  </div>
                </div>
                <div className="resource-item" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(https://i.imgur.com/wAJ7AOg.png)` }}>
                  <div className="resource-content">
                    <span className="resource-icon">💧</span>
                    <span className="resource-value">{renderSafe(sheetData.mp)}</span>
                    <span className="resource-label">MP</span>
                  </div>
                </div>
                <div className="resource-item" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(https://i.imgur.com/KwnQdw7.png)` }}>
                  <div className="resource-content">
                    <span className="resource-icon">💰</span>
                    <span className="resource-value">{renderSafe(sheetData.gold)}</span>
                    <span className="resource-label">Ouro</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="details-card">
              <h2 className="details-card-title">Habilidades</h2>
              <div className="character-list">
                {abilitiesDetails.map(ability => (
                  <div key={ability.id} className="character-card" style={{ backgroundImage: ability.imageUrl ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${convertGoogleDriveLink(ability.imageUrl)})` : 'none' }}>
                    <div className="character-card-info">
                      <Link to={`/spell/${ability.id}`} className="character-card-link"><h3>{ability.name}</h3></Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="details-card">
              <h2 className="details-card-title">Magias</h2>
              <div className="character-list">
                {spellsDetails.map(spell => (
                  <div key={spell.id} className="character-card" style={{ backgroundImage: spell.imageUrl ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${convertGoogleDriveLink(spell.imageUrl)})` : 'none' }}>
                    <div className="character-card-info">
                      <Link to={`/spell/${spell.id}`} className="character-card-link"><h3>{spell.name}</h3></Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="details-card">
              <h2 className="details-card-title">Inventário</h2>
              <div className="character-list">
                {inventoryDetails.map(item => (
                  <div key={item.id} className="character-card" style={{ backgroundImage: item.imageUrl ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${convertGoogleDriveLink(item.imageUrl)})` : 'none' }}>
                    <div className="character-card-info">
                      <Link to={`/item/${item.id}`} className="character-card-link"><h3>{item.name}</h3></Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="details-card">
              <h2 className="details-card-title">Equipamentos</h2>
              <div className="character-list">
                {equipmentDetails.map(item => (
                  <div key={item.id} className="character-card" style={{ backgroundImage: item.imageUrl ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${convertGoogleDriveLink(item.imageUrl)})` : 'none' }}>
                    <div className="character-card-info">
                      <Link to={`/item/${item.id}`} className="character-card-link"><h3>{item.name}</h3></Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'attributes' && (
          <div className="details-card">
            <h2 className="details-card-title">Atributos</h2>
            <div className="attributes-table">
              {Object.entries(sheetData.attributes).map(([key, attrValue]) => {
                const { score, bonusDisplay } = getAttributeDisplay(attrValue);
                const skills = (attrValue as Attribute).skills;
                return (
                  <div key={key} className="attribute-group">
                    <div className="attribute-row main-attribute">
                      <span className="attribute-name">
                        {attributeTranslations[key] || key}
                      </span>
                      <span className="attribute-score">{score}</span>
                      <span className="attribute-bonus">{bonusDisplay}</span>
                    </div>
                    {skills && Object.entries(skills).map(([skillName, skillValue]) => (
                      <div key={skillName} className="attribute-row skill-row">
                        <span className="skill-name">{skillTranslations[skillName] || skillName}</span>
                        <span className="skill-value">{skillValue >= 0 ? '+' : ''}{skillValue}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="details-card sheet-details-full-width">
            <h2 className="details-card-title">Detalhes do Personagem</h2>
            {sheetData.history && (<><h3>História</h3><p>{renderSafe(sheetData.history)}</p></>)}
            {sheetData.appearance && (<><h3>Aparência</h3><p>{renderSafe(sheetData.appearance)}</p></>)}
            {sheetData.personality && (<><h3>Personalidade</h3><p>{renderSafe(sheetData.personality)}</p></>)}
            {sheetData.notes && (<><h3>Anotações</h3><p>{renderSafe(sheetData.notes)}</p></>)}
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterSheetPage;
