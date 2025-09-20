import React from 'react';
import './GMActionModal.css';

interface GMActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const GMActionModal: React.FC<GMActionModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Ações do Mestre</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default GMActionModal;
