import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Auth.css'; // Reutilizando o CSS da autenticação

const CreateCharacterPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
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
  const [inventory, setInventory] = useState('');
  const [abilities, setAbilities] = useState('');
  const [spells, setSpells] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAttributeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAttributes(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!currentUser) {
      setError('Você precisa estar logado para criar um personagem.');
      return;
    }

    try {
      await addDoc(collection(db, 'characterSheets'), {
        name,
        class: characterClass,
        level,
        attributes,
        inventory,
        abilities,
        spells,
        ownerId: currentUser.uid,
        createdAt: new Date(),
      });
      console.log('Ficha criada com sucesso');
      navigate('/dashboard');
    } catch (e) {
      console.error('Erro ao adicionar documento: ', e);
      setError('Não foi possível criar a ficha.');
    }
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
              <label htmlFor={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
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
        <div>
          <label htmlFor="abilities">Habilidades e Talentos</label>
          <textarea
            id="abilities"
            value={abilities}
            onChange={(e) => setAbilities(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="spells">Magias</label>
          <textarea
            id="spells"
            value={spells}
            onChange={(e) => setSpells(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="inventory">Inventário</label>
          <textarea
            id="inventory"
            value={inventory}
            onChange={(e) => setInventory(e.target.value)}
          />
        </div>
        <button type="submit">Salvar Ficha</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default CreateCharacterPage;
