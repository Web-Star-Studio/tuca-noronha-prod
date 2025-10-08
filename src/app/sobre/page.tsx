
import { Separator } from '@/components/ui/separator'
import { playfairDisplay } from '@/lib/fonts'
import { MapPin, Sun, Waves } from 'lucide-react'
import Image from 'next/image'

const galleryImages = [
  {
    src: '/images/baia-do-sancho.webp',
    alt: 'Praia do Sancho em Fernando de Noronha',
  },
  {
    src: '/images/morro-dois-irmaos.jpg',
    alt: 'Morro Dois Irmãos em Fernando de Noronha',
  }
]

export default function SobrePage() {
  return (
    <div className="bg-gray-50 text-gray-800">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] w-full">
        <Image
          src="/images/praias-hero.png"
          alt="Vista panorâmica de Fernando de Noronha"
          layout="fill"
          objectFit="cover"
          className="brightness-50"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-4 text-center text-white">
          <h1
            className={`${playfairDisplay.className} text-5xl font-bold md:text-7xl`}
          >
            A Alma de Noronha
          </h1>
          <p className="mt-4 max-w-2xl text-lg font-light md:text-xl">
            Conectamos você à essência de um paraíso chamado Fernando de
            Noronha.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
        {/* Intro Section */}
        <section className="text-center">
          <h2
            className={`${playfairDisplay.className} text-4xl font-bold text-gray-900 sm:text-5xl`}
          >
            Seu Hub de Turismo em Fernando de Noronha
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-gray-600">
            Nossa plataforma nasceu de um propósito claro: ser o hub central de
            turismo para Fernando de Noronha, simplificando o planejamento de
            viagens e enriquecendo a experiência do turista na ilha através de
            uma curadoria especializada e autêntica.
          </p>
        </section>

        <Separator className="my-16" />

        {/* Tuca Noronha Section */}
        <section className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div className="flex justify-center">
            <div className="relative h-96 w-80">
              <Image
                src="/images/tuca.jpg"
                alt="Tuca Noronha"
                layout="fill"
                objectFit="cover"
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <h3
              className={`${playfairDisplay.className} text-3xl font-bold text-gray-900 md:text-4xl`}
            >
              Tuca Noronha: O Rosto por Trás do Sonho
            </h3>
            <p className="mt-4 text-lg text-gray-600">
              Tuca Noronha é a personificação da paixão por este paraíso. Com um
              olhar de quem vive e respira a ilha, ele é a ponte entre você e a
              verdadeira essência de Noronha.
            </p>
            <p className="mt-4 text-gray-600">
              Como especialista em turismo de experiência e produtor de conteúdo
              reconhecido, Tuca oferece uma curadoria que vai além do óbvio,
              combinando aventura, cultura local e um profundo respeito pela
              natureza.
            </p>
          </div>
        </section>

        <Separator className="my-16" />

        {/* Noronha Section */}
        <section>
          <h3
            className={`${playfairDisplay.className} mb-12 text-center text-4xl font-bold text-gray-900 md:text-5xl`}
          >
            Um Santuário Ecológico
          </h3>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <InfoCard
              icon={Waves}
              title="Patrimônio da Humanidade"
              description="Reconhecido pela UNESCO, o arquipélago é um santuário de biodiversidade, crucial para a vida marinha do Atlântico."
            />
            <InfoCard
              icon={Sun}
              title="Praias Paradisíacas"
              description="Lar de praias eleitas entre as mais belas do mundo, como a Baía do Sancho, um convite à contemplação."
            />
            <InfoCard
              icon={MapPin}
              title="Turismo Consciente"
              description="A ilha é um modelo de sustentabilidade, onde o turismo contribui ativamente para a preservação ambiental."
            />
          </div>
        </section>

        {/* Gallery Section */}
        <section className="mt-16">
          <h3
            className={`${playfairDisplay.className} mb-12 text-center text-4xl font-bold text-gray-900 md:text-5xl`}
          >
            Vislumbres do Paraíso
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {galleryImages.map((img, index) => (
              <div
                key={index}
                className="relative h-80 w-full overflow-hidden rounded-lg shadow-lg"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  layout="fill"
                  objectFit="cover"
                  className="transition-transform duration-500 hover:scale-110"
                />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg bg-white p-8 text-center shadow-md transition-shadow duration-300 hover:shadow-xl">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
        <Icon className="h-8 w-8" />
      </div>
      <h4 className="mb-2 text-xl font-bold text-gray-900">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
