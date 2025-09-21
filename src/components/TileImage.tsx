import React from 'react';
import { Image } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';

const GRID_SIZE = 32;

interface TileImageProps {
  tile: {
    id: string;
    x: number;
    y: number;
    src?: string;
    crop?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
}

const TileImage: React.FC<TileImageProps> = ({ tile }) => {
  // Só tenta carregar a imagem se a fonte (src) existir
  const [image] = useImage(tile.src || '', 'anonymous');

  if (!tile.src || !tile.crop) {
    // Retorna null ou um placeholder se não houver imagem
    return null;
  }

  return (
    <Image
      key={tile.id}
      image={image}
      x={tile.x}
      y={tile.y}
      width={tile.crop.width}
      height={tile.crop.height}
      crop={tile.crop}
    />
  );
};

export default TileImage;
