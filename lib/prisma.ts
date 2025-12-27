import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configure database URL with connection pooling parameters
let databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL

// CRITICAL: For Supabase pooler, Prisma needs to use DIRECT connection, not pooler
// The pooler (PgBouncer) doesn't support prepared statements that Prisma uses
// Prepared statements cause "prepared statement already exists" errors with PgBouncer
if (databaseUrl && databaseUrl.includes('pooler.supabase.com')) {
  try {
    // Parse URL to extract components
    const url = new URL(databaseUrl)
    
    // Convert pooler URL to direct connection URL
    // Replace pooler.supabase.com with db.supabase.co (direct connection)
    // Extract the region from pooler hostname: aws-1-us-east-1.pooler.supabase.com -> aws-1-us-east-1.db.supabase.co
    const hostname = url.hostname
    if (hostname.includes('pooler.supabase.com')) {
      // Replace pooler with db in hostname
      url.hostname = hostname.replace('pooler.supabase.com', 'db.supabase.co')
      
      // Direct connections use port 5432 (not 6543 which is pooler transaction mode)
      url.port = '5432'
      
      // Remove ALL query parameters - keep only base connection string
      url.search = ''
      
      databaseUrl = url.toString()
      console.log('Converted Supabase pooler URL to direct connection URL (required for Prisma prepared statements)')
    }
  } catch (error) {
    console.error('Error processing DATABASE_URL:', error)
    // Fallback: simple string replacement
    if (databaseUrl.includes('pooler.supabase.com')) {
      databaseUrl = databaseUrl.replace('pooler.supabase.com', 'db.supabase.co')
      // Reset port to 5432 and remove query string
      databaseUrl = databaseUrl.replace(':6543/', ':5432/').replace(':5432/', ':5432/')
      const baseUrl = databaseUrl.split('?')[0]
      databaseUrl = baseUrl
      console.log('Used fallback method to convert to direct connection URL')
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

