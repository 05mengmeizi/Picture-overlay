import React, { useState } from 'react';
import { DndContext, PointerSensor, useSensors, closestCenter,useSensor } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable';
import { Flex, Tag } from 'antd';

interface Item {
  id: string | number;
  name: string;
}

interface DraggableTagListProps {
  items: Item[];
  onDragEnd: (event: DragEndEvent) => void;
}

const DraggableTag: React.FC<{ tag: Item; onRemove: (id: number) => void }> = ({ tag, onRemove }) => {
    const { listeners, transform, transition, isDragging, setNodeRef } = useSortable({ id: tag.id });

  const style = transform
    ? {
        cursor: 'move',
        // transition: 'unset',
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        transition: isDragging ? 'unset' : transition,
      }
    : { cursor: 'move', transition: 'unset' };

  return (
    <Tag style={style} ref={setNodeRef} {...listeners}>
      {tag.name}
      <Tag
        onClick={() => onRemove(tag.id)}
        closable
        color="dashed"
      >
        删除
      </Tag>
    </Tag>
  );
};


const DraggableTagList: React.FC<DraggableTagListProps> = ({ items, onDragEnd ,onRemove}) => {
  const sensors = useSensors(useSensor(PointerSensor));
  const handleRemove = (id: number) => {
    onRemove(id);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={onDragEnd}
      collisionDetection={closestCenter}
    >
      <SortableContext items={items} strategy={horizontalListSortingStrategy}>
        <Flex gap="4px 0" wrap>
          {items.map((item) => (
            <DraggableTag key={item.id} tag={item} onRemove={() => onRemove(item.id)} />
          ))}
        </Flex>
      </SortableContext>
    </DndContext>
  );
};

export default DraggableTagList;