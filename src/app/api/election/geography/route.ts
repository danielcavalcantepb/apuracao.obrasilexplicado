import { catalog } from '@/lib/tse/service';
export const dynamic = 'force-dynamic';
export async function GET() {
  const { geography } = await catalog();
  return Response.json(
    { regions: geography?.value ?? [], unavailable: !geography?.value },
    { headers: { 'Cache-Control': 'public, max-age=60' } },
  );
}
