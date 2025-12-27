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
    // CRITICAL: Use transaction mode instead of session mode
    // Transaction mode allows up to 200 connections vs 15 in session mode
    // This is the key to preventing "max clients reached" errors
    if (!url.searchParams.has('pgbouncer')) {
      url.searchParams.set('pgbouncer', 'transaction') // Use transaction mode, not session mode
    }
    
    // Set reasonable connection limits for transaction mode
    // Transaction mode can handle more connections, but we still want to be conservative
    if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', '10') // Can be higher in transaction mode
    }
    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', '10')
    }
    // Add connect timeout to fail fast if pool is exhausted
    if (!url.searchParams.has('connect_timeout')) {
      url.searchParams.set('connect_timeout', '5')
    }
    // Add statement timeout to prevent long-running queries from holding connections
    if (!url.searchParams.has('statement_timeout')) {
      url.searchParams.set('statement_timeout', '30000') // 30 seconds
    }
    
    console.log('Configured Supabase connection pooler in transaction mode')
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

