import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebaseConfig'; // Import storage
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'; // Import storage functions
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const AddSpellPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [type, setType] = useState<'magia' | 'habilidade'>('magia');
  const [level, setLevel] = useState(0);
  const [description, setDescription] = useState('');
  const [visibleToPlayers, setVisibleToPlayers] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (currentUser?.role !== 'gm') {
      setError('Você não tem permissão para adicionar.');
      return;
    }

    let imageUrl = '';

    if (image) {
      const storageRef = ref(storage, `spellImages/${currentUser.uid}/${Date.now()}_${image.name}`);
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
        return; // Impede a criação se o upload falhar
      }
    }

    try {
      await addDoc(collection(db, 'spellsAndAbilities'), {
        name,
        type,
        level,
        description,
        visibleToPlayers,
        createdAt: new Date(),
        imageUrl: imageUrl, // Salva a URL da imagem
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
          <label htmlFor="image">Imagem</label>
          <input
            type="file"
            id="image"
            onChange={handleImageChange}
            accept="image/*"
          />
          {uploadProgress > 0 && <progress value={uploadProgress} max="100" />}
        </div>
        <div>
          <label htmlFor="type">Tipo</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value as 'magia' | 'habilidade')}>
            <option value="magia">Magia</option>
            <option value="habilidade">Habilidade</option>
          </select>
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
