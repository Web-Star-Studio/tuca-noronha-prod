import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";

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
          <div className="flex-1 mt-24">
            {children}
          </div>
          <Footer />
        </main>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
