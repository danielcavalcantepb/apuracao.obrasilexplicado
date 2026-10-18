import { FirstAccess } from '@/features/election/first-access/first-access';
import { readBootCache } from '@/features/election/first-access/read-boot-cache';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const { initial, regions } = await readBootCache();
  return <FirstAccess initial={initial} regions={regions} />;
}
