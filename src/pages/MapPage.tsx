import React, { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';

const MapPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!image || !currentUser) return;

    setUploading(true);
    const storage = getStorage();
    // No futuro, o caminho pode incluir um ID de campanha
    const storageRef = ref(storage, `maps/${currentUser.uid}/${image.name}`);

    try {
      const snapshot = await uploadBytes(storageRef, image);
      const url = await getDownloadURL(snapshot.ref);
      setImageUrl(url);
      console.log('Upload bem-sucedido:', url);
    } catch (error) {
      console.error("Erro no upload:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h2>Mapa Interativo</h2>
      <div>
        <h3>Upload de Mapa (GM)</h3>
        <input type="file" onChange={handleImageChange} />
        <button onClick={handleUpload} disabled={!image || uploading}>
          {uploading ? 'Enviando...' : 'Enviar Mapa'}
        </button>
      </div>

      <hr />

      {imageUrl ? (
        <div>
          <h3>Mapa Atual</h3>
          <img src={imageUrl} alt="Mapa da campanha" style={{ maxWidth: '100%' }} />
        </div>
      ) : (
        <p>Nenhum mapa carregado.</p>
      )}
    </div>
  );
};

export default MapPage;
