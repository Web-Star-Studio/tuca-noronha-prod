import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { preloadQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import GuiaPageContent from "./GuiaPageContent";

export default async function GuidePanel() {
  // Check if user has active subscription
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // Check subscription status
  const preloaded = await preloadQuery(
    api.domains.subscriptions.queries.hasActiveSubscription,
    {}
  );

  const hasSubscription = preloaded._valueJSON;

  if (!hasSubscription) {
    // Redirect to subscription page if no active subscription
    redirect("/meu-painel/guia/assinar");
  }
  
  return <GuiaPageContent />;
}
