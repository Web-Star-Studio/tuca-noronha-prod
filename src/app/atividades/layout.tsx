import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";

/**
 * The layout component for the Atividades page.
 *
 * It renders the Header at the top and the Footer at the bottom
 * of the page, with the children component rendered in the middle.
 *
 * @param {{ children: React.ReactNode }} props the props object
 * @prop {React.ReactNode} children the children components to be rendered
 */
export default function AtividadesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="relative mb-10">
        <div>
          <div
            className="h-[60vh] bg-cover bg-center filter brightness-60"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1559357711-e442ab604fdc?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGZlcm5hbmRvJTIwZGUlMjBub3JvbmhhfGVufDB8fDB8fHww')",
            }}
          ></div>
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center text-white px-4">
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
                Atividades em Fernando de Noronha
              </h1>
              <p className="text-xl max-w-2xl mx-auto">
                Descubra experiências incríveis na ilha com nossas atividades
                guiadas por especialistas locais.
              </p>
            </div>
          </div>
        </div>
      </section>
      {children}
      <Footer />
    </main>
  );
}
