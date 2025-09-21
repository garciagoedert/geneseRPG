import React from 'react';
import './CombatTrackerWidget.css';
import { convertGoogleDriveLink } from '../../utils/imageUtils';

interface Combatant {
  id: string;
  name: string;
  initiative: number;
  type: 'player' | 'creature';
  isActive: boolean;
  currentHp?: number;
  maxHp?: number;
  imageUrl?: string;
}

interface CombatTrackerWidgetProps {
  combatants: Combatant[];
  onCombatantClick: (combatant: Combatant) => void;
}

const CombatTrackerWidget: React.FC<CombatTrackerWidgetProps> = ({ combatants, onCombatantClick }) => {
  const sortedCombatants = [...combatants].sort((a, b) => b.initiative - a.initiative);
  
  return (
    <div className="widget combat-tracker-widget">
      <div className="widget-header">
        <h2>Rastreador de Combate</h2>
      </div>
      <div className="widget-content">
        <ul className="combat-tracker-list">
          {sortedCombatants.map((c) => (
            <li 
              key={c.id} 
              className={`combatant-item ${c.isActive ? 'active' : ''} ${c.type}`}
              onClick={() => onCombatantClick(c)}
              title="Clique para editar"
            >
              <span className="combatant-initiative">{c.initiative}</span>
              <img 
                src={c.imageUrl ? convertGoogleDriveLink(c.imageUrl) : '/default-avatar.png'} 
                alt={c.name} 
                className="combatant-avatar" 
              />
              <div className="combatant-details">
                <span className="combatant-name">{c.name}</span>
                {c.currentHp !== undefined && c.maxHp !== undefined && (
                  <span className="combatant-hp">{c.currentHp} / {c.maxHp} HP</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CombatTrackerWidget;
