import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { convertGoogleDriveLink } from '../utils/imageUtils';
import './Auth.css';

const AddSpellPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [type, setType] = useState<'magia' | 'habilidade'>('magia');
  const [actionType, setActionType] = useState('Ação');
  const [className, setClassName] = useState('');
  const [level, setLevel] = useState(0);
  const [description, setDescription] = useState('');
  const [range, setRange] = useState('');
  const [duration, setDuration] = useState('');
  const [components, setComponents] = useState({
    verbal: false,
    somatic: false,
    material: false,
  });
  const [visibleToPlayers, setVisibleToPlayers] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (currentUser?.role !== 'gm') {
      setError('Você não tem permissão para adicionar.');
      return;
    }

    try {
      const finalImageUrl = convertGoogleDriveLink(imageUrl);

      await addDoc(collection(db, 'spellsAndAbilities'), {
        name,
        type,
        actionType,
        className,
        level,
        description,
        range,
        duration,
        components,
        visibleToPlayers,
        createdAt: new Date(),
        imageUrl: finalImageUrl,
      });
      navigate('/spells');
    } catch (e) {
      setError('Não foi possível adicionar.');
    }
  };

  if (currentUser?.role !== 'gm') {
    return <p>Acesso negado.</p>;
  }

  return (
    <div className="sheet-creation-container">
      <h1>Adicionar Magia ou Habilidade</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <div>
          <label htmlFor="name">Nome</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="image">URL da Imagem</label>
          <input
            type="text"
            id="image"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://exemplo.com/magia.png"
          />
        </div>
        <div>
          <label htmlFor="type">Tipo</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value as 'magia' | 'habilidade')}>
            <option value="magia">Magia</option>
            <option value="habilidade">Habilidade</option>
          </select>
        </div>
        <div>
          <label htmlFor="actionType">Tipo de Ação</label>
          <select id="actionType" value={actionType} onChange={(e) => setActionType(e.target.value)}>
            <option value="Ação">Ação</option>
            <option value="Ação bônus">Ação bônus</option>
            <option value="Reação">Reação</option>
            <option value="Ritual">Ritual</option>
          </select>
        </div>
        <div>
          <label htmlFor="className">Classe</label>
          <input
            type="text"
            id="className"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="Guerreiro, Mago, etc."
          />
        </div>
        <div>
          <label htmlFor="level">Nível</label>
          <input
            type="number"
            id="level"
            value={level}
            onChange={(e) => setLevel(parseInt(e.target.value, 10) || 0)}
            required
          />
        </div>
        <div>
          <label htmlFor="description">Descrição</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={10}
          />
        </div>
        <div>
          <label htmlFor="range">Alcance</label>
          <input
            type="text"
            id="range"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            placeholder="Ex: 30 metros, Toque"
          />
        </div>
        <div>
          <label htmlFor="duration">Duração</label>
          <input
            type="text"
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Ex: 1 minuto, Instantânea"
          />
        </div>
        <div className="form-section">
          <h2 className="form-section-title">Componentes</h2>
          <div className="checkbox-row">
            <label htmlFor="verbal">Verbal</label>
            <input
              type="checkbox"
              id="verbal"
              checked={components.verbal}
              onChange={() => setComponents(c => ({ ...c, verbal: !c.verbal }))}
            />
          </div>
          <div className="checkbox-row">
            <label htmlFor="somatic">Somático</label>
            <input
              type="checkbox"
              id="somatic"
              checked={components.somatic}
              onChange={() => setComponents(c => ({ ...c, somatic: !c.somatic }))}
            />
          </div>
          <div className="checkbox-row">
            <label htmlFor="material">Material</label>
            <input
              type="checkbox"
              id="material"
              checked={components.material}
              onChange={() => setComponents(c => ({ ...c, material: !c.material }))}
            />
          </div>
        </div>
        <div className="checkbox-container">
          <label htmlFor="visibleToPlayers">Visível para Jogadores?</label>
          <input
            type="checkbox"
            id="visibleToPlayers"
            checked={visibleToPlayers}
            onChange={(e) => setVisibleToPlayers(e.target.checked)}
          />
        </div>
        <button type="submit">Salvar</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default AddSpellPage;
