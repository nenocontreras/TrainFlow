"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LoadPoint } from "@/lib/progress";

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Progresión de 1RM estimado por sesión. Los colores salen de los tokens del
 * sistema "Forge" (`--chart-1`, `--border`…), así que sigue el tema claro/oscuro.
 */
export function ProgressChart({ points }: { points: LoadPoint[] }) {
  if (points.length < 2) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
        {points.length === 0
          ? "Aún no hay series completadas de este ejercicio."
          : "Hace falta al menos otra sesión para dibujar la progresión."}
      </p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            minTickGap={24}
          />
          <YAxis
            width={44}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            unit=" kg"
            domain={["dataMin - 5", "dataMax + 5"]}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--popover-foreground)",
            }}
            labelFormatter={(label) => formatDate(String(label))}
            formatter={(value, _name, item) => {
              const p = item.payload as LoadPoint;
              return [`${value} kg`, `1RM est. (${p.topWeightKg} kg × ${p.reps})`];
            }}
          />
          <Line
            type="monotone"
            dataKey="oneRepMax"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--chart-1)" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
