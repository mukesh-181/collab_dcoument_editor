import { login, signup } from '../actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { OAuthButtons } from './oauth-buttons'

export function LoginForm({ message, next }: { message?: string, next?: string }) {
  return (
    <Card className="w-full max-w-md border-zinc-200 dark:border-zinc-800 shadow-xl dark:bg-zinc-900/50 backdrop-blur-xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
        <CardDescription className="text-sm text-zinc-500 dark:text-zinc-400">
          Enter your email below to sign in to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <form className="space-y-4">
          <input type="hidden" name="next" value={next || ''} />
          
          <div className="space-y-2 text-left">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="m@example.com"
              required
              className="bg-white dark:bg-zinc-950"
            />
          </div>
          <div className="space-y-2 text-left">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              className="bg-white dark:bg-zinc-950"
            />
          </div>
          
          {message && (
            <p className="text-sm text-red-500 text-center font-medium">{message}</p>
          )}

          <div className="flex flex-col gap-3 pt-4">
            <Button formAction={login} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all">
              Sign In
            </Button>
            <Button formAction={signup} variant="outline" className="w-full">
              Create an account
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
