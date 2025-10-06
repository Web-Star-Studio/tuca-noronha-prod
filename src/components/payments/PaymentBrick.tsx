"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PaymentBrickProps {
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
    firstName?: string;
    lastName?: string;
  };
  onSuccess?: (paymentId: string, paymentType: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

declare global {
  interface Window {
    MercadoPago: any;
  }
}

export function PaymentBrick({
  bookingId,
  assetType,
  amount,
  description,
  payer,
  onSuccess,
  onError,
  className = "",
}: PaymentBrickProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const brickRef = useRef<any>(null);
  const isInitialized = useRef(false);
  
  // Gerar ID único para evitar duplicação
  const containerId = useRef(`paymentBrick_${Math.random().toString(36).substr(2, 9)}`);
  
  // Armazenar props em refs para uso no useEffect
  const propsRef = useRef({ bookingId, assetType, amount, description, payer });
  propsRef.current = { bookingId, assetType, amount, description, payer };

  const createPayment = useAction(api.domains.mercadoPago.actions.createPaymentWithManualCapture);

  // Estabilizar callbacks com useCallback
  const handleSuccess = useCallback((paymentId: string, paymentType: string = "credit_card") => {
    onSuccess?.(paymentId, paymentType);
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
        const mp = new window.MercadoPago(publicKey, {
          locale: "pt-BR",
        });

        // Create Payment Brick
        const bricks = mp.bricks();
        
        const settings = {
          initialization: {
            amount: propsRef.current.amount,
            payer: {
              email: propsRef.current.payer.email,
              firstName: propsRef.current.payer.firstName,
              lastName: propsRef.current.payer.lastName,
            },
          },
          customization: {
            visual: {
              style: {
                theme: "default",
              },
            },
            paymentMethods: {
              creditCard: "all",
              debitCard: "all",
              ticket: "all", // Boleto
              bankTransfer: "all", // PIX
              maxInstallments: 12,
            },
          },
          callbacks: {
            onReady: () => {
              console.log("[Payment Brick] Ready");
              setIsLoading(false);
            },
            onSubmit: async (formData: any) => {
              setIsProcessing(true);
              console.log("[Payment Brick] Form submitted:", formData);

              try {
                // Identificar tipo de pagamento
                const paymentType = formData.payment_method_id;
                const isTicket = paymentType === "bolbradesco" || paymentType === "pec";
                const isPix = paymentType === "pix";
                
                // Call backend to create payment
                const result = await createPayment({
                  bookingId: propsRef.current.bookingId,
                  assetType: propsRef.current.assetType,
                  token: formData.token,
                  paymentMethodId: formData.payment_method_id,
                  issuerId: formData.issuer_id,
                  amount: propsRef.current.amount,
                  installments: formData.installments || 1,
                  payer: formData.payer ? {
                    email: formData.payer.email,
                    identification: formData.payer.identification
                      ? {
                          type: formData.payer.identification.type,
                          number: formData.payer.identification.number,
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
                    handleSuccess(result.paymentId, paymentType);
                  } else if (result.status === "approved") {
                    toast.success("Pagamento aprovado com sucesso!");
                    handleSuccess(result.paymentId, paymentType);
                  } else if (result.status === "pending") {
                    if (isTicket) {
                      toast.info("Boleto gerado com sucesso!", {
                        description: "Você receberá o boleto por email. Pague até o vencimento.",
                        duration: 8000,
                      });
                    } else if (isPix) {
                      toast.info("PIX gerado com sucesso!", {
                        description: "Use o QR Code ou cole o código PIX para pagar.",
                        duration: 8000,
                      });
                    } else {
                      toast.info("Pagamento em processamento", {
                        description: "Você será notificado quando for confirmado.",
                      });
                    }
                    handleSuccess(result.paymentId, paymentType);
                  } else if (result.status === "rejected") {
                    toast.error("Pagamento rejeitado", {
                      description: result.statusDetail || "Tente novamente com outro método.",
                    });
                    handleError(result.statusDetail || "Payment rejected");
                  } else if (result.status === "in_process") {
                    toast.info("Pagamento em processamento", {
                      description: "Você será notificado quando for confirmado.",
                    });
                    handleSuccess(result.paymentId, paymentType);
                  }
                } else {
                  throw new Error(result.error || "Failed to create payment");
                }
              } catch (error) {
                console.error("[Payment Brick] Payment error:", error);
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
              console.error("[Payment Brick] Error:", error);
              toast.error("Erro no formulário de pagamento", {
                description: error.message || "Tente novamente",
              });
              handleError(error.message);
              setIsProcessing(false);
            },
          },
        };

        // Create the brick usando ID único
        brickRef.current = await bricks.create("payment", containerId.current, settings);
        
        // Não usar variável global - usar ref local
        // window.paymentBrickController = brickRef.current;
        
        // Marcar como inicializado
        isInitialized.current = true;

      } catch (error) {
        console.error("[Payment Brick] Initialization error:", error);
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
      if (brickRef.current) {
        try {
          brickRef.current.unmount();
          brickRef.current = null;
        } catch (error) {
          console.error("[Payment Brick] Cleanup error:", error);
        }
      }
      isInitialized.current = false;
    };
  }, []); // Dependências vazias - inicializa apenas uma vez

  return (
    <div className={`payment-brick-wrapper ${className}`}>
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-sm text-muted-foreground">
            Carregando métodos de pagamento...
          </span>
        </div>
      )}
      
      <div
        id={containerId.current}
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
                  Aguarde enquanto processamos seu pagamento...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
