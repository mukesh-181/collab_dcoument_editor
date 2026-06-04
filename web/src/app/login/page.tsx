import { LoginForm } from '@/features/auth/components/login-form'

export default async function LoginPage(props: { searchParams: Promise<{ message?: string, next?: string }> }) {
  const searchParams = await props.searchParams

  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <LoginForm message={searchParams?.message} next={searchParams?.next} />
    </div>
  )
}
