import { LoginPage } from '@/features/auth/components/login-page'

export default async function Login(props: { searchParams: Promise<{ message?: string, next?: string, tab?: string }> }) {
  const {next='', tab=''} = await props.searchParams

  return <LoginPage next={next} tab={tab} />
}
