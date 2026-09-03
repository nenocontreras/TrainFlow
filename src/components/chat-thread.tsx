"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import type { ChatMessage } from "@/lib/queries/messages";
import type { SendResult } from "@/lib/validations/messages";
import { Button } from "@/components/ui/button";

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Hilo de chat 1:1 (diseño del handoff, opción 1i). Lo usan tanto la vista del
 * atleta (`/coach`) como la del coach (`/mensajes/[athleteId]`); `threadAthleteId`
 * identifica el hilo y `sendAction` es la server action `sendMessageAction`.
 */
export function ChatThread({
  peerName,
  peerLabel,
  threadAthleteId,
  initialMessages,
  sendAction,
}: {
  peerName: string;
  peerLabel: string;
  threadAthleteId: string;
  initialMessages: ChatMessage[];
  sendAction: (athleteId: string, body: string) => Promise<SendResult>;
}) {
  const [draft, setDraft] = useState("");
  const [, startSend] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);
  const [messages, addOptimistic] = useOptimistic(
    initialMessages,
    (state: ChatMessage[], msg: ChatMessage) => [...state, msg],
  );

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  function send() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    startSend(async () => {
      addOptimistic({
        id: `tmp-${Date.now()}`,
        mine: true,
        text,
        sentAt: new Date().toISOString(),
        quote: null,
      });
      const res = await sendAction(threadAthleteId, text);
      if (!res.ok) {
        setDraft(text);
        toast.error(res.error ?? "No se pudo enviar el mensaje.");
      }
    });
  }

  return (
    // Alto disponible descontando top bar + padding del main + bottom-nav móvil.
    <div className="-mx-4 flex h-[calc(100dvh-9rem)] flex-col lg:mx-0 lg:h-[calc(100dvh-7rem)]">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <div className="bg-muted text-muted-foreground font-display flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold">
          {initials(peerName)}
        </div>
        <div>
          <p className="font-display font-bold">{peerName}</p>
          <p className="text-primary mt-0.5 font-mono text-[0.625rem] tracking-[0.08em] uppercase">
            {peerLabel}
          </p>
        </div>
      </header>

      <div ref={listRef} className="flex flex-1 flex-col gap-3 overflow-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="text-muted-foreground m-auto text-center text-sm">
            Aún no hay mensajes. Escribe el primero.
          </p>
        ) : null}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
              m.mine
                ? "bg-primary text-primary-foreground self-end rounded-br-md"
                : "bg-card self-start rounded-bl-md border"
            }`}
          >
            {m.quote ? (
              <p className="text-primary border-primary mb-2 border-l-2 pl-2 font-mono text-[0.65rem]">
                {m.quote}
              </p>
            ) : null}
            <p className="text-[0.85rem] leading-snug">{m.text}</p>
            <p
              className={`mt-1.5 font-mono text-[0.6rem] ${
                m.mine ? "text-right opacity-65" : "text-muted-foreground"
              }`}
            >
              {new Date(m.sentAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={`Escribe a ${peerName.split(" ")[0]}…`}
          aria-label="Mensaje"
          className="border-input bg-card h-12 flex-1 rounded-2xl border px-3.5 text-sm outline-none"
        />
        <Button
          size="icon-lg"
          className="rounded-2xl"
          aria-label="Enviar"
          onClick={send}
          disabled={!draft.trim()}
        >
          ↑
        </Button>
      </div>
    </div>
  );
}
