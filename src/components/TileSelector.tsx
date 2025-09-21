import React, { useRef, useState, useEffect } from 'react';
import './TileSelector.css';

const TILE_SIZE = 32; // Tamanho de cada tile no tileset

interface Tile {
  src?: string; // Opcional para cores sólidas
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  color?: string; // Nova propriedade para cor
}

interface TileSelectorProps {
  onSelectTile: (tile: Tile) => void;
  onClose: () => void;
}

const tilesets = {
  Vila: '/tileset_village.png',
  Masmorra: '/tileset_dungeon.png',
  Floresta: '/tileset_forest.png',
  Caverna: '/tileset_cave.png',
  Castelo: '/tileset_castle.png',
  Interior: '/tileset_interior.png',
  Neve: '/tileset_snow.png',
};

type SelectionMode = 'Vila' | 'Masmorra' | 'Floresta' | 'Caverna' | 'Castelo' | 'Interior' | 'Neve' | 'Cor';

const TileSelector: React.FC<TileSelectorProps> = ({ onSelectTile, onClose }) => {
  const [mode, setMode] = useState<SelectionMode>('Vila');
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const tilesetSrc = mode !== 'Cor' ? tilesets[mode] : '';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selection, setSelection] = useState({ x: 0, y: 0, width: 1, height: 1 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (mode === 'Cor' || !tilesetSrc) {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }
    const image = new Image();
    image.src = tilesetSrc;
    image.onload = () => {
      if (canvas) {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx?.drawImage(image, 0, 0);
        drawGrid(ctx, image.width, image.height);
        highlightSelection(ctx, selection.x, selection.y, selection.width, selection.height);
      }
    };
    image.onerror = () => {
      console.error(`Erro ao carregar o tileset: ${tilesetSrc}`);
      if (canvas) {
        // Limpa o canvas se a imagem falhar
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [tilesetSrc, selection, mode]);

  const drawGrid = (ctx: CanvasRenderingContext2D | null | undefined, width: number, height: number) => {
    if (!ctx) return;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const highlightSelection = (ctx: CanvasRenderingContext2D | null | undefined, x: number, y: number, width: number, height: number) => {
    if (!ctx) return;
    ctx.strokeStyle = 'cyan';
    ctx.lineWidth = 2;
    ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, width * TILE_SIZE, height * TILE_SIZE);
  };

  const getTileCoords = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { tileX: 0, tileY: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return {
      tileX: Math.floor(x / TILE_SIZE),
      tileY: Math.floor(y / TILE_SIZE),
    };
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    const { tileX, tileY } = getTileCoords(event);
    setSelection({ x: tileX, y: tileY, width: 1, height: 1 });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const { tileX, tileY } = getTileCoords(event);
    setSelection(prev => ({
      ...prev,
      width: Math.max(1, tileX - prev.x + 1),
      height: Math.max(1, tileY - prev.y + 1),
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSelect = () => {
    if (mode === 'Cor') {
      onSelectTile({ color: selectedColor });
    } else {
      const selectedTile: Tile = {
        src: tilesetSrc,
        crop: {
          x: selection.x * TILE_SIZE,
          y: selection.y * TILE_SIZE,
          width: selection.width * TILE_SIZE,
          height: selection.height * TILE_SIZE,
        },
      };
      onSelectTile(selectedTile);
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content tile-selector">
        <h2>Selecionar Tile</h2>
        <div className="tileset-selection">
          {Object.keys(tilesets).map((name) => (
            <button
              key={name}
              className={mode === name ? 'active' : ''}
              onClick={() => setMode(name as SelectionMode)}
            >
              {name}
            </button>
          ))}
          <button
            key="Cor"
            className={mode === 'Cor' ? 'active' : ''}
            onClick={() => setMode('Cor')}
          >
            Cor
          </button>
        </div>
        {mode !== 'Cor' ? (
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp} // Para o arraste se o mouse sair do canvas
            className="tileset-canvas"
          ></canvas>
        ) : (
          <div className="color-picker-container">
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="color-picker-input"
            />
            <div className="color-preview" style={{ backgroundColor: selectedColor }}></div>
          </div>
        )}
        <div className="modal-actions">
          <button onClick={handleSelect}>Selecionar</button>
          <button onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
};

export default TileSelector;
