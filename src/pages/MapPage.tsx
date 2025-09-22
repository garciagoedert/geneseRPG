import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Image, Rect } from 'react-konva';
import { useParams } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Konva from 'konva';
import useImage from 'use-image';
import './MapPage.css';
import CreatureSelector from '../components/CreatureSelector';
import PlayerSelector from '../components/PlayerSelector';
import AssetSelector from '../components/AssetSelector';
import TokenEditModal from '../components/TokenEditModal';
import AssetEditModal from '../components/AssetEditModal';
import '../components/TokenEditModal.css';
import Token from '../components/Token';

interface Asset {
  name: string;
  src: string;
  width: number;
  height: number;
}

interface Creature {
  id: string;
  name: string;
  imageUrl: string;
}

interface Player {
  id: string;
  name: string;
  imageUrl: string;
}

const GRID_SIZE = 32; // Alterado para corresponder ao TILE_SIZE

type DrawingMode = 'select' | 'line' | 'free' | 'paint';

interface PaintedCell {
  x: number;
  y: number;
  color: string;
}

interface AssetTokenProps {
  asset: any;
  onSelect: () => void;
  isSelected: boolean;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDblClick: () => void;
}

const AssetToken: React.FC<AssetTokenProps> = ({ asset, onSelect, isSelected, onDragEnd, onDblClick }) => {
  const [image] = useImage(asset.src, 'anonymous');
  return (
    <Image
      image={image}
      id={asset.id}
      x={asset.x}
      y={asset.y}
      width={asset.width}
      height={asset.height}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      onDblClick={onDblClick}
      stroke={isSelected ? 'cyan' : undefined}
      strokeWidth={isSelected ? 3 : 0}
    />
  );
};

