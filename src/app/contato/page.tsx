'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { playfairDisplay } from '@/lib/fonts'
import { useSystemSettings } from '@/lib/hooks/useSystemSettings'
import { Mail, Phone, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

export default function ContatoPage() {
  const { supportEmail, supportPhone, whatsappNumber } = useSystemSettings()
  const sendContactMessage = useMutation(api.domains.support.mutations.sendContactMessage)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await sendContactMessage(formData)
      toast.success('Mensagem enviada com sucesso!', {
        description: 'Agradecemos o seu contato. Responderemos em breve.',
      })
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (error) {
      console.error('Failed to send contact message:', error)
      toast.error('Falha ao enviar a mensagem.', {
        description:
          'Ocorreu um erro. Por favor, tente novamente ou use um dos canais alternativos.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <section className="relative h-[50vh] min-h-[350px] w-full">
        <Image
          src="/images/transfer-hero-guide.png"
          alt="Contato com Tuca Noronha"
          layout="fill"
          objectFit="cover"
          className="brightness-50"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-4 text-center text-white">
          <h1
            className={`${playfairDisplay.className} text-5xl font-bold md:text-7xl`}
          >
            Entre em Contato
          </h1>
          <p className="mt-4 max-w-2xl text-lg font-light md:text-xl">
            Estamos aqui para ajudar a planejar sua viagem dos sonhos.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Canais de Atendimento
              </h2>
              <p className="mt-2 text-gray-600">
                Prefere falar diretamente conosco? Utilize um dos canais abaixo.
              </p>
              <div className="mt-6 space-y-4 text-gray-600">
                <a
                  href={`mailto:${supportEmail}`}
                  className="flex items-center gap-4 transition-colors hover:text-blue-600"
                >
                  <Mail className="h-5 w-5" />
                  <span>{supportEmail}</span>
                </a>
                <a
                  href={`https://wa.me/${whatsappNumber?.replace(/\D/g, '')}`}
                  className="flex items-center gap-4 transition-colors hover:text-blue-600"
                >
                  <Phone className="h-5 w-5" />
                  <span>{supportPhone}</span>
                </a>
              </div>
            </div>
          </div>

          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                name="name"
                type="text"
                placeholder="Seu nome completo"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
              <Input
                name="email"
                type="email"
                placeholder="Seu melhor e-mail"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
              <Input
                name="subject"
                type="text"
                placeholder="Assunto da mensagem"
                value={formData.subject}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
              <Textarea
                name="message"
                placeholder="Sua mensagem..."
                rows={6}
                value={formData.message}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
              <Button
                type="submit"
                className="w-full bg-blue-600 text-white"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Mensagem'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
