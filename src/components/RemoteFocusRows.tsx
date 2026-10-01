import { createContext, useCallback, useContext, useState, type PropsWithChildren } from 'react';
import { findNodeHandle, Platform, type View } from 'react-native';

type Row = { ids: string[]; selected?: string };
const FocusContext = createContext<{
  rows: Row[];
  nodes: Record<string, number>;
  remembered: Record<number, string>;
  register: (id: string, node: View | null) => void;
  remember: (id: string) => void;
} | null>(null);

// Logical rows override geometric focus search without intercepting remote events.
export function RemoteFocusRows({ rows, children }: PropsWithChildren<{ rows: Row[] }>) {
  const [nodes, setNodes] = useState<Record<string, number>>({});
  const [remembered, setRemembered] = useState<Record<number, string>>({});
  const register = useCallback((id: string, node: View | null) => {
    if (!Platform.isTV) return;
    const handle = node ? findNodeHandle(node) : null;
    setNodes(current => {
      if (current[id] === handle || (!handle && !(id in current))) return current;
      const next = { ...current };
      if (handle) next[id] = handle;
      else delete next[id];
      return next;
    });
  }, []);
  const remember = (id: string) => {
    const index = rows.findIndex(row => row.ids.includes(id));
    if (index >= 0) setRemembered(current => current[index] === id ? current : { ...current, [index]: id });
  };
  return <FocusContext.Provider value={{ rows, nodes, remembered, register, remember }}>{children}</FocusContext.Provider>;
}

export function useRowFocus(id?: string) {
  const context = useContext(FocusContext);
  const index = id && context ? context.rows.findIndex(row => row.ids.includes(id)) : -1;
  if (!context || !id || index < 0) return null;
  const destination = (rowIndex: number) => {
    const row = context.rows[rowIndex];
    if (!row) return id;
    const remembered = context.remembered[rowIndex];
    return row.selected ?? (remembered && row.ids.includes(remembered) ? remembered : row.ids[0]!);
  };
  const row = context.rows[index]!;
  const column = row.ids.indexOf(id);
  return {
    register: context.register,
    remember: context.remember,
    up: destination(index - 1),
    down: destination(index + 1),
    left: row.ids[Math.max(0, column - 1)]!,
    right: row.ids[Math.min(row.ids.length - 1, column + 1)]!,
    nodes: context.nodes,
  };
}
