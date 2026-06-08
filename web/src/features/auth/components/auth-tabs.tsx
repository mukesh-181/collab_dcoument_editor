import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { OAuthButtons } from './oauth-buttons'
import { LoginForm } from './login-form'
import { RegisterForm } from './register-form'

export function AuthTabs({ next, defaultTab }: { next?: string, defaultTab?: string }) {
  // Only allow valid tabs to prevent errors
  const activeTab = defaultTab === 'register' ? 'register' : 'login';

  return (
    <Card className="w-full max-w-md border-zinc-200 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 bg-white rounded-xl">
      <Tabs defaultValue={activeTab} className="w-full">
        <CardHeader className="space-y-1.5 text-center pb-8">
          <CardTitle className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Welcome back</CardTitle>
          <CardDescription className="text-base text-zinc-500 dark:text-zinc-400">
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TabsList className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] mb-8 bg-transparent  dark:border-zinc-800 p-1 rounded-lg h-14">
            <TabsTrigger value="login" className="h-full rounded-md text-base font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 data-[state=active]:bg-zinc-900 dark:data-[state=active]:bg-zinc-50 data-[state=active]:text-white dark:data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm transition-all duration-200">Sign In</TabsTrigger>
            <div className="flex h-full w-4 items-center justify-center">
              <span aria-hidden="true" className="pointer-events-none h-8 w-px bg-zinc-700 dark:bg-zinc-800" />
            </div>
            <TabsTrigger value="register" className="h-full rounded-md text-base font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 data-[state=active]:bg-zinc-900 dark:data-[state=active]:bg-zinc-50 data-[state=active]:text-white dark:data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm transition-all duration-200">Register</TabsTrigger>
          </TabsList>

          <OAuthButtons />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full border-zinc-200 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
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
