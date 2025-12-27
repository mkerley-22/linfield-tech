import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { withRetry } from './prisma-retry'

export async function getSession() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value

    if (!sessionToken) {
      console.log('No session token found in cookies')
      return null
    }

    // Use retry wrapper with timeout to handle connection pool exhaustion
    const session = await Promise.race([
      withRetry(
        () =>
          prisma.session.findUnique({
            where: { token: sessionToken },
            include: { User: true },
          }),
        3, // 3 retries
        1000 // 1 second base delay
      ),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      )
    ]) as any

    if (!session) {
      console.log('Session not found in database for token:', sessionToken.substring(0, 10) + '...')
      return null
    }

    if (session.expiresAt < new Date()) {
      console.log('Session expired')
      // Session expired
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {
        // Ignore errors when deleting expired session
      })
      return null
    }

    return session
  } catch (error: any) {
    // If cookies() fails (e.g., in client component), return null
    // Also handle connection pool exhaustion gracefully
    if (error.message?.includes('MaxClientsInSessionMode') || 
        error.message?.includes('max clients reached') ||
        error.message?.includes('timeout')) {
      console.error('Database connection pool exhausted or timeout:', error.message)
      return null
    }
    console.error('Error getting session:', error)
    return null
  }
}

export async function getUser() {
  const session = await getSession()
  return session?.User || null
}

export async function createSession(userId: string) {
  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  const session = await prisma.session.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      token,
      expiresAt,
    },
    include: { User: true },
  })

  return session
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({
    where: { token },
  })
}

function generateSessionToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function setSessionCookie(token: string) {
  try {
    const cookieStore = await cookies()
    cookieStore.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    })
  } catch (error) {
    console.error('Failed to set session cookie:', error)
  }
}

export async function clearSessionCookie() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('session_token')
  } catch (error) {
    console.error('Failed to clear session cookie:', error)
  }
}

// Role-based access control helpers
export async function isAdmin() {
  const user = await getUser()
  return user?.role === 'admin'
}

export async function isEditor() {
  const user = await getUser()
  return user?.role === 'admin' || user?.role === 'editor'
}

export async function canEdit() {
  return isEditor()
}

export async function canView() {
  const user = await getUser()
  return !!user // Any authenticated user can view
}

