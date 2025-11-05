"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, FileText, Shield } from "lucide-react";

export default function GuideTermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Termos de Serviço e Política de Reembolso
          </h1>
          <p className="text-lg text-gray-600">
            Guia Digital Exclusivo de Fernando de Noronha
          </p>
        </div>

        {/* Aviso Importante */}
        <Card className="border-2 border-amber-200 bg-amber-50 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="h-6 w-6" />
              Produto Digital - Leia com Atenção
            </CardTitle>
          </CardHeader>
          <CardContent className="text-amber-800 space-y-2">
            <p className="font-semibold">
              Este é um PRODUTO DIGITAL INTANGÍVEL com acesso imediato após aprovação do pagamento.
            </p>
            <p>
              Ao realizar a compra, você reconhece e concorda com nossa política de não reembolso para produtos digitais.
            </p>
          </CardContent>
        </Card>

        {/* Seção 1: Natureza do Produto */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              1. Natureza do Produto Digital
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <p>
              O <strong>Guia Digital Exclusivo de Fernando de Noronha</strong> é um produto digital intangível que oferece:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Acesso online ao conteúdo completo do guia</li>
              <li>Roteiros detalhados e mapas interativos</li>
              <li>Dicas exclusivas de quem mora na ilha</li>
              <li>Contatos verificados de fornecedores locais</li>
              <li>Atualizações periódicas do conteúdo</li>
            </ul>
            <p className="font-semibold text-blue-900">
              ⚠️ IMPORTANTE: O acesso ao guia é liberado IMEDIATAMENTE após a aprovação do pagamento pelo Mercado Pago.
            </p>
          </CardContent>
        </Card>

        {/* Seção 2: Política de Não Reembolso */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              2. Política de Não Reembolso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <p className="font-semibold text-red-700">
              NÃO OFERECEMOS REEMBOLSO PARA PRODUTOS DIGITAIS APÓS A ENTREGA DO ACESSO.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h4 className="font-semibold text-gray-900">Por que não há reembolso?</h4>
              <ul className="list-disc ml-6 space-y-2">
                <li>
                  <strong>Entrega Instantânea:</strong> O acesso ao conteúdo é liberado imediatamente após o pagamento
                </li>
                <li>
                  <strong>Produto Intangível:</strong> Diferente de produtos físicos, não é possível &ldquo;devolver&rdquo; conteúdo digital já acessado
                </li>
                <li>
                  <strong>Base Legal:</strong> Conforme Art. 49 do CDC, produtos digitais entregues imediatamente não se enquadram no direito de arrependimento
                </li>
                <li>
                  <strong>Política do Mercado Pago:</strong> A &ldquo;Compra Garantida&rdquo; do Mercado Pago NÃO cobre produtos digitais e intangíveis
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                📋 Exceção: Problemas Técnicos
              </p>
              <p className="text-sm text-blue-800">
                Reembolso será oferecido APENAS em casos de falha técnica que impeça completamente o acesso ao guia, 
                mesmo após suporte técnico. Entre em contato conosco em até 48h após a compra se encontrar problemas de acesso.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Seção 3: Compra Garantida do Mercado Pago */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>3. Compra Garantida do Mercado Pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <p>
              De acordo com a <a href="https://www.mercadopago.com.br/ajuda/23185" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">política oficial do Mercado Pago</a>, 
              a &ldquo;Compra Garantida&rdquo; se aplica apenas a produtos físicos que não foram entregues.
            </p>
            
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <p className="font-semibold text-red-900 mb-2">
                ❌ O Programa &ldquo;Compra Garantida do Mercado Pago&rdquo; NÃO COBRE:
              </p>
              <ul className="list-disc ml-6 space-y-1 text-red-800 text-sm">
                <li>Contratações de serviços e/ou produtos intangíveis</li>
                <li>Produtos digitais com entrega imediata</li>
                <li>Conteúdo online acessível instantaneamente</li>
              </ul>
            </div>

            <p className="text-sm italic text-gray-600">
              Fonte: Mercado Pago - Seção 4 &ldquo;Extensão e exclusões&rdquo; do programa Compra Garantida
            </p>
          </CardContent>
        </Card>

        {/* Seção 4: Direitos do Consumidor */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>4. Direito de Arrependimento (CDC Art. 49)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <p>
              O Art. 49 do Código de Defesa do Consumidor (CDC) prevê o direito de arrependimento de 7 dias para compras 
              realizadas fora do estabelecimento comercial (online).
            </p>
            
            <p className="font-semibold">
              PORÉM: A jurisprudência brasileira reconhece que este direito NÃO se aplica a produtos digitais 
              com entrega instantânea.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-semibold mb-2">Fundamentação Legal:</p>
              <ul className="text-sm space-y-2 ml-4">
                <li>
                  • <strong>Impossibilidade de Devolução:</strong> Não há como &ldquo;devolver&rdquo; conteúdo digital já acessado
                </li>
                <li>
                  • <strong>Entrega Imediata:</strong> O produto é entregue e consumido instantaneamente
                </li>
                <li>
                  • <strong>Natureza Intangível:</strong> Produto não pode ser &ldquo;recuperado&rdquo; após entrega
                </li>
              </ul>
            </div>

            <p className="text-sm text-gray-600 italic">
              Referência: Decisões do TJDFT e doutrina especializada sobre produtos digitais
            </p>
          </CardContent>
        </Card>

        {/* Seção 5: Garantias e Suporte */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>5. Garantias e Suporte Técnico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <p className="font-semibold text-green-700">
              ✅ Garantimos:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Acesso funcional ao conteúdo do guia por período anual</li>
              <li>Suporte técnico para problemas de acesso</li>
              <li>Atualizações periódicas do conteúdo</li>
              <li>Qualidade e veracidade das informações fornecidas</li>
            </ul>

            <p className="font-semibold text-blue-700 mt-4">
              📞 Suporte:
            </p>
            <p>
              Em caso de dificuldades técnicas de acesso, entre em contato com nossa equipe 
              através do painel de usuário ou pelo email de suporte. Estamos aqui para ajudar!
            </p>
          </CardContent>
        </Card>

        {/* Seção 6: Aceitação dos Termos */}
        <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">6. Aceitação dos Termos</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800 space-y-3">
            <p className="font-semibold">
              Ao clicar no botão &ldquo;Aceito os termos e quero comprar&rdquo;, você declara que:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Leu e compreendeu completamente estes Termos de Serviço</li>
              <li>Entende que está comprando um produto digital intangível</li>
              <li>Concorda com a política de não reembolso para produtos digitais</li>
              <li>Reconhece que o acesso será liberado imediatamente após o pagamento</li>
              <li>Aceita que produtos digitais não estão cobertos pela Compra Garantida do Mercado Pago</li>
            </ul>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8 pb-8">
          <p>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          <p className="mt-2">
            Para dúvidas sobre estes termos, entre em contato antes de realizar a compra.
          </p>
        </div>
      </div>
    </div>
  );
}
