// Diagnostic wrapper for Vercel Serverless Function to catch and display exact runtime errors
export default async function handler(req: any, res: any) {
  try {
    const { app } = await import('../server.js');
    return app(req, res);
  } catch (err: any) {
    console.error('[VERCEL-CRASH] Serverless Function crashed:', err);
    res.status(500).json({
      error: err?.message || 'Unknown Serverless Error',
      stack: err?.stack || 'No stack trace available',
      file: err?.fileName || 'Unknown file',
      lineNumber: err?.lineNumber || 'Unknown line',
      env: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV,
      }
    });
  }
}
