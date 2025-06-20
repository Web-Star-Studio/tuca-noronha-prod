"use client";;
import { use } from "react";

import { notFound } from "next/navigation";
import { usePublicEvent } from "@/lib/services/eventService";
import { ChatButton } from "@/components/chat/ChatButton";
import EventDetails from "@/components/cards/EventDetails";

export default function EventPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  // Usar diretamente o hook usePublicEvent (mesmo padrão das atividades)
  const { event, isLoading } = usePublicEvent(params.id);

  // Lidar com caso 404
  if (!isLoading && !event) {
    notFound();
  }

  if (isLoading || !event) {
    return (
      <div className="container mx-auto py-12 flex flex-col items-center justify-center">
        <div className="animate-pulse space-y-8">
          <div className="h-10 w-40 bg-gray-200 rounded" />
          <div className="h-96 w-full bg-gray-200 rounded-xl" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 bg-gray-200 rounded" />
            <div className="h-6 w-1/2 bg-gray-200 rounded" />
            <div className="h-6 w-1/3 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <EventDetails event={event} />
      
      {/* Botão de Chat Flutuante */}
      <ChatButton
        assetId={event.id}
        assetType="events"
        assetName={event.title}
        partnerId={event.partnerId as any}
        variant="floating"
        size="lg"
        showLabel={true}
        customLabel="Suporte"
      />
    </>
  );
}
