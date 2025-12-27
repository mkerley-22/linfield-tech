/**
 * Retry wrapper for Prisma queries with exponential backoff
 * Handles connection pool exhaustion gracefully
 */

export async function withRetry<T>(
  query: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: any

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await query()
    } catch (error: any) {
      lastError = error

      // Check if it's a connection pool error
      const isPoolError =
        error.message?.includes('MaxClientsInSessionMode') ||
        error.message?.includes('max clients reached') ||
        error.message?.includes('connection pool') ||
        error.code === 'P1001' // Prisma connection error code

      if (isPoolError && attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, attempt)
        console.log(
          `Connection pool exhausted, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      // If it's not a pool error or we've exhausted retries, throw
      throw error
    }
  }

  throw lastError
}

