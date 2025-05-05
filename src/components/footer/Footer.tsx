import Link from "next/link";
import { Instagram, Facebook, Twitter, Mail, Phone, ArrowRight } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-tuca-sand text-foreground py-20">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <h3 className="text-xl font-medium tracking-tight mb-6">Tuca Noronha</h3>
            <p className="mb-8 text-muted-foreground max-w-md">
              Sua agência especializada em experiências exclusivas em Fernando de Noronha, comprometida com a sustentabilidade e a preservação do paraíso.
            </p>
            <div className="flex space-x-5">
              <a
                href="https://instagram.com/tucanoronha"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-tuca-ocean-blue transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://facebook.com/tucanoronha"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-tuca-ocean-blue transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://twitter.com/tucanoronha"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-tuca-ocean-blue transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
            </div>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-sm font-medium tracking-tight uppercase mb-6">Explorar</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/pacotes" className="text-muted-foreground hover:text-tuca-ocean-blue transition-colors">
                  Pacotes
                </Link>
              </li>
              <li>
                <Link href="/passeios" className="text-muted-foreground hover:text-tuca-ocean-blue transition-colors">
                  Passeios
                </Link>
              </li>
              <li>
                <Link href="/hospedagens" className="text-muted-foreground hover:text-tuca-ocean-blue transition-colors">
                  Hospedagens
                </Link>
              </li>
              <li>
                <Link href="/loja" className="text-muted-foreground hover:text-tuca-ocean-blue transition-colors">
                  Loja
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-sm font-medium tracking-tight uppercase mb-6">Empresa</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/sobre" className="text-muted-foreground hover:text-tuca-ocean-blue transition-colors">
                  Sobre
                </Link>
              </li>
              <li>
                <Link href="/contato" className="text-muted-foreground hover:text-tuca-ocean-blue transition-colors">
                  Contato
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="text-muted-foreground hover:text-tuca-ocean-blue transition-colors">
                  Privacidade
                </Link>
              </li>
              <li>
                <Link href="/termos" className="text-muted-foreground hover:text-tuca-ocean-blue transition-colors">
                  Termos
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h3 className="text-sm font-medium tracking-tight uppercase mb-6">Newsletter</h3>
            <p className="text-muted-foreground mb-4">
              Receba em primeira mão nossas ofertas exclusivas.
            </p>
            <form className="flex mb-6">
              <input
                type="email"
                placeholder="Seu e-mail"
                className="flex-1 py-3 px-4 rounded-l-full bg-white border-0 focus:outline-none focus:ring-1 focus:ring-tuca-ocean-blue"
              />
              <button
                type="submit"
                className="bg-tuca-ocean-blue text-white rounded-r-full px-4 hover:bg-tuca-ocean-blue/90 transition-colors"
                aria-label="Inscrever"
              >
                <ArrowRight size={20} />
              </button>
            </form>
            <div className="space-y-3">
              <div className="flex items-start">
                <Mail size={18} className="mr-3 mt-1 text-muted-foreground" />
                <a href="mailto:karol@tucanoronha.com.br" className="text-muted-foreground hover:text-tuca-ocean-blue transition-colors">
                  karol@tucanoronha.com.br
                </a>
              </div>
              <div className="flex items-start">
                <Phone size={18} className="mr-3 mt-1 text-muted-foreground" />
                <a href="https://wa.me/5511968008888" className="text-muted-foreground hover:text-tuca-ocean-blue transition-colors">
                  +55 11 96800-8888
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} Tuca Noronha. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
