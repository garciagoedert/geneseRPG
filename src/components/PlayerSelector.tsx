import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import './PlayerSelector.css';

interface Player {
  id: string;
  name: string;
  // Adicione outros campos do personagem se necessário
}

interface PlayerSelectorProps {
  onSelectPlayer: (player: Player) => void;
  onClose: () => void;
}

const PlayerSelector: React.FC<PlayerSelectorProps> = ({ onSelectPlayer, onClose }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        // Assumindo que a coleção de personagens se chama 'characters'
        const playersCollection = collection(db, 'characterSheets');
        const playerSnapshot = await getDocs(playersCollection);
        const playersList = playerSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Player));
        setPlayers(playersList);
      } catch (error) {
        console.error("Erro ao buscar personagens:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  return (
    <div className="player-selector-modal">
      <div className="player-selector-content">
        <div className="player-selector-header">
          <h3>Adicionar Jogador</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        {loading ? (
          <p>Carregando jogadores...</p>
        ) : (
          <ul className="player-list">
            {players.map(player => (
              <li key={player.id} onClick={() => onSelectPlayer(player)}>
                {player.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PlayerSelector;
