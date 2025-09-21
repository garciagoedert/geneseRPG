import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { doc, onSnapshot, collection, getDocs, updateDoc, arrayUnion, setDoc, getDoc } from 'firebase/firestore';
import { convertGoogleDriveLink } from '../utils/imageUtils';
import './MesaPage.css';

import CharacterWidget from '../components/widgets/CharacterWidget';
import MapWidget from '../components/widgets/MapWidget';
import CombatTrackerWidget from '../components/widgets/CombatTrackerWidget';
import InventoryWidget from '../components/widgets/InventoryWidget';
import Toolbar from '../components/Toolbar';
import MesaModal from '../components/MesaModal';

interface CharacterData {
  id: string;
  name: string;
  class: string;
  currentHp: number;
  maxHp: number;
  armorClass: number;
  imageUrl?: string;
  attributes: {
    strength: { score: number; bonus: number };
    dexterity: { score: number; bonus: number };
    constitution: { score: number; bonus: number };
    intelligence: { score: number; bonus: number };
    wisdom: { score: number; bonus: number };
    charisma: { score: number; bonus: number };
  };
}

interface MapData {
  id: string;
  name: string;
  imageUrl?: string;
  description?: string;
}

interface CreatureData {
  id: string;
  name: string;
  imageUrl?: string;
  description?: string;
  stats?: any;
}

interface ItemData {
  id: string;
  name: string;
}

