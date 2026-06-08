import { AuthTabs } from '@/features/auth/components/auth-tabs'

import Link from 'next/link'

export default async function LoginPage(props: { searchParams: Promise<{ message?: string, next?: string, tab?: string }> }) {
  const {next='', tab=''} = await props.searchParams

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <AuthTabs next={next} defaultTab={tab} />
    </div>
  )
}
