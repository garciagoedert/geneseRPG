import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebaseConfig'; // Import storage
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'; // Import storage functions
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const AddItemPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [rarity, setRarity] = useState('');
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
      setError('Você não tem permissão para adicionar itens.');
      return;
    }

    let imageUrl = '';

    if (image) {
      const storageRef = ref(storage, `itemImages/${currentUser.uid}/${Date.now()}_${image.name}`);
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
      await addDoc(collection(db, 'items'), {
        name,
        type,
        rarity,
        description,
        visibleToPlayers,
        createdAt: new Date(),
        imageUrl: imageUrl, // Salva a URL da imagem
      });
      navigate('/items');
    } catch (e) {
      setError('Não foi possível adicionar o item.');
    }
  };

  if (currentUser?.role !== 'gm') {
    return <p>Acesso negado.</p>;
  }

  return (
    <div className="sheet-creation-container">
      <h1>Adicionar Novo Item</h1>
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
          <label htmlFor="image">Imagem do Item</label>
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
        <button type="submit">Salvar Item</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default AddItemPage;
