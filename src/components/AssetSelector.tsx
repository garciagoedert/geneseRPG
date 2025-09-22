import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import './AssetSelector.css';
import AssetFormModal from './AssetFormModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface Asset {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
}

interface AssetSelectorProps {
  onSelectAsset: (asset: Asset) => void;
  onClose: () => void;
}

const AssetSelector: React.FC<AssetSelectorProps> = ({ onSelectAsset, onClose }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const assetsCollection = collection(db, 'assets');
      const assetSnapshot = await getDocs(assetsCollection);
      const assetsList = assetSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Asset));
      setAssets(assetsList);
    } catch (error) {
      console.error("Erro ao buscar assets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleSave = async (assetData: Omit<Asset, 'id'> & { id?: string }) => {
    if (assetData.id) {
      const { id, ...data } = assetData;
      const assetRef = doc(db, 'assets', id);
      await updateDoc(assetRef, data);
    } else {
      const { id, ...data } = assetData;
      await addDoc(collection(db, 'assets'), data);
    }
    fetchAssets();
  };

  const handleDelete = async () => {
    if (selectedAsset) {
      const assetRef = doc(db, 'assets', selectedAsset.id);
      await deleteDoc(assetRef);
      fetchAssets();
      setDeleteModalOpen(false);
    }
  };

  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="asset-selector-modal">
        <div className="asset-selector-content">
          <div className="asset-selector-header">
            <h3>Adicionar Asset</h3>
            <button onClick={onClose} className="close-button">&times;</button>
          </div>
          <div className="asset-controls">
            <input
              type="text"
              placeholder="Buscar asset..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button onClick={() => { setSelectedAsset(null); setFormModalOpen(true); }} className="add-button">
              Adicionar Novo
            </button>
          </div>
          <div className="asset-table-container">
            {loading ? (
              <p>Carregando assets...</p>
            ) : (
              <table className="asset-table">
                <thead>
                  <tr>
                    <th>Imagem</th>
                    <th>Nome</th>
                    <th>Dimensões</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map(asset => (
                    <tr key={asset.id} onClick={() => onSelectAsset(asset)}>
                      <td><img src={asset.src} alt={asset.name} className="asset-thumbnail" /></td>
                      <td>{asset.name}</td>
                      <td>{`${asset.width}x${asset.height}`}</td>
                      <td className="asset-actions">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedAsset(asset); setFormModalOpen(true); }}>
                          Editar
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedAsset(asset); setDeleteModalOpen(true); }}>
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      <AssetFormModal
        isOpen={isFormModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSave={handleSave}
        asset={selectedAsset}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        itemName={selectedAsset?.name || ''}
      />
    </>
  );
};

export default AssetSelector;
