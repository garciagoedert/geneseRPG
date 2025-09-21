import React from 'react';
import './InventoryWidget.css';

interface Item {
  id: string;
  name: string;
  quantity: number;
}

interface InventoryWidgetProps {
  items: Item[];
  onItemClick: (item: Item) => void;
}

const InventoryWidget: React.FC<InventoryWidgetProps> = ({ items, onItemClick }) => {
  return (
    <div className="widget inventory-widget">
      <div className="widget-header">
        <h2>Inventário do Grupo</h2>
      </div>
      <div className="widget-content">
        <ul className="inventory-widget-list">
          {items.length > 0 ? (
            items.map(item => (
              <li key={item.id} className="inventory-widget-item" onClick={() => onItemClick(item)} title="Clique para remover">
                <span className="item-name">{item.name}</span>
                <span className="item-quantity">x{item.quantity}</span>
              </li>
            ))
          ) : (
            <p>O inventário do grupo está vazio.</p>
          )}
        </ul>
      </div>
    </div>
  );
};

export default InventoryWidget;
