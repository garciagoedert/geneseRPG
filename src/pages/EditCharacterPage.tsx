import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import SpellSelector from '../components/SpellSelector';
import ItemSelector from '../components/ItemSelector';
import { convertGoogleDriveLink } from '../utils/imageUtils';
import './Auth.css'; // Reutilizando o CSS

const EditCharacterPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState('');
  const [characterClass, setCharacterClass] = useState('');
  const [level, setLevel] = useState(1);
  const [attributes, setAttributes] = useState({
    strength: { score: 10, bonus: 0 },
    dexterity: { score: 10, bonus: 0 },
    constitution: { score: 10, bonus: 0 },
    intelligence: { score: 10, bonus: 0 },
    wisdom: { score: 10, bonus: 0 },
    charisma: { score: 10, bonus: 0 },
  });
  const [inventory, setInventory] = useState<string[]>([]);
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
          setLevel(data.level);

          // Lógica para retrocompatibilidade de atributos
          const newAttributes = { ...attributes };
          for (const key in newAttributes) {
            if (typeof data.attributes[key] === 'number') {
              newAttributes[key as keyof typeof newAttributes] = {
                score: data.attributes[key],
                bonus: Math.floor((data.attributes[key] - 10) / 2),
              };
            } else {
              newAttributes[key as keyof typeof newAttributes] = data.attributes[key];
            }
          }
          setAttributes(newAttributes);

          setInventory(data.inventory);
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
        level,
        attributes,
        inventory,
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
        <button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default EditCharacterPage;
