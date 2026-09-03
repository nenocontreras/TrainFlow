import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getAthleteThread } from "@/lib/queries/messages";
import { sendMessageAction } from "@/lib/actions/messages";
import { ChatThread } from "@/components/chat-thread";

export const metadata: Metadata = { title: "Coach" };

export default async function CoachChatPage() {
  await requireRole("athlete");
  const thread = await getAthleteThread();

  if (!thread) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="bg-muted flex size-12 items-center justify-center rounded-full">
          <MessageCircle className="text-muted-foreground size-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Sin coach todavía</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Cuando tu coach te vincule podrás escribirle desde aquí.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ChatThread
      peerName={thread.coachName}
      peerLabel="Tu coach"
      threadAthleteId={thread.athleteId}
      initialMessages={thread.messages}
      sendAction={sendMessageAction}
    />
  );
}
