import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configure database URL with connection pooling parameters
let databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL

// If using Supabase pooler, configure for transaction mode
// Supabase uses port 6543 for transaction mode (200 connections) and 5432 for session mode (15 connections)
// Simply changing the port is the most reliable way - no parameters needed
if (databaseUrl && databaseUrl.includes('pooler.supabase.com')) {
  try {
    // Change port from 5432 to 6543 for transaction mode
    // This is the cleanest approach - no URL parameters needed
    if (databaseUrl.includes(':5432/')) {
      databaseUrl = databaseUrl.replace(':5432/', ':6543/')
      console.log('Switched Supabase pooler to port 6543 (transaction mode - 200 connections)')
    }
    
    // Remove ALL query parameters - Prisma might reject them
    // Only keep the base connection string
    const urlMatch = databaseUrl.match(/^(postgres:\/\/[^?]+)/)
    if (urlMatch) {
      databaseUrl = urlMatch[1]
      console.log('Removed query parameters from connection string for Prisma compatibility')
    }
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

