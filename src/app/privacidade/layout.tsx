
import Footer from "@/components/footer/Footer";
import Header from "@/components/header/Header";

export default function PoliticaDePrivacidadeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}

