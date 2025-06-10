import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import Header from "@/components/header/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SignedIn>
        <main className="min-h-screen flex flex-col">
          <Header />
          <div className="flex-1 relative">
            {children}
          </div>
        </main>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
