import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, deleteDoc, addDoc, query, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { convertGoogleDriveLink } from '../utils/imageUtils';
import GMActionModal from '../components/GMActionModal';
import DiceRoller from '../components/DiceRoller';
import NPCGenerator from '../components/NPCGenerator';
import LootGenerator from '../components/LootGenerator';

interface CharacterSummary {
  id: string;
  name: string;
  class: string;
  level: number;
  imageUrl?: string;
}

interface MapSummary {
  id: string;
  name: string;
  imageUrl?: string;
}

interface Creature {
  id: string;
  name: string;
  description: string;
  stats: string;
}

interface Item {
  id: string;
  name: string;
  type: string;
  description: string;
}

interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  description: string;
}

interface WikiEntry {
  id: string;
  title: string;
  content: string;
}

type QuickAccessTab = 'characters' | 'maps' | 'creatures' | 'items' | 'spells' | 'wiki';

const GMViewPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [maps, setMaps] = useState<MapSummary[]>([]);
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [spells, setSpells] = useState<Spell[]>([]);
  const [wikiEntries, setWikiEntries] = useState<WikiEntry[]>([]);
  const [quickSearchTerm, setQuickSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<QuickAccessTab>('characters');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterSummary | null>(null);

  const handleCardClick = (character: CharacterSummary) => {
    if (currentUser?.role === 'gm') {
      setSelectedCharacter(character);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCharacter(null);
  };

  useEffect(() => {
    const savedNotes = localStorage.getItem('gmNotes');
    if (savedNotes) {
      setNotes(savedNotes);
    }

    const fetchData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists() || userDocSnap.data().role !== 'gm') {
          setLoading(false);
          return;
        }

        const charactersSnapshot = await getDocs(collection(db, 'characterSheets'));
        setCharacters(charactersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CharacterSummary)));

        const mapsSnapshot = await getDocs(collection(db, "maps"));
        setMaps(mapsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MapSummary)));

        const bestiarySnapshot = await getDocs(collection(db, 'bestiary'));
        setCreatures(bestiarySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Creature)));

        const itemsSnapshot = await getDocs(collection(db, 'items'));
        setItems(itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item)));

        const spellsSnapshot = await getDocs(collection(db, 'spellsAndAbilities'));
        setSpells(spellsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Spell)));

        const wikiSnapshot = await getDocs(collection(db, 'wiki'));
        setWikiEntries(wikiSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WikiEntry)));

      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleDeleteCharacter = async (characterId: string) => {
    if (window.confirm('Tem certeza que deseja apagar esta ficha? Esta ação não pode ser desfeita.')) {
      try {
        await deleteDoc(doc(db, 'characterSheets', characterId));
        setCharacters(characters.filter(char => char.id !== characterId));
      } catch (error) {
        console.error("Erro ao apagar a ficha:", error);
      }
    }
  };

  const filteredCharacters = characters.filter(char => char.name?.toLowerCase().includes(quickSearchTerm.toLowerCase()));
  const filteredMaps = maps.filter(map => map.name?.toLowerCase().includes(quickSearchTerm.toLowerCase()));
  const filteredCreatures = creatures.filter(creature => creature.name?.toLowerCase().includes(quickSearchTerm.toLowerCase()));
  const filteredItems = items.filter(item => item.name?.toLowerCase().includes(quickSearchTerm.toLowerCase()));
  const filteredSpells = spells.filter(spell => spell.name?.toLowerCase().includes(quickSearchTerm.toLowerCase()));
  const filteredWikiEntries = wikiEntries.filter(entry => entry.title?.toLowerCase().includes(quickSearchTerm.toLowerCase()));

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    localStorage.setItem('gmNotes', e.target.value);
  };

  if (loading) return <p>Carregando...</p>;
  if (currentUser?.role !== 'gm') {
    return (
      <div className="mesa-container">
        <h1>Acesso Negado</h1>
        <p>Esta página é restrita aos Game Masters.</p>
      </div>
    );
  }

  return (
    <div className="mesa-container">
      <div className="mesa-header">
        <h1>Visão do Mestre</h1>
      </div>

      <div className="gm-sections-container">
        <div className="gm-section">
          <DiceRoller />
        </div>

        <div className="gm-section">
          <h2>Geradores Aleatórios</h2>
          <div className="generators-container">
            <NPCGenerator />
            <LootGenerator />
          </div>
        </div>

        <div className="gm-section">
          <h2>Bloco de Notas do Mestre</h2>
          <textarea
            className="notes-textarea"
            placeholder="Suas anotações secretas aqui..."
            value={notes}
            onChange={handleNotesChange}
          />
        </div>

        <div className="gm-section">
          <h2>Acesso Rápido</h2>
          <div className="tabs">
            <button className={`tab-button ${activeTab === 'characters' ? 'active' : ''}`} onClick={() => setActiveTab('characters')}>Personagens</button>
            <button className={`tab-button ${activeTab === 'maps' ? 'active' : ''}`} onClick={() => setActiveTab('maps')}>Mapas</button>
            <button className={`tab-button ${activeTab === 'creatures' ? 'active' : ''}`} onClick={() => setActiveTab('creatures')}>Bestiário</button>
            <button className={`tab-button ${activeTab === 'items' ? 'active' : ''}`} onClick={() => setActiveTab('items')}>Itens</button>
            <button className={`tab-button ${activeTab === 'spells' ? 'active' : ''}`} onClick={() => setActiveTab('spells')}>Magias</button>
            <button className={`tab-button ${activeTab === 'wiki' ? 'active' : ''}`} onClick={() => setActiveTab('wiki')}>Wiki</button>
          </div>
          <input
            type="text"
            placeholder={`Buscar em ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}...`}
            className="search-bar-small"
            value={quickSearchTerm}
            onChange={(e) => setQuickSearchTerm(e.target.value)}
          />
          <div className="quick-access-grid">
            {activeTab === 'characters' && (filteredCharacters.length > 0 ? filteredCharacters.map(char => (
              <div key={char.id} className="character-card" style={{ backgroundImage: char.imageUrl ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${convertGoogleDriveLink(char.imageUrl)})` : 'none' }} onClick={() => handleCardClick(char)}>
                <div className="character-card-info">
                  <Link to={`/character/${char.id}`} className="character-card-link">
                    <h3>{char.name}</h3>
                    <p>{char.class} - Nível {char.level}</p>
                  </Link>
                </div>
              </div>
            )) : <p>Nenhum personagem encontrado.</p>)}

            {activeTab === 'maps' && (filteredMaps.length > 0 ? filteredMaps.map(map => (
              <div key={map.id} className="character-card" style={{ backgroundImage: map.imageUrl ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${convertGoogleDriveLink(map.imageUrl)})` : 'none' }}>
                <div className="character-card-info">
                  <Link to={`/map/${map.id}`} className="character-card-link">
                    <h3>{map.name}</h3>
                  </Link>
                </div>
              </div>
            )) : <p>Nenhum mapa encontrado.</p>)}

            {activeTab === 'creatures' && (filteredCreatures.length > 0 ? filteredCreatures.map(creature => (
              <Link to={`/creature/${creature.id}`} key={creature.id} className="card-link">
                <div className="item-card">
                  <h3>{creature.name}</h3>
                  <p className="item-card-description">{creature.description}</p>
                  <pre>{creature.stats}</pre>
                </div>
              </Link>
            )) : <p>Nenhuma criatura encontrada.</p>)}

            {activeTab === 'items' && (filteredItems.length > 0 ? filteredItems.map(item => (
              <Link to={`/item/${item.id}`} key={item.id} className="card-link">
                <div className="item-card">
                  <h3>{item.name}</h3>
                  <p><strong>Tipo:</strong> {item.type}</p>
                  <p className="item-card-description">{item.description}</p>
                </div>
              </Link>
            )) : <p>Nenhum item encontrado.</p>)}

            {activeTab === 'spells' && (filteredSpells.length > 0 ? filteredSpells.map(spell => (
              <Link to={`/spell/${spell.id}`} key={spell.id} className="card-link">
                <div className="item-card">
                  <h3>{spell.name}</h3>
                  <p><strong>Nível {spell.level} de {spell.school}</strong></p>
                  <p className="item-card-description">{spell.description}</p>
                </div>
              </Link>
            )) : <p>Nenhuma magia encontrada.</p>)}

            {activeTab === 'wiki' && (filteredWikiEntries.length > 0 ? filteredWikiEntries.map(entry => (
              <Link to={`/wiki/${entry.id}`} key={entry.id} className="card-link">
                <div className="item-card">
                  <h3>{entry.title}</h3>
                  <p className="item-card-description">{entry.content}</p>
                </div>
              </Link>
            )) : <p>Nenhuma entrada na wiki encontrada.</p>)}
          </div>
        </div>
      </div>

      {selectedCharacter && (
        <GMActionModal isOpen={isModalOpen} onClose={handleCloseModal}>
          <Link to={`/character/${selectedCharacter.id}`} className="control-button">
            Ver Ficha
          </Link>
          <button onClick={() => { handleDeleteCharacter(selectedCharacter.id); handleCloseModal(); }} className="control-button delete">
            Apagar Ficha
          </button>
        </GMActionModal>
      )}
    </div>
  );
};

export default GMViewPage;
