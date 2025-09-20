import React, { useState } from 'react';

const commonItems = ["Poção de Cura Menor", "Adaga", "Tocha", "Corda de Cânhamo (15m)", "Rações de Viagem (1 dia)"];
const uncommonItems = ["Poção de Cura Maior", "Espada Curta +1", "Pergaminho de Míssil Mágico", "Óleo de Inflamabilidade", "Amuleto da Prova d'Água"];
const rareItems = ["Anel de Proteção +1", "Varinha de Mísseis Mágicos", "Poção de Invisibilidade", "Bolsa do Carregador", "Botas da Velocidade"];

const LootGenerator: React.FC = () => {
  const [loot, setLoot] = useState<string[] | null>(null);

  const generateLoot = () => {
    const generatedLoot: string[] = [];
    const gold = Math.floor(Math.random() * 100) + 1;
    generatedLoot.push(`${gold} peças de ouro`);

    const numberOfItems = Math.floor(Math.random() * 3); // 0 a 2 itens
    for (let i = 0; i < numberOfItems; i++) {
      const rarity = Math.random();
      if (rarity < 0.6) { // 60% de chance de item comum
        generatedLoot.push(commonItems[Math.floor(Math.random() * commonItems.length)]);
      } else if (rarity < 0.9) { // 30% de chance de item incomum
        generatedLoot.push(uncommonItems[Math.floor(Math.random() * uncommonItems.length)]);
      } else { // 10% de chance de item raro
        generatedLoot.push(rareItems[Math.floor(Math.random() * rareItems.length)]);
      }
    }
    setLoot(generatedLoot);
  };

  return (
    <div className="loot-generator">
      <button onClick={generateLoot} className="gm-header-button">Gerar Tesouro</button>
      <div className="loot-details">
        {loot && (
          <ul>
            {loot.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LootGenerator;
