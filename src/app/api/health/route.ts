import { createClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = createClient();
    const { error } = await supabase.from('profiles').select('count').limit(1);

    if (error) {
      return Response.json({
        status: 'error',
        message: error.message,
        error,
      }, { status: 500 });
    }

    return Response.json({
      status: 'ok',
      message: 'Supabase connection is healthy',
    }, { status: 200 });

  } catch (err) {
    return Response.json({
      status: 'error',
      message: 'An unexpected error occurred',
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}