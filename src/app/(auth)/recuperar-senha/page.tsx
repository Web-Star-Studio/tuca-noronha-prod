"use client";

import { useState, useEffect } from "react";
import { useAuth, useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock, ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [successfulCreation, setSuccessfulCreation] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { isLoaded, signIn, setActive } = useSignIn();

  useEffect(() => {
    if (isSignedIn) {
      router.push("/meu-painel");
    }
  }, [isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Enviar código de recuperação para o email
  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await signIn?.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });

      setSuccessfulCreation(true);
      toast.success("Código enviado!", {
        description: "Verifique seu email para o código de recuperação.",
      });
    } catch (err: any) {
      console.error("Erro ao enviar código:", err);
      
      // Tradução de erros comuns
      const errorMessage = err.errors?.[0]?.longMessage || err.message;
      let translatedError = errorMessage;
      
      if (errorMessage.includes("not found") || errorMessage.includes("couldn't be found")) {
        translatedError = "Email não encontrado. Verifique se está cadastrado.";
      } else if (errorMessage.includes("blocked") || errorMessage.includes("temporarily")) {
        translatedError = "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
      } else if (errorMessage.includes("invalid")) {
        translatedError = "Email inválido. Por favor, verifique o formato.";
      }
      
      setError(translatedError);
      toast.error("Erro ao enviar código", {
        description: translatedError,
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Redefinir senha com o código recebido
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn?.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });

      if (result?.status === "complete") {
        await setActive?.({ session: result.createdSessionId });
        setComplete(true);
        
        toast.success("Senha redefinida!", {
          description: "Redirecionando para seu painel...",
        });

        setTimeout(() => {
          router.push("/meu-painel");
        }, 2000);
      }
    } catch (err: any) {
      console.error("Erro ao redefinir senha:", err);
      
      // Tradução de erros comuns
      const errorMessage = err.errors?.[0]?.longMessage || err.message;
      let translatedError = errorMessage;
      
      if (errorMessage.includes("incorrect") || errorMessage.includes("invalid")) {
        translatedError = "Código incorreto. Verifique o código enviado ao seu email.";
      } else if (errorMessage.includes("expired")) {
        translatedError = "Código expirado. Solicite um novo código.";
      } else if (errorMessage.includes("weak") || errorMessage.includes("password")) {
        translatedError = "Senha muito fraca. Use no mínimo 8 caracteres com letras e números.";
      }
      
      setError(translatedError);
      toast.error("Erro ao redefinir senha", {
        description: translatedError,
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Se completou, mostrar mensagem de sucesso
  if (complete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Senha Redefinida!</CardTitle>
            <CardDescription>
              Sua senha foi alterada com sucesso. Você será redirecionado em instantes...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para login
          </Link>
          <CardTitle className="text-2xl">
            {!successfulCreation ? "Recuperar Senha" : "Redefinir Senha"}
          </CardTitle>
          <CardDescription>
            {!successfulCreation
              ? "Digite seu email para receber o código de recuperação"
              : "Digite o código enviado ao seu email e sua nova senha"}
          </CardDescription>
        </CardHeader>

        <form onSubmit={!successfulCreation ? handleSendCode : handleResetPassword}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!successfulCreation ? (
              <>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu-email@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label htmlFor="code" className="text-sm font-medium">
                    Código de Verificação
                  </label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Digite o código de 6 dígitos"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={6}
                    required
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500">
                    Verifique seu email para o código de recuperação
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      minLength={8}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Use no mínimo 8 caracteres com letras e números
                  </p>
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : !successfulCreation ? (
                "Enviar Código"
              ) : (
                "Redefinir Senha"
              )}
            </Button>

            {successfulCreation && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSuccessfulCreation(false);
                  setCode("");
                  setPassword("");
                  setError("");
                }}
                disabled={isLoading}
              >
                Solicitar Novo Código
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
