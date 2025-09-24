import React, { useRef, useEffect, useState } from 'react';
import { Group, Image, Circle, Text, Label, Tag } from 'react-konva';
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
  const labelRef = useRef<Konva.Label>(null);
  const [labelWidth, setLabelWidth] = useState(0);

  useEffect(() => {
    if (labelRef.current) {
      setLabelWidth(labelRef.current.width());
    }
  }, [token.name]);

  const scale = image ? Math.max((token.radius * 2) / image.width, (token.radius * 2) / image.height) : 1;
  const scaledWidth = image ? image.width * scale : 0;
  const scaledHeight = image ? image.height * scale : 0;
  const imageX = -scaledWidth / 2;
  const imageY = -scaledHeight / 2;

  return (
    <React.Fragment>
      {token.image && image ? (
        <Group
          id={token.id}
          x={token.x}
          y={token.y}
          draggable
          onDragEnd={onDragEnd}
          onDblClick={onDblClick}
          onClick={onSelect}
          onTap={onSelect}
        >
          {/* Aura */}
          {token.aura && token.aura.radius > 0 && (
            <Circle
              radius={token.aura.radius}
              fill={token.aura.color}
              opacity={0.5}
              listening={false}
            />
          )}
          {/* Hitbox para tornar o grupo clicável e arrastável */}
          <Circle
            radius={token.radius}
            fill="transparent"
          />
          <Group
            clipFunc={(ctx) => {
              ctx.arc(0, 0, token.radius, 0, Math.PI * 2, false);
            }}
            listening={false}
          >
            <Image
              image={image}
              x={imageX}
              y={imageY}
              width={scaledWidth}
              height={scaledHeight}
            />
          </Group>
          <Circle
            radius={token.radius}
            stroke={isSelected ? 'cyan' : '#daa520'}
            strokeWidth={isSelected ? 4 : 2}
            listening={false}
          />
        </Group>
      ) : (
        <Group
          id={token.id}
          x={token.x}
          y={token.y}
          draggable
          onDragEnd={onDragEnd}
          onDblClick={onDblClick}
          onClick={onSelect}
          onTap={onSelect}
        >
          {/* Aura */}
          {token.aura && token.aura.radius > 0 && (
            <Circle
              radius={token.aura.radius}
              fill={token.aura.color}
              opacity={0.5}
              listening={false}
            />
          )}
          <Circle
            radius={token.radius}
            fill={token.fill}
            stroke={isSelected ? 'cyan' : undefined}
            strokeWidth={isSelected ? 3 : 0}
          />
        </Group>
      )}
      <Label
        ref={labelRef}
        x={token.x}
        y={token.y + token.radius + 5}
        offsetX={labelWidth / 2}
        listening={false}
      >
        <Tag
          fill="rgba(0, 0, 0, 0.7)"
          cornerRadius={8}
        />
        <Text
          text={token.name}
          align="center"
          fill="white"
          fontSize={12}
          padding={5}
        />
      </Label>
    </React.Fragment>
  );
};

export default Token;
