import Footer from "@/components/footer/Footer";
import Header from "@/components/header/Header";

/**
 * The layout component for the Hospedagens page.
 *
 * It renders the Header at the top and the Footer at the bottom
 * of the page, with the children component rendered in the middle.
 *
 * @param {{ children: React.ReactNode }} props the props object
 * @prop {React.ReactNode} children the children components to be rendered
 */
export default function HospedagensLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen">
      <Header />
      
      {children}
      <Footer />
    </main>
  );
}