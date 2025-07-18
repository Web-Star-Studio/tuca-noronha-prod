"use client";
import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";
import { motion } from "framer-motion";
import {playfairDisplay} from '@/lib/fonts'
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[url('/images/bg-pattern.png')] bg-cover bg-center bg-no-repeat bg-blend-overlay bg-white/80 backdrop-blur-sm relative">
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute top-6 left-6"
      >
        <Link href="/">
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full w-10 h-10 p-0 bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all shadow-sm hover:shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-800">
              <path d="m12 19-7-7 7-7"/>
              <path d="M19 12H5"/>
            </svg>
            <span className="sr-only">Voltar para home</span>
          </Button>
        </Link>
      </motion.div>
      <div className="max-w-md w-full mx-auto">
        <SignIn.Root>
          <Clerk.Loading>
            {(isGlobalLoading) => (
              <>
                <SignIn.Step name="start">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Card className="w-full shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                      <CardHeader className="space-y-2 pb-4">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2, duration: 0.4 }}
                        >
                          <CardTitle className={`text-3xl font-bold text-center ${playfairDisplay.className}`}>
                            Tuca Noronha
                          </CardTitle>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3, duration: 0.4 }}
                        >
                          <CardDescription className="text-center text-gray-600">
                            Acesse sua conta para continuar
                          </CardDescription>
                        </motion.div>
                      </CardHeader>
                      <CardContent className="grid gap-y-6">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4, duration: 0.4 }}
                          className="grid grid-cols-1 gap-4"
                        >
                          <Clerk.Connection name="google" asChild>
                            <Button
                              size="lg"
                              variant="outline"
                              type="button"
                              disabled={isGlobalLoading}
                              className="w-full border-gray-300 bg-white/80 hover:bg-white text-gray-800 font-medium backdrop-blur-sm transition-all duration-300 hover:shadow-md"
                            >
                              <Clerk.Loading scope="provider:google">
                                {(isLoading) =>
                                  isLoading ? (
                                    <Icons.spinner className="size-5 animate-spin" />
                                  ) : (
                                    <>
                                      <Icons.google className="mr-2 size-5" />
                                      Entrar com Google
                                    </>
                                  )
                                }
                              </Clerk.Loading>
                            </Button>
                          </Clerk.Connection>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5, duration: 0.4 }}
                        >
                          <p className="flex items-center gap-x-3 text-sm text-gray-500 before:h-px before:flex-1 before:bg-gray-200 after:h-px after:flex-1 after:bg-gray-200">
                            ou continue com email
                          </p>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6, duration: 0.4 }}
                        >
                          <Clerk.Field name="identifier" className="space-y-3">
                            <Clerk.Label asChild>
                              <Label className="text-gray-700">Email</Label>
                            </Clerk.Label>
                            <Clerk.Input type="email" required asChild>
                              <Input
                                className="h-11 border-gray-300 focus:border-blue-500 bg-white/70 focus:bg-white transition-all duration-300"
                                placeholder="seu@email.com"
                              />
                            </Clerk.Input>
                            <Clerk.FieldError className="block text-sm text-red-600" />
                          </Clerk.Field>
                        </motion.div>
                      </CardContent>
                      <CardFooter className="pb-6 pt-2">
                        <motion.div
                          className="grid w-full gap-y-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.7, duration: 0.4 }}
                        >
                          <SignIn.Action submit asChild>
                            <Button
                              disabled={isGlobalLoading}
                              className="h-11 bg-blue-700 hover:bg-blue-800 text-white font-medium transition-all duration-300 hover:shadow-lg"
                            >
                              <Clerk.Loading>
                                {(isLoading) => {
                                  return isLoading ? (
                                    <Icons.spinner className="size-5 animate-spin" />
                                  ) : (
                                    "Continuar"
                                  );
                                }}
                              </Clerk.Loading>
                            </Button>
                          </SignIn.Action>

                          <div className="text-center">
                            <Button
                              variant="link"
                              size="sm"
                              asChild
                              className="text-blue-700 hover:text-blue-800 transition-colors duration-300"
                            >
                              <Clerk.Link navigate="sign-up">
                                Não tem uma conta? Cadastre-se
                              </Clerk.Link>
                            </Button>
                          </div>
                        </motion.div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                </SignIn.Step>

                <SignIn.Step name="choose-strategy">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Card className="w-full shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                      <CardHeader className="space-y-2 pb-4">
                        <CardTitle className="text-2xl font-playfair font-bold text-center text-blue-900">
                          Escolha outro método
                        </CardTitle>
                        <CardDescription className="text-center text-gray-600">
                          Problemas para entrar? Utilize algum dos métodos
                          abaixo.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-y-4">
                        <SignIn.SupportedStrategy name="email_code" asChild>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isGlobalLoading}
                            className="w-full justify-start text-gray-700 bg-white/70 hover:bg-white transition-all duration-300 hover:shadow-md"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-2"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                              <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            Código por email
                          </Button>
                        </SignIn.SupportedStrategy>
                        <SignIn.SupportedStrategy name="password" asChild>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isGlobalLoading}
                            className="w-full justify-start text-gray-700 bg-white/70 hover:bg-white transition-all duration-300 hover:shadow-md"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-2"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect
                                x="3"
                                y="11"
                                width="18"
                                height="11"
                                rx="2"
                                ry="2"
                              ></rect>
                              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            Senha
                          </Button>
                        </SignIn.SupportedStrategy>
                      </CardContent>
                      <CardFooter className="pb-6 pt-2">
                        <div className="grid w-full gap-y-4">
                          <SignIn.Action navigate="previous" asChild>
                            <Button
                              disabled={isGlobalLoading}
                              className="h-11 bg-blue-700 hover:bg-blue-800 text-white font-medium transition-all duration-300 hover:shadow-lg"
                            >
                              <Clerk.Loading>
                                {(isLoading) => {
                                  return isLoading ? (
                                    <Icons.spinner className="size-5 animate-spin" />
                                  ) : (
                                    "Voltar"
                                  );
                                }}
                              </Clerk.Loading>
                            </Button>
                          </SignIn.Action>
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                </SignIn.Step>

                <SignIn.Step name="verifications">
                  <SignIn.Strategy name="password">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <Card className="w-full shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                        <CardHeader className="space-y-2 pb-4">
                          <CardTitle className="text-2xl font-playfair font-bold text-center text-blue-900">
                            Digite sua senha
                          </CardTitle>
                          <CardDescription className="text-center text-gray-600">
                            Por favor, informe sua senha para acessar
                          </CardDescription>
                          <p className="text-sm text-center text-blue-600 font-medium">
                            <SignIn.SafeIdentifier />
                          </p>
                        </CardHeader>
                        <CardContent className="grid gap-y-4">
                          <Clerk.Field name="password" className="space-y-3">
                            <Clerk.Label asChild>
                              <Label className="text-gray-700">Senha</Label>
                            </Clerk.Label>
                            <Clerk.Input type="password" asChild>
                              <Input
                                className="h-11 border-gray-300 focus:border-blue-500 bg-white/70 focus:bg-white transition-all duration-300"
                                placeholder="••••••••"
                              />
                            </Clerk.Input>
                            <Clerk.FieldError className="block text-sm text-red-600" />
                          </Clerk.Field>
                        </CardContent>
                        <CardFooter className="pb-6 pt-2">
                          <div className="grid w-full gap-y-4">
                            <SignIn.Action submit asChild>
                              <Button
                                disabled={isGlobalLoading}
                                className="h-11 bg-blue-700 hover:bg-blue-800 text-white font-medium transition-all duration-300 hover:shadow-lg"
                              >
                                <Clerk.Loading>
                                  {(isLoading) => {
                                    return isLoading ? (
                                      <Icons.spinner className="size-5 animate-spin" />
                                    ) : (
                                      "Entrar"
                                    );
                                  }}
                                </Clerk.Loading>
                              </Button>
                            </SignIn.Action>
                            <SignIn.Action navigate="choose-strategy" asChild>
                              <Button
                                type="button"
                                size="sm"
                                variant="link"
                                className="text-blue-600 hover:text-blue-800 transition-colors duration-300"
                              >
                                Usar outro método
                              </Button>
                            </SignIn.Action>
                          </div>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  </SignIn.Strategy>

                  <SignIn.Strategy name="email_code">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <Card className="w-full shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                        <CardHeader className="space-y-2 pb-4">
                          <CardTitle className="text-2xl font-playfair font-bold text-center text-blue-900">
                            Verificação de email
                          </CardTitle>
                          <CardDescription className="text-center text-gray-600">
                            Digite o código enviado para seu email
                          </CardDescription>
                          <p className="text-sm text-center text-blue-600 font-medium">
                            <SignIn.SafeIdentifier />
                          </p>
                        </CardHeader>
                        <CardContent className="grid gap-y-4">
                          <Clerk.Field name="code">
                            <Clerk.Label className="sr-only">
                              Código de verificação
                            </Clerk.Label>
                            <div className="grid gap-y-2 items-center justify-center">
                              <div className="flex justify-center text-center">
                                <Clerk.Input
                                  type="otp"
                                  autoSubmit
                                  className="flex justify-center has-[:disabled]:opacity-50"
                                  render={({ value, status }) => {
                                    return (
                                      <div
                                        data-status={status}
                                        className="relative flex h-12 w-12 items-center justify-center border-y border-r border-gray-300 text-lg bg-white/70 shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md data-[status=selected]:ring-2 data-[status=selected]:ring-blue-500 data-[status=cursor]:ring-2 data-[status=cursor]:ring-blue-500 data-[status=selected]:bg-white data-[status=cursor]:bg-white"
                                      >
                                        {value}
                                      </div>
                                    );
                                  }}
                                />
                              </div>
                              <Clerk.FieldError className="block text-sm text-red-600 text-center" />
                              <SignIn.Action
                                asChild
                                resend
                                className="text-muted-foreground"
                                fallback={({ resendableAfter }) => (
                                  <Button variant="link" size="sm" disabled>
                                    Não recebeu o código? Reenviar (
                                    <span className="tabular-nums">
                                      {resendableAfter}
                                    </span>
                                    )
                                  </Button>
                                )}
                              >
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-800 transition-colors duration-300"
                                >
                                  Não recebeu o código? Reenviar
                                </Button>
                              </SignIn.Action>
                            </div>
                          </Clerk.Field>
                        </CardContent>
                        <CardFooter className="pb-6 pt-2">
                          <div className="grid w-full gap-y-4">
                            <SignIn.Action submit asChild>
                              <Button
                                disabled={isGlobalLoading}
                                className="h-11 bg-blue-700 hover:bg-blue-800 text-white font-medium transition-all duration-300 hover:shadow-lg"
                              >
                                <Clerk.Loading>
                                  {(isLoading) => {
                                    return isLoading ? (
                                      <Icons.spinner className="size-5 animate-spin" />
                                    ) : (
                                      "Verificar"
                                    );
                                  }}
                                </Clerk.Loading>
                              </Button>
                            </SignIn.Action>
                            <SignIn.Action navigate="choose-strategy" asChild>
                              <Button
                                size="sm"
                                variant="link"
                                className="text-blue-600 hover:text-blue-800 transition-colors duration-300"
                              >
                                Usar outro método
                              </Button>
                            </SignIn.Action>
                          </div>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  </SignIn.Strategy>
                </SignIn.Step>
              </>
            )}
          </Clerk.Loading>
        </SignIn.Root>
      </div>
    </div>
  );
}