const MesaPage: React.FC = () => {
  const { currentUser } = useAuth();
  
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [allMaps, setAllMaps] = useState<MapData[]>([]);
  const [bestiary, setBestiary] = useState<CreatureData[]>([]);
  const [allItems, setAllItems] = useState<ItemData[]>([]);
  const [activeMap, setActiveMap] = useState<MapData | null>(null);
  const [combatants, setCombatants] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [turn, setTurn] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const mesaStateRef = doc(db, 'mesaState', 'active');
    const unsubscribeSession = onSnapshot(mesaStateRef, async (docSnap) => {
      if (docSnap.exists()) {
        const sessionData = docSnap.data();
        setCombatants(sessionData.combatants || []);
        setInventory(sessionData.partyInventory || []);
        setTurn(sessionData.turn || 0);

        if (sessionData.activeMapId) {
          const mapDocRef = doc(db, 'maps', sessionData.activeMapId);
          const mapDocSnap = await getDoc(mapDocRef);
          if (mapDocSnap.exists()) {
            setActiveMap({ id: mapDocSnap.id, ...mapDocSnap.data() } as MapData);
          }
        } else {
          setActiveMap(null);
        }
      } else {
        setDoc(mesaStateRef, { combatants: [], partyInventory: [], turn: 0, activeMapId: null });
      }
      setLoading(false);
    }, (error) => {
      console.error("Erro ao ouvir estado da mesa:", error);
      setLoading(false);
    });

    const fetchStaticData = async () => {
      try {
        const charactersSnapshot = await getDocs(collection(db, "characterSheets"));
        setCharacters(charactersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CharacterData)));

        const mapsSnapshot = await getDocs(collection(db, "maps"));
        setAllMaps(mapsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MapData)));

        const bestiarySnapshot = await getDocs(collection(db, "bestiary"));
        const bestiaryList = bestiarySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CreatureData));
        setBestiary(bestiaryList);

        const itemsSnapshot = await getDocs(collection(db, "items"));
        setAllItems(itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ItemData)));
      } catch (error) {
        console.error("Erro ao buscar dados estáticos:", error);
      }
    };

    fetchStaticData();

    return () => unsubscribeSession();
  }, [currentUser]);

  const mesaStateRef = doc(db, 'mesaState', 'active');

  const handleAddCharacterToCombat = async (character: CharacterData) => {
    const newCombatant = { ...character, id: character.id, initiative: 0, isActive: combatants.length === 0, type: 'player' };
    await updateDoc(mesaStateRef, { combatants: arrayUnion(newCombatant) });
    setIsModalOpen(false);
  };

  const handleAddCreatureToCombat = async (creature: CreatureData) => {
    const newCombatant = { 
      ...creature, 
      id: `${creature.id}_${Date.now()}`, 
      initiative: 0, 
      isActive: combatants.length === 0, 
      type: 'creature' 
    };
    await updateDoc(mesaStateRef, { combatants: arrayUnion(newCombatant) });
    setIsModalOpen(false);
  };

  const handleUpdateCombatant = async (id: string, updates: any) => {
    const updatedCombatants = combatants.map(c => c.id === id ? { ...c, ...updates } : c);
    await updateDoc(mesaStateRef, { combatants: updatedCombatants });
    setIsModalOpen(false);
  };

  const handleRemoveCombatant = async (id: string) => {
    const updatedCombatants = combatants.filter(c => c.id !== id);
    await updateDoc(mesaStateRef, { combatants: updatedCombatants });
    setIsModalOpen(false);
  };

  const handleNextTurn = async () => {
    if (combatants.length === 0) return;
    const nextTurnIndex = (turn + 1) % combatants.length;
    const updatedCombatants = combatants.map((c, index) => ({ ...c, isActive: index === nextTurnIndex }));
    await updateDoc(mesaStateRef, { combatants: updatedCombatants, turn: nextTurnIndex });
  };

  const handleAddItemToInventory = async (item: ItemData) => {
    const itemWithQuantity = { ...item, quantity: 1, id: `${item.id}_${Date.now()}` };
    await updateDoc(mesaStateRef, { partyInventory: arrayUnion(itemWithQuantity) });
    setIsModalOpen(false);
  };

  const handleRemoveItemFromInventory = async (itemToRemove: { id: string, name: string }) => {
    const removeItem = async () => {
      const updatedInventory = inventory.filter(item => item.id !== itemToRemove.id);
      await updateDoc(mesaStateRef, { partyInventory: updatedInventory });
      setIsModalOpen(false);
    };

    openModal(
      `Remover ${itemToRemove.name}`,
      <ConfirmationPrompt
        message={`Tem certeza que deseja remover "${itemToRemove.name}" do inventário do grupo?`}
        onConfirm={removeItem}
        onCancel={() => setIsModalOpen(false)}
      />
    );
  };

  const handleSelectMap = async (mapId: string) => {
    await updateDoc(mesaStateRef, { activeMapId: mapId });
    setIsModalOpen(false);
  };

  const openModal = (title: string, content: React.ReactNode) => {
    setModalTitle(title);
    setModalContent(content);
    setIsModalOpen(true);
  };

  const openAddItemModal = () => openModal("Adicionar Item ao Inventário", <SelectionList items={allItems} onSelect={handleAddItemToInventory} />);
  const openSelectMapModal = () => openModal("Selecionar Mapa Ativo", <SelectionList items={allMaps} onSelect={handleSelectMap} />);
  const openAddCharacterModal = () => openModal("Adicionar Personagem ao Combate", <SelectionList items={characters} onSelect={handleAddCharacterToCombat} />);
  const openAddCreatureModal = () => openModal("Adicionar Criatura ao Combate", <SelectionList items={bestiary} onSelect={handleAddCreatureToCombat} />);
  const openEditCombatantModal = (c: any) => {
    const details = c.type === 'player' 
      ? <CharacterDetails character={c} /> 
      : <CreatureDetails creature={c} />;
      
    openModal(
      `Editar ${c.name}`, 
      <>
        {details}
        <CombatantForm combatant={c} onUpdate={handleUpdateCombatant} onRemove={handleRemoveCombatant} />
      </>
    );
  };
  const openCharacterDetailsModal = (c: CharacterData) => openModal(``, <CharacterDetails character={c} />);
  const openMapDetailsModal = (m: MapData) => openModal(m.name, <MapDetails map={m} />);

  if (loading) return <div>Carregando dados da mesa...</div>;

  return (
    <div className="mesa-container">
      <div className="mesa-dashboard">
        <CharacterWidget characters={characters} onCharacterClick={openCharacterDetailsModal} />
        <MapWidget map={activeMap} onMapClick={openMapDetailsModal} />
        <CombatTrackerWidget combatants={combatants} onCombatantClick={openEditCombatantModal} />
        <InventoryWidget items={inventory} onItemClick={handleRemoveItemFromInventory} />
      </div>
      <Toolbar
        onAddCharacter={openAddCharacterModal}
        onAddCreature={openAddCreatureModal}
        onNextTurn={handleNextTurn}
        onAddItem={openAddItemModal}
        onSelectMap={openSelectMapModal}
      />
      <MesaModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
        {modalContent}
      </MesaModal>
    </div>
  );
};

