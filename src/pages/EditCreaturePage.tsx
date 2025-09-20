import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebaseConfig'; // Import storage
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'; // Import storage functions
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import './Auth.css'; // Reutilizando o CSS

const EditCreaturePage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stats, setStats] = useState('');
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
    const fetchCreature = async () => {
      try {
        const docRef = doc(db, 'bestiary', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name);
          setDescription(data.description);
          setStats(data.stats);
          setVisibleToPlayers(data.visibleToPlayers);
          setCurrentImageUrl(data.imageUrl || '');
        } else {
          setError('Criatura não encontrada.');
        }
      } catch (e) {
        setError('Erro ao buscar a criatura.');
      } finally {
        setLoading(false);
      }
    };
    fetchCreature();
  }, [id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) return;

    if (!currentUser) {
      setError('Você precisa estar logado para editar uma criatura.');
      return;
    }

    let imageUrl = currentImageUrl;

    if (image) {
      const storageRef = ref(storage, `creatureImages/${currentUser.uid}/${Date.now()}_${image.name}`);
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
      const docRef = doc(db, 'bestiary', id);
      await updateDoc(docRef, {
        name,
        description,
        stats,
        visibleToPlayers,
        imageUrl: imageUrl,
      });
      navigate('/bestiary');
    } catch (e) {
      setError('Não foi possível atualizar a criatura.');
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
      <h1>Editar Criatura</h1>
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
          <label htmlFor="image">Imagem da Criatura</label>
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
          <label htmlFor="description">Descrição</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
        </div>
        <div>
          <label htmlFor="stats">Bloco de Estatísticas</label>
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
        <button type="submit">Salvar Alterações</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default EditCreaturePage;
