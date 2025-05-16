import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { decorativeBackgrounds } from "@/lib/ui-config";

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
          <div className={`flex-1 mt-24 relative ${decorativeBackgrounds.gradient.subtle}`}>
            {/* Elementos decorativos de fundo */}
            <div 
              className={`absolute top-0 right-0 w-1/3 h-1/3 -z-10 rounded-full blur-3xl opacity-20 bg-primary/30 ${decorativeBackgrounds.decorative.blob}`} 
              style={{ transform: 'translate(30%, -30%)' }}
            />
            <div 
              className={`absolute bottom-0 left-0 w-1/4 h-1/4 -z-10 rounded-full blur-3xl opacity-20 bg-blue-400/30 ${decorativeBackgrounds.decorative.blob}`} 
              style={{ transform: 'translate(-20%, 20%)' }}
            />
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
