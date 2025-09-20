import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue, push, serverTimestamp, query, limitToLast, remove } from 'firebase/database';
import { realtimeDB } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import './DiceRoller.css';

// Por enquanto, usaremos um ID de sala fixo para testes.
const SALA_DE_TESTE_ID = 'sala_teste_01';

interface Roll {
  key: string;
  formula: string;
  individualResults: number[];
  modifier: number;
  totalResult: number;
  userName: string;
  timestamp: number;
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

  const parseDiceFormula = (formula: string): { count: number; sides: number; modifier: number } => {
    formula = formula.toLowerCase().replace(/\s/g, ''); // Remove espaços e converte para minúsculas
    let count = 1;
    let sides = 20;
    let modifier = 0;

    // Extrai o modificador
    const modifierMatch = formula.match(/[+-]\d+$/);
    if (modifierMatch) {
      modifier = parseInt(modifierMatch[0], 10);
      formula = formula.slice(0, modifierMatch.index);
    }

    // Extrai a contagem e os lados (ex: "2d8")
    const diceMatch = formula.match(/(\d+)?d(\d+)/);
    if (diceMatch) {
      count = diceMatch[1] ? parseInt(diceMatch[1], 10) : 1;
      sides = parseInt(diceMatch[2], 10);
    }

    return { count, sides, modifier };
  };

  const handleRoll = () => {
    if (!currentUser) {
      alert('Você precisa estar logado para rolar os dados.');
      return;
    }
    if (!diceFormula) {
      alert('Por favor, insira uma fórmula de dados.');
      return;
    }

    const { count, sides, modifier } = parseDiceFormula(diceFormula);

    if (count <= 0 || sides <= 0) {
      alert('Fórmula de dados inválida.');
      return;
    }

    const individualResults: number[] = [];
    for (let i = 0; i < count; i++) {
      individualResults.push(Math.floor(Math.random() * sides) + 1);
    }

    const sumOfRolls = individualResults.reduce((sum, current) => sum + current, 0);
    const totalResult = sumOfRolls + modifier;

    const historyRef = ref(realtimeDB, `rolls_history/${SALA_DE_TESTE_ID}`);
    push(historyRef, {
      formula: diceFormula,
      individualResults,
      modifier,
      totalResult,
      userName: currentUser.displayName || currentUser.email,
      timestamp: serverTimestamp(),
    });
    setDiceFormula(''); // Limpa o input após a rolagem
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
              <strong>{roll.userName}</strong> rolou {roll.totalResult} ({roll.formula})
              <span className="roll-details">
                {`[${roll.individualResults.join(', ')}]`}
                {roll.modifier !== 0 && (roll.modifier > 0 ? ` + ${roll.modifier}` : ` - ${Math.abs(roll.modifier)}`)}
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
