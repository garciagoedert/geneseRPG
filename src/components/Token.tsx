import React from 'react';
import { Image, Circle, Text } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';

interface TokenProps {
  token: any;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDblClick: () => void;
}

const Token: React.FC<TokenProps> = ({ token, isSelected, onSelect, onDragEnd, onDblClick }) => {
  const [image] = useImage(token.image, 'anonymous');

  return (
    <React.Fragment>
      {token.image && image ? (
        <Image
          image={image}
          id={token.id}
          x={token.x - token.radius}
          y={token.y - token.radius}
          width={token.radius * 2}
          height={token.radius * 2}
          draggable
          onClick={onSelect}
          onTap={onSelect}
          stroke={isSelected ? 'cyan' : undefined}
          strokeWidth={isSelected ? 3 : 0}
          onDragEnd={onDragEnd}
          onDblClick={onDblClick}
        />
      ) : (
        <Circle
          id={token.id}
          x={token.x}
          y={token.y}
          radius={token.radius}
          fill={token.fill}
          draggable
          onClick={onSelect}
          onTap={onSelect}
          stroke={isSelected ? 'cyan' : undefined}
          strokeWidth={isSelected ? 3 : 0}
          onDragEnd={onDragEnd}
          onDblClick={onDblClick}
        />
      )}
      <Text
        text={token.name}
        x={token.x - token.radius}
        y={token.y + token.radius + 5}
        width={token.radius * 2}
        align="center"
        fill="white"
        fontSize={12}
        listening={false}
      />
    </React.Fragment>
  );
};

export default Token;
