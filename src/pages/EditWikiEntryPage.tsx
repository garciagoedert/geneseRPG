import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import './Auth.css'; // Reutilizando o CSS

const EditWikiEntryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visibleToPlayers, setVisibleToPlayers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchEntry = async () => {
      try {
        const docRef = doc(db, 'wiki', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTitle(data.title);
          setContent(data.content);
          setVisibleToPlayers(data.visibleToPlayers);
        } else {
          setError('Artigo não encontrado.');
        }
      } catch (e) {
        setError('Erro ao buscar o artigo.');
      } finally {
        setLoading(false);
      }
    };
    fetchEntry();
  }, [id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) return;

    if (!currentUser) {
      setError('Você precisa estar logado para editar um artigo.');
      return;
    }

    try {
      const docRef = doc(db, 'wiki', id);
      await updateDoc(docRef, {
        title,
        content,
        visibleToPlayers,
      });
      navigate('/wiki');
    } catch (e) {
      setError('Não foi possível atualizar o artigo.');
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
      <h1>Editar Artigo da Wiki</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <div>
          <label htmlFor="title">Título do Artigo</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="content">Conteúdo</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={15}
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

export default EditWikiEntryPage;
