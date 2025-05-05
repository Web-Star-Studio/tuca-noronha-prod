// "use client"

// import { useState, useActionState } from "react"
// import Link from "next/link"
// import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"


// export default function LoginPage() {
//   const [showPassword, setShowPassword] = useState(false)
//   const [loginState, loginAction] = useActionState(login, null)
//   const [signupState, signupAction] = useActionState(signup, null)
//   const [activeTab, setActiveTab] = useState("login")

//   const togglePasswordVisibility = () => {
//     setShowPassword((prev) => !prev)
//   }

//   return (
//     <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4 py-12">
//       <div className="absolute top-6 left-6">
//         <Link href="/" className="text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-colors">
//           <ArrowLeft className="h-4 w-4" />
//           <span>Voltar para Home</span>
//         </Link>
//       </div>

//       <div className="w-full max-w-md">
//         <Card className="w-full shadow-xl bg-white/80 backdrop-blur-md">
//           <CardHeader className="space-y-1">
//             <CardTitle className="text-2xl font-bold text-center font-serif tracking-tighter">Tuca Noronha</CardTitle>
//             <CardDescription className="text-center">
//               {activeTab === "login" ? "Entre na sua conta para continuar" : "Crie sua conta para começar"}
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <Tabs
//               defaultValue="login"
//               className="w-full"
//               onValueChange={(value) => setActiveTab(value)}
//             >
//               <TabsList className="grid w-full grid-cols-2 mb-6">
//                 <TabsTrigger value="login">Entrar</TabsTrigger>
//                 <TabsTrigger value="signup">Cadastrar</TabsTrigger>
//               </TabsList>

//               <TabsContent value="login">
//                 <form className="space-y-4" action={loginAction}>
//                   <div className="space-y-2">
//                     <Label htmlFor="email-login" className="text-sm font-medium">Email</Label>
//                     <div className="relative">
//                       <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
//                       <Input
//                         id="email-login"
//                         name="email"
//                         type="email"
//                         placeholder="seu@email.com"
//                         required
//                         className="pl-10"
//                       />
//                     </div>
//                   </div>
                  
//                   <div className="space-y-2">
//                     <div className="flex justify-between">
//                       <Label htmlFor="password-login" className="text-sm font-medium">Senha</Label>
//                       <Link href="/recover-password" className="text-xs text-blue-600 hover:underline">
//                         Esqueceu a senha?
//                       </Link>
//                     </div>
//                     <div className="relative">
//                       <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
//                       <Input
//                         id="password-login"
//                         name="password"
//                         type={showPassword ? "text" : "password"}
//                         placeholder="••••••••"
//                         required
//                         className="pl-10"
//                       />
//                       <button
//                         type="button"
//                         onClick={togglePasswordVisibility}
//                         className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
//                         aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
//                       >
//                         {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//                       </button>
//                     </div>
//                   </div>

//                   <Button
//                     type="submit"
//                     className="w-full bg-blue-700 hover:bg-blue-600 text-white"
//                   >
//                     {"Entrar"}
//                   </Button>
//                 </form>
//               </TabsContent>

//               <TabsContent value="signup">
//                 <form className="space-y-4" action={signupAction}>
//                   <div className="space-y-2">
//                     <Label htmlFor="email-signup" className="text-sm font-medium">Email</Label>
//                     <div className="relative">
//                       <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
//                       <Input
//                         id="email-signup"
//                         name="email"
//                         type="email"
//                         placeholder="seu@email.com"
//                         required
//                         className="pl-10"
//                       />
//                     </div>
//                   </div>
                  
//                   <div className="space-y-2">
//                     <Label htmlFor="password-signup" className="text-sm font-medium">Senha</Label>
//                     <div className="relative">
//                       <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
//                       <Input
//                         id="password-signup"
//                         name="password"
//                         type={showPassword ? "text" : "password"}
//                         placeholder="••••••••"
//                         required
//                         className="pl-10"
//                       />
//                       <button
//                         type="button"
//                         onClick={togglePasswordVisibility}
//                         className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
//                         aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
//                       >
//                         {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//                       </button>
//                     </div>
//                   </div>

//                   <Button
//                     type="submit"
//                     className="w-full bg-blue-700 hover:bg-blue-600 text-white"
//                   >
//                     {"Criar Conta"}
//                   </Button>
//                 </form>
//               </TabsContent>
//             </Tabs>
//           </CardContent>
//           <CardFooter className="flex flex-col space-y-4">
//             <div className="relative w-full flex items-center justify-center">
//               <div className="absolute inset-0 flex items-center">
//                 <div className="w-full border-t border-gray-300"></div>
//               </div>
//               <div className="relative z-10 bg-white px-4 text-sm text-gray-500">
//                 ou continue com
//               </div>
//             </div>
            
//             <div className="w-full">
//               <Button variant="outline" className="w-full">
//                 Google
//               </Button>
//             </div>
//           </CardFooter>
//         </Card>
//       </div>
//     </div>
//   )
// }