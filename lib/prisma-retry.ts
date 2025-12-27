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

      // Extract error message and code from potentially nested Prisma error structure
      const errorMessage = error.message || error.cause?.message || JSON.stringify(error)
      const errorCode = error.code || error.cause?.code || 
                       (error.meta?.code) || 
                       (error.kind === 'QueryError' && error.meta?.code)

      // Check if it's a retryable error
      const isRetryableError =
        // Connection pool errors
        errorMessage?.includes('MaxClientsInSessionMode') ||
        errorMessage?.includes('max clients reached') ||
        errorMessage?.includes('connection pool') ||
        error.code === 'P1001' || // Prisma connection error code
        // Prepared statement errors (PgBouncer transaction mode limitation)
        // These can be "already exists" (42P05) or "does not exist" (26000)
        errorMessage?.includes('prepared statement') ||
        errorMessage?.includes('already exists') ||
        errorMessage?.includes('does not exist') ||
        (errorCode === '42P05') || // PostgreSQL error code for prepared statement already exists
        (errorCode === '26000') || // PostgreSQL error code for invalid SQL statement name (prepared statement does not exist)
        // Check nested error structure (Prisma wraps Postgres errors)
        (error.kind === 'QueryError' && errorMessage?.includes('prepared statement')) ||
        (error.cause?.code === '42P05') ||
        (error.cause?.code === '26000')

      if (isRetryableError && attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, attempt)
        const errorType = errorMessage?.includes('prepared statement') 
          ? 'prepared statement conflict' 
          : 'connection pool issue'
        console.log(
          `Database ${errorType}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries}):`,
          errorMessage?.substring(0, 100)
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

