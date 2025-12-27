import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configure database URL with connection pooling parameters
let databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL

// If using Supabase pooler, add necessary parameters
if (databaseUrl && databaseUrl.includes('pooler.supabase.com')) {
  try {
    const url = new URL(databaseUrl)
    // Add pgbouncer mode for connection pooling
    if (!url.searchParams.has('pgbouncer')) {
      url.searchParams.set('pgbouncer', 'true')
    }
    // Set connection limits to prevent pool exhaustion
    // Lower limit for serverless to avoid "max clients reached" errors
    if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', '5')
    }
    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', '10')
    }
    // Add connect timeout to fail fast if pool is exhausted
    if (!url.searchParams.has('connect_timeout')) {
      url.searchParams.set('connect_timeout', '5')
    }
    databaseUrl = url.toString()
  } catch (error) {
    console.error('Error parsing DATABASE_URL:', error)
    // Use original URL if parsing fails
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

