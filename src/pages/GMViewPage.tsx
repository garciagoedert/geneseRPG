import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';

interface CharacterSummary {
  id: string;
  name: string;
  class: string;
  level: number;
}

const GMViewPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCharacters = async () => {
      if (currentUser?.role !== 'gm') {
        setLoading(false);
        return;
      }
      try {
        const querySnapshot = await getDocs(collection(db, 'characterSheets'));
        const chars = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          class: doc.data().class,
          level: doc.data().level,
        }));
        setCharacters(chars);
      } catch (error) {
        console.error("Erro ao buscar fichas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCharacters();
  }, [currentUser]);

  const handleDelete = async (characterId: string) => {
    if (window.confirm('Tem certeza que deseja apagar esta ficha? Esta ação não pode ser desfeita.')) {
      try {
        await deleteDoc(doc(db, 'characterSheets', characterId));
        setCharacters(characters.filter(char => char.id !== characterId));
      } catch (error) {
        console.error("Erro ao apagar a ficha:", error);
      }
    }
  };

  const populateDatabase = async () => {
    if (!window.confirm('Isso irá adicionar mais dados de exemplo ao banco de dados. Deseja continuar?')) {
      return;
    }
    console.log('Populando banco de dados com mais exemplos...');
    try {
      const creatures = [
        { name: 'Goblin', description: 'Uma pequena e maliciosa criatura verde, conhecida por sua covardia e amor por objetos brilhantes.', stats: 'HP: 7 (2d6)\nAC: 15\nAtaque: Cimitarra +4 (1d6+2)', visibleToPlayers: true },
        { name: 'Orc', description: 'Uma criatura brutal e guerreira, com pele verde ou cinza e presas proeminentes.', stats: 'HP: 15 (2d8+6)\nAC: 13\nAtaque: Machadão +5 (1d12+3)', visibleToPlayers: true },
        { name: 'Esqueleto', description: 'Restos mortais animados por magia negra, que obedecem cegamente seu mestre.', stats: 'HP: 13 (2d8+4)\nAC: 13\nAtaque: Espada Curta +4 (1d6+2)', visibleToPlayers: false },
      ];

      const items = [
        { name: 'Poção de Cura', type: 'Poção', rarity: 'Comum', description: 'Restaura 2d4+2 pontos de vida.' },
        { name: 'Espada Longa +1', type: 'Arma', rarity: 'Incomum', description: 'Uma espada longa bem balanceada que concede +1 de bônus nas jogadas de ataque e dano.' },
        { name: 'Amuleto da Saúde', type: 'Item Mágico', rarity: 'Raro', description: 'Este amuleto ajusta a Constituição de quem o usa para 19.' },
      ];

      const spells = [
        { name: 'Bola de Fogo', type: 'magia', level: 3, school: 'Evocação', description: 'Causa 8d6 de dano de fogo em um raio de 6 metros.' },
        { name: 'Mísseis Mágicos', type: 'magia', level: 1, school: 'Evocação', description: 'Cria três dardos de energia que causam 1d4+1 de dano de força cada.' },
        { name: 'Curar Ferimentos', type: 'magia', level: 1, school: 'Evocação', description: 'Cura 1d8+modificador de habilidade em um alvo tocado.' },
        { name: 'Ataque Furtivo', type: 'habilidade', level: 1, school: 'N/A', description: 'Causa 1d6 de dano extra uma vez por turno se tiver vantagem.' },
        { name: 'Fúria', type: 'habilidade', level: 1, school: 'N/A', description: 'Ganha vantagem em testes de Força e resistência, e bônus no dano corpo a corpo.' },
      ];

      const wikiEntries = [
        { title: 'O Reino de Eldoria', content: 'Eldoria é um vasto reino conhecido por suas montanhas imponentes e florestas antigas.', visibleToPlayers: true },
        { title: 'A Guilda dos Ladrões', content: 'Uma organização secreta que opera nas sombras das grandes cidades, controlando o submundo.', visibleToPlayers: false },
        { title: 'A Torre do Arquimago', content: 'Uma torre flutuante, lar do enigmático Arquimago Zalthar, cheia de segredos e perigos.', visibleToPlayers: true },
      ];

      for (const creature of creatures) {
        await addDoc(collection(db, 'bestiary'), creature);
      }
      for (const item of items) {
        await addDoc(collection(db, 'items'), item);
      }
      for (const spell of spells) {
        await addDoc(collection(db, 'spellsAndAbilities'), spell);
      }
      for (const entry of wikiEntries) {
        await addDoc(collection(db, 'wiki'), entry);
      }

      alert('Banco de dados populado com mais exemplos!');
    } catch (error) {
      console.error("Erro ao popular o banco de dados:", error);
      alert('Ocorreu um erro ao popular o banco de dados.');
    }
  };

  if (loading) {
    return <p>Carregando...</p>;
  }

  if (currentUser?.role !== 'gm') {
    return (
      <div className="mesa-container">
        <h1>Acesso Negado</h1>
        <p>Esta página é restrita aos Game Masters.</p>
      </div>
    );
  }

  return (
    <div className="mesa-container">
      <div className="mesa-header">
        <h1>Visão do Mestre</h1>
        <button onClick={populateDatabase} className="gm-button">Popular com Exemplos</button>
      </div>
      <h2>Fichas de Personagens</h2>
      <div className="character-list">
        {characters.length > 0 ? (
          characters.map(char => (
            <div key={char.id} className="character-card">
              <Link to={`/character/${char.id}`} className="character-card-link">
                <h3>{char.name}</h3>
                <p>{char.class} - Nível {char.level}</p>
              </Link>
              <button onClick={() => handleDelete(char.id)} className="delete-button">
                Apagar
              </button>
            </div>
          ))
        ) : (
          <p>Nenhuma ficha de personagem encontrada.</p>
        )}
      </div>
    </div>
  );
};

export default GMViewPage;
