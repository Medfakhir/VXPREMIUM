import { NextResponse } from 'next/server';
import { testDatabaseConnection } from '@/lib/db-utils';

export async function GET() {
  try {
    const dbConnected = await testDatabaseConnection();
    
    return NextResponse.json({
      success: true,
      status: 'healthy',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      status: 'unhealthy',
      database: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
