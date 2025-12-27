import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configure database URL with connection pooling parameters
let databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL

// If using Supabase pooler, configure for transaction mode
// Supabase uses port 6543 for transaction mode (200 connections) and 5432 for session mode (15 connections)
if (databaseUrl && databaseUrl.includes('pooler.supabase.com')) {
  try {
    // Parse the URL to properly handle password encoding
    const url = new URL(databaseUrl)
    
    // Change port from 5432 to 6543 for transaction mode
    if (url.port === '5432' || databaseUrl.includes(':5432/')) {
      url.port = '6543'
      console.log('Switched Supabase pooler to port 6543 (transaction mode - 200 connections)')
    }
    
    // Remove ALL query parameters - Prisma's URL validator rejects custom parameters
    // Keep only the base connection string: postgres://user:pass@host:port/database
    url.search = ''
    
    // Reconstruct the URL - this ensures proper encoding
    databaseUrl = url.toString()
    console.log('Cleaned connection string for Prisma compatibility')
  } catch (error) {
    console.error('Error processing DATABASE_URL:', error)
    // If URL parsing fails, try simple string replacement as fallback
    if (databaseUrl.includes(':5432/')) {
      databaseUrl = databaseUrl.replace(':5432/', ':6543/')
      // Remove query string
      const baseUrl = databaseUrl.split('?')[0]
      databaseUrl = baseUrl
      console.log('Used fallback method to configure connection string')
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

