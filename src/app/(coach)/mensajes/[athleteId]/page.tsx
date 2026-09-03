import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getCoachThread } from "@/lib/queries/messages";
import { sendMessageAction } from "@/lib/actions/messages";
import { ChatThread } from "@/components/chat-thread";

export const metadata: Metadata = { title: "Conversación" };

export default async function CoachThreadPage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  await requireRole("coach");
  const { athleteId } = await params;
  const thread = await getCoachThread(athleteId);
  if (!thread) notFound();

  return (
    <div className="flex flex-col gap-3">
      <Link href="/mensajes" className="text-muted-foreground text-sm underline">
        ← Mensajes
      </Link>
      <ChatThread
        peerName={thread.athleteName}
        peerLabel="Tu atleta"
        threadAthleteId={thread.athleteId}
        initialMessages={thread.messages}
        sendAction={sendMessageAction}
      />
    </div>
  );
}
