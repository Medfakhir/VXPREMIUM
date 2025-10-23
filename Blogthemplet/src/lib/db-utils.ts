import { prisma } from './db';

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Check if it's a connection error
      if (
        error instanceof Error &&
        (error.message.includes('connection') ||
         error.message.includes('timeout') ||
         error.message.includes('P1001') ||
         error.message.includes('P2024'))
      ) {
        console.warn(`Database connection attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
          continue;
        }
      }
      
      // If it's not a connection error or we've exhausted retries, throw immediately
      throw error;
    }
  }

  throw lastError!;
}

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await withRetry(async () => {
      await prisma.$queryRaw`SELECT 1`;
    });
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T | null> {
  try {
    return await withRetry(operation);
  } catch (error) {
    console.error('Database operation failed:', error);
    return fallback ?? null;
  }
}
