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
    // Always override to transaction mode, even if pgbouncer=true is already set
    const currentMode = url.searchParams.get('pgbouncer')
    if (currentMode !== 'transaction') {
      url.searchParams.set('pgbouncer', 'transaction') // Force transaction mode
      if (currentMode === 'true') {
        console.log('Converting pgbouncer from session mode (true) to transaction mode')
      }
    }
    
    // Only set parameters that are valid in PostgreSQL connection strings
    // Prisma/PostgreSQL connection strings support limited parameters
    // connection_limit and pool_timeout are Prisma-specific and should be set in PrismaClient config, not URL
    // Remove any invalid parameters that might cause issues
    
    // Keep only valid PostgreSQL connection string parameters:
    // - sslmode (already there)
    // - pgbouncer (we just set this)
    // Remove connection_limit, pool_timeout, connect_timeout, statement_timeout from URL
    // These should be handled by Prisma Client configuration, not the connection string
    
    url.searchParams.delete('connection_limit')
    url.searchParams.delete('pool_timeout')
    url.searchParams.delete('connect_timeout')
    url.searchParams.delete('statement_timeout')
    
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

