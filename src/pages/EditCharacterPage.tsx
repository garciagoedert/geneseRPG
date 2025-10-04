import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import SpellSelector from '../components/SpellSelector';
import ItemSelector from '../components/ItemSelector';
import AutoResizingTextarea from '../components/AutoResizingTextarea'; // Importa o novo componente
import { convertGoogleDriveLink } from '../utils/imageUtils';
import './Auth.css'; // Reutilizando o CSS

const EditCharacterPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState('');
  const [characterClass, setCharacterClass] = useState('');
  const [race, setRace] = useState('');
  const [level, setLevel] = useState(1);
  const [hp, setHp] = useState(10);
  const [mp, setMp] = useState(10);
  const [gold, setGold] = useState(0);
  const [silver, setSilver] = useState(0);
  const [inspiration, setInspiration] = useState(0);
  const [perception, setPerception] = useState(0);
  const [armorClass, setArmorClass] = useState(0);
  const [xp, setXp] = useState(0);
  const [proximoNivel, setProximoNivel] = useState(0);
  const [attributes, setAttributes] = useState({
    strength: { score: 10, bonus: 0, skills: { atletismo: 0, briga: 0, forcaDeVontade: 0 } },
    dexterity: { score: 10, bonus: 0, skills: { acrobacia: 0, furtividade: 0, performance: 0 } },
    constitution: { score: 10, bonus: 0, skills: { sobrevivencia: 0, saude: 0, resistencia: 0 } },
    intelligence: { score: 10, bonus: 0, skills: { arcanismo: 0, historia: 0, investigacao: 0, natureza: 0, religiao: 0 } },
    wisdom: { score: 10, bonus: 0, skills: { intuicao: 0, medicina: 0, percepcao: 0, lideranca: 0 } },
    charisma: { score: 10, bonus: 0, skills: { atuacao: 0, enganacao: 0, intimidacao: 0, persuasao: 0 } },
  });
  const [inventory, setInventory] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]); // Estado para equipamentos
  const [abilities, setAbilities] = useState<string[]>([]);
  const [spells, setSpells] = useState<string[]>([]);
  const [history, setHistory] = useState('');
  const [appearance, setAppearance] = useState('');
  const [personality, setPersonality] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (!id) return;
    const fetchCharacter = async () => {
      try {
        const docRef = doc(db, 'characterSheets', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.ownerId !== currentUser?.uid && currentUser?.role !== 'gm') {
            setError('Você não tem permissão para editar esta ficha.');
            return;
          }
          setName(data.name);
          setCharacterClass(data.class);
          setRace(data.race || '');
          setLevel(data.level);
          setHp(data.hp || 10);
          setMp(data.mp || 10);
          setGold(data.gold || 0);
          setSilver(data.silver || 0);
          setInspiration(data.inspiration || 0);
          setPerception(data.perception || 0);
          setArmorClass(data.armorClass || 0);
          setXp(data.xp || 0);
          setProximoNivel(data.proximoNivel || 0);

          // Lógica para retrocompatibilidade de atributos
          const loadedAttributes = JSON.parse(JSON.stringify(attributes)); // Deep copy
          for (const attrKey in loadedAttributes) {
            if (data.attributes[attrKey]) {
              loadedAttributes[attrKey].score = data.attributes[attrKey].score || 10;
              loadedAttributes[attrKey].bonus = data.attributes[attrKey].bonus || 0;
              if (data.attributes[attrKey].skills) {
                for (const skillKey in loadedAttributes[attrKey].skills) {
                  loadedAttributes[attrKey].skills[skillKey] = data.attributes[attrKey].skills[skillKey] || 0;
                }
              }
            }
          }
          setAttributes(loadedAttributes);

          setInventory(data.inventory || []);
          setEquipment(data.equipment || []); // Carrega os equipamentos
          setAbilities(data.abilities);
          setSpells(data.spells);
          setHistory(data.history || '');
          setAppearance(data.appearance || '');
          setPersonality(data.personality || '');
          setNotes(data.notes || '');
          setImageUrl(data.imageUrl || '');
        } else {
          setError('Ficha não encontrada.');
        }
      } catch (e) {
        setError('Erro ao buscar a ficha.');
      } finally {
        setLoading(false);
      }
    };
    fetchCharacter();
  }, [id, currentUser]);

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

  const handleSkillChange = (e: React.ChangeEvent<HTMLInputElement>, attr: string, skill: string) => {
    const { value } = e.target;
    setAttributes(prev => ({
      ...prev,
      [attr]: {
        ...prev[attr as keyof typeof prev],
        skills: {
          ...prev[attr as keyof typeof prev].skills,
          [skill]: parseInt(value, 10) || 0,
        },
      },
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    if (!currentUser || !id) {
      setError('Você precisa estar logado e ter um ID de ficha válido.');
      setLoading(false);
      return;
    }

    try {
      const finalImageUrl = convertGoogleDriveLink(imageUrl);

      const docRef = doc(db, 'characterSheets', id);
      await updateDoc(docRef, {
        name,
        class: characterClass,
        race,
        level,
        hp,
        mp,
        gold,
        silver,
        inspiration,
        perception,
        armorClass,
        xp,
        proximoNivel,
        attributes,
        inventory,
        equipment, // Adiciona equipamentos ao objeto de atualização
        abilities,
        spells,
        imageUrl: finalImageUrl,
        history,
        appearance,
        personality,
        notes,
      });
      navigate(`/character/${id}`);
    } catch (e) {
      setError('Não foi possível atualizar a ficha.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p>Carregando...</p>;
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
    <div className="sheet-creation-container">
      <h1>Editar Ficha</h1>
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
          {imageUrl && <img src={convertGoogleDriveLink(imageUrl)} alt="Imagem atual" style={{ width: '100px', display: 'block', marginBottom: '10px' }} />}
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
          <label htmlFor="silver">Prata</label>
          <input
            type="number"
            id="silver"
            value={silver}
            onChange={(e) => setSilver(parseInt(e.target.value, 10) || 0)}
            required
          />
        </div>
        <div>
          <label htmlFor="inspiration">Inspiração</label>
          <input
            type="number"
            id="inspiration"
            value={inspiration}
            onChange={(e) => setInspiration(parseInt(e.target.value, 10) || 0)}
            required
          />
        </div>
        <div>
          <label htmlFor="perception">Percepção</label>
          <input
            type="number"
            id="perception"
            value={perception}
            onChange={(e) => setPerception(parseInt(e.target.value, 10) || 0)}
            required
          />
        </div>
        <div>
          <label htmlFor="armorClass">Classe de Armadura (CA)</label>
          <input
            type="number"
            id="armorClass"
            value={armorClass}
            onChange={(e) => setArmorClass(parseInt(e.target.value, 10) || 0)}
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
          {Object.entries(attributes).map(([attrKey, attrValues]) => (
            <div key={attrKey} className="attribute-group">
              <div className="attribute-input">
                <label htmlFor={attrKey}>{attributeTranslations[attrKey] || attrKey}</label>
                <div className="attribute-wrapper">
                  <input
                    type="number"
                    id={`${attrKey}-score`}
                    value={attrValues.score}
                    onChange={(e) => handleAttributeChange(e, attrKey, 'score')}
                    placeholder="Pontos"
                  />
                  <input
                    type="number"
                    id={`${attrKey}-bonus`}
                    value={attrValues.bonus}
                    onChange={(e) => handleAttributeChange(e, attrKey, 'bonus')}
                    placeholder="Bônus"
                  />
                </div>
              </div>
              <div className="skills-grid">
                {Object.entries(attrValues.skills).map(([skillKey, skillValue]) => (
                  <div key={skillKey} className="skill-input">
                    <label htmlFor={`${attrKey}-${skillKey}`}>{skillKey.charAt(0).toUpperCase() + skillKey.slice(1)}</label>
                    <input
                      type="number"
                      id={`${attrKey}-${skillKey}`}
                      value={skillValue}
                      onChange={(e) => handleSkillChange(e, attrKey, skillKey)}
                    />
                  </div>
                ))}
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
        <ItemSelector
          selectedIds={equipment}
          onChange={setEquipment}
          label="Equipamentos" // Label customizada
        />
        <div>
          <label htmlFor="history">História</label>
          <AutoResizingTextarea
            id="history"
            value={history}
            onChange={(e) => setHistory(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="appearance">Aparência</label>
          <AutoResizingTextarea
            id="appearance"
            value={appearance}
            onChange={(e) => setAppearance(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="personality">Personalidade</label>
          <AutoResizingTextarea
            id="personality"
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="notes">Anotações</label>
          <AutoResizingTextarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default EditCharacterPage;
