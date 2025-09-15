import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue, push, serverTimestamp, query, limitToLast } from 'firebase/database';
import { realtimeDB } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import './DiceRoller.css';

// Por enquanto, usaremos um ID de sala fixo para testes.
const SALA_DE_TESTE_ID = 'sala_teste_01';

interface Roll {
  key: string;
  die: string;
  result: number;
  userName: string;
  timestamp: number;
}

const DiceRoller: React.FC = () => {
  const { currentUser } = useAuth();
  const [rollHistory, setRollHistory] = useState<Roll[]>([]);
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;

    const historyRef = ref(realtimeDB, `rolls_history/${SALA_DE_TESTE_ID}`);
    const recentRollsQuery = query(historyRef, limitToLast(20));

    const unsubscribe = onValue(recentRollsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const history: Roll[] = [];
        snapshot.forEach((childSnapshot) => {
          history.push({ key: childSnapshot.key!, ...childSnapshot.val() });
        });
        // Ordena no cliente para garantir a ordem cronológica
        history.sort((a, b) => a.timestamp - b.timestamp);
        setRollHistory(history);
      } else {
        setRollHistory([]);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [rollHistory]);

  const rollDie = (die: string, sides: number) => {
    if (!currentUser) {
      alert('Você precisa estar logado para rolar os dados.');
      return;
    }
    const result = Math.floor(Math.random() * sides) + 1;
    const historyRef = ref(realtimeDB, `rolls_history/${SALA_DE_TESTE_ID}`);
    push(historyRef, {
      die,
      result,
      userName: currentUser.displayName || currentUser.email,
      timestamp: serverTimestamp(),
    });
  };

  return (
    <div className="dice-roller-container">
      <h3>Rolagem de Dados</h3>
      <div className="dice-buttons">
        <button onClick={() => rollDie('d4', 4)}>d4</button>
        <button onClick={() => rollDie('d6', 6)}>d6</button>
        <button onClick={() => rollDie('d8', 8)}>d8</button>
        <button onClick={() => rollDie('d10', 10)}>d10</button>
        <button onClick={() => rollDie('d12', 12)}>d12</button>
        <button onClick={() => rollDie('d20', 20)}>d20</button>
      </div>
      <div className="roll-history">
        <h4>Histórico de Rolagens</h4>
        <ul>
          {rollHistory.map((roll) => (
            <li key={roll.key}>
              <strong>{roll.userName}</strong> rolou {roll.result} ({roll.die})
            </li>
          ))}
        </ul>
        <div ref={historyEndRef} />
      </div>
    </div>
  );
};

export default DiceRoller;
