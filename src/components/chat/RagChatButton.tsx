"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Bot, User, History, Sparkles } from "lucide-react";
import { Authenticated, Unauthenticated } from "convex/react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

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
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);

  const { user } = useUser();
  const userId = user?.id;

  // Actions for thread management
  const createThread = useAction(api.guide.createThread);
  const askGuideWithThread = useAction(api.guide.askGuideWithThread);
  
  // Legacy action for backwards compatibility
  const askGuide = useAction(api.guide.askGuide);
  
  // Query for loading thread messages
  const threadMessages = useQuery(
    api.guide.listThreadMessages,
    threadId ? { threadId, paginationOpts: { numItems: 50 } } : "skip"
  );

  // Initialize thread when dialog opens
  useEffect(() => {
    if (open && !threadId && userId) {
      initializeThread();
    }
  }, [open, threadId, userId]);

  // Update messages when thread messages load
  useEffect(() => {
    if (threadMessages?.page) {
      const formattedMessages = threadMessages.page
        .filter((msg: any) => msg.role === 'user' || msg.role === 'assistant')
        .map((msg: any) => ({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : msg.content?.[0]?.text || ''
        }))
        .reverse(); // Reverse to show latest first in our UI
      
      setMessages(formattedMessages);
    }
  }, [threadMessages]);

  const initializeThread = async () => {
    if (!userId) return;
    
    try {
      const result = await createThread({
        userId,
        title: "Chat com Tuca Noronha"
      });
      setThreadId(result.threadId);
    } catch (error) {
      console.error("Erro ao criar thread:", error);
      toast.error("Erro ao inicializar conversa");
    }
  };

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
      ? `fixed bottom-8 right-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 border-none text-white hidden md:flex ${className}`
      : className;

  const onAsk = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    
    // Add user message optimistically
    const userMessage = { role: 'user' as const, content: question.trim() };
    setMessages(prev => [...prev, userMessage]);
    
    const currentQuestion = question.trim();
    setQuestion("");
    
    try {
      let response;
      
      if (threadId && userId) {
        // Use enhanced thread-based conversation
        response = await askGuideWithThread({
          prompt: currentQuestion,
          threadId,
          userId,
        });
      } else {
        // Fallback to legacy method
        response = await askGuide({ prompt: currentQuestion });
      }
      
      // Add assistant response
      if (response?.answer) {
        const assistantMessage = { role: 'assistant' as const, content: response.answer };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (err) {
      console.error("Erro ao consultar guia AI:", err);
      toast.error("Não foi possível obter a resposta da IA");
      
      // Remove the optimistic user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (message: {role: 'user' | 'assistant', content: string}, index: number) => {
    return (
      <div key={index} className={`flex gap-2 sm:gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex gap-1 sm:gap-2 max-w-[85%] sm:max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
            message.role === 'user' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white'
          }`}>
            {message.role === 'user' ? <User className="w-3 h-3 sm:w-4 sm:h-4" /> : <Bot className="w-3 h-3 sm:w-4 sm:h-4" />}
          </div>
          <div className={`rounded-lg px-3 py-2 sm:px-4 ${
            message.role === 'user'
              ? 'bg-blue-500 text-white ml-auto'
              : 'bg-gray-100 text-gray-900'
          }`}>
            <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{message.content}</p>
          </div>
        </div>
      </div>
    );
  };

  const clearConversation = () => {
    setMessages([]);
    setThreadId(null);
    toast.success("Conversa limpa com sucesso");
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
              ? `fixed bottom-8 right-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 bg-gradient-to-r from-gray-400 to-gray-500 border-none text-white opacity-50 cursor-not-allowed hidden md:flex ${className}`
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
          <DialogContent className="w-full h-full sm:w-auto sm:h-auto sm:max-w-2xl sm:max-h-[80vh] max-w-none max-h-none m-0 p-4 sm:m-6 sm:p-6 flex flex-col rounded-none sm:rounded-lg">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-violet-600" />
                  Tuca Noronha - Assistente IA
                </div>
                <div className="flex items-center gap-2">
                  {threadId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearConversation}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <History className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </DialogTitle>
              <DialogDescription>
                Converse com o Tuca sobre Fernando de Noronha - praias, restaurantes, atividades e muito mais!
              </DialogDescription>
            </DialogHeader>

            {/* Messages Area */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-2 space-y-4 min-h-[200px] sm:min-h-[300px]">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center px-4">
                      <Bot className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-4 text-violet-400" />
                      <p className="text-sm sm:text-base">Olá! Sou o Tuca Noronha, seu assistente virtual.</p>
                      <p className="text-xs sm:text-sm mt-2">Pergunte qualquer coisa sobre Fernando de Noronha!</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => renderMessage(message, index))
                )}
                
                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex gap-2">
                      <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-violet-500 to-indigo-500 text-white">
                        <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                      <div className="bg-gray-100 text-gray-900 rounded-lg px-3 py-2 sm:px-4">
                        <div className="flex items-center space-x-1">
                          <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                          <span className="text-xs sm:text-sm">Tuca está pensando...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 border-t pt-3 sm:pt-4">
              <div className="flex gap-2">
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Pergunte sobre praias, restaurantes, atividades..."
                  className="flex-1 text-sm sm:text-base"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onAsk();
                    }
                  }}
                />
                <Button 
                  onClick={onAsk} 
                  disabled={loading || !question.trim()}
                  className="px-2 sm:px-3 min-w-[40px] sm:min-w-[44px]"
                  size="sm"
                >
                  {loading ? (
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                  ) : (
                    <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </Authenticated>
    </>
  );
};

export default RagChatButton;
