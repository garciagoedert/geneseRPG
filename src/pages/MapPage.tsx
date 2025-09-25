import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Image, Rect, Transformer, Text, Circle } from 'react-konva';
import { useParams } from 'react-router-dom';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Konva from 'konva';
import useImage from 'use-image';
import { useAuth } from '../context/AuthContext';
import './MapPage.css';
import CreatureSelector from '../components/CreatureSelector';
import PlayerSelector from '../components/PlayerSelector';
import AssetSelector from '../components/AssetSelector';
import TokenEditModal from '../components/TokenEditModal';
import AssetEditModal from '../components/AssetEditModal';
import '../components/TokenEditModal.css';
import Token from '../components/Token';
import LayerManager from '../components/LayerManager';
import '../components/LayerManager.css';

interface Layer {
  id: string;
  name: string;
  isVisible: boolean;
  tokens: any[];
  assets: any[];
  lines: any[];
  shapes: any[];
}

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

type DrawingMode = 'select' | 'line' | 'free' | 'paint' | 'measure' | 'fog' | 'circle' | 'square';

interface PaintedCell {
  x: number;
  y: number;
  color: string;
}

interface AssetTokenProps {
  asset: any;
  onSelect: () => void;
  onTransform: (e: Konva.KonvaEventObject<Event>) => void;
  onDblClick: () => void;
}

const AssetToken: React.FC<AssetTokenProps> = ({ asset, onSelect, onTransform, onDblClick }) => {
  const [image] = useImage(asset.src, 'anonymous');
  const shapeRef = useRef<Konva.Image>(null);

  return (
    <Image
      image={image}
      id={asset.id}
      x={asset.x}
      y={asset.y}
      width={asset.width}
      height={asset.height}
      rotation={asset.rotation || 0}
      draggable
      name="asset-image"
      onClick={onSelect}
      onTap={onSelect}
      ref={shapeRef}
      onTransform={onTransform}
      onDragEnd={onTransform} // Reutiliza a lógica para salvar o estado
      onDblClick={onDblClick}
    />
  );
};

const MapPage: React.FC = () => {
  const { mapId } = useParams<{ mapId: string }>();
  const { currentUser } = useAuth();
  const [isMaster, setIsMaster] = useState(false);
  const [layers, setLayers] = useState<Layer[]>([
    { id: `layer-${Date.now()}`, name: 'Camada 1', isVisible: true, tokens: [], assets: [], lines: [], shapes: [] }
  ]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(layers[0]?.id || null);
  const [drawingShape, setDrawingShape] = useState<any>(null);
  const [paintedCells, setPaintedCells] = useState<PaintedCell[]>([]);
  const [fogPath, setFogPath] = useState<number[]>([]);
  const [fogPaths, setFogPaths] = useState<any[]>([]);
  const [isFogEnabled, setIsFogEnabled] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('select');
  const [lineColor, setLineColor] = useState('#ffffff');
  const [measurePoints, setMeasurePoints] = useState<number[]>([]);
  const [measureDistance, setMeasureDistance] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionRect, setSelectionRect] = useState({ x1: 0, y1: 0, x2: 0, y2: 0, visible: false });
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
  const trRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Garante que haja sempre uma camada ativa se houver camadas
  useEffect(() => {
    if (!activeLayerId && layers.length > 0) {
      setActiveLayerId(layers[0].id);
    }
  }, [layers, activeLayerId]);

  useEffect(() => {
    if (trRef.current) {
      const stage = stageRef.current;
      if (!stage) return;

      const selectedNodes = selectedIds.map(id => stage.findOne('#' + id)).filter((node): node is Konva.Node => node !== null);
      trRef.current.nodes(selectedNodes);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [selectedIds]);

  const saveStateToHistory = () => {
    const currentState = { layers, paintedCells };
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(currentState);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      const prevState = history[historyStep - 1];
      setLayers(prevState.layers);
      setPaintedCells(prevState.paintedCells);
      setHistoryStep(historyStep - 1);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const nextState = history[historyStep + 1];
      setLayers(nextState.layers);
      setPaintedCells(nextState.paintedCells);
      setHistoryStep(historyStep + 1);
    }
  };

  // Efeito para carregar e ouvir os dados do mapa em tempo real
  useEffect(() => {
    if (!mapId) return;
    const mapRef = doc(db, 'maps', mapId);

    const unsubscribe = onSnapshot(mapRef, (mapSnap) => {
      if (mapSnap.exists()) {
        const data = mapSnap.data();
        if (currentUser && data.ownerId === currentUser.uid) {
          setIsMaster(true);
        }
        if (data.mapState) {
          const state = JSON.parse(data.mapState);
          const loadedLayers = state.layers || [{ id: `layer-${Date.now()}`, name: 'Camada 1', isVisible: true, tokens: [], assets: [], lines: [], shapes: [] }];
          setLayers(loadedLayers);
          setPaintedCells(state.paintedCells || []);
          setFogPaths(state.fogPaths || []);
          setIsFogEnabled(state.isFogEnabled !== false); // Padrão para true se não definido
          setBackgroundColor(state.backgroundColor || '#1a1f2c');
        }
      } else {
        console.error("Mapa não encontrado!");
      }
    });

    // Limpa o listener quando o componente é desmontado
    return () => unsubscribe();
  }, [mapId, currentUser]);

  // Efeito para salvar os dados do mapa
  useEffect(() => {
    if (!mapId) return;
    const saveMapState = async () => {
      const mapRef = doc(db, 'maps', mapId);
      const mapState = JSON.stringify({ layers, paintedCells, fogPaths, isFogEnabled, backgroundColor });
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
  }, [layers, paintedCells, fogPaths, isFogEnabled, backgroundColor, mapId]);


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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // 1. Deselecionar se clicar no palco
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedIds([]);
    }

    // 2. Iniciar seleção de arrastar se clicar no palco
    if (e.target === e.target.getStage()) {
      const pos = e.target.getStage()?.getPointerPosition();
      if (pos) {
        setSelectionRect({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y, visible: true });
      }
      return;
    }

    if (drawingMode === 'fog') {
      setDrawing(true);
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const transform = stage.getAbsoluteTransform().copy().invert();
      const truePos = transform.point(pos);
      setFogPath([truePos.x, truePos.y]);
      return;
    }

    if (drawingMode === 'paint') {
      setDrawing(true);
      paintCell(e);
      return;
    }

    if (drawingMode === 'measure') {
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const transform = stage.getAbsoluteTransform().copy().invert();
      const truePos = transform.point(pos);
      setMeasurePoints([truePos.x, truePos.y, truePos.x, truePos.y]);
      setMeasureDistance('0 m');
      setDrawing(true);
      return;
    }

    if (drawingMode === 'circle' || drawingMode === 'square') {
      setDrawing(true);
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const transform = stage.getAbsoluteTransform().copy().invert();
      const truePos = transform.point(pos);
      setDrawingShape({
        type: drawingMode,
        x: truePos.x,
        y: truePos.y,
        width: 0,
        height: 0,
        radius: 0,
        color: lineColor,
      });
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
      id: `line-${Date.now()}`,
      color: lineColor,
      mode: drawingMode,
    };
    
    setLayers(layers.map(layer => {
      if (layer.id === activeLayerId) {
        return { ...layer, lines: [...layer.lines, newLine] };
      }
      return layer;
    }));
  };
  
  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Atualizar retângulo de seleção
    if (selectionRect.visible) {
      const pos = e.target.getStage()?.getPointerPosition();
      if (pos) {
        setSelectionRect({
          ...selectionRect,
          x2: pos.x,
          y2: pos.y,
        });
      }
      return;
    }

    if (!drawing) return;

    if (drawingMode === 'paint') {
      paintCell(e);
      return;
    }

    if (drawingMode === 'fog') {
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const transform = stage.getAbsoluteTransform().copy().invert();
      const truePos = transform.point(pos);
      const newPath = fogPath.concat([truePos.x, truePos.y]);
      setFogPath(newPath);
      return;
    }

    if (drawingMode === 'measure') {
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const transform = stage.getAbsoluteTransform().copy().invert();
      const truePos = transform.point(pos);
      
      const newPoints = [measurePoints[0], measurePoints[1], truePos.x, truePos.y];
      setMeasurePoints(newPoints);

      const dx = newPoints[2] - newPoints[0];
      const dy = newPoints[3] - newPoints[1];
      const distanceInPixels = Math.sqrt(dx * dx + dy * dy);
      const distanceInMeters = (distanceInPixels / GRID_SIZE) * 1.5; // Assumindo 1.5m por quadrado
      setMeasureDistance(`${distanceInMeters.toFixed(1)} m`);
      return;
    }

    if (drawingMode === 'circle' || drawingMode === 'square') {
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const transform = stage.getAbsoluteTransform().copy().invert();
      const truePos = transform.point(pos);
      
      setDrawingShape((prev: any) => {
        if (!prev) return null;
        if (prev.type === 'circle') {
          const dx = truePos.x - prev.x;
          const dy = truePos.y - prev.y;
          const radius = Math.sqrt(dx * dx + dy * dy);
          return { ...prev, radius };
        }
        if (prev.type === 'square') {
          return { ...prev, width: truePos.x - prev.x, height: truePos.y - prev.y };
        }
        return prev;
      });
      return;
    }

    if (drawingMode !== 'line' && drawingMode !== 'free') return;
  
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
  
    const transform = stage.getAbsoluteTransform().copy().invert();
    const truePos = transform.point(pos);
  
    setLayers(layers.map(layer => {
      if (layer.id === activeLayerId) {
        let lastLine = layer.lines[layer.lines.length - 1];
        if (lastLine) {
          if (lastLine.mode === 'line') {
            lastLine.points = [lastLine.points[0], lastLine.points[1], truePos.x, truePos.y];
          } else {
            lastLine.points = lastLine.points.concat([truePos.x, truePos.y]);
          }
          const newLines = [...layer.lines];
          newLines.splice(newLines.length - 1, 1, lastLine);
          return { ...layer, lines: newLines };
        }
      }
      return layer;
    }));
  };

  const handleMouseUp = () => {
    // Finalizar seleção de arrastar
    if (selectionRect.visible) {
      setSelectionRect({ ...selectionRect, visible: false });
      const stage = stageRef.current;
      if (!stage) return;

      const box = {
        x: Math.min(selectionRect.x1, selectionRect.x2),
        y: Math.min(selectionRect.y1, selectionRect.y2),
        width: Math.abs(selectionRect.x1 - selectionRect.x2),
        height: Math.abs(selectionRect.y1 - selectionRect.y2),
      };
      
      const allNodes = stage.find('.token-group, .asset-image');
      const selected = allNodes.filter((node) =>
        Konva.Util.haveIntersection(box, node.getClientRect())
      );
      setSelectedIds(selected.map(node => node.id()));
    }

    if (drawing) {
      if (drawingMode === 'line' || drawingMode === 'free') {
        saveStateToHistory();
      } else if (drawingMode === 'fog' && fogPath.length > 0) {
        setFogPaths([...fogPaths, fogPath]);
        setFogPath([]);
      } else if ((drawingMode === 'circle' || drawingMode === 'square') && drawingShape) {
        setLayers(layers.map(layer => {
          if (layer.id === activeLayerId) {
            const newShape = { ...drawingShape, id: `shape-${Date.now()}` };
            return { ...layer, shapes: [...layer.shapes, newShape] };
          }
          return layer;
        }));
        setDrawingShape(null);
      }
    }
    setDrawing(false);
    if (drawingMode === 'measure') {
      // Opcional: limpar a linha de medição após um tempo ou no próximo clique
      setTimeout(() => {
        setMeasurePoints([]);
        setMeasureDistance(null);
      }, 3000); // Limpa após 3 segundos
    }
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
    if (!activeLayerId) return;
    const newToken = {
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height,
      id: `token-${Date.now()}`,
      radius: 20,
      fill: 'red',
      name: 'Token'
    };
    setLayers(layers.map(layer => {
      if (layer.id === activeLayerId) {
        return { ...layer, tokens: [...layer.tokens, newToken] };
      }
      return layer;
    }));
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
    setLayers(layers.map(layer => {
      if (layer.id === activeLayerId) {
        return { ...layer, tokens: [...layer.tokens, newCreatureToken] };
      }
      return layer;
    }));
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
    setLayers(layers.map(layer => {
      if (layer.id === activeLayerId) {
        return { ...layer, tokens: [...layer.tokens, newPlayerToken] };
      }
      return layer;
    }));
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
    setLayers(layers.map(layer => {
      if (layer.id === activeLayerId) {
        return { ...layer, assets: [...layer.assets, newAsset] };
      }
      return layer;
    }));
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
      setLayers(layers.map(l => ({ ...l, tokens: [], assets: [], lines: [], shapes: [] })));
      setPaintedCells([]);
      setSelectedIds([]);
    }
  };

  const handleAddLayer = () => {
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: `Camada ${layers.length + 1}`,
      isVisible: true,
      tokens: [],
      assets: [],
      lines: [],
      shapes: [],
    };
    setLayers([...layers, newLayer]);
    setActiveLayerId(newLayer.id);
  };

  const handleDeleteLayer = (id: string) => {
    if (layers.length <= 1) {
      alert("Não é possível deletar a última camada.");
      return;
    }
    if (window.confirm("Tem certeza que deseja deletar esta camada e todo o seu conteúdo?")) {
      const newLayers = layers.filter(l => l.id !== id);
      setLayers(newLayers);
      if (activeLayerId === id) {
        setActiveLayerId(newLayers[0]?.id || null);
      }
    }
  };

  const handleRenameLayer = (id: string, newName: string) => {
    setLayers(layers.map(l => l.id === id ? { ...l, name: newName } : l));
  };

  const handleLayerToggleVisibility = (id: string) => {
    setLayers(layers.map(l => l.id === id ? { ...l, isVisible: !l.isVisible } : l));
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
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
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
          {/* Renderiza o conteúdo de cada camada */}
          {layers.map(layer => layer.isVisible && (
            <React.Fragment key={layer.id}>
              {/* Formas */}
              {layer.shapes.map((shape) => {
                if (shape.type === 'circle') {
                  return <Circle key={shape.id} x={shape.x} y={shape.y} radius={shape.radius} stroke={shape.color} strokeWidth={2} />;
                }
                if (shape.type === 'square') {
                  return <Rect key={shape.id} x={shape.x} y={shape.y} width={shape.width} height={shape.height} stroke={shape.color} strokeWidth={2} />;
                }
                return null;
              })}
              {/* Linhas */}
              {layer.lines.map((line) => (
                <Line
                  key={line.id}
                  points={line.points}
                  stroke={selectedIds.includes(line.id) ? 'cyan' : line.color || 'white'}
                  strokeWidth={5}
                  tension={0.5}
                  lineCap="round"
                  onClick={() => { if (drawingMode === 'select') setSelectedIds([line.id]); }}
                  onTap={() => { if (drawingMode === 'select') setSelectedIds([line.id]); }}
                />
              ))}
              {/* Assets */}
              {layer.assets.map((asset) => (
                <AssetToken
                  key={asset.id}
                  asset={asset}
                  onSelect={() => { if (drawingMode === 'select') setSelectedIds([asset.id]); }}
                  onDblClick={() => {
                    setEditingAsset(asset);
                    setAssetEditModalOpen(true);
                  }}
                  onTransform={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    const rotation = node.rotation();
                    const x = node.x();
                    const y = node.y();
                    const snappedX = Math.round(x / GRID_SIZE) * GRID_SIZE;
                    const snappedY = Math.round(y / GRID_SIZE) * GRID_SIZE;

                    setLayers(layers.map(l => ({
                      ...l,
                      assets: l.assets.map(a => {
                        if (a.id === asset.id) {
                          return {
                            ...a,
                            x: snappedX,
                            y: snappedY,
                            width: Math.max(5, a.width * scaleX),
                            height: Math.max(5, a.height * scaleY),
                            rotation,
                          };
                        }
                        return a;
                      })
                    })));
                    node.scaleX(1);
                    node.scaleY(1);
                  }}
                />
              ))}
              {/* Tokens */}
              {layer.tokens.map((token) => (
                <Token
                  key={token.id}
                  token={token}
                  isSelected={selectedIds.includes(token.id)}
                  onSelect={() => setSelectedIds([token.id])}
                  onDragEnd={(e) => {
                    const id = e.target.id();
                    setLayers(layers.map(l => ({
                      ...l,
                      tokens: l.tokens.map(t => {
                        if (t.id === id) {
                          const snappedX = Math.round(e.target.x() / GRID_SIZE) * GRID_SIZE;
                          const snappedY = Math.round(e.target.y() / GRID_SIZE) * GRID_SIZE;
                          return { ...t, x: snappedX, y: snappedY };
                        }
                        return t;
                      })
                    })));
                  }}
                  onDblClick={() => {
                    const currentToken = layer.tokens.find(t => t.id === token.id);
                    if (currentToken) {
                      setEditingToken(currentToken);
                      setTokenEditModalOpen(true);
                    }
                  }}
                />
              ))}
            </React.Fragment>
          ))}
          {/* Desenho da forma atual */}
          {drawingShape && (
            drawingShape.type === 'circle' ? (
              <Circle x={drawingShape.x} y={drawingShape.y} radius={drawingShape.radius} stroke={drawingShape.color} strokeWidth={2} dash={[10, 5]} />
            ) : (
              <Rect x={drawingShape.x} y={drawingShape.y} width={drawingShape.width} height={drawingShape.height} stroke={drawingShape.color} strokeWidth={2} dash={[10, 5]} />
            )
          )}
          <Transformer ref={trRef} />
          <Rect
            x={Math.min(selectionRect.x1, selectionRect.x2)}
            y={Math.min(selectionRect.y1, selectionRect.y2)}
            width={Math.abs(selectionRect.x1 - selectionRect.x2)}
            height={Math.abs(selectionRect.y1 - selectionRect.y2)}
            fill="rgba(0, 160, 255, 0.3)"
            visible={selectionRect.visible}
          />
        </Layer>
        {isFogEnabled && (
          <Layer listening={false}>
            {/* Camada da Névoa de Guerra */}
            <Rect
              x={-10000}
            y={-10000}
            width={20000}
            height={20000}
            fill="black"
            opacity={0.8}
          />
          {fogPaths.map((path, i) => (
            <Line
              key={i}
              points={path}
              closed
              fill="black"
              globalCompositeOperation="destination-out"
            />
          ))}
          {fogPath.length > 0 && (
            <Line
              points={fogPath}
              closed
              fill="black"
              globalCompositeOperation="destination-out"
            />
          )}
          </Layer>
        )}
        <Layer>
          {/* Camada de UI - Medição, etc. */}
          {measurePoints.length > 0 && (
            <>
              <Line
                points={measurePoints}
                stroke="cyan"
                strokeWidth={2}
                dash={[10, 5]}
              />
              <Rect
                x={measurePoints[2] - 10}
                y={measurePoints[3] + 10}
                width={measureDistance ? measureDistance.length * 8 + 10 : 0}
                height={20}
                fill="rgba(0,0,0,0.5)"
                cornerRadius={5}
              />
              <Text
                x={measurePoints[2] - 5}
                y={measurePoints[3] + 12}
                text={measureDistance || ''}
                fill="white"
                fontSize={14}
              />
            </>
          )}
        </Layer>
      </Stage>
      <LayerManager
        layers={layers}
        activeLayerId={activeLayerId}
        isMaster={isMaster}
        onLayerSelect={setActiveLayerId}
        onLayerToggleVisibility={handleLayerToggleVisibility}
        onAddLayer={handleAddLayer}
        onRenameLayer={handleRenameLayer}
        onDeleteLayer={handleDeleteLayer}
      />
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
          <button onClick={() => setDrawingMode('measure')} className={drawingMode === 'measure' ? 'active' : ''} title="Medir Distância">📏</button>
          <button onClick={() => setIsFogEnabled(!isFogEnabled)} title={isFogEnabled ? "Desativar Névoa" : "Ativar Névoa"}>{isFogEnabled ? '🌫️' : '☀️'}</button>
          <button onClick={() => setDrawingMode('fog')} className={drawingMode === 'fog' ? 'active' : ''} title="Revelar Névoa">👁️</button>
          <button onClick={() => setFogPaths([])} title="Resetar Revelação">🔄</button>
          <button onClick={() => setDrawingMode('paint')} className={drawingMode === 'paint' ? 'active' : ''}>Pintar</button>
          <button onClick={() => setDrawingMode('line')} className={drawingMode === 'line' ? 'active' : ''}>Linha</button>
          <button onClick={() => setDrawingMode('free')} className={drawingMode === 'free' ? 'active' : ''}>Desenhar</button>
          <button onClick={() => setDrawingMode('square')} className={drawingMode === 'square' ? 'active' : ''} title="Quadrado">⬜</button>
          <button onClick={() => setDrawingMode('circle')} className={drawingMode === 'circle' ? 'active' : ''} title="Círculo">⚪</button>
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
              if (selectedIds.length > 0) {
                setLayers(layers.map(l => ({
                  ...l,
                  tokens: l.tokens.filter(t => !selectedIds.includes(t.id)),
                  assets: l.assets.filter(a => !selectedIds.includes(a.id)),
                  lines: l.lines.filter(line => !selectedIds.includes(line.id)),
                  shapes: l.shapes.filter(s => !selectedIds.includes(s.id)),
                })));
                setSelectedIds([]);
              }
            }}
            disabled={selectedIds.length === 0}
          >
            Deletar
          </button>
          <button onClick={clearMap}>Limpar</button>
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
            setLayers(layers.map(l => ({
              ...l,
              assets: l.assets.map(a => {
                if (a.id === editingAsset.id) {
                  return { ...a, width: newWidth, height: newHeight };
                }
                return a;
              })
            })));
          }
        }}
      />
      <TokenEditModal
        isOpen={isTokenEditModalOpen}
        onClose={() => setTokenEditModalOpen(false)}
        token={editingToken}
        onSave={(newName, newRadius, newImage, newAura) => {
          if (editingToken) {
            setLayers(layers.map(l => ({
              ...l,
              tokens: l.tokens.map(t => {
                if (t.id === editingToken.id) {
                  return { ...t, name: newName, radius: newRadius, image: newImage, aura: newAura };
                }
                return t;
              })
            })));
          }
        }}
      />
    </div>
  );
};

export default MapPage;
