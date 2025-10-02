import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { preloadQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import GuiaPageContent from "./GuiaPageContent";

export default async function GuidePanel() {
  // Check if user has access to guide (master role or active subscription)
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // Check guide access (masters have free access, others need subscription)
  const preloaded = await preloadQuery(
    api.domains.subscriptions.queries.hasGuideAccess,
    {}
  );

  const hasAccess = preloaded._valueJSON;

  if (!hasAccess) {
    // Redirect to subscription page if no access
    redirect("/meu-painel/guia/assinar");
  }
  
  return <GuiaPageContent />;
}
