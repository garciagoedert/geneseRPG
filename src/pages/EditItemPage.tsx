import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import './Auth.css';

const EditItemPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [rarity, setRarity] = useState('');
  const [description, setDescription] = useState('');
  const [visibleToPlayers, setVisibleToPlayers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchItem = async () => {
      try {
        const docRef = doc(db, 'items', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name);
          setType(data.type);
          setRarity(data.rarity);
          setDescription(data.description);
          setVisibleToPlayers(data.visibleToPlayers);
        } else {
          setError('Item não encontrado.');
        }
      } catch (e) {
        setError('Erro ao buscar o item.');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) return;

    try {
      const docRef = doc(db, 'items', id);
      await updateDoc(docRef, {
        name,
        type,
        rarity,
        description,
        visibleToPlayers,
      });
      navigate('/items');
    } catch (e) {
      setError('Não foi possível atualizar o item.');
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
      <h1>Editar Item</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <div>
          <label htmlFor="name">Nome do Item</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="type">Tipo</label>
          <input
            type="text"
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="Ex: Arma, Armadura, Poção"
            required
          />
        </div>
        <div>
          <label htmlFor="rarity">Raridade</label>
          <input
            type="text"
            id="rarity"
            value={rarity}
            onChange={(e) => setRarity(e.target.value)}
            placeholder="Ex: Comum, Incomum, Raro"
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

export default EditItemPage;
