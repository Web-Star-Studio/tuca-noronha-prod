'use client';

import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle, Play, BarChart3, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function StripeBackfillPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [limit, setLimit] = useState(10);
  const [partnerId, setPartnerId] = useState('');
  const [results, setResults] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  const runBackfill = useAction(api.scripts.stripeBackfill.runStripeBackfill);
  const getSummary = useAction(api.scripts.stripeBackfill.getIntegrationSummary);

  const handleGetSummary = async () => {
    try {
      const result = await getSummary();
      setSummary(result);
      toast.success('Status atualizado');
    } catch (error) {
      toast.error('Erro ao obter status');
      console.error(error);
    }
  };

  const handleRunBackfill = async () => {
    if (!dryRun) {
      const confirmed = window.confirm(
        'Atenção! Isso irá criar produtos e payment links reais no Stripe. Continuar?'
      );
      if (!confirmed) return;
    }

    setIsRunning(true);
    setResults(null);

    try {
      const result = await runBackfill({
        dryRun,
        limit,
        partnerId: partnerId || undefined,
      });

      setResults(result);

      if (result.failed === 0) {
        toast.success(`Backfill concluído! ${result.succeeded}/${result.total} atividades processadas`);
      } else {
        toast.warning(`Backfill concluído com erros: ${result.succeeded}/${result.total} sucessos`);
      }

      // Refresh summary after successful run
      if (!dryRun && result.succeeded > 0) {
        setTimeout(handleGetSummary, 1000);
      }
    } catch (error) {
      toast.error('Erro ao executar backfill');
      console.error(error);
    } finally {
      setIsRunning(false);
    }
  };

  const getProgressPercentage = () => {
    if (!summary) return 0;
    return summary.totalActivities > 0 
      ? (summary.withStripeProducts / summary.totalActivities) * 100 
      : 0;
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stripe Backfill</h1>
          <p className="text-gray-600 mt-2">
            Crie produtos e payment links do Stripe para atividades existentes
          </p>
        </div>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Status da Integração
            </CardTitle>
            <CardDescription>
              Situação atual das atividades com Stripe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={handleGetSummary} variant="outline">
                Atualizar Status
              </Button>

              {summary && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {summary.totalActivities}
                      </div>
                      <div className="text-sm text-gray-500">Total Atividades</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {summary.withStripeProducts}
                      </div>
                      <div className="text-sm text-gray-500">Com Stripe</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {summary.withoutStripeProducts}
                      </div>
                      <div className="text-sm text-gray-500">Sem Stripe</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {summary.activeActivities}
                      </div>
                      <div className="text-sm text-gray-500">Ativas</div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progresso da integração</span>
                      <span>{Math.round(getProgressPercentage())}%</span>
                    </div>
                    <Progress value={getProgressPercentage()} className="h-2" />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Backfill Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Executar Backfill
            </CardTitle>
            <CardDescription>
              Configure e execute o processo de criação dos produtos Stripe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Dry Run Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="dry-run"
                  checked={dryRun}
                  onCheckedChange={setDryRun}
                />
                <Label htmlFor="dry-run" className="text-sm">
                  Modo de teste (Dry Run) - apenas simula, não executa
                </Label>
                {dryRun && (
                  <Badge variant="outline" className="ml-2">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Teste
                  </Badge>
                )}
              </div>

              {/* Limit */}
              <div className="space-y-2">
                <Label htmlFor="limit">Limite de atividades (recomendado: 10-50)</Label>
                <Input
                  id="limit"
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  min={1}
                  max={200}
                  className="w-32"
                />
              </div>

              {/* Partner ID (optional) */}
              <div className="space-y-2">
                <Label htmlFor="partner-id">ID do Parceiro (opcional)</Label>
                <Input
                  id="partner-id"
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                  placeholder="Deixe vazio para processar todos"
                  className="font-mono text-sm"
                />
              </div>

              {/* Warning for production mode */}
              {!dryRun && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-orange-800">
                    <AlertTriangle className="h-5 w-5" />
                    <strong>Atenção!</strong>
                  </div>
                  <p className="text-orange-700 text-sm mt-1">
                    Modo de produção ativo. Isso irá criar produtos e payment links reais no Stripe.
                    Certifique-se de que as variáveis de ambiente estão corretas.
                  </p>
                </div>
              )}

              {/* Run Button */}
              <Button
                onClick={handleRunBackfill}
                disabled={isRunning}
                className="w-full"
                size="lg"
              >
                {isRunning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Executando...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    {dryRun ? 'Simular Backfill' : 'Executar Backfill'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {results.failed === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                Resultados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {results.total}
                    </div>
                    <div className="text-sm text-gray-500">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {results.processed}
                    </div>
                    <div className="text-sm text-gray-500">Processadas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {results.succeeded}
                    </div>
                    <div className="text-sm text-gray-500">Sucessos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {results.failed}
                    </div>
                    <div className="text-sm text-gray-500">Falhas</div>
                  </div>
                </div>

                {results.errors.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Erros encontrados:</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {results.errors.map((error: any, index: number) => (
                        <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                          <div className="font-medium text-red-800">{error.activityTitle}</div>
                          <div className="text-sm text-red-600">{error.error}</div>
                          <div className="text-xs text-red-500 font-mono">ID: {error.activityId}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instruções</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p>1. <strong>Sempre execute primeiro em modo de teste (Dry Run)</strong> para verificar quantas atividades serão processadas</p>
              <p>2. <strong>Use limite baixo</strong> (10-50) para evitar problemas de rate limiting do Stripe</p>
              <p>3. <strong>Certifique-se das variáveis de ambiente:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><code className="bg-gray-100 px-1 rounded">STRIPE_SECRET_KEY</code> - Chave secreta do Stripe</li>
                <li><code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_APP_URL</code> - URL da aplicação</li>
              </ul>
              <p>4. <strong>Monitore os logs</strong> no console do Convex para acompanhar o progresso</p>
              <p>5. <strong>Em caso de erro,</strong> você pode re-executar o script - ele não duplicará produtos existentes</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 