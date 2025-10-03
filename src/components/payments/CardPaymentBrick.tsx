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
                // Call backend to create payment with manual capture
                const result = await createPayment({
                  bookingId: propsRef.current.bookingId,
                  assetType: propsRef.current.assetType,
                  token: formData.token,
                  paymentMethodId: formData.payment_method_id,
                  issuerId: formData.issuer_id,
                  amount: propsRef.current.amount,
                  installments: formData.installments,
                  payer: {
                    email: formData.payer.email,
                    identification: formData.payer.identification
                      ? {
                          type: formData.payer.identification.type,
                          number: formData.payer.identification.number,
                        }
                      : undefined,
                  },
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
                const errorMessage = error instanceof Error ? error.message : "Erro ao processar pagamento";
                toast.error("Erro ao processar pagamento", {
                  description: errorMessage,
                });
                handleError(errorMessage);
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
