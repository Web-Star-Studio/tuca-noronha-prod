
import { playfairDisplay } from '@/lib/fonts';

export default function PoliticaDePrivacidadePage() {
  return (
    <div className="bg-white py-12 pt-20">
      <div className="container mx-auto max-w-4xl px-4">
        <header className="mb-12 text-center">
          <h1 className={`${playfairDisplay.className} text-4xl font-bold text-gray-900 sm:text-5xl`}>
            Política de Privacidade
          </h1>
          <p className="mt-4 text-sm text-gray-500">
            Última atualização: 10 de Julho de 2024
          </p>
        </header>

        <div className="prose prose-lg mx-auto max-w-full text-gray-700">
          <p>
            A sua privacidade é importante para nós. É política do Tuca Noronha respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no site Tuca Noronha, e outros sites que possuímos e operamos.
          </p>

          <h2 className="text-2xl font-bold text-gray-800">1. Informações que Coletamos</h2>
          <p>
            Coletamos informações pessoais que você nos fornece voluntariamente ao se registrar em nosso site, expressar interesse em obter informações sobre nós ou nossos produtos e serviços, ao participar de atividades no site ou de outra forma ao entrar em contato conosco.
          </p>
          <p>
            As informações pessoais que coletamos dependem do contexto de suas interações conosco e com o site, as escolhas que você faz e os produtos e recursos que você usa. As informações pessoais que coletamos podem incluir o seguinte:
          </p>
          <ul>
            <li><strong>Informações de Identificação Pessoal:</strong> Nome, endereço de e-mail, número de telefone.</li>
            <li><strong>Informações de Pagamento:</strong> Dados de cartão de crédito/débito e informações de faturamento (processados por provedores de pagamento terceirizados).</li>
            <li><strong>Informações de Uso do Site:</strong> Endereço IP, tipo de navegador, páginas visitadas, tempo gasto em páginas e outras estatísticas.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-800">2. Como Usamos Suas Informações</h2>
          <p>
            Usamos as informações que coletamos ou recebemos para:
          </p>
          <ul>
            <li>Facilitar a criação de contas e o processo de logon.</li>
            <li>Processar suas transações e gerenciar seus pedidos.</li>
            <li>Enviar a você informações administrativas, incluindo informações sobre produtos, serviços e novos recursos e/ou informações sobre alterações em nossos termos, condições e políticas.</li>
            <li>Personalizar sua experiência e permitir que você participe de promoções.</li>
            <li>Para proteção de nossos serviços (por exemplo, para monitoramento e prevenção de fraudes).</li>
            <li>Para responder às suas perguntas e oferecer suporte ao cliente.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-800">3. Compartilhamento de Suas Informações</h2>
          <p>
            Não compartilhamos, vendemos, alugamos ou trocamos suas informações com terceiros para fins promocionais. Podemos compartilhar informações com terceiros que nos prestam serviços, como processamento de pagamentos, análise de dados, envio de e-mail, serviços de hospedagem e atendimento ao cliente.
          </p>

          <h2 className="text-2xl font-bold text-gray-800">4. Segurança de Suas Informações</h2>
          <p>
            Implementamos uma variedade de medidas de segurança para manter a segurança de suas informações pessoais quando você faz um pedido ou insere, envia ou acessa suas informações pessoais. No entanto, lembre-se de que nenhum método de transmissão pela Internet ou método de armazenamento eletrônico é 100% seguro.
          </p>
          
          <h2 className="text-2xl font-bold text-gray-800">5. Seus Direitos de Privacidade</h2>
          <p>
            Você tem o direito de acessar, corrigir ou excluir suas informações pessoais. Você também pode ter outros direitos, como o direito de se opor ao nosso uso de seus dados ou o direito de portabilidade de dados, dependendo da sua localização.
          </p>

          <h2 className="text-2xl font-bold text-gray-800">6. Alterações a Esta Política</h2>
          <p>
            Podemos atualizar nossa Política de Privacidade de tempos em tempos. Notificaremos você sobre quaisquer alterações, publicando a nova Política de Privacidade nesta página e atualizando a data da &quot;Última atualização&quot; no topo desta página.
          </p>

          <h2 className="text-2xl font-bold text-gray-800">7. Contate-Nos</h2>
          <p>
            Se você tiver alguma dúvida sobre esta Política de Privacidade, entre em contato conosco através do nosso e-mail de suporte ou da página de contato.
          </p>
        </div>
      </div>
    </div>
  );
}

