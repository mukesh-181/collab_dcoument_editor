import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { OAuthButtons } from './oauth-buttons'
import { LoginForm } from './login-form'
import { RegisterForm } from './register-form'

export function AuthTabs({ next }: { next?: string }) {
  return (
    <Card className="w-full max-w-md border-zinc-200 dark:border-zinc-800 shadow-xl dark:bg-zinc-900/50 backdrop-blur-xl">
      <Tabs defaultValue="login" className="w-full">
        <CardHeader className="space-y-1 text-center pb-6">
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome</CardTitle>
          <CardDescription className="text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <OAuthButtons />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full border-zinc-200 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-50 px-2 text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400">
                Or continue with email
              </span>
            </div>
          </div>

          <TabsContent value="login" className="mt-0">
            <LoginForm next={next} />
          </TabsContent>
          
          <TabsContent value="register" className="mt-0">
            <RegisterForm next={next} />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
}
