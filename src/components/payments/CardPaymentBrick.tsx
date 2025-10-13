"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CardPaymentBrickProps {
  bookingId: string;
  assetType: "activity" | "event" | "restaurant" | "vehicle" | "package";
  amount: number;
  description: string;
  payer: {
    email: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

declare global {
  interface Window {
    MercadoPago: any;
    cardPaymentBrickController?: any;
  }
}

export function CardPaymentBrick({
  bookingId,
  assetType,
  amount,
  description,
  payer,
  onSuccess,
  onError,
  className = "",
}: CardPaymentBrickProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const brickRef = useRef<any>(null);
  const isInitialized = useRef(false);
  
  // Armazenar props em refs para uso no useEffect
  const propsRef = useRef({ bookingId, assetType, amount, description, payer });
  propsRef.current = { bookingId, assetType, amount, description, payer };

  const createPayment = useAction(api.domains.mercadoPago.actions.createPaymentWithManualCapture);

  // Estabilizar callbacks com useCallback
  const handleSuccess = useCallback((paymentId: string) => {
    onSuccess?.(paymentId);
  }, [onSuccess]);

  const handleError = useCallback((error: string) => {
    onError?.(error);
  }, [onError]);

  useEffect(() => {
    // Prevenir reinicializações
    if (isInitialized.current) {
      return;
    }

    const loadMercadoPago = async () => {
      try {
        // Load MercadoPago SDK if not already loaded
        if (!window.MercadoPago) {
          const script = document.createElement("script");
          script.src = "https://sdk.mercadopago.com/js/v2";
          script.async = true;
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
        }

        // Get public key from environment
        const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
        if (!publicKey) {
          throw new Error("Mercado Pago public key not configured");
        }

        // Initialize MercadoPago instance
        const mp = new window.MercadoPago(publicKey);

        // Create Card Payment Brick
        const bricks = mp.bricks();
        
        const settings = {
          initialization: {
            amount: propsRef.current.amount,
            payer: {
              email: propsRef.current.payer.email,
            },
          },
          customization: {
            visual: {
              style: {
                theme: "default",
              },
            },
            paymentMethods: {
              maxInstallments: 12,
            },
          },
          callbacks: {
            onReady: () => {
              console.log("[Card Payment Brick] Ready");
              setIsLoading(false);
            },
            onSubmit: async (formData: any) => {
              setIsProcessing(true);
              console.log("[Card Payment Brick] Form submitted:", formData);

              try {
                // MP Brick nests data in formData.formData
                const innerFormData = formData.formData || formData;
                
                // CRITICAL: payment_method_id from innerFormData is the ONLY valid MP ID
                const paymentMethodId = innerFormData.payment_method_id;

                console.log("[Card Payment Brick] Extracted payment_method_id:", paymentMethodId);

                if (!paymentMethodId) {
                  console.error("[Card Payment Brick] Missing payment_method_id in innerFormData");
                  throw new Error("Método de pagamento não identificado. Por favor, selecione um método válido e tente novamente.");
                }

                // Call backend to create payment with manual capture
                const result = await createPayment({
                  bookingId: propsRef.current.bookingId,
                  assetType: propsRef.current.assetType,
                  token: innerFormData.token || formData.token || undefined,
                  paymentMethodId: paymentMethodId,
                  issuerId: innerFormData.issuer_id || formData.issuer_id || undefined,
                  amount: propsRef.current.amount,
                  installments: innerFormData.installments || formData.installments,
                  payer: (innerFormData.payer || formData.payer) ? {
                    email: (innerFormData.payer || formData.payer).email,
                    identification: (innerFormData.payer || formData.payer).identification
                      ? {
                          type: (innerFormData.payer || formData.payer).identification.type,
                          number: (innerFormData.payer || formData.payer).identification.number,
                        }
                      : undefined,
                  } : undefined,
                  description: propsRef.current.description,
                  metadata: {
                    assetType: propsRef.current.assetType,
                    bookingId: propsRef.current.bookingId,
                  },
                });

                if (result.success && result.paymentId) {
                  // Check payment status
                  if (result.status === "authorized") {
                    toast.success(
                      "Pagamento autorizado! Aguarde a confirmação do administrador.",
                      {
                        description: "O valor foi reservado no seu cartão.",
                        duration: 5000,
                      }
                    );
                    handleSuccess(result.paymentId);
                  } else if (result.status === "approved") {
                    toast.success("Pagamento aprovado com sucesso!");
                    handleSuccess(result.paymentId);
                  } else if (result.status === "rejected") {
                    toast.error("Pagamento rejeitado", {
                      description: result.statusDetail || "Tente novamente com outro cartão.",
                    });
                    handleError(result.statusDetail || "Payment rejected");
                  } else if (result.status === "in_process" || result.status === "pending") {
                    toast.info("Pagamento em processamento", {
                      description: "Você será notificado quando for confirmado.",
                    });
                    handleSuccess(result.paymentId);
                  }
                } else {
                  throw new Error(result.error || "Failed to create payment");
                }
              } catch (error) {
                console.error("[Card Payment Brick] Payment error:", error);
                
                // Parse error message for better UX
                let errorTitle = "Erro ao processar pagamento";
                let errorDescription = "Tente novamente em alguns instantes";
                
                if (error instanceof Error) {
                  const errorMsg = error.message.toLowerCase();
                  
                  // Mercado Pago API errors
                  if (errorMsg.includes("mercado pago api error")) {
                    errorTitle = "Erro no processamento do pagamento";
                    
                    if (errorMsg.includes("idempotency") || errorMsg.includes("header")) {
                      errorDescription = "Ocorreu um erro temporário. Por favor, recarregue a página e tente novamente.";
                    } else if (errorMsg.includes("400") || errorMsg.includes("bad request")) {
                      errorDescription = "Dados do pagamento inválidos. Verifique as informações do cartão e tente novamente.";
                    } else if (errorMsg.includes("401") || errorMsg.includes("unauthorized")) {
                      errorDescription = "Erro de autenticação. Por favor, entre em contato com o suporte.";
                    } else if (errorMsg.includes("404")) {
                      errorDescription = "Serviço de pagamento temporariamente indisponível. Tente novamente em alguns minutos.";
                    } else if (errorMsg.includes("500") || errorMsg.includes("502") || errorMsg.includes("503")) {
                      errorDescription = "Serviço de pagamento temporariamente indisponível. Tente novamente em alguns minutos.";
                    } else {
                      errorDescription = "Não foi possível processar o pagamento. Tente novamente ou entre em contato com o suporte.";
                    }
                  }
                  // Card/payment method errors
                  else if (errorMsg.includes("payment_method") || errorMsg.includes("método de pagamento")) {
                    errorTitle = "Método de pagamento inválido";
                    errorDescription = "Por favor, selecione um método de pagamento válido e tente novamente.";
                  }
                  // Token errors
                  else if (errorMsg.includes("token")) {
                    errorTitle = "Erro nos dados do cartão";
                    errorDescription = "Verifique os dados do cartão e tente novamente.";
                  }
                  // Network errors
                  else if (errorMsg.includes("network") || errorMsg.includes("fetch")) {
                    errorTitle = "Erro de conexão";
                    errorDescription = "Verifique sua conexão com a internet e tente novamente.";
                  }
                  // Generic errors - show original message if it's user-friendly
                  else if (error.message && error.message.length < 100 && !errorMsg.includes("error:")) {
                    errorDescription = error.message;
                  }
                }
                
                toast.error(errorTitle, {
                  description: errorDescription,
                  duration: 6000,
                  action: errorTitle.includes("temporário") || errorTitle.includes("indisponível") 
                    ? {
                        label: "Recarregar",
                        onClick: () => window.location.reload(),
                      }
                    : undefined,
                });
                
                handleError(error instanceof Error ? error.message : "Erro ao processar pagamento");
              } finally {
                setIsProcessing(false);
              }

              return;
            },
            onError: (error: any) => {
              console.error("[Card Payment Brick] Error:", error);
              toast.error("Erro no formulário de pagamento", {
                description: error.message || "Tente novamente",
              });
              handleError(error.message);
              setIsProcessing(false);
            },
          },
        };

        // Create the brick
        brickRef.current = await bricks.create("cardPayment", "cardPaymentBrick_container", settings);
        
        // Store controller globally for cleanup
        window.cardPaymentBrickController = brickRef.current;
        
        // Marcar como inicializado
        isInitialized.current = true;

      } catch (error) {
        console.error("[Card Payment Brick] Initialization error:", error);
        setIsLoading(false);
        toast.error("Erro ao carregar formulário de pagamento", {
          description: "Por favor, recarregue a página.",
        });
        handleError(error instanceof Error ? error.message : "Initialization error");
      }
    };

    loadMercadoPago();

    // Cleanup on unmount
    return () => {
      if (window.cardPaymentBrickController) {
        try {
          window.cardPaymentBrickController.unmount();
          window.cardPaymentBrickController = undefined;
        } catch (error) {
          console.error("[Card Payment Brick] Cleanup error:", error);
        }
      }
      isInitialized.current = false;
    };
  }, []); // Dependências vazias - inicializa apenas uma vez

  return (
    <div className={`card-payment-brick-wrapper ${className}`}>
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-sm text-muted-foreground">
            Carregando formulário de pagamento...
          </span>
        </div>
      )}
      
      <div
        id="cardPaymentBrick_container"
        ref={containerRef}
        className={isLoading ? "hidden" : ""}
      />

      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm mx-4">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-2">Processando pagamento</h3>
                <p className="text-sm text-muted-foreground">
                  Aguarde enquanto autorizamos o pagamento no seu cartão...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
