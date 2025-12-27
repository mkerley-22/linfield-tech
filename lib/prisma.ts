import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configure database URL with connection pooling parameters
let databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL

// CRITICAL: For Supabase pooler, use transaction mode (port 6543) and disable prepared statements
// PgBouncer in transaction mode doesn't support prepared statements, so we must disable them
if (databaseUrl && databaseUrl.includes('pooler.supabase.com')) {
  try {
    // Parse URL to extract components
    const url = new URL(databaseUrl)
    
    // Use port 6543 for transaction mode (200 connections vs 15 for session mode)
    if (url.port === '5432' || databaseUrl.includes(':5432/')) {
      url.port = '6543'
      console.log('Switched Supabase pooler to port 6543 (transaction mode - 200 connections)')
    }
    
    // CRITICAL: Add pgbouncer=true parameter to tell Prisma to disable prepared statements
    // This is a special parameter that Prisma recognizes and uses to disable prepared statements
    // Remove all other query parameters first, then add only pgbouncer=true
    url.search = '?pgbouncer=true'
    
    databaseUrl = url.toString()
    console.log('Configured connection string for PgBouncer transaction mode (prepared statements disabled)')
  } catch (error) {
    console.error('Error processing DATABASE_URL:', error)
    // Fallback: simple string replacement
    if (databaseUrl.includes(':5432/')) {
      databaseUrl = databaseUrl.replace(':5432/', ':6543/')
      // Remove existing query params and add pgbouncer=true
      const baseUrl = databaseUrl.split('?')[0]
      databaseUrl = `${baseUrl}?pgbouncer=true`
      console.log('Used fallback method to configure connection string with pgbouncer=true')
    }
  }
}

// Log the final connection string (without password) for debugging
if (databaseUrl) {
  const safeUrl = databaseUrl.replace(/:[^:@]+@/, ':****@')
  console.log('Using database URL:', safeUrl)
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
})

// Ensure we're using connection pooling properly
// In serverless environments, we need to be careful about connection management

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Handle connection cleanup
if (process.env.NODE_ENV === 'production') {
  // In production, ensure connections are properly managed
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