const MapPage: React.FC = () => {
  const { mapId } = useParams<{ mapId: string }>();
  const [tokens, setTokens] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [paintedCells, setPaintedCells] = useState<PaintedCell[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('select');
  const [lineColor, setLineColor] = useState('#ffffff');
  const [selectedId, selectShape] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState('#1a1f2c');
  const [isCreatureSelectorOpen, setCreatureSelectorOpen] = useState(false);
  const [isPlayerSelectorOpen, setPlayerSelectorOpen] = useState(false);
  const [isAssetSelectorOpen, setAssetSelectorOpen] = useState(false);
  const [isTokenEditModalOpen, setTokenEditModalOpen] = useState(false);
  const [isAssetEditModalOpen, setAssetEditModalOpen] = useState(false);
  const [editingToken, setEditingToken] = useState<any | null>(null);
  const [editingAsset, setEditingAsset] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyStep, setHistoryStep] = useState(0);
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const saveStateToHistory = () => {
    const currentState = { tokens, assets, lines, paintedCells };
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(currentState);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      const prevState = history[historyStep - 1];
      setTokens(prevState.tokens);
      setAssets(prevState.assets);
      setLines(prevState.lines);
      setPaintedCells(prevState.paintedCells);
      setHistoryStep(historyStep - 1);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const nextState = history[historyStep + 1];
      setTokens(nextState.tokens);
      setAssets(nextState.assets);
      setLines(nextState.lines);
      setPaintedCells(nextState.paintedCells);
      setHistoryStep(historyStep + 1);
    }
  };

  const fetchMapData = async () => {
    if (!mapId) return;
    const mapRef = doc(db, 'maps', mapId);
    const mapSnap = await getDoc(mapRef);
    if (mapSnap.exists()) {
      const data = mapSnap.data();
      if (data.mapState) {
        const state = JSON.parse(data.mapState);
        setTokens(state.tokens || []);
        setAssets(state.assets || []);
        setLines(state.lines || []);
        setPaintedCells(state.paintedCells || []);
        setBackgroundColor(state.backgroundColor || '#1a1f2c');
      }
    } else {
      console.error("Mapa não encontrado!");
    }
  };

  // Efeito para carregar os dados do mapa
  useEffect(() => {
    fetchMapData();
  }, [mapId]);

  // Efeito para salvar os dados do mapa
  useEffect(() => {
    if (!mapId) return;
    const saveMapState = async () => {
      const mapRef = doc(db, 'maps', mapId);
      const mapState = JSON.stringify({ tokens, assets, lines, paintedCells, backgroundColor });
      // Usamos setDoc com merge: true para não sobrescrever outros campos como nome e ownerId
      await setDoc(mapRef, { mapState }, { merge: true });
    };

    // Debounce para evitar salvamentos excessivos
    const handler = setTimeout(() => {
      saveMapState();
    }, 1000); // Salva 1 segundo após a última alteração

    return () => {
      clearTimeout(handler);
    };
  }, [tokens, assets, lines, paintedCells, backgroundColor, mapId]);


  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);


  const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // Deseleciona ao clicar no palco
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
    }
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (drawingMode === 'paint') {
      setDrawing(true);
      paintCell(e);
      return;
    }

    if (drawingMode !== 'line' && drawingMode !== 'free') return;
  
    setDrawing(true);
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
  
    const transform = stage.getAbsoluteTransform().copy().invert();
    const truePos = transform.point(pos);
  
    const newLine = {
      points: [truePos.x, truePos.y],
      id: `line-${lines.length}-${Math.random()}`,
      color: lineColor,
      mode: drawingMode,
    };
    setLines([...lines, newLine]);
  };
  
  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!drawing) return;

    if (drawingMode === 'paint') {
      paintCell(e);
      return;
    }

    if (drawingMode !== 'line' && drawingMode !== 'free') return;
  
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
  
    const transform = stage.getAbsoluteTransform().copy().invert();
    const truePos = transform.point(pos);
  
    let lastLine = lines[lines.length - 1];
    if (lastLine) {
      if (lastLine.mode === 'line') {
        // Para linha reta, atualiza apenas o ponto final
        lastLine.points = [lastLine.points[0], lastLine.points[1], truePos.x, truePos.y];
      } else {
        // Para desenho livre, adiciona novos pontos
        lastLine.points = lastLine.points.concat([truePos.x, truePos.y]);
      }
      lines.splice(lines.length - 1, 1, lastLine);
      setLines([...lines]);
    }
  };

  const handleMouseUp = () => {
    if (drawing) {
      saveStateToHistory();
    }
    setDrawing(false);
  };


  useEffect(() => {
    const stage = stageRef.current;
    if (stage) {
      const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        const scaleBy = 1.1;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();

        if (!pointer) return;

        const mousePointTo = {
          x: (pointer.x - stage.x()) / oldScale,
          y: (pointer.y - stage.y()) / oldScale,
        };

        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

        stage.scale({ x: newScale, y: newScale });

        const newPos = {
          x: pointer.x - mousePointTo.x * newScale,
          y: pointer.y - mousePointTo.y * newScale,
        };
        stage.position(newPos);
        stage.batchDraw();
      };

      stage.on('wheel', handleWheel);

      return () => {
        stage.off('wheel', handleWheel);
      };
    }
  }, []);

  useEffect(() => {
    if (stageRef.current && dimensions.width > 0 && dimensions.height > 0) {
      const stage = stageRef.current;
      stage.width(dimensions.width);
      stage.height(dimensions.height);
      
      const oldLayer = stage.findOne('.grid-layer');
      if (oldLayer) {
        oldLayer.destroy();
      }

      const layer = new Konva.Layer({ name: 'grid-layer' });
      const largeDim = 5000; // Um tamanho grande para cobrir a área visível

      // Cor de fundo
      layer.add(new Konva.Rect({
          x: -largeDim,
          y: -largeDim,
          width: largeDim * 2,
          height: largeDim * 2,
          fill: backgroundColor,
      }));

      // Linhas da grade
      const gridColor = getContrastingGridColor(backgroundColor);
      for (let i = -largeDim; i < largeDim; i += GRID_SIZE) {
          layer.add(new Konva.Line({
              points: [i, -largeDim, i, largeDim],
              stroke: gridColor,
              strokeWidth: 0.5,
          }));
          layer.add(new Konva.Line({
              points: [-largeDim, i, largeDim, i],
              stroke: gridColor,
              strokeWidth: 0.5,
          }));
      }

      stage.add(layer);
      layer.moveToBottom();
    }
  }, [dimensions, backgroundColor]);

  const getContrastingGridColor = (hex: string) => {
    if (!hex) return '#4f5b6a';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    // Formula to determine brightness (YIQ)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#333333' : '#cccccc'; // Retorna cor escura para fundos claros, e clara para fundos escuros
  };


  const addToken = () => {
    const newToken = {
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height,
      id: `token-${tokens.length}`,
      radius: 20,
      fill: 'red',
      name: 'Token'
    };
    setTokens([...tokens, newToken]);
  };

  const handleSelectCreature = (creature: Creature) => {
    const stage = stageRef.current;
    if (!stage) return;

    // Adiciona o token no centro da visão atual do mapa
    const pointer = {
        x: stage.width() / 2,
        y: stage.height() / 2,
    };
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const pos = transform.point(pointer);

    const newCreatureToken = {
      ...pos,
      id: `creature-${creature.id}-${Math.random()}`,
      radius: 25, // Um pouco maior para diferenciar
      fill: 'purple',
      name: creature.name,
      image: creature.imageUrl,
    };
    setTokens([...tokens, newCreatureToken]);
    setCreatureSelectorOpen(false);
  };

  const handleSelectPlayer = (player: Player) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = {
        x: stage.width() / 2,
        y: stage.height() / 2,
    };
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const pos = transform.point(pointer);

    const newPlayerToken = {
      ...pos,
      id: `player-${player.id}-${Math.random()}`,
      radius: 20,
      fill: 'blue', // Cor diferente para jogadores
      name: player.name,
      image: player.imageUrl,
    };
    setTokens([...tokens, newPlayerToken]);
    setPlayerSelectorOpen(false);
  };

  const handleSelectAsset = (asset: Asset) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = {
        x: stage.width() / 2,
        y: stage.height() / 2,
    };
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    const newAsset = {
      ...pos,
      id: `asset-${asset.name}-${Math.random()}`,
      ...asset,
    };
    setAssets([...assets, newAsset]);
    setAssetSelectorOpen(false);
  };

  const paintCell = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    const transform = stage.getAbsoluteTransform().copy().invert();
    const truePos = transform.point(pos);

    const x = Math.floor(truePos.x / GRID_SIZE);
    const y = Math.floor(truePos.y / GRID_SIZE);

    const newCell = { x, y, color: lineColor };

    setPaintedCells(prevCells => {
      const existingCellIndex = prevCells.findIndex(cell => cell.x === x && cell.y === y);
      if (existingCellIndex !== -1) {
        const updatedCells = [...prevCells];
        updatedCells[existingCellIndex] = newCell;
        return updatedCells;
      }
      return [...prevCells, newCell];
    });
  };

  const clearMap = () => {
    if (window.confirm('Tem certeza que deseja limpar todo o mapa? Esta ação não pode ser desfeita.')) {
      setTokens([]);
      setLines([]);
      setAssets([]);
      setPaintedCells([]);
      selectShape(null);
    }
  };

  const handleZoom = (scaleFactor: number) => {
    const stage = stageRef.current;
    if (stage) {
      const oldScale = stage.scaleX();
      const center = {
        x: stage.width() / 2,
        y: stage.height() / 2,
      };

      const mousePointTo = {
        x: (center.x - stage.x()) / oldScale,
        y: (center.y - stage.y()) / oldScale,
      };

      const newScale = oldScale * scaleFactor;

      stage.scale({ x: newScale, y: newScale });

      const newPos = {
        x: center.x - mousePointTo.x * newScale,
        y: center.y - mousePointTo.y * newScale,
      };
      stage.position(newPos);
      stage.batchDraw();
    }
  };

  return (
    <div className="map-container" ref={containerRef}>
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        ref={stageRef}
        className="map-stage"
        draggable={drawingMode === 'select'} // Só permite arrastar no modo de seleção
        onMouseDown={(e) => { checkDeselect(e); handleMouseDown(e); }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={checkDeselect}
      >
        <Layer>
          {/* Células Pintadas */}
          {paintedCells.map((cell, i) => (
            <Rect
              key={i}
              x={cell.x * GRID_SIZE}
              y={cell.y * GRID_SIZE}
              width={GRID_SIZE}
              height={GRID_SIZE}
              fill={cell.color}
            />
          ))}
          {/* Linhas Desenhadas */}
          {lines.map((line) => (
            <Line
              key={line.id}
              points={line.points}
              stroke={selectedId === line.id ? 'cyan' : line.color || 'white'}
              strokeWidth={5}
              tension={0.5}
              lineCap="round"
              onClick={() => {
                if (drawingMode === 'select') {
                  selectShape(line.id);
                }
              }}
              onTap={() => {
                if (drawingMode === 'select') {
                  selectShape(line.id);
                }
              }}
            />
          ))}
          {/* Assets */}
          {assets.map((asset) => (
            <AssetToken
              key={asset.id}
              asset={asset}
              isSelected={selectedId === asset.id}
              onSelect={() => {
                if (drawingMode === 'select') {
                  selectShape(asset.id);
                }
              }}
              onDragEnd={(e) => {
                const id = e.target.id();
                const newAssets = assets.map((a) => {
                  if (a.id === id) {
                    return { ...a, x: e.target.x(), y: e.target.y() };
                  }
                  return a;
                });
                setAssets(newAssets);
              }}
              onDblClick={() => {
                const currentAsset = assets.find(a => a.id === asset.id);
                if (currentAsset) {
                  setEditingAsset(currentAsset);
                  setAssetEditModalOpen(true);
                }
              }}
            />
          ))}
          {/* Tokens */}
          {tokens.map((token) => (
            <Token
              key={token.id}
              token={token}
              isSelected={selectedId === token.id}
              onSelect={() => selectShape(token.id)}
              onDragEnd={(e) => {
                const id = e.target.id();
                const newTokens = tokens.map((t) => {
                  if (t.id === id) {
                    return { ...t, x: e.target.x(), y: e.target.y() };
                  }
                  return t;
                });
                setTokens(newTokens);
              }}
              onDblClick={() => {
                const currentToken = tokens.find(t => t.id === token.id);
                if (currentToken) {
                  setEditingToken(currentToken);
                  setTokenEditModalOpen(true);
                }
              }}
            />
          ))}
        </Layer>
      </Stage>
      <div className="map-toolbar">
        <div className="toolbar-group">
          <button onClick={() => handleZoom(1.2)} title="Aproximar">+</button>
          <button onClick={() => handleZoom(0.8)} title="Afastar">-</button>
        </div>
        <div className="toolbar-separator"></div>
        <div className="toolbar-group">
          <label className="toolbar-label">Fundo:</label>
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="toolbar-color-picker"
            title="Cor de Fundo"
          />
        </div>
        <div className="toolbar-separator"></div>
        <div className="toolbar-group">
          <button onClick={addToken}>Token</button>
          <button onClick={() => setCreatureSelectorOpen(true)}>Criatura</button>
          <button onClick={() => setPlayerSelectorOpen(true)}>Jogador</button>
          <button onClick={() => setAssetSelectorOpen(true)}>Asset</button>
        </div>
        <div className="toolbar-separator"></div>
        <div className="toolbar-group">
          <button onClick={() => setDrawingMode('paint')} className={drawingMode === 'paint' ? 'active' : ''}>Pintar</button>
          <button onClick={() => setDrawingMode('line')} className={drawingMode === 'line' ? 'active' : ''}>Linha</button>
          <button onClick={() => setDrawingMode('free')} className={drawingMode === 'free' ? 'active' : ''}>Desenhar</button>
          <input
            type="color"
            value={lineColor}
            onChange={(e) => setLineColor(e.target.value)}
            className="toolbar-color-picker"
            title="Cor do Desenho"
          />
        </div>
        <div className="toolbar-separator"></div>
        <div className="toolbar-group">
          <button onClick={() => setDrawingMode('select')} className={drawingMode === 'select' ? 'active' : ''}>Selecionar</button>
          <button
            onClick={() => {
              if (selectedId) {
                setTokens(tokens.filter((t) => t.id !== selectedId));
                setLines(lines.filter((l) => l.id !== selectedId));
                setAssets(assets.filter((a) => a.id !== selectedId));
                selectShape(null);
              }
            }}
            disabled={!selectedId}
          >
            Deletar
          </button>
          <button onClick={clearMap}>Limpar</button>
          <button onClick={fetchMapData}>Atualizar</button>
        </div>
        <div className="toolbar-separator"></div>
        <div className="toolbar-group">
          <button onClick={handleUndo} disabled={historyStep === 0}>Desfazer</button>
          <button onClick={handleRedo} disabled={historyStep === history.length - 1}>Refazer</button>
        </div>
      </div>
      {isCreatureSelectorOpen && (
        <CreatureSelector
          onSelectCreature={handleSelectCreature}
          onClose={() => setCreatureSelectorOpen(false)}
        />
      )}
      {isPlayerSelectorOpen && (
        <PlayerSelector
          onSelectPlayer={handleSelectPlayer}
          onClose={() => setPlayerSelectorOpen(false)}
        />
      )}
      {isAssetSelectorOpen && (
        <AssetSelector
          onSelectAsset={handleSelectAsset}
          onClose={() => setAssetSelectorOpen(false)}
        />
      )}
      <AssetEditModal
        isOpen={isAssetEditModalOpen}
        onClose={() => setAssetEditModalOpen(false)}
        asset={editingAsset}
        onSave={(newWidth, newHeight) => {
          if (editingAsset) {
            const newAssets = assets.map(a => {
              if (a.id === editingAsset.id) {
                return { ...a, width: newWidth, height: newHeight };
              }
              return a;
            });
            setAssets(newAssets);
          }
        }}
      />
      <TokenEditModal
        isOpen={isTokenEditModalOpen}
        onClose={() => setTokenEditModalOpen(false)}
        token={editingToken}
        onSave={(newName, newRadius, newImage) => {
          if (editingToken) {
            const newTokens = tokens.map(t => {
              if (t.id === editingToken.id) {
                return { ...t, name: newName, radius: newRadius, image: newImage };
              }
              return t;
            });
            setTokens(newTokens);
          }
        }}
      />
    </div>
  );
};

export default MapPage;
