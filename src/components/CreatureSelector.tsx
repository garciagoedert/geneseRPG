import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import './CreatureSelector.css';

interface Creature {
  id: string;
  name: string;
  // Adicione outros campos da criatura se necessário
}

interface CreatureSelectorProps {
  onSelectCreature: (creature: Creature) => void;
  onClose: () => void;
}

const CreatureSelector: React.FC<CreatureSelectorProps> = ({ onSelectCreature, onClose }) => {
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreatures = async () => {
      try {
        const creaturesCollection = collection(db, 'bestiary');
        const creatureSnapshot = await getDocs(creaturesCollection);
        const creaturesList = creatureSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Creature));
        setCreatures(creaturesList);
      } catch (error) {
        console.error("Erro ao buscar criaturas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCreatures();
  }, []);

  return (
    <div className="creature-selector-modal">
      <div className="creature-selector-content">
        <div className="creature-selector-header">
          <h3>Adicionar Criatura do Bestiário</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        {loading ? (
          <p>Carregando bestiário...</p>
        ) : (
          <ul className="creature-list">
            {creatures.map(creature => (
              <li key={creature.id} onClick={() => onSelectCreature(creature)}>
                {creature.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CreatureSelector;
