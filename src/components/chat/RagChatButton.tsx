"use client";

import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Authenticated, Unauthenticated, useAction } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { toast } from "sonner";

interface RagChatButtonProps {
  variant?: "default" | "outline" | "ghost" | "floating";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  customLabel?: string;
}

export const RagChatButton: React.FC<RagChatButtonProps> = ({
  variant = "default",
  size = "md",
  showLabel = true,
  className = "",
  customLabel,
}) => {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [context, setContext] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const askGuide = useAction(api.guide.askGuide);

  const getButtonSize = () => {
    switch (size) {
      case "sm":
        return "sm" as const;
      case "lg":
        return "lg" as const;
      default:
        return "default" as const;
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case "outline":
        return "outline" as const;
      case "ghost":
        return "ghost" as const;
      case "floating":
        return "default" as const;
      default:
        return "default" as const;
    }
  };

  const buttonClasses =
    variant === "floating"
      ? `fixed bottom-8 right-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 border-none text-white ${className}`
      : className;

  const onAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer(null);
    setContext(null);
    try {
      const res = await askGuide({ prompt: question.trim(), limit: 8 });
      // res should be { answer: string, context: any }
      setAnswer(res?.answer ?? null);
      setContext(res?.context ?? null);
    } catch (err) {
      console.error("Erro ao consultar guia AI:", err);
      toast.error("Não foi possível obter a resposta da IA");
    } finally {
      setLoading(false);
    }
  };

  const renderSources = () => {
    // Try best-effort rendering for context (structure from @convex-dev/rag)
    // Typical shape: context.chunks: Array<{ content: { text, metadata? }, score?, entryId?, key? }>
    const chunks = (context && (context.chunks || context.results || context.sources)) ?? [];
    if (!Array.isArray(chunks) || chunks.length === 0) return null;
    return (
      <div className="mt-4 border-t pt-4">
        <h4 className="text-sm font-semibold mb-2">Fontes relacionadas</h4>
        <ul className="space-y-2 max-h-40 overflow-auto">
          {chunks.map((c: any, idx: number) => {
            const text: string = c?.content?.text || c?.text || "";
            const key: string | undefined = c?.key || c?.content?.metadata?.key;
            return (
              <li key={idx} className="text-xs text-slate-600">
                {key && <span className="font-medium mr-1">{key}:</span>}
                <span>{text.slice(0, 160)}{text.length > 160 ? "…" : ""}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <>
      <Authenticated>
        <Button
          variant={getButtonVariant()}
          size={getButtonSize()}
          className={buttonClasses}
          onClick={() => setOpen(true)}
        >
          <Sparkles className={`${size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5"}`} />
          {showLabel && <span className="ml-2">{customLabel || "Dúvidas? Pergunte à IA"}</span>}
        </Button>
      </Authenticated>

      <Unauthenticated>
        <Button
          disabled
          variant={getButtonVariant()}
          size={getButtonSize()}
          className={
            variant === "floating"
              ? `fixed bottom-8 right-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 bg-gradient-to-r from-gray-400 to-gray-500 border-none text-white opacity-50 cursor-not-allowed ${className}`
              : `${className} opacity-50 cursor-not-allowed`
          }
          title="Faça login para usar o assistente"
        >
          <Sparkles className={`${size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5"}`} />
          {showLabel && <span className="ml-2">Login necessário</span>}
        </Button>
      </Unauthenticated>

      <Authenticated>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5" />
                <span>Assistente da Ilha (IA)</span>
              </DialogTitle>
              <DialogDescription>
                Faça perguntas sobre o guia e receba respostas com base no nosso conteúdo.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rag-question">Sua pergunta</Label>
                <Textarea
                  id="rag-question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ex.: Como funciona a confirmação da minha reserva?"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Fechar
                </Button>
                <Button onClick={onAsk} disabled={loading || !question.trim()}>
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Perguntando...
                    </>
                  ) : (
                    "Perguntar"
                  )}
                </Button>
              </div>

              {answer && (
                <div className="mt-2 p-4 rounded-md bg-slate-50 border text-slate-800">
                  <div className="text-sm whitespace-pre-wrap">{answer}</div>
                  {renderSources()}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </Authenticated>
    </>
  );
};

export default RagChatButton;
