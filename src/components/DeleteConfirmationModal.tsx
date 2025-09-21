import React, { useState } from 'react';
import './Modal.css';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
}) => {
  const [confirmationText, setConfirmationText] = useState('');

  if (!isOpen) {
    return null;
  }

  const isConfirmationMatching = confirmationText === itemName;

  const handleConfirm = () => {
    if (isConfirmationMatching) {
      onConfirm();
      setConfirmationText(''); // Limpa o campo após a confirmação
    }
  };

  const handleClose = () => {
    setConfirmationText(''); // Limpa o campo ao fechar
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Confirmar Exclusão</h2>
        <p>
          Esta ação é irreversível. Para confirmar a exclusão de{' '}
          <strong>{itemName}</strong>, por favor, digite o nome abaixo.
        </p>
        <input
          type="text"
          value={confirmationText}
          onChange={(e) => setConfirmationText(e.target.value)}
          placeholder="Digite o nome para confirmar"
          className="confirmation-input"
        />
        <div className="modal-actions">
          <button onClick={handleClose} className="button-secondary">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isConfirmationMatching}
            className="button-danger"
          >
            Excluir Permanentemente
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
