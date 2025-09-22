"use client";

import Link from "next/link";
import { Instagram, Facebook, Twitter, Mail, Phone, ArrowRight } from "lucide-react";
import { useSystemSettings } from "@/lib/hooks/useSystemSettings";

const Footer = () => {
  const { 
    supportEmail, 
    supportPhone, 
    footerText,
    whatsappNumber 
  } = useSystemSettings();
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
                href="https://www.instagram.com/agenciatucanoronha/"
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
                <Link href="/atividades" className="text-muted-foreground hover:text-tuca-ocean-blue transition-colors">
                  Atividades
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
              <li>
                <Link href="/admin/dashboard" className="text-muted-foreground hover:text-tuca-ocean-blue transition-colors">
                  Admin
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <div className="space-y-3">
              <div className="flex items-start">
                <Mail size={18} className="mr-3 mt-1 text-muted-foreground" />
                <a href={`mailto:${supportEmail}`} className="text-muted-foreground hover:text-tuca-ocean-blue transition-colors">
                  {supportEmail}
                </a>
              </div>
              <div className="flex items-start">
                <Phone size={18} className="mr-3 mt-1 text-muted-foreground" />
                <a href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`} className="text-muted-foreground hover:text-tuca-ocean-blue transition-colors">
                  {supportPhone}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200 text-center text-muted-foreground text-sm">
          <p>{footerText}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
