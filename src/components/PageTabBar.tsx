import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NotebookPage } from '../types';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PageTabBarProps {
  pages: NotebookPage[];
  activePageId: string | null;
  onSwitchPage: (pageId: string) => void;
  onAddPage: () => void;
  onDeletePage: (pageId: string) => void;
  onRenamePage: (pageId: string, newName: string) => void;
  onReorderPages: (activeId: string, overId: string) => void;
  readOnly: boolean;
}

interface SortableTabProps {
  page: NotebookPage;
  isActive: boolean;
  canClose: boolean;
  readOnly: boolean;
  onSwitch: () => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
}

const SortableTab: React.FC<SortableTabProps> = ({
  page,
  isActive,
  canClose,
  readOnly,
  onSwitch,
  onDelete,
  onRename,
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(page.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: page.id,
    disabled: readOnly,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleDoubleClick = () => {
    if (readOnly) return;
    setRenameValue(page.name);
    setIsRenaming(true);
  };

  const commitRename = () => {
    setIsRenaming(false);
    onRename(renameValue);
  };

  const cancelRename = () => {
    setIsRenaming(false);
    setRenameValue(page.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitRename();
    } else if (e.key === 'Escape') {
      cancelRename();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(readOnly ? {} : listeners)}
      className={`whitespace-nowrap flex-shrink-0 px-3 py-1.5 flex items-center gap-1.5 cursor-pointer select-none text-sm transition-colors group/tab ${
        isActive
          ? 'border-b-2 border-soft-green text-off-white bg-deep-navy'
          : 'text-gray-text hover:text-off-white hover:bg-deep-navy/50 border-b-2 border-transparent'
      }`}
      onClick={onSwitch}
      onDoubleClick={handleDoubleClick}
    >
      {isRenaming ? (
        <input
          ref={inputRef}
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="bg-deep-navy border border-gray-text/30 rounded px-1 py-0 text-sm text-off-white outline-none w-24 font-mono"
        />
      ) : (
        <span className="font-mono text-xs">{page.name}</span>
      )}
      {canClose && !readOnly && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover/tab:opacity-100 text-gray-text hover:text-tomato transition-opacity ml-1 text-xs leading-none"
          title="Close page"
        >
          ×
        </button>
      )}
    </div>
  );
};

const PageTabBar: React.FC<PageTabBarProps> = ({
  pages,
  activePageId,
  onSwitchPage,
  onAddPage,
  onDeletePage,
  onRenamePage,
  onReorderPages,
  readOnly,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        onReorderPages(active.id as string, over.id as string);
      }
    },
    [onReorderPages]
  );

  const canClose = pages.length > 1;
  const canAdd = pages.length < 20;

  return (
    <div className="flex items-center border-b border-gray-text/20 bg-lighter-navy">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={pages.map((p) => p.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex overflow-x-auto tab-scrollbar flex-1 min-w-0">
            {pages.map((page) => (
              <SortableTab
                key={page.id}
                page={page}
                isActive={page.id === activePageId}
                canClose={canClose}
                readOnly={readOnly}
                onSwitch={() => onSwitchPage(page.id)}
                onDelete={() => onDeletePage(page.id)}
                onRename={(newName) => onRenamePage(page.id, newName)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {!readOnly && canAdd && (
        <button
          onClick={onAddPage}
          className="flex-shrink-0 px-2.5 py-1.5 text-gray-text hover:text-soft-green hover:bg-deep-navy/50 transition-colors text-sm"
          title="Add page"
        >
          +
        </button>
      )}
      {readOnly && (
        <span className="flex-shrink-0 px-2 text-gray-text/60 text-xs italic">
          Upgrade to manage pages
        </span>
      )}
    </div>
  );
};

export default PageTabBar;
