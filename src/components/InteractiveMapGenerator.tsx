import React, { useRef, useEffect, useState } from 'react';
import './InteractiveMapGenerator.css';

interface InteractiveMapGeneratorProps {
  onClose: () => void;
  onMapGenerated: (mapDataUrl: string) => void;
}

// --- Tipos e Constantes ---
const TILE_SIZE = 40;

interface MapTile {
    x: number;
    y: number;
    texture: string;
}

interface MapObject {
    type: string;
    x: number;
    y: number;
    w: number;
    h: number;
    rot: number;
    shadow?: boolean;
    shadowPass?: boolean;
}

const PALETTES: { [key: string]: { terrains: string[], objects: string[] } } = {
    floresta: { terrains: ['grass', 'dirt', 'water'], objects: ['tree', 'rock', 'bush'] },
    mansao: { terrains: ['woodFloor', 'carpetFloor'], objects: ['table', 'bed', 'chair', 'bookshelf', 'pillar'] },
    cripta: { terrains: ['stoneFloor', 'crackedStoneFloor'], objects: ['sarcophagus', 'pillar', 'bones', 'chest'] },
    taverna: { terrains: ['woodFloor', 'stoneFloor'], objects: ['table', 'chair', 'bar'] },
    masmorra: { terrains: ['stoneFloor', 'crackedStoneFloor', 'water'], objects: ['pillar', 'chest', 'bones', 'grate'] }
};

const objectBaseSizes: { [key: string]: { w: number, h: number } } = {
    tree: {w:TILE_SIZE, h:TILE_SIZE}, table:{w:TILE_SIZE*1.5, h:TILE_SIZE}, bed:{w:TILE_SIZE, h:TILE_SIZE*2},
    sarcophagus:{w:TILE_SIZE, h:TILE_SIZE*2}, chair:{w:TILE_SIZE*0.7, h:TILE_SIZE*0.7}, bookshelf:{w:TILE_SIZE*2, h:TILE_SIZE*0.6},
    bar:{w:TILE_SIZE*3, h:TILE_SIZE}, rock:{w:TILE_SIZE, h:TILE_SIZE}, pillar:{w:TILE_SIZE*0.8, h:TILE_SIZE*0.8},
    wall:{w:TILE_SIZE, h:TILE_SIZE}, bush:{w:TILE_SIZE, h:TILE_SIZE}, bones:{w:TILE_SIZE, h:TILE_SIZE},
    chest:{w:TILE_SIZE*0.9, h:TILE_SIZE*0.7}, grate:{w:TILE_SIZE, h:TILE_SIZE}
};

// --- Classe do Gerador de Mapas (Lógica do Estúdio Titã) ---
class MapGenerator {
    private ctx: CanvasRenderingContext2D;
    private textures: { [key: string]: CanvasPattern } = {};
    private mapData: { tiles: MapTile[], objects: MapObject[] } = { tiles: [], objects: [] };

    constructor(private canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d')!;
        this.createTextures();
    }

    private createTextures() {
        const createPattern = (color1: string, color2: string, details = 15) => {
           const patternCanvas = document.createElement('canvas');
           patternCanvas.width = TILE_SIZE; patternCanvas.height = TILE_SIZE;
           const pCtx = patternCanvas.getContext('2d')!;
           pCtx.fillStyle = color1; pCtx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
           for (let i = 0; i < details; i++) {
               pCtx.fillStyle = `${color2}${Math.floor(Math.random() * 80 + 20).toString(16)}`;
               pCtx.fillRect(Math.random() * TILE_SIZE, Math.random() * TILE_SIZE, Math.random() * 3 + 1, Math.random() * 3 + 1);
           }
           return this.ctx.createPattern(patternCanvas, 'repeat')!;
       };
       this.textures = {
           grass: createPattern('#2a452a', '#3a593a'), dirt: createPattern('#5a4a3a', '#6b5b4a'),
           woodFloor: createPattern('#6B5B40', '#7f6c4c'), stoneWall: createPattern('#3a3a42', '#42424a'),
           stoneFloor: createPattern('#5a5a62', '#62626a'), crackedStoneFloor: createPattern('#505058', '#404048', 30),
           carpetFloor: createPattern('#803030', '#602020'), water: createPattern('#304080', '#405090'),
       };
    }

