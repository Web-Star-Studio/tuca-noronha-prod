"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Database, Sparkles } from 'lucide-react';

interface RecommendationDebugProps {
  recommendations: any[];
  realAssets?: any[];
  isUsingAI: boolean;
  className?: string;
}

export default function RecommendationsDebug({ 
  recommendations, 
  realAssets = [], 
  isUsingAI,
  className 
}: RecommendationDebugProps) {
  // Análise de duplicação
  const ids = recommendations.map(rec => rec.id);
  const uniqueIds = [...new Set(ids)];
  const hasDuplicates = ids.length !== uniqueIds.length;
  
  // Encontrar duplicados
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  const duplicateDetails = duplicates.map(dupId => {
    const recs = recommendations.filter(rec => rec.id === dupId);
    return {
      id: dupId,
      count: recs.length,
      titles: recs.map(r => r.title),
      types: recs.map(r => r.type)
    };
  });

  // Análise de tipos
  const typeAnalysis = recommendations.reduce((acc, rec) => {
    acc[rec.type] = (acc[rec.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Análise de assets reais
  const realAssetsAnalysis = realAssets.length > 0 ? {
    total: realAssets.length,
    byType: realAssets.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    uniqueIds: [...new Set(realAssets.map(a => a.id))].length
  } : null;

  return (
    <div className={className}>
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Database className="h-5 w-5" />
            Debug de Recomendações
            {isUsingAI && <Badge className="bg-green-100 text-green-800">IA Ativa</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status de Duplicação */}
          <Alert className={hasDuplicates ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
            <div className="flex items-center gap-2">
              {hasDuplicates ? (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <AlertDescription className={hasDuplicates ? "text-red-800" : "text-green-800"}>
                {hasDuplicates ? (
                  <>
                    <strong>Duplicação Detectada!</strong>
                    <br />
                    Total: {ids.length} | Únicos: {uniqueIds.length} | Duplicados: {duplicates.length}
                  </>
                ) : (
                  <>
                    <strong>Sem Duplicação</strong>
                    <br />
                    {ids.length} recomendações com IDs únicos
                  </>
                )}
              </AlertDescription>
            </div>
          </Alert>

          {/* Detalhes de Duplicação */}
          {hasDuplicates && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-800 mb-2">Detalhes da Duplicação:</h4>
              {duplicateDetails.map((dup, index) => (
                <div key={index} className="mb-2 p-2 bg-white rounded border border-red-200">
                  <div className="text-sm">
                    <strong>ID:</strong> {dup.id}
                  </div>
                  <div className="text-sm">
                    <strong>Aparições:</strong> {dup.count}
                  </div>
                  <div className="text-sm">
                    <strong>Títulos:</strong> {dup.titles.join(', ')}
                  </div>
                  <div className="text-sm">
                    <strong>Tipos:</strong> {dup.types.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Análise por Tipo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Recomendações por Tipo:</h4>
              {Object.entries(typeAnalysis).map(([type, count]) => (
                <div key={type} className="flex justify-between text-sm">
                  <span className="capitalize">{type}:</span>
                  <Badge variant="outline">{String(count)}</Badge>
                </div>
              ))}
            </div>

            {realAssetsAnalysis && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">Assets Reais:</h4>
                <div className="text-sm mb-2">
                  <strong>Total:</strong> {realAssetsAnalysis.total}
                </div>
                <div className="text-sm mb-2">
                  <strong>IDs Únicos:</strong> {realAssetsAnalysis.uniqueIds}
                </div>
                {Object.entries(realAssetsAnalysis.byType).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="capitalize">{type}:</span>
                    <Badge variant="outline">{String(count)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lista de IDs */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2">IDs das Recomendações:</h4>
            <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-gray-500">{index + 1}.</span>
                  <code className="bg-white px-2 py-1 rounded text-xs">{rec.id}</code>
                  <span className="text-sm truncate">{rec.title}</span>
                  <Badge variant="outline" className="text-xs">{rec.type}</Badge>
                  {rec.aiGenerated && <Sparkles className="h-3 w-3 text-green-500" />}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 