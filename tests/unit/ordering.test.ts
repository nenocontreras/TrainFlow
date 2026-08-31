import { describe, expect, it } from "vitest";
import { move, nextOrder, renumber, type Ordered } from "@/lib/ordering";

const list = (orders: number[]): Ordered[] => orders.map((order, i) => ({ id: `id${i}`, order }));

describe("nextOrder", () => {
  it("es 1 para lista vacía", () => {
    expect(nextOrder([])).toBe(1);
  });
  it("es max+1 aunque haya huecos", () => {
    expect(nextOrder(list([1, 2, 5]))).toBe(6);
  });
});

describe("renumber", () => {
  it("reasigna 1..N respetando el orden del array", () => {
    const r = renumber([
      { id: "a", order: 10 },
      { id: "b", order: 3 },
      { id: "c", order: 7 },
    ]);
    expect(r.map((x) => [x.id, x.order])).toEqual([
      ["a", 1],
      ["b", 2],
      ["c", 3],
    ]);
  });
});

describe("move", () => {
  const three: Ordered[] = [
    { id: "a", order: 1 },
    { id: "b", order: 2 },
    { id: "c", order: 3 },
  ];

  it("sube un elemento intercambiándolo con el anterior", () => {
    expect(move(three, "b", "up")).toEqual([
      { id: "b", order: 1 },
      { id: "a", order: 2 },
      { id: "c", order: 3 },
    ]);
  });

  it("baja un elemento", () => {
    expect(move(three, "b", "down")).toEqual([
      { id: "a", order: 1 },
      { id: "c", order: 2 },
      { id: "b", order: 3 },
    ]);
  });

  it("no hace nada al subir el primero (pero renumera)", () => {
    expect(move(three, "a", "up")).toEqual(three);
  });

  it("no hace nada al bajar el último", () => {
    expect(move(three, "c", "down")).toEqual(three);
  });

  it("ordena por 'order' antes de mover, aunque el array venga desordenado", () => {
    const messy: Ordered[] = [
      { id: "c", order: 3 },
      { id: "a", order: 1 },
      { id: "b", order: 2 },
    ];
    expect(move(messy, "a", "down")).toEqual([
      { id: "b", order: 1 },
      { id: "a", order: 2 },
      { id: "c", order: 3 },
    ]);
  });

  it("id inexistente -> lista igual renumerada", () => {
    expect(move(three, "zzz", "up")).toEqual(three);
  });
});
