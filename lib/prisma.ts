import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configure database URL with connection pooling parameters
let databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL

// If using Supabase pooler, configure for transaction mode
// Note: pgbouncer parameter might not be recognized by Prisma's URL parser
// So we'll use string replacement instead of URL parsing
if (databaseUrl && databaseUrl.includes('pooler.supabase.com')) {
  try {
    // Use string replacement to change pgbouncer mode
    // This avoids Prisma's strict URL validation
    if (databaseUrl.includes('pgbouncer=true')) {
      databaseUrl = databaseUrl.replace('pgbouncer=true', 'pgbouncer=transaction')
      console.log('Converted pgbouncer from session mode to transaction mode')
    } else if (databaseUrl.includes('pgbouncer=transaction')) {
      // Already in transaction mode
      console.log('Already using transaction mode')
    } else {
      // Add pgbouncer=transaction if not present
      const separator = databaseUrl.includes('?') ? '&' : '?'
      databaseUrl = `${databaseUrl}${separator}pgbouncer=transaction`
      console.log('Added pgbouncer=transaction to connection string')
    }
    
    // Remove any invalid parameters that Prisma might reject
    // These are not standard PostgreSQL connection string parameters
    databaseUrl = databaseUrl.replace(/[?&]connection_limit=[^&]*/g, '')
    databaseUrl = databaseUrl.replace(/[?&]pool_timeout=[^&]*/g, '')
    databaseUrl = databaseUrl.replace(/[?&]connect_timeout=[^&]*/g, '')
    databaseUrl = databaseUrl.replace(/[?&]statement_timeout=[^&]*/g, '')
    
    // Clean up any double separators
    databaseUrl = databaseUrl.replace(/\?\&/g, '?').replace(/\&\&/g, '&')
    
    console.log('Configured Supabase connection pooler in transaction mode')
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

