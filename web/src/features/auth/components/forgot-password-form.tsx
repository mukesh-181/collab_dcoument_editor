'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { requestPasswordReset } from '../actions/request-password-reset.action'
import { forgotPasswordSchema, ForgotPasswordInput } from '../schemas/auth.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'
import { ROUTES } from "@/constants/routes"
import Link from 'next/link'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(data: ForgotPasswordInput) {
    setIsLoading(true)
    try {
      const result = await requestPasswordReset(data)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Reset link sent to your email!')
        setIsSuccess(true)
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/40 bg-white/60 shadow-2xl backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/50 p-2 sm:p-4">
      <CardHeader className="space-y-2 text-center pb-6">
        <CardTitle className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-serif">
          Reset Password
        </CardTitle>
        <CardDescription className="text-base text-zinc-500 dark:text-zinc-400">
          Enter your email and we'll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {isSuccess ? (
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm">
              We've sent a password reset link to <strong>{form.getValues('email')}</strong>. Please check your inbox.
            </div>
            <Link href={ROUTES.LOGIN} className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1 text-left">
                    <FormLabel className="text-sm font-medium">Email <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="login@gmail.com"
                        className="bg-white dark:bg-zinc-950 h-11 text-base"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <div className="pt-2">
                <Button type="submit" className="relative w-full h-12 text-base bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm rounded-lg font-semibold cursor-pointer hover:-translate-y-0.5 hover:scale-[1.02] transition-all duration-200" disabled={isLoading}>
                  <span className={isLoading ? "opacity-0" : ""}>Send Reset Link</span>
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  )}
                </Button>
              </div>

              <div className="mt-6 text-center">
                <Link href={ROUTES.LOGIN} className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Link>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  )
}
