import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configure database URL with connection pooling parameters
let databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL

// If using Supabase pooler, configure for transaction mode
// Supabase uses port 6543 for transaction mode and 5432 for session mode
// OR we can use the pgbouncer parameter, but Prisma might reject it
// Let's try using port 6543 for transaction mode (more reliable)
if (databaseUrl && databaseUrl.includes('pooler.supabase.com')) {
  try {
    // Option 1: Use port 6543 for transaction mode (Supabase's transaction mode port)
    // This is more reliable than the pgbouncer parameter
    if (databaseUrl.includes(':5432/')) {
      databaseUrl = databaseUrl.replace(':5432/', ':6543/')
      console.log('Switched to port 6543 for transaction mode')
    }
    
    // Option 2: Also try to set pgbouncer parameter if port change doesn't work
    // But remove it if Prisma rejects it - we'll use port-based approach instead
    if (databaseUrl.includes('pgbouncer=true')) {
      databaseUrl = databaseUrl.replace('pgbouncer=true', 'pgbouncer=transaction')
    } else if (!databaseUrl.includes('pgbouncer=')) {
      // Only add if not already present
      const separator = databaseUrl.includes('?') ? '&' : '?'
      databaseUrl = `${databaseUrl}${separator}pgbouncer=transaction`
    }
    
    // Remove any invalid parameters that Prisma might reject
    databaseUrl = databaseUrl.replace(/[?&]connection_limit=[^&]*/g, '')
    databaseUrl = databaseUrl.replace(/[?&]pool_timeout=[^&]*/g, '')
    databaseUrl = databaseUrl.replace(/[?&]connect_timeout=[^&]*/g, '')
    databaseUrl = databaseUrl.replace(/[?&]statement_timeout=[^&]*/g, '')
    
    // Clean up any double separators
    databaseUrl = databaseUrl.replace(/\?\&/g, '?').replace(/\&\&/g, '&')
    
    console.log('Configured Supabase connection pooler for transaction mode')
  } catch (error) {
    console.error('Error processing DATABASE_URL:', error)
    // Use original URL if processing fails
  }
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  // Add connection pool configuration
  // This helps prevent "max clients reached" errors
  // Prisma will manage connections more efficiently
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

