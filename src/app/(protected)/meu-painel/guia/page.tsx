import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import GuideAccessWrapper from "./GuideAccessWrapper";

export default async function GuidePanel() {
  // Check if user is authenticated
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  // Delegate access check to client component with auth context
  return <GuideAccessWrapper />;
}
