import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue, push, serverTimestamp, query, limitToLast, remove } from 'firebase/database';
import { realtimeDB } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { evaluateMathExpression } from '../utils/mathParser';
import './DiceRoller.css';

// Por enquanto, usaremos um ID de sala fixo para testes.
const SALA_DE_TESTE_ID = 'sala_teste_01';

interface Roll {
  key: string;
  formula: string;
  individualResults: Record<string, number[]>;
  totalResult: number;
  userName: string;
  timestamp: number;
  resolvedFormula: string;
}

const DiceRoller: React.FC = () => {
  const { currentUser } = useAuth();
  const [diceFormula, setDiceFormula] = useState('');
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

  const handleRoll = () => {
    if (!currentUser) {
      alert('Você precisa estar logado para rolar os dados.');
      return;
    }
    if (!diceFormula) {
      alert('Por favor, insira uma fórmula de dados.');
      return;
    }

    try {
      const originalFormula = diceFormula.toLowerCase();
      const individualResults: Record<string, number[]> = {};
      const diceRegex = /(\d+)?d(\d+)/g;

      const resolvedFormula = originalFormula.replace(diceRegex, (match, countStr, sidesStr) => {
        const count = countStr ? parseInt(countStr, 10) : 1;
        const sides = parseInt(sidesStr, 10);

        if (count <= 0 || sides <= 0) {
          throw new Error(`Dado inválido na fórmula: ${match}`);
        }

        const rolls: number[] = [];
        for (let i = 0; i < count; i++) {
          rolls.push(Math.floor(Math.random() * sides) + 1);
        }

        if (!individualResults[match]) {
          individualResults[match] = [];
        }
        individualResults[match].push(...rolls);

        const sumOfRolls = rolls.reduce((sum, current) => sum + current, 0);
        return sumOfRolls.toString();
      });

      const totalResult = evaluateMathExpression(resolvedFormula);

      const historyRef = ref(realtimeDB, `rolls_history/${SALA_DE_TESTE_ID}`);
      push(historyRef, {
        formula: diceFormula,
        individualResults,
        totalResult,
        userName: currentUser.displayName || currentUser.email,
        timestamp: serverTimestamp(),
        resolvedFormula: resolvedFormula.replace(/\s/g, ''),
      });

      setDiceFormula('');
    } catch (error) {
      if (error instanceof Error) {
        alert(`Erro na fórmula: ${error.message}`);
      } else {
        alert('Ocorreu um erro desconhecido ao rolar os dados.');
      }
      console.error(error);
    }
  };

  const clearHistory = () => {
    if (currentUser?.role !== 'gm') {
      alert('Apenas o GM pode limpar o histórico.');
      return;
    }
    const historyRef = ref(realtimeDB, `rolls_history/${SALA_DE_TESTE_ID}`);
    remove(historyRef)
      .then(() => {
        console.log('Histórico de rolagens limpo com sucesso.');
      })
      .catch((error) => {
        console.error("Erro ao limpar o histórico de rolagens: ", error);
      });
  };

  return (
    <div className="dice-roller-container">
      <h3>Rolagem de Dados</h3>
      <div className="dice-input-area">
        <input
          type="text"
          value={diceFormula}
          onChange={(e) => setDiceFormula(e.target.value)}
          placeholder="Ex: 2d6+3"
          onKeyPress={(e) => e.key === 'Enter' && handleRoll()}
        />
        <button onClick={handleRoll}>Rolar</button>
      </div>
      <div className="dice-buttons">
        <button onClick={() => setDiceFormula('1d4')}>d4</button>
        <button onClick={() => setDiceFormula('1d6')}>d6</button>
        <button onClick={() => setDiceFormula('1d8')}>d8</button>
        <button onClick={() => setDiceFormula('1d10')}>d10</button>
        <button onClick={() => setDiceFormula('1d12')}>d12</button>
        <button onClick={() => setDiceFormula('1d20')}>d20</button>
      </div>
      <div className="roll-history">
        <h4>Histórico de Rolagens</h4>
        {currentUser?.role === 'gm' && (
          <button onClick={clearHistory} className="clear-history-button">
            Limpar Histórico
          </button>
        )}
        <ul>
          {rollHistory.map((roll) => (
            <li key={roll.key}>
              <div className="roll-main-info">
                <span className="roll-info">{roll.userName} rolou ({roll.formula})</span>
                <strong>{roll.totalResult}</strong>
              </div>
              <span className="roll-details">
                Detalhes: {roll.resolvedFormula}
                {' ➔ '}
                {Object.entries(roll.individualResults)
                  .map(([dice, results]) => `${dice}: [${results.join(', ')}]`)
                  .join('; ')}
              </span>
            </li>
          ))}
        </ul>
        <div ref={historyEndRef} />
      </div>
    </div>
  );
};

export default DiceRoller;
