/**
 * Utilidades de orden para listas posicionales (días de un plan, ejercicios de
 * un día). El orden se guarda como enteros 1..N contiguos.
 */

export interface Ordered {
  id: string;
  order: number;
}

/** Siguiente valor de orden al añadir un elemento al final. */
export function nextOrder(items: readonly Ordered[]): number {
  return items.reduce((max, it) => Math.max(max, it.order), 0) + 1;
}

/**
 * Devuelve la lista reordenada tras mover `id` una posición arriba/abajo.
 * Renumera 1..N. Si el movimiento no es posible, devuelve la lista igual
 * (renumerada). No muta la entrada.
 */
export function move(items: readonly Ordered[], id: string, direction: "up" | "down"): Ordered[] {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  const index = sorted.findIndex((it) => it.id === id);
  if (index === -1) return renumber(sorted);

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= sorted.length) return renumber(sorted);

  const swapped = [...sorted];
  const a = swapped[index];
  const b = swapped[target];
  if (!a || !b) return renumber(sorted);
  swapped[index] = b;
  swapped[target] = a;
  return renumber(swapped);
}

/** Reasigna orden 1..N respetando el orden actual del array. */
export function renumber(items: readonly Ordered[]): Ordered[] {
  return items.map((it, i) => ({ ...it, order: i + 1 }));
}
