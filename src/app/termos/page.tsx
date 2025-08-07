
import { playfairDisplay } from '@/lib/fonts';

export default function TermosPage() {
  return (
    <div className="bg-white py-12 pt-20">
      <div className="container mx-auto max-w-4xl px-4">
        <header className="mb-12 text-center">
          <h1 className={`${playfairDisplay.className} text-4xl font-bold text-gray-900 sm:text-5xl`}>
            Termos de Adesão
          </h1>
          <p className="mt-4 text-sm text-gray-500">
            Última atualização: 10 de Julho de 2024
          </p>
        </header>

        <div className="prose prose-lg mx-auto max-w-full text-gray-700">
          <p>
            Bem-vindo ao Tuca Noronha. Ao utilizar nossos serviços, você concorda com os seguintes termos e condições. Por favor, leia-os com atenção.
          </p>

          <h2 className="text-2xl font-bold text-gray-800">1. Nossos Serviços</h2>
          <p>
            O Tuca Noronha atua como um hub central de turismo para Fernando de Noronha, conectando viajantes a uma rede de serviços locais, incluindo, mas não se limitando a, atividades, passeios, eventos e reservas. Atuamos como intermediários entre você e os fornecedores finais dos serviços.
          </p>

          <h2 className="text-2xl font-bold text-gray-800">2. Reservas e Pagamentos</h2>
          <p>
            Todas as reservas estão sujeitas à disponibilidade. Os preços são indicados em nosso site e podem ser alterados sem aviso prévio. O pagamento é processado através de nossos parceiros de pagamento seguros. Ao fornecer suas informações de pagamento, você autoriza a cobrança do valor total da reserva.
          </p>

          <h2 className="text-2xl font-bold text-gray-800">3. Cancelamentos e Reembolsos</h2>
          <p>
            A política de cancelamento varia de acordo com o serviço e o fornecedor. Cada atividade ou pacote terá sua política de cancelamento claramente indicada no momento da reserva. Reembolsos, quando aplicáveis, serão processados de acordo com a política específica do serviço contratado e podem estar sujeitos a taxas de processamento.
          </p>

          <h2 className="text-2xl font-bold text-gray-800">4. Responsabilidades do Usuário</h2>
          <p>
            Você é responsável por fornecer informações precisas e completas durante o processo de reserva. É sua responsabilidade garantir que possui a documentação necessária para a viagem, como identidade e comprovantes de vacinação, se exigido. Você concorda em seguir as regras e orientações dos fornecedores de serviços durante as atividades.
          </p>

          <h2 className="text-2xl font-bold text-gray-800">5. Limitação de Responsabilidade</h2>
          <p>
            O Tuca Noronha não se responsabiliza por quaisquer danos, perdas, acidentes, ou despesas que possam ocorrer durante a prestação dos serviços pelos fornecedores parceiros. Nossa responsabilidade limita-se à intermediação da reserva. Não garantimos a qualidade ou segurança dos serviços prestados por terceiros.
          </p>
          
          <h2 className="text-2xl font-bold text-gray-800">6. Propriedade Intelectual</h2>
          <p>
            Todo o conteúdo deste site, incluindo textos, imagens, logotipos e design, é propriedade do Tuca Noronha e protegido por leis de direitos autorais. É proibida a sua reprodução ou uso não autorizado.
          </p>

          <h2 className="text-2xl font-bold text-gray-800">7. Alterações nos Termos</h2>
          <p>
            Reservamo-nos o direito de alterar estes Termos de Adesão a qualquer momento. As alterações entrarão em vigor imediatamente após a sua publicação no site. É sua responsabilidade revisar os termos periodicamente.
          </p>

          <h2 className="text-2xl font-bold text-gray-800">8. Lei Aplicável</h2>
          <p>
            Estes termos serão regidos e interpretados de acordo com as leis da República Federativa do Brasil, e você se submete à jurisdição exclusiva dos tribunais localizados em Pernambuco para a resolução de quaisquer disputas.
          </p>
        </div>
      </div>
    </div>
  );
}

