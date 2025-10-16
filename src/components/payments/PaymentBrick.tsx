"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PixPaymentModal } from "./PixPaymentModal";

interface PaymentResult {
  paymentId: string;
  paymentType: string;
  status: string;
  pixQrCode?: string;
  pixQrCodeBase64?: string;
  boletoUrl?: string;
}

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
  onSuccess?: (result: PaymentResult) => void;
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
  const [pixPaymentData, setPixPaymentData] = useState<PaymentResult | null>(null);
  const [showPixModal, setShowPixModal] = useState(false);
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
  const handleSuccess = useCallback((result: PaymentResult) => {
    onSuccess?.(result);
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
        console.log("[PaymentBrick] Checking public key...");
        console.log("[PaymentBrick] Public key exists:", !!publicKey);
        console.log("[PaymentBrick] Public key prefix:", publicKey?.substring(0, 20));
        
        if (!publicKey) {
          const errorMsg = "Mercado Pago Public Key não configurada. Verifique se NEXT_PUBLIC_MP_PUBLIC_KEY está configurada na Vercel e faça redeploy.";
          console.error("[PaymentBrick]", errorMsg);
          throw new Error(errorMsg);
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
                // MP Brick nests data in formData.formData
                const innerFormData = formData.formData || formData;
                
                // CRITICAL: payment_method_id from innerFormData is the ONLY valid MP ID
                // selectedPaymentMethod and paymentType are just UI identifiers
                const paymentMethodId = innerFormData.payment_method_id;

                console.log("[Payment Brick] innerFormData:", innerFormData);
                console.log("[Payment Brick] Extracted payment_method_id:", paymentMethodId);
                console.log("[Payment Brick] UI identifiers:", {
                  selectedPaymentMethod: formData.selectedPaymentMethod,
                  paymentType: formData.paymentType
                });

                if (!paymentMethodId) {
                  console.error("[Payment Brick] Missing payment_method_id in innerFormData");
                  throw new Error("Método de pagamento não identificado. Por favor, selecione um método válido e tente novamente.");
                }

                // Identificar tipo de pagamento
                const paymentType = paymentMethodId;
                const isTicket = paymentType === "bolbradesco" || paymentType === "pec";
                const isPix = paymentType === "pix";
                
                // Call backend to create payment
                const result = await createPayment({
                  bookingId: propsRef.current.bookingId,
                  assetType: propsRef.current.assetType,
                  token: innerFormData.token || formData.token || undefined,
                  paymentMethodId: paymentMethodId,
                  issuerId: innerFormData.issuer_id || formData.issuer_id || undefined,
                  amount: propsRef.current.amount,
                  installments: innerFormData.installments || formData.installments || 1,
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
                  const paymentResult: PaymentResult = {
                    paymentId: result.paymentId,
                    paymentType: paymentType,
                    status: result.status || "unknown",
                    pixQrCode: result.pixQrCode,
                    pixQrCodeBase64: result.pixQrCodeBase64,
                    boletoUrl: result.boletoUrl
                  };

                  console.log("[Payment Brick] Payment result:", paymentResult);

                  // Check payment status
                  if (result.status === "authorized") {
                    toast.success(
                      "Pagamento autorizado! Aguarde a confirmação do administrador.",
                      {
                        description: "O valor foi reservado no seu cartão.",
                        duration: 5000,
                      }
                    );
                    handleSuccess(paymentResult);
                  } else if (result.status === "approved") {
                    toast.success("Pagamento aprovado com sucesso!");
                    handleSuccess(paymentResult);
                  } else if (result.status === "pending") {
                    if (isTicket) {
                      toast.info("Boleto gerado com sucesso!", {
                        description: "Você receberá o boleto por email. Pague até o vencimento.",
                        duration: 8000,
                      });
                    } else if (isPix) {
                      if (result.pixQrCode) {
                        // Armazenar dados do PIX e abrir modal
                        setPixPaymentData(paymentResult);
                        setShowPixModal(true);
                        toast.success("PIX gerado com sucesso!", {
                          description: "Use o QR Code ou copie o código para pagar.",
                          duration: 8000,
                        });
                        console.log("[Payment Brick] PIX QR Code:", result.pixQrCode);
                        console.log("[Payment Brick] PIX QR Code Base64:", result.pixQrCodeBase64 ? "present" : "missing");
                      } else {
                        toast.info("PIX gerado!", {
                          description: "Aguarde... gerando código PIX.",
                          duration: 8000,
                        });
                      }
                    } else {
                      toast.info("Pagamento em processamento", {
                        description: "Você será notificado quando for confirmado.",
                      });
                    }
                    handleSuccess(paymentResult);
                  } else if (result.status === "rejected") {
                    toast.error("Pagamento rejeitado", {
                      description: result.statusDetail || "Tente novamente com outro método.",
                    });
                    handleError(result.statusDetail || "Payment rejected");
                  } else if (result.status === "in_process") {
                    toast.info("Pagamento em processamento", {
                      description: "Você será notificado quando for confirmado.",
                    });
                    handleSuccess(paymentResult);
                  }
                } else {
                  throw new Error(result.error || "Failed to create payment");
                }
              } catch (error) {
                console.error("[Payment Brick] Payment error:", error);
                
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
                      errorDescription = "Dados do pagamento inválidos. Verifique as informações e tente novamente.";
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
                    errorTitle = "Erro nos dados do pagamento";
                    errorDescription = "Verifique os dados e tente novamente.";
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

  // Modal PIX - mantém dados mesmo após brick fechar
  const handlePixModalClose = () => {
    setShowPixModal(false);
    // Não limpar pixPaymentData para permitir reabrir
  };

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

      {/* Modal PIX */}
      {pixPaymentData && pixPaymentData.pixQrCode && (
        <PixPaymentModal
          open={showPixModal}
          onOpenChange={handlePixModalClose}
          pixQrCode={pixPaymentData.pixQrCode}
          pixQrCodeBase64={pixPaymentData.pixQrCodeBase64}
          amount={amount}
          expiresIn={30}
          paymentId={pixPaymentData.paymentId}
          onPaymentConfirmed={() => {
            setShowPixModal(false);
            handleSuccess(pixPaymentData);
          }}
        />
      )}
    </div>
  );
}
