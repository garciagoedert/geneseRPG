import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import { convertGoogleDriveLink } from '../utils/imageUtils';
import './Auth.css';

const EditSpellPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState('');
  const [type, setType] = useState<'magia' | 'habilidade'>('magia');
  const [actionType, setActionType] = useState('Ação');
  const [className, setClassName] = useState('');
  const [level, setLevel] = useState(0);
  const [description, setDescription] = useState('');
  const [range, setRange] = useState('');
  const [visibleToPlayers, setVisibleToPlayers] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchSpell = async () => {
      try {
        const docRef = doc(db, 'spellsAndAbilities', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name);
          setType(data.type);
          setActionType(data.actionType || 'Ação');
          setClassName(data.className || '');
          setLevel(data.level);
          setDescription(data.description);
          setRange(data.range || '');
          setVisibleToPlayers(data.visibleToPlayers);
          setImageUrl(data.imageUrl || '');
        } else {
          setError('Não encontrado.');
        }
      } catch (e) {
        setError('Erro ao buscar dados.');
      } finally {
        setLoading(false);
      }
    };
    fetchSpell();
  }, [id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) return;

    if (!currentUser) {
      setError('Você precisa estar logado para editar.');
      return;
    }

    try {
      const finalImageUrl = convertGoogleDriveLink(imageUrl);

      const docRef = doc(db, 'spellsAndAbilities', id);
      await updateDoc(docRef, {
        name,
        type,
        actionType,
        className,
        level,
        description,
        range,
        visibleToPlayers,
        imageUrl: finalImageUrl,
      });
      navigate('/spells');
    } catch (e) {
      setError('Não foi possível atualizar.');
    }
  };

  if (currentUser?.role !== 'gm') {
    return <p>Acesso negado.</p>;
  }

  if (loading) {
    return <p>Carregando...</p>;
  }

  return (
    <div className="sheet-creation-container">
      <h1>Editar Magia ou Habilidade</h1>
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
          {imageUrl && <img src={convertGoogleDriveLink(imageUrl)} alt="Imagem atual" style={{ width: '100px', display: 'block', marginBottom: '10px' }} />}
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
        <div className="checkbox-container">
          <label htmlFor="visibleToPlayers">Visível para Jogadores?</label>
          <input
            type="checkbox"
            id="visibleToPlayers"
            checked={visibleToPlayers}
            onChange={(e) => setVisibleToPlayers(e.target.checked)}
          />
        </div>
        <button type="submit">Salvar Alterações</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default EditSpellPage;