    private draw() {
        this.ctx.fillStyle = '#1a1a1e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        if (!this.mapData.tiles.length) return;

        this.mapData.tiles.forEach(tile => {
            this.ctx.fillStyle = this.textures[tile.texture] || 'magenta';
            this.ctx.fillRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        });
        
        const sortedObjects = this.mapData.objects.sort((a, b) => (a.y + (a.h || TILE_SIZE)) - (b.y + (b.h || TILE_SIZE)));
        sortedObjects.forEach(obj => {
             const drawer = this.objectDrawers[obj.type];
             if (!drawer) return;
             if (obj.shadow) {
                this.ctx.save();
                this.ctx.globalAlpha = 0.4; this.ctx.fillStyle = 'black';
                this.ctx.translate(obj.x + 5, obj.y + 5);
                this.ctx.transform(1, 0, -0.3, 1, 0, 0);
                drawer(this.ctx, { ...obj, x: 0, y: 0, shadowPass: true });
                this.ctx.restore();
             }
             drawer(this.ctx, obj);
        });
    }

    public generateMap(config: { location: string, complexity: number, mapWidth: number, mapHeight: number }) {
        this.mapData = { tiles: [], objects: [] };
        const generator = this.generators[config.location as keyof typeof this.generators];
        if (generator) {
            generator(config, config.mapWidth, config.mapHeight);
        }
        this.draw();
    }

    private generators = {
        floresta: (cfg: any, cols: number, rows: number) => {
            for (let y = 0; y < rows; y++) { for (let x = 0; x < cols; x++) { this.mapData.tiles.push({ x, y, texture: 'grass' }); } }
            const numObjects = Math.floor((cols * rows) * (cfg.complexity / 250));
            for (let i = 0; i < numObjects; i++) {
                const objType = this.choice(PALETTES.floresta.objects);
                const {w, h} = this.getObjectDimensions({type: objType, rot: 0});
                const x = this.rand(0, cols - 1), y = this.rand(0, rows - 1);
                this.mapData.objects.push({ type: objType, x: x*TILE_SIZE, y: y*TILE_SIZE, w, h, rot: 0, shadow: true });
            }
        },
        mansao: (cfg: any, c: number, r: number) => this.createInterior(cfg, c, r, 'woodFloor', PALETTES.mansao.objects),
        cripta: (cfg: any, c: number, r: number) => this.createInterior(cfg, c, r, 'stoneFloor', PALETTES.cripta.objects),
        taverna: (cfg: any, c: number, r: number) => this.createInterior(cfg, c, r, 'woodFloor', PALETTES.taverna.objects),
        masmorra: (cfg: any, c: number, r: number) => this.createInterior(cfg, c, r, 'stoneFloor', PALETTES.masmorra.objects),
    };

    private createInterior(cfg: any, cols: number, rows: number, floorTexture: string, objectTypes: string[]) {
        for (let y = 0; y < rows; y++) { for (let x = 0; x < cols; x++) { this.mapData.tiles.push({ x, y, texture: 'stoneWall' }); } }
        const floorCoords = new Set<string>();
        let x = Math.floor(cols / 2), y = Math.floor(rows / 2);
        for (let i = 0; i < (cols * rows * (cfg.complexity / 100)) * 5; i++) {
            floorCoords.add(`${x},${y}`);
            const dir = this.rand(0, 3);
            if (dir === 0 && x < cols - 2) x++; else if (dir === 1 && x > 1) x--;
            else if (dir === 2 && y < rows - 2) y++; else if (dir === 3 && y > 1) y--;
        }
        floorCoords.forEach(coord => {
            const [fx, fy] = coord.split(',').map(Number);
            const tileIndex = fy * cols + fx;
            if (this.mapData.tiles[tileIndex]) { this.mapData.tiles[tileIndex].texture = floorTexture; }
        });
        const floorTilesArray = Array.from(floorCoords).map(c => c.split(',').map(Number));
        const objectCount = Math.floor(floorTilesArray.length * (cfg.complexity / 500));
        for (let i = 0; i < objectCount; i++) {
            const [tileX, tileY] = this.choice(floorTilesArray);
            const type = this.choice(objectTypes);
            const { w, h } = this.getObjectDimensions({ type, rot: 0 });
            this.mapData.objects.push({ type, x: tileX*TILE_SIZE, y: tileY*TILE_SIZE, w, h, rot: this.rand(0, 3), shadow: true });
        }
    }

    private rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    private choice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    
    private getObjectDimensions(obj: { type: string, rot: number }) {
        if (!obj || !obj.type) return { w: TILE_SIZE, h: TILE_SIZE };
        const base = objectBaseSizes[obj.type] || { w: TILE_SIZE, h: TILE_SIZE };
        return obj.rot % 2 !== 0 ? { w: base.h, h: base.w } : { w: base.w, h: base.h };
    }

