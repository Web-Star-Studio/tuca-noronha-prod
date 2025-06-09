"use client";
import * as Clerk from "@clerk/elements/common";
import * as SignUp from "@clerk/elements/sign-up";
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
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {playfairDisplay} from '@/lib/fonts'
import Link from "next/link";

export default function SignUpPage() {


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
        <SignUp.Root>
          <Clerk.Loading>
            {(isGlobalLoading) => (
              <>
                <SignUp.Step name="start">
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
                                      Cadastrar com Google
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
                            ou preencha o formulário
                          </p>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6, duration: 0.4 }}
                        >
                          <Clerk.Field
                            name="emailAddress"
                            className="space-y-3"
                          >
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
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.7, duration: 0.4 }}
                        >
                          <Clerk.Field name="password" className="space-y-3">
                            <Clerk.Label asChild>
                              <Label className="text-gray-700">Senha</Label>
                            </Clerk.Label>
                            <Clerk.Input type="password" required asChild>
                              <Input
                                className="h-11 border-gray-300 focus:border-blue-500 bg-white/70 focus:bg-white transition-all duration-300"
                                placeholder="Mínimo 8 caracteres"
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
                          transition={{ delay: 0.8, duration: 0.4 }}
                        >
                          <SignUp.Captcha />
                          {/* Manual CAPTCHA element as fallback */}
                          <div id="clerk-captcha" />
                          <SignUp.Action submit asChild>
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
                          </SignUp.Action>
                          <div className="text-center">
                            <Button
                              variant="link"
                              size="sm"
                              asChild
                              className="text-blue-700 hover:text-blue-800 transition-colors duration-300"
                            >
                              <Clerk.Link navigate="sign-in">
                                Já tem uma conta? Entrar
                              </Clerk.Link>
                            </Button>
                          </div>
                        </motion.div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                </SignUp.Step>

                <SignUp.Step name="continue">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Card className="w-full shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                      <CardHeader className="space-y-2 pb-4">
                        <CardTitle className="text-2xl font-playfair font-bold text-center text-blue-900">
                          Quase lá!
                        </CardTitle>
                        <CardDescription className="text-center text-gray-600">
                          Escolha um nome de usuário para sua conta
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-y-4">
                        <Clerk.Field name="username" className="space-y-3">
                          <Clerk.Label asChild>
                            <Label className="text-gray-700">
                              Nome de usuário
                            </Label>
                          </Clerk.Label>
                          <Clerk.Input type="text" required asChild>
                            <Input
                              className="h-11 border-gray-300 focus:border-blue-500 bg-white/70 focus:bg-white transition-all duration-300"
                              placeholder="seu_nome_usuario"
                            />
                          </Clerk.Input>
                          <Clerk.FieldError className="block text-sm text-red-600" />
                        </Clerk.Field>
                      </CardContent>
                      <CardFooter className="pb-6 pt-2">
                        <div className="grid w-full gap-y-4">
                          <SignUp.Action submit asChild>
                            <Button
                              disabled={isGlobalLoading}
                              className="h-11 bg-blue-700 hover:bg-blue-800 text-white font-medium transition-all duration-300 hover:shadow-lg"
                            >
                              <Clerk.Loading>
                                {(isLoading) => {
                                  return isLoading ? (
                                    <Icons.spinner className="size-5 animate-spin" />
                                  ) : (
                                    "Finalizar cadastro"
                                  );
                                }}
                              </Clerk.Loading>
                            </Button>
                          </SignUp.Action>
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                </SignUp.Step>

                <SignUp.Step name="verifications">
                  <SignUp.Strategy name="email_code">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <Card className="w-full shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                        <CardHeader className="space-y-2 pb-4">
                          <CardTitle className="text-2xl font-playfair font-bold text-center text-blue-900">
                            Verifique seu email
                          </CardTitle>
                          <CardDescription className="text-center text-gray-600">
                            Digite o código enviado para seu endereço de email
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-y-4">
                          <div className="grid items-center justify-center gap-y-2">
                            <Clerk.Field name="code" className="space-y-3">
                              <Clerk.Label className="sr-only">
                                Código de verificação
                              </Clerk.Label>
                              <div className="flex justify-center text-center">
                                <Clerk.Input
                                  type="otp"
                                  className="flex justify-center has-[:disabled]:opacity-50"
                                  autoSubmit
                                  render={({ value, status }) => {
                                    return (
                                      <div
                                        data-status={status}
                                        className={cn(
                                          "relative flex h-12 w-12 items-center justify-center border-y border-r border-gray-300 text-lg bg-white/70 shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
                                          {
                                            "z-10 ring-2 ring-blue-500 ring-offset-background data-[status=selected]:bg-white data-[status=cursor]:bg-white":
                                              status === "cursor" ||
                                              status === "selected",
                                          }
                                        )}
                                      >
                                        {value}
                                        {status === "cursor" && (
                                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                            <div className="animate-caret-blink h-5 w-px bg-blue-800 duration-1000" />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }}
                                />
                              </div>
                              <Clerk.FieldError className="block text-center text-sm text-red-600" />
                            </Clerk.Field>
                            <SignUp.Action
                              asChild
                              resend
                              className="text-muted-foreground"
                              fallback={({ resendableAfter }) => (
                                <Button
                                  variant="link"
                                  size="sm"
                                  disabled
                                  className="text-gray-400"
                                >
                                  Não recebeu o código? Reenviar (
                                  <span className="tabular-nums">
                                    {resendableAfter}
                                  </span>
                                  )
                                </Button>
                              )}
                            >
                              <Button
                                type="button"
                                variant="link"
                                size="sm"
                                className="text-blue-600 hover:text-blue-800 transition-colors duration-300"
                              >
                                Não recebeu o código? Reenviar
                              </Button>
                            </SignUp.Action>
                          </div>
                        </CardContent>
                        <CardFooter className="pb-6 pt-2">
                          <div className="grid w-full gap-y-4">
                            <SignUp.Action submit asChild>
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
                            </SignUp.Action>
                          </div>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  </SignUp.Strategy>
                </SignUp.Step>
              </>
            )}
          </Clerk.Loading>
        </SignUp.Root>
      </div>
    </div>
  );
}
