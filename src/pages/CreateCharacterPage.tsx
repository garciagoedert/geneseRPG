import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { convertGoogleDriveLink } from '../utils/imageUtils'; // Importar a função
import SpellSelector from '../components/SpellSelector';
import ItemSelector from '../components/ItemSelector';
import './Auth.css'; // Reutilizando o CSS da autenticação
const CreateCharacterPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [characterClass, setCharacterClass] = useState('');
  const [race, setRace] = useState('');
  const [level, setLevel] = useState(1);
  const [hp, setHp] = useState(10);
  const [mp, setMp] = useState(10);
  const [gold, setGold] = useState(0);
  const [xp, setXp] = useState(0);
  const [proximoNivel, setProximoNivel] = useState(0);
  const [attributes, setAttributes] = useState({
    strength: { score: 10, bonus: 0 },
    dexterity: { score: 10, bonus: 0 },
    constitution: { score: 10, bonus: 0 },
    intelligence: { score: 10, bonus: 0 },
    wisdom: { score: 10, bonus: 0 },
    charisma: { score: 10, bonus: 0 },
  });
  const [inventory, setInventory] = useState<string[]>([]);
  const [abilities, setAbilities] = useState<string[]>([]); // Agora um array de IDs
  const [spells, setSpells] = useState<string[]>([]); // Agora um array de IDs
  const [history, setHistory] = useState('');
  const [appearance, setAppearance] = useState('');
  const [personality, setPersonality] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState(''); // Estado para a URL da imagem
  const [error, setError] = useState<string | null>(null);

  const handleAttributeChange = (e: React.ChangeEvent<HTMLInputElement>, attr: string, field: 'score' | 'bonus') => {
    const { value } = e.target;
    setAttributes(prev => ({
      ...prev,
      [attr]: {
        ...prev[attr as keyof typeof prev],
        [field]: parseInt(value, 10) || 0,
      },
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!currentUser) {
      setError('Você precisa estar logado para criar um personagem.');
      return;
    }

    try {
      const finalImageUrl = convertGoogleDriveLink(imageUrl); // Converte o link, se necessário

      await addDoc(collection(db, 'characterSheets'), {
        name,
        class: characterClass,
        race,
        level,
        hp,
        mp,
        gold,
        xp,
        proximoNivel,
        attributes,
        inventory: inventory,
        abilities: abilities,
        spells: spells,
        ownerId: currentUser.uid,
        createdAt: new Date(),
        imageUrl: finalImageUrl, // Salva a URL da imagem
        history,
        appearance,
        personality,
        notes,
      });
      console.log('Ficha criada com sucesso');
      navigate('/dashboard');
    } catch (e) {
      console.error('Erro ao adicionar documento: ', e);
      setError('Não foi possível criar a ficha.');
    }
  };

  const attributeTranslations: { [key: string]: string } = {
    strength: 'Força',
    dexterity: 'Destreza',
    constitution: 'Constituição',
    intelligence: 'Inteligência',
    wisdom: 'Sabedoria',
    charisma: 'Carisma',
  };

  return (
    <div className="sheet-creation-container">
      <h1>Criar Ficha</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <div>
          <label htmlFor="name">Nome do Personagem</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="characterClass">Classe</label>
          <input
            type="text"
            id="characterClass"
            value={characterClass}
            onChange={(e) => setCharacterClass(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="race">Raça</label>
          <input
            type="text"
            id="race"
            value={race}
            onChange={(e) => setRace(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="image">URL da Imagem do Personagem</label>
          <input
            type="text"
            id="image"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://exemplo.com/personagem.png"
          />
        </div>
        <div>
          <label htmlFor="level">Nível</label>
          <input
            type="number"
            id="level"
            value={level}
            onChange={(e) => setLevel(parseInt(e.target.value, 10) || 1)}
            required
          />
        </div>
        <div>
          <label htmlFor="hp">HP</label>
          <input
            type="number"
            id="hp"
            value={hp}
            onChange={(e) => setHp(parseInt(e.target.value, 10) || 0)}
            required
          />
        </div>
        <div>
          <label htmlFor="mp">MP</label>
          <input
            type="number"
            id="mp"
            value={mp}
            onChange={(e) => setMp(parseInt(e.target.value, 10) || 0)}
            required
          />
        </div>
        <div>
          <label htmlFor="gold">Ouro</label>
          <input
            type="number"
            id="gold"
            value={gold}
            onChange={(e) => setGold(parseInt(e.target.value, 10) || 0)}
            required
          />
        </div>
        <div>
          <label htmlFor="xp">Experiência (XP)</label>
          <input
            type="number"
            id="xp"
            value={xp}
            onChange={(e) => setXp(parseInt(e.target.value, 10) || 0)}
            required
          />
        </div>
        <div>
          <label htmlFor="proximoNivel">Próximo Nível (ProXP)</label>
          <input
            type="number"
            id="proximoNivel"
            value={proximoNivel}
            onChange={(e) => setProximoNivel(parseInt(e.target.value, 10) || 0)}
            required
          />
        </div>
        <fieldset>
          <legend>Atributos</legend>
          {Object.entries(attributes).map(([key, values]) => (
            <div key={key} className="attribute-input">
              <label htmlFor={key}>{attributeTranslations[key] || key}</label>
              <div className="attribute-wrapper">
                <input
                  type="number"
                  id={`${key}-score`}
                  name={`${key}-score`}
                  value={values.score}
                  onChange={(e) => handleAttributeChange(e, key, 'score')}
                  placeholder="Pontos"
                />
                <input
                  type="number"
                  id={`${key}-bonus`}
                  name={`${key}-bonus`}
                  value={values.bonus}
                  onChange={(e) => handleAttributeChange(e, key, 'bonus')}
                  placeholder="Bônus"
                />
              </div>
            </div>
          ))}
        </fieldset>
        <SpellSelector
          selectedIds={abilities}
          onChange={setAbilities}
          typeToShow="habilidade"
        />
        <SpellSelector
          selectedIds={spells}
          onChange={setSpells}
          typeToShow="magia"
        />
        <ItemSelector
          selectedIds={inventory}
          onChange={setInventory}
        />
        <div>
          <label htmlFor="history">História</label>
          <textarea
            id="history"
            value={history}
            onChange={(e) => setHistory(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="appearance">Aparência</label>
          <textarea
            id="appearance"
            value={appearance}
            onChange={(e) => setAppearance(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="personality">Personalidade</label>
          <textarea
            id="personality"
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="notes">Anotações</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <button type="submit">Salvar Ficha</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default CreateCharacterPage;
