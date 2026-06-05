import { AuthTabs } from '@/features/auth/components/auth-tabs'

export default async function LoginPage(props: { searchParams: Promise<{ message?: string, next?: string }> }) {
  const {next=''} = await props.searchParams

  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <AuthTabs next={next} />
    </div>
  )
}
