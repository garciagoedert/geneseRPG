import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import SpellSelector from '../components/SpellSelector';
import ItemSelector from '../components/ItemSelector';
import './Auth.css'; // Reutilizando o CSS

const EditCharacterPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState('');
  const [characterClass, setCharacterClass] = useState('');
  const [level, setLevel] = useState(1);
  const [attributes, setAttributes] = useState({
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  });
  const [inventory, setInventory] = useState<string[]>([]);
  const [abilities, setAbilities] = useState<string[]>([]);
  const [spells, setSpells] = useState<string[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

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
          setAttributes(data.attributes);
          setInventory(data.inventory);
          setAbilities(data.abilities);
          setSpells(data.spells);
          setCurrentImageUrl(data.imageUrl || '');
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

  const handleAttributeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAttributes(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsProcessingImage(true);

    if (!currentUser) {
      setError('Você precisa estar logado para editar um personagem.');
      setIsProcessingImage(false);
      return;
    }
    if (!id) {
      setError('ID da ficha não encontrado.');
      setIsProcessingImage(false);
      return;
    }

    let imageUrl = currentImageUrl;

    if (image) {
      try {
        const imageRef = ref(storage, `character-images/${id}/${image.name}`);
        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      } catch (e) {
        console.error('Erro no upload da imagem:', e);
        setError('Falha ao fazer upload da imagem.');
        setIsProcessingImage(false);
        return;
      }
    }

    try {
      const docRef = doc(db, 'characterSheets', id);
      await updateDoc(docRef, {
        name,
        class: characterClass,
        level,
        attributes,
        inventory,
        abilities,
        spells,
        imageUrl: imageUrl,
      });
      navigate(`/character/${id}`);
    } catch (e) {
      setError('Não foi possível atualizar a ficha.');
    } finally {
      setIsProcessingImage(false);
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
          <label htmlFor="image">Imagem do Personagem</label>
          {currentImageUrl && <img src={currentImageUrl} alt="Imagem atual" style={{ width: '100px', display: 'block', marginBottom: '10px' }} />}
          <input
            type="file"
            id="image"
            onChange={handleImageChange}
            accept="image/*"
            disabled={isProcessingImage}
          />
          {isProcessingImage && <p>Processando imagem...</p>}
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
          {Object.entries(attributes).map(([key, value]) => (
            <div key={key}>
              <label htmlFor={key}>{attributeTranslations[key] || key}</label>
              <input
                type="number"
                id={key}
                name={key}
                value={value}
                onChange={handleAttributeChange}
              />
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
        <button type="submit" disabled={isProcessingImage}>
          {isProcessingImage ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default EditCharacterPage;
