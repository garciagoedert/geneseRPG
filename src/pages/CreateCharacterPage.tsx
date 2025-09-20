import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebaseConfig'; // Import storage
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'; // Import storage functions
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import SpellSelector from '../components/SpellSelector';
import ItemSelector from '../components/ItemSelector';
import './Auth.css'; // Reutilizando o CSS da autenticação

const CreateCharacterPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
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
  const [abilities, setAbilities] = useState<string[]>([]); // Agora um array de IDs
  const [spells, setSpells] = useState<string[]>([]); // Agora um array de IDs
  const [history, setHistory] = useState('');
  const [appearance, setAppearance] = useState('');
  const [personality, setPersonality] = useState('');
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

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

    let imageUrl = '';

    if (image) {
      const storageRef = ref(storage, `characterImages/${currentUser.uid}/${Date.now()}_${image.name}`);
      const uploadTask = uploadBytesResumable(storageRef, image);

      try {
        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              console.error('Upload error:', error);
              setError('Falha no upload da imagem.');
              reject(error);
            },
            async () => {
              imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      } catch (e) {
        return; // Impede a criação da ficha se o upload falhar
      }
    }

    try {
      await addDoc(collection(db, 'characterSheets'), {
        name,
        class: characterClass,
        level,
        attributes,
        inventory: inventory,
        abilities: abilities,
        spells: spells,
        ownerId: currentUser.uid,
        createdAt: new Date(),
        imageUrl: imageUrl, // Salva a URL da imagem
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
          <label htmlFor="image">Imagem do Personagem</label>
          <input
            type="file"
            id="image"
            onChange={handleImageChange}
            accept="image/*"
          />
          {uploadProgress > 0 && <progress value={uploadProgress} max="100" />}
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
        <button type="submit">Salvar Ficha</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default CreateCharacterPage;
