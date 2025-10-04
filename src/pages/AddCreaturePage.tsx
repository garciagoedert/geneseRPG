import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { convertGoogleDriveLink } from '../utils/imageUtils';
import './Auth.css'; // Reutilizando o CSS

const AddCreaturePage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stats, setStats] = useState('');
  const [hp, setHp] = useState(0);
  const [mp, setMp] = useState(0);
  const [atk, setAtk] = useState('');
  const [ca, setCa] = useState(0);
  const [inc, setInc] = useState(0);
  const [visibleToPlayers, setVisibleToPlayers] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (currentUser?.role !== 'gm') {
      setError('Você não tem permissão para adicionar criaturas.');
      return;
    }

    try {
      const finalImageUrl = convertGoogleDriveLink(imageUrl);

      await addDoc(collection(db, 'bestiary'), {
        name,
        description,
        stats,
        hp,
        mp,
        atk,
        ca,
        inc,
        visibleToPlayers,
        createdAt: new Date(),
        imageUrl: finalImageUrl,
      });
      navigate('/bestiary');
    } catch (e) {
      setError('Não foi possível adicionar a criatura.');
    }
  };

  if (currentUser?.role !== 'gm') {
    return <p>Acesso negado.</p>;
  }

  return (
    <div className="sheet-creation-container">
      <h1>Adicionar Criatura ao Bestiário</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <div>
          <label htmlFor="name">Nome da Criatura</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="image">URL da Imagem da Criatura</label>
          <input
            type="text"
            id="image"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://exemplo.com/criatura.png"
          />
        </div>
        <div>
          <label htmlFor="description">Descrição</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
        </div>
        <div className="stats-grid">
          <div className="stat-item">
            <label htmlFor="hp">HP</label>
            <input type="number" id="hp" value={hp} onChange={(e) => setHp(parseInt(e.target.value, 10))} />
          </div>
          <div className="stat-item">
            <label htmlFor="mp">MP</label>
            <input type="number" id="mp" value={mp} onChange={(e) => setMp(parseInt(e.target.value, 10))} />
          </div>
          <div className="stat-item">
            <label htmlFor="atk">ATK</label>
            <input type="text" id="atk" value={atk} onChange={(e) => setAtk(e.target.value)} />
          </div>
          <div className="stat-item">
            <label htmlFor="ca">CA</label>
            <input type="number" id="ca" value={ca} onChange={(e) => setCa(parseInt(e.target.value, 10))} />
          </div>
          <div className="stat-item">
            <label htmlFor="inc">INC</label>
            <input type="number" id="inc" value={inc} onChange={(e) => setInc(parseInt(e.target.value, 10))} />
          </div>
        </div>
        <div>
          <label htmlFor="stats">Bloco de detalhes</label>
          <textarea
            id="stats"
            value={stats}
            onChange={(e) => setStats(e.target.value)}
            rows={10}
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
        <button type="submit">Salvar Criatura</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default AddCreaturePage;
