'use client';

import { useState } from 'react';
import type { TabRow } from '@/lib/tabs';
import TabEditor from '@/components/admin/TabEditor';

function reorder(items: TabRow[], fromId: string, beforeId: string): TabRow[] {
  const from = items.findIndex((t) => t.id === fromId);
  if (from === -1) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  const insertAt = next.findIndex((t) => t.id === beforeId);
  if (insertAt === -1) {
    next.push(item);
  } else {
    next.splice(insertAt, 0, item);
  }
  return next;
}

function TabIcon({ icon }: { icon: string }) {
  if (icon && (icon.startsWith('http') || icon.startsWith('/'))) {
    return (
      <img
        src={icon}
        alt=""
        className="w-6 h-6 rounded object-contain shrink-0"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }
  return (
    <div className="w-6 h-6 rounded bg-(--color-bg) border border-(--color-border) flex items-center justify-center shrink-0">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-(--color-text-muted)">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
      </svg>
    </div>
  );
}

interface TabRowItemProps {
  tab: TabRow;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleEnabled: (enabled: boolean) => void;
}

function TabRowItem({
  tab, isDragging, isDragOver,
  onDragStart, onDragOver, onDrop, onDragEnd,
  onEdit, onDelete, onToggleEnabled,
}: TabRowItemProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-3 px-4 py-3 border-b border-(--color-border) last:border-b-0 transition-all cursor-grab active:cursor-grabbing select-none ${
        isDragging ? 'opacity-40' : ''
      } ${isDragOver ? 'border-t-2 border-t-(--color-accent)' : ''}`}
    >
      {/* Drag handle */}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-(--color-text-muted) shrink-0">
        <path d="M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01" strokeWidth={2} />
      </svg>

      <TabIcon icon={tab.icon} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-(--color-text) truncate">{tab.label}</span>
          <span className="text-xs text-(--color-text-muted) font-mono shrink-0">/tab/{tab.slug}</span>
        </div>
        <span className="text-xs text-(--color-text-muted) truncate block">{tab.url}</span>
      </div>

      {/* Role badge */}
      {tab.minRole === 'admin' ? (
        <span className="text-xs px-2 py-0.5 rounded bg-(--color-accent)/15 text-(--color-accent) border border-(--color-accent)/25 shrink-0 hidden sm:inline-flex">
          admin only
        </span>
      ) : (
        <span className="text-xs px-2 py-0.5 rounded bg-(--color-surface) text-(--color-text-muted) border border-(--color-border) shrink-0 hidden sm:inline-flex">
          all users
        </span>
      )}

      {/* iFrame indicator */}
      <span className="text-xs text-(--color-text-muted) shrink-0 hidden md:block">
        {tab.openInIframe ? 'iFrame' : 'new tab'}
      </span>

      {/* Enabled toggle */}
      <button
        type="button"
        role="switch"
        aria-checked={tab.enabled}
        onClick={() => onToggleEnabled(!tab.enabled)}
        className={`relative w-8 h-5 rounded-full transition-colors shrink-0 ${tab.enabled ? 'bg-(--color-accent)' : 'bg-(--color-border)'}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform ${
            tab.enabled ? 'translate-x-3.5 bg-(--color-accent-text)' : 'translate-x-0.5 bg-(--color-text-muted)'
          }`}
        />
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 rounded-md text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-bg) transition-colors"
          title="Edit tab"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded-md text-(--color-text-muted) hover:text-red-400 hover:bg-(--color-bg) transition-colors"
          title="Delete tab"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function TabsClient({ initialTabs }: { initialTabs: TabRow[] }) {
  const [tabs, setTabs] = useState<TabRow[]>(initialTabs);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingTab, setEditingTab] = useState<TabRow | null>(null);

  function handleDragStart(id: string) {
    setDragId(id);
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    if (id !== dragId) setDragOverId(id);
  }

  function handleDrop(e: React.DragEvent, beforeId: string) {
    e.preventDefault();
    if (!dragId || dragId === beforeId) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    const reordered = reorder(tabs, dragId, beforeId);
    setTabs(reordered);
    setDragId(null);
    setDragOverId(null);
    void fetch('/api/tabs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: reordered.map((t) => t.id) }),
    });
  }

  function handleDragEnd() {
    setDragId(null);
    setDragOverId(null);
  }

  async function handleToggleEnabled(tab: TabRow, enabled: boolean) {
    setTabs((prev) => prev.map((t) => (t.id === tab.id ? { ...t, enabled } : t)));
    await fetch(`/api/tabs/${tab.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
  }

  async function handleDelete(tab: TabRow) {
    if (!window.confirm(`Delete tab "${tab.label}"? This cannot be undone.`)) return;
    await fetch(`/api/tabs/${tab.id}`, { method: 'DELETE' });
    setTabs((prev) => prev.filter((t) => t.id !== tab.id));
  }

  function handleSuccess(saved: TabRow) {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === saved.id);
      if (idx === -1) return [...prev, saved];
      const next = [...prev];
      next[idx] = saved;
      return next;
    });
    setModalMode(null);
    setEditingTab(null);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-(--color-text)">Tab Manager</h1>
          <p className="text-sm text-(--color-text-muted) mt-0.5">
            Drag to reorder. {tabs.length} tab{tabs.length !== 1 ? 's' : ''} configured.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditingTab(null); setModalMode('create'); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--color-button) text-(--color-button-text) text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Tab
        </button>
      </div>

      <div className="bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden">
        {tabs.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-(--color-text-muted)">
            No tabs yet. Click "Add Tab" to add your first service.
          </div>
        ) : (
          tabs.map((tab) => (
            <TabRowItem
              key={tab.id}
              tab={tab}
              isDragging={dragId === tab.id}
              isDragOver={dragOverId === tab.id}
              onDragStart={() => handleDragStart(tab.id)}
              onDragOver={(e) => handleDragOver(e, tab.id)}
              onDrop={(e) => handleDrop(e, tab.id)}
              onDragEnd={handleDragEnd}
              onEdit={() => { setEditingTab(tab); setModalMode('edit'); }}
              onDelete={() => handleDelete(tab)}
              onToggleEnabled={(enabled) => handleToggleEnabled(tab, enabled)}
            />
          ))
        )}
      </div>

      {modalMode === 'create' && (
        <TabEditor mode="create" onClose={() => setModalMode(null)} onSuccess={handleSuccess} />
      )}
      {modalMode === 'edit' && editingTab && (
        <TabEditor mode="edit" tab={editingTab} onClose={() => { setModalMode(null); setEditingTab(null); }} onSuccess={handleSuccess} />
      )}
    </>
  );
}
