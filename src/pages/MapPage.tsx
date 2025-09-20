import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Circle, Text, Line, Image } from 'react-konva';
import { useParams } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Konva from 'konva';
import useImage from 'use-image';
import './MapPage.css';
import CreatureSelector from '../components/CreatureSelector';
import PlayerSelector from '../components/PlayerSelector';
import AssetSelector from '../components/AssetSelector';

interface Asset {
  name: string;
  src: string;
  width: number;
  height: number;
}

interface Creature {
  id: string;
  name: string;
}

interface Player {
  id: string;
  name: string;
}

const GRID_SIZE = 30;
const DOT_RADIUS = 1;

type DrawingMode = 'select' | 'line';

interface AssetTokenProps {
  asset: any;
  onSelect: () => void;
  isSelected: boolean;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

const AssetToken: React.FC<AssetTokenProps> = ({ asset, onSelect, isSelected, onDragEnd }) => {
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
  const [drawing, setDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('select');
  const [selectedId, selectShape] = useState<string | null>(null);
  const [isCreatureSelectorOpen, setCreatureSelectorOpen] = useState(false);
  const [isPlayerSelectorOpen, setPlayerSelectorOpen] = useState(false);
  const [isAssetSelectorOpen, setAssetSelectorOpen] = useState(false);
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [mapName, setMapName] = useState('');

  // Efeito para carregar os dados do mapa
  useEffect(() => {
    if (!mapId) return;
    const fetchMapData = async () => {
      const mapRef = doc(db, 'maps', mapId);
      const mapSnap = await getDoc(mapRef);
      if (mapSnap.exists()) {
        const data = mapSnap.data();
        setMapName(data.name);
        if (data.mapState) {
          const state = JSON.parse(data.mapState);
          setTokens(state.tokens || []);
          setAssets(state.assets || []);
          setLines(state.lines || []);
        }
      } else {
        console.error("Mapa não encontrado!");
      }
    };
    fetchMapData();
  }, [mapId]);

  // Efeito para salvar os dados do mapa
  useEffect(() => {
    if (!mapId) return;
    const saveMapState = async () => {
      const mapRef = doc(db, 'maps', mapId);
      const mapState = JSON.stringify({ tokens, assets, lines });
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
  }, [tokens, assets, lines, mapId]);


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
    if (drawingMode !== 'line' || drawing) return;

    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    const transform = stage.getAbsoluteTransform().copy().invert();
    const truePos = transform.point(pos);

    setDrawing(true);
    setLines([...lines, { points: [truePos.x, truePos.y, truePos.x, truePos.y], id: `line-${lines.length}-${Math.random()}` }]);
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (drawingMode !== 'line' || !drawing) return;

    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    const transform = stage.getAbsoluteTransform().copy().invert();
    const truePos = transform.point(pos);

    let lastLine = lines[lines.length - 1];
    lastLine.points = [lastLine.points[0], lastLine.points[1], truePos.x, truePos.y];
    lines.splice(lines.length - 1, 1, lastLine);
    setLines([...lines]);
  };

  const handleMouseUp = () => {
    if (drawingMode === 'select') return;
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

      // Cria um canvas para o padrão de pontos
      const patternCanvas = document.createElement('canvas');
      patternCanvas.width = GRID_SIZE;
      patternCanvas.height = GRID_SIZE;
      const patternContext = patternCanvas.getContext('2d');

      if (patternContext) {
        patternContext.fillStyle = '#4f5b6a';
        patternContext.beginPath();
        patternContext.arc(DOT_RADIUS, DOT_RADIUS, DOT_RADIUS, 0, 2 * Math.PI);
        patternContext.fill();
      }

      const largeDim = 5000;
      layer.add(new Konva.Rect({
        x: -largeDim,
        y: -largeDim,
        width: largeDim * 2,
        height: largeDim * 2,
        fill: '#1a1f2c',
        fillPatternImage: patternCanvas,
        fillPatternRepeat: 'repeat',
      }));

      stage.add(layer);
      layer.moveToBottom();
    }
  }, [dimensions]);


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

  const clearMap = () => {
    if (window.confirm('Tem certeza que deseja limpar todo o mapa? Esta ação não pode ser desfeita.')) {
      setTokens([]);
      setLines([]);
      setAssets([]);
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
          {/* Linhas Desenhadas */}
          {lines.map((line) => (
            <Line
              key={line.id}
              points={line.points}
              stroke={selectedId === line.id ? 'cyan' : 'white'}
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
            />
          ))}
          {/* Tokens */}
          {tokens.map((token) => (
            <React.Fragment key={token.id}>
              <Circle
                id={token.id}
                x={token.x}
                y={token.y}
                radius={token.radius}
                fill={token.fill}
                draggable
                onClick={() => selectShape(token.id)}
                onTap={() => selectShape(token.id)}
                stroke={selectedId === token.id ? 'cyan' : undefined}
                strokeWidth={selectedId === token.id ? 3 : 0}
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
                onDblClick={(e) => {
                  const id = e.target.id();
                  const token = tokens.find(t => t.id === id);
                  if (token) {
                    const newName = prompt('Digite o novo nome para o token:', token.name);
                    if (newName) {
                      const newTokens = tokens.map(t => {
                        if (t.id === id) {
                          return { ...t, name: newName };
                        }
                        return t;
                      });
                      setTokens(newTokens);
                    }
                  }
                }}
              />
              <Text
                text={token.name}
                x={token.x - token.radius}
                y={token.y + token.radius + 5}
                width={token.radius * 2}
                align="center"
                fill="white"
                fontSize={12}
                listening={false} // Para não interferir com o clique no círculo
              />
            </React.Fragment>
          ))}
        </Layer>
      </Stage>
      <div className="map-toolbar">
        <button onClick={() => handleZoom(1.2)}>+</button>
        <button onClick={() => handleZoom(0.8)}>-</button>
        <button onClick={addToken}>Token Genérico</button>
        <button onClick={() => setCreatureSelectorOpen(true)}>Criatura</button>
        <button onClick={() => setPlayerSelectorOpen(true)}>Jogador</button>
        <button onClick={() => setDrawingMode('line')} className={drawingMode === 'line' ? 'active' : ''}>Linha</button>
        <button onClick={() => setDrawingMode('select')} className={drawingMode === 'select' ? 'active' : ''}>Selecionar</button>
        <button onClick={() => setAssetSelectorOpen(true)}>Asset</button>
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
        <button onClick={clearMap}>Limpar Mapa</button>
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
    </div>
  );
};

export default MapPage;
