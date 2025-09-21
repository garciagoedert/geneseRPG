import React from 'react';
import './MesaModal.css';

interface MesaModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const MesaModal: React.FC<MesaModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* O header foi removido daqui para ser controlado pelo conteúdo */}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MesaModal;