const SelectionList = ({ items, onSelect }: { items: { id: string, name: string }[], onSelect: (item: any) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredItems = items.filter(item => item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div>
      <input
        type="text"
        placeholder="Buscar..."
        className="modal-search-input"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />
      <ul className="modal-selection-list">
        {filteredItems.map(item => <li key={item.id} onClick={() => onSelect(item)}>{item.name}</li>)}
      </ul>
    </div>
  );
};

const CombatantForm = ({ combatant, onUpdate, onRemove }: { combatant: any, onUpdate: Function, onRemove: Function }) => {
  const [hp, setHp] = useState(combatant.currentHp || '');
  const [initiative, setInitiative] = useState(combatant.initiative || '');

  return (
    <div className="combatant-form-container">
      <div className="form-group">
        <label>HP Atual</label>
        <input type="number" value={hp} onChange={e => setHp(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Iniciativa</label>
        <input type="number" value={initiative} onChange={e => setInitiative(e.target.value)} />
      </div>
      <div className="modal-actions">
        <button className="secondary" onClick={() => onRemove(combatant.id)}>Remover do Combate</button>
        <button onClick={() => onUpdate(combatant.id, { currentHp: parseInt(hp), initiative: parseInt(initiative) })}>Salvar Alterações</button>
      </div>
    </div>
  );
};

const ConfirmationPrompt = ({ message, onConfirm, onCancel }: { message: string, onConfirm: () => void, onCancel: () => void }) => (
  <div>
    <p>{message}</p>
    <div className="modal-actions">
      <button className="secondary" onClick={onCancel}>Cancelar</button>
      <button onClick={onConfirm}>Confirmar</button>
    </div>
  </div>
);

const CharacterDetails = ({ character }: { character: CharacterData }) => {
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
              <p>{character.class}</p>
            </div>
          </div>
        </div>
      )}
      {character.attributes ? (
        <div className="character-details-grid">
          {Object.entries(character.attributes).map(([attr, value]) => (
            <div key={attr} className="attribute-item">
              <span className="attribute-name">{attr.substring(0, 3).toUpperCase()}</span>
              <span className="attribute-value">{value.score}</span>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ padding: '2rem' }}>Atributos não cadastrados para este personagem.</p>
      )}
    </div>
  );
};

const CreatureDetails = ({ creature }: { creature: CreatureData }) => (
  <div className="character-details-container">
    {creature.imageUrl && (
      <div className="character-details-header">
        <img 
          src={convertGoogleDriveLink(creature.imageUrl)} 
          alt={creature.name} 
          className="character-details-avatar"
        />
      </div>
    )}
    <div style={{ padding: '2rem' }}>
      {creature.description && (
        <div className="form-group">
          <h4>Descrição</h4>
          <p>{creature.description}</p>
        </div>
      )}
      {creature.stats && (
        <div className="form-group">
          <h4>Estatísticas</h4>
          <pre>{JSON.stringify(creature.stats, null, 2)}</pre>
        </div>
      )}
      {!creature.description && !creature.stats && (
        <p>Nenhuma descrição ou estatística cadastrada para esta criatura.</p>
      )}
    </div>
  </div>
);

const MapDetails = ({ map }: { map: MapData }) => (
  <div className="map-details-container">
    {map.imageUrl && (
      <img 
        src={convertGoogleDriveLink(map.imageUrl)} 
        alt={map.name}
        className="map-details-image"
      />
    )}
    <div className="map-details-content">
      {map.description ? (
        <>
          <h3>História e Detalhes</h3>
          <p>{map.description}</p>
        </>
      ) : (
        <p>Nenhuma descrição disponível para este mapa.</p>
      )}
    </div>
  </div>
);

export default MesaPage;
