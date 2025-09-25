import React from 'react';
import './NotesWidget.css';

interface NotesWidgetProps {
  notes: string;
  onNotesChange: (notes: string) => void;
}

const NotesWidget: React.FC<NotesWidgetProps> = ({ notes, onNotesChange }) => {
  return (
    <div className="widget notes-widget">
      <h3>Anotações Rápidas</h3>
      <textarea
        className="notes-textarea"
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Digite suas anotações aqui..."
      />
    </div>
  );
};

export default NotesWidget;
