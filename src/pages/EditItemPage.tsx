import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebaseConfig'; // Import storage
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'; // Import storage functions
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
  const [image, setImage] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

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
          setCurrentImageUrl(data.imageUrl || '');
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

    if (!currentUser) {
      setError('Você precisa estar logado para editar um item.');
      return;
    }

    let imageUrl = currentImageUrl;

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
        return; // Impede a atualização se o upload falhar
      }
    }

    try {
      const docRef = doc(db, 'items', id);
      await updateDoc(docRef, {
        name,
        type,
        rarity,
        description,
        visibleToPlayers,
        imageUrl: imageUrl,
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
          <label htmlFor="image">Imagem do Item</label>
          {currentImageUrl && <img src={currentImageUrl} alt="Imagem atual" style={{ width: '100px', display: 'block', marginBottom: '10px' }} />}
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
        <button type="submit">Salvar Alterações</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default EditItemPage;