    private objectDrawers: { [key: string]: (c: CanvasRenderingContext2D, o: MapObject) => void } = {
        wall: (c, o) => { if (!o.shadowPass) { c.fillStyle = this.textures.stoneWall; c.fillRect(o.x, o.y, o.w, o.h); } },
        tree: (c, o) => {
            const s = TILE_SIZE;
            if(o.shadowPass) { c.beginPath(); c.ellipse(o.x + s*0.5, o.y + s*0.7, s*0.6, s*0.3, 0, 0, 2*Math.PI); c.fill(); return; }
            c.fillStyle = '#4a2a1a'; c.fillRect(o.x + s*0.4, o.y + s*0.4, s*0.2, s*0.6);
            c.fillStyle = '#2a452a'; c.beginPath(); c.arc(o.x + s*0.5, o.y + s*0.2, s*0.5, 0, 2*Math.PI); c.fill();
        },
        table: (c, o) => {
            const { w, h } = this.getObjectDimensions(o);
            if(o.shadowPass){ c.fillRect(o.x,o.y,w,h); return; }
            c.fillStyle = '#4a2a1a'; c.fillRect(o.x, o.y, w, h);
            c.fillStyle = '#654321'; c.fillRect(o.x+w*0.05, o.y+h*0.05, w*0.9, h*0.9);
        },
        bed: (c, o) => {
            const { w, h } = this.getObjectDimensions(o);
            if(o.shadowPass){ c.fillRect(o.x,o.y,w,h); return; }
            c.fillStyle = '#4a2a1a'; c.fillRect(o.x, o.y, w, h);
            c.fillStyle = '#b0b0b0'; c.fillRect(o.x+w*0.1, o.y+h*0.05, w*0.8, h*0.9);
            c.fillStyle = '#ffffff'; c.fillRect(o.x+w*0.1, o.y+h*0.05, w*0.8, h*0.2);
        },
        sarcophagus: (c, o) => {
            const { w, h } = this.getObjectDimensions(o);
            if(o.shadowPass){ c.fillRect(o.x,o.y,w,h); return; }
            c.fillStyle = '#6a6a72'; c.fillRect(o.x, o.y, w, h);
            c.fillStyle = '#8a8a92'; c.fillRect(o.x+w*0.1, o.y+h*0.1, w*0.8, h*0.8);
        },
        chair: (c, o) => {
            const { w, h } = this.getObjectDimensions(o);
            if(o.shadowPass){ c.fillRect(o.x, o.y, w, h); return; }
            c.fillStyle = '#4a2a1a'; c.fillRect(o.x, o.y, w, h);
            c.fillStyle = '#654321'; c.fillRect(o.x, o.y + h * 0.4, w, h * 0.6);
        },
        bookshelf: (c, o) => {
            const { w, h } = this.getObjectDimensions(o);
            if(o.shadowPass){ c.fillRect(o.x, o.y, w, h); return; }
            c.fillStyle = '#4a2a1a'; c.fillRect(o.x, o.y, w, h);
            c.fillStyle = '#3a1a0a';
            c.fillRect(o.x, o.y + h*0.45, w, h*0.1);
            for(let i=0; i<w/5; i++){
                c.fillStyle = `hsl(${this.rand(0,360)}, 50%, 60%)`;
                c.fillRect(o.x + i*5 + 2, o.y + h*0.1, 4, h*0.35);
                c.fillRect(o.x + i*5 + 2, o.y + h*0.55, 4, h*0.35);
            }
        },
        bar: (c, o) => {
            const { w, h } = this.getObjectDimensions(o);
            if(o.shadowPass){ c.fillRect(o.x, o.y, w, h); return; }
            c.fillStyle = '#4a2a1a'; c.fillRect(o.x, o.y, w, h);
            c.fillStyle = '#654321'; c.fillRect(o.x, o.y, w, h * 0.2);
        },
        rock: (c, o) => {
            if(o.shadowPass){ c.beginPath(); c.ellipse(o.x+o.w/2, o.y+o.h/2, o.w/2, o.h/2, 0, 0, Math.PI*2); c.fill(); return; }
            c.fillStyle = '#8a8a92'; c.beginPath(); c.ellipse(o.x+o.w/2, o.y+o.h/2, o.w/2, o.h/2, 0, 0, Math.PI*2); c.fill();
            c.fillStyle = '#6a6a72'; c.beginPath(); c.ellipse(o.x+o.w/2, o.y+o.h/2, o.w/3, o.h/3, 0, 0, Math.PI*2); c.fill();
        },
        pillar: (c, o) => {
            const { w, h } = this.getObjectDimensions(o);
            if(o.shadowPass){ c.fillRect(o.x, o.y, w, h); return; }
            c.fillStyle = '#8a8a92'; c.fillRect(o.x, o.y, w, h);
            c.fillStyle = '#6a6a72'; c.fillRect(o.x + w*0.1, o.y + h*0.1, w*0.8, h*0.8);
        },
        bush: (c, o) => {
            if(o.shadowPass){ c.beginPath(); c.ellipse(o.x+o.w/2, o.y+o.h/2, o.w/2, o.h/2, 0, 0, Math.PI*2); c.fill(); return; }
            c.fillStyle = '#1a351a'; c.beginPath(); c.ellipse(o.x+o.w/2, o.y+o.h/2, o.w/2, o.h/2, 0, 0, Math.PI*2); c.fill();
        },
        bones: (c, o) => {
            if(o.shadowPass){ return; }
            c.fillStyle = '#EAEAEA'; c.fillRect(o.x+o.w*0.3, o.y+o.h*0.1, o.w*0.4, o.h*0.8);
            c.beginPath(); c.arc(o.x+o.w/2, o.y, o.w*0.2, 0, Math.PI*2); c.fill();
        },
        chest: (c, o) => {
            const { w, h } = this.getObjectDimensions(o);
            if(o.shadowPass){ c.fillRect(o.x, o.y, w, h); return; }
            c.fillStyle = '#4a2a1a'; c.fillRect(o.x, o.y, w, h);
            c.fillStyle = '#c59533'; c.fillRect(o.x, o.y + h*0.2, w, h*0.1);
        },
        grate: (c, o) => {
            if(o.shadowPass){ return; }
            c.fillStyle = '#333'; c.fillRect(o.x, o.y, o.w, o.h);
            c.fillStyle = '#111';
            for(let i=1; i<4; i++){ c.fillRect(o.x+o.w*(i/4)-2, o.y, 4, o.h); c.fillRect(o.x, o.y+o.h*(i/4)-2, o.w, 4);}
        },
    };
}

