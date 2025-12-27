import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function Home() {
  try {
    const user = await getUser()
    if (user) {
      redirect('/dashboard')
    } else {
      redirect('/login')
    }
  } catch (error) {
    // If there's an error (e.g., database not connected), redirect to login
    redirect('/login')
  }
}

