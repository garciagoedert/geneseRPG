import React, { useState } from 'react';

const firstNames = ["Aelar", "Bryn", "Cael", "Darek", "Elara", "Finnan", "Gwen", "Hagan", "Iona", "Joric"];
const lastNames = ["Corin", "Stonehand", "Swiftwater", "Blackwood", "Goldleaf", "Ironhide", "Moonshadow", "Stormcaller", "Sunstrider", "Winterfell"];
const traits = ["Corajoso", "Tímido", "Ganancioso", "Honesto", "Enganador", "Leal", "Preguiçoso", "Ambicioso", "Gentil", "Cruel"];
const professions = ["Ferreiro", "Alquimista", "Guarda", "Taverneiro", "Mercador", "Curandeiro", "Ladrão", "Bardo", "Fazendeiro", "Caçador"];

const NPCGenerator: React.FC = () => {
  const [npc, setNpc] = useState<{ name: string; trait: string; profession: string } | null>(null);

  const generateNpc = () => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const trait = traits[Math.floor(Math.random() * traits.length)];
    const profession = professions[Math.floor(Math.random() * professions.length)];
    setNpc({ name: `${firstName} ${lastName}`, trait, profession });
  };

  return (
    <div className="npc-generator">
      <button onClick={generateNpc} className="gm-header-button">Gerar NPC Aleatório</button>
      <div className="npc-details">
        {npc && (
          <>
            <p><strong>Nome:</strong> {npc.name}</p>
            <p><strong>Traço:</strong> {npc.trait}</p>
            <p><strong>Profissão:</strong> {npc.profession}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default NPCGenerator;