const InteractiveMapGenerator: React.FC<InteractiveMapGeneratorProps> = ({ onClose, onMapGenerated }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [location, setLocation] = useState('floresta');
  const [complexity, setComplexity] = useState(30);
  const [mapWidth, setMapWidth] = useState(30);
  const [mapHeight, setMapHeight] = useState(20);

  const handleGenerate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const generator = new MapGenerator(canvas);
    generator.generateMap({ location, complexity, mapWidth, mapHeight });
    
    const dataUrl = canvas.toDataURL('image/png');
    onMapGenerated(dataUrl);
    onClose();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = mapWidth * TILE_SIZE;
      canvas.height = mapHeight * TILE_SIZE;
    }
  }, [mapWidth, mapHeight]);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="title-font">Estúdio Cartográfico Titã</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="modal-body">
          <div className="generator-controls">
            <div className="control-card">
              <label>Local do Mapa</label>
              <select className="select-style" value={location} onChange={e => setLocation(e.target.value)}>
                <option value="floresta">Floresta Assombrada</option>
                <option value="mansao">Salão da Mansão</option>
                <option value="cripta">Cripta Ancestral</option>
                <option value="taverna">Taverna do Javali Risonho</option>
                <option value="masmorra">Masmorra do Desespero</option>
              </select>
            </div>
            <div className="control-card">
              <label>Dimensões (em tiles)</label>
              <div style={{display: 'flex', gap: '1rem'}}>
                <input type="number" value={mapWidth} onChange={e => setMapWidth(parseInt(e.target.value, 10))} className="input-style" placeholder="Largura" />
                <input type="number" value={mapHeight} onChange={e => setMapHeight(parseInt(e.target.value, 10))} className="input-style" placeholder="Altura" />
              </div>
            </div>
            <div className="control-card">
              <label>Complexidade</label>
              <input type="range" min="10" max="100" value={complexity} onChange={e => setComplexity(parseInt(e.target.value, 10))} />
            </div>
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
        <div className="modal-footer">
          <button onClick={handleGenerate} className="btn-primary">GERAR MAPA</button>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMapGenerator;
