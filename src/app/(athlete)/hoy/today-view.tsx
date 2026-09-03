"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock } from "lucide-react";
import type { TodayView as TodayViewData } from "@/lib/queries/today";
import { FocusSession } from "./focus-session";
import { HomeToday } from "./home-today";

export function TodayView({ data }: { data: TodayViewData }) {
  const router = useRouter();
  const [pickedDayId, setPickedDayId] = useState<string | null>(data.currentDay?.id ?? null);

  const day =
    data.days.find((d) => d.id === pickedDayId) ?? data.currentDay ?? data.days[0] ?? null;

  if (!data.started) {
    return (
      <Empty
        title="Tu plan aún no empieza"
        body={`“${data.planName}” arranca el ${data.startDate}.`}
      />
    );
  }
  if (!day) {
    return <Empty title="El plan no tiene días" body="Pídele a tu coach que lo complete." />;
  }

  // --- Sesión en curso: modelo "enfoque" ---------------------------------
  if (data.todaySession) {
    return (
      <FocusSession
        planName={data.planName}
        day={day}
        session={data.todaySession}
        onAfterMutate={() => router.refresh()}
      />
    );
  }

  // --- Sin sesión hoy: inicio "sesión primero" --------------------------
  return (
    <HomeToday
      planName={data.planName}
      assignmentId={data.assignmentId}
      day={day}
      days={data.days}
      onPickDay={(id) => setPickedDayId(id)}
    />
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div className="bg-muted flex size-12 items-center justify-center rounded-full">
        <CalendarClock className="text-muted-foreground size-6" />
      </div>
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{body}</p>
      </div>
    </div>
  );
}
