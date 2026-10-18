import {it,expect} from 'vitest';
import {municipalBaseline} from '../src/lib/tse/municipal-baseline';
it('validates the complete published official baseline, including TSE timezone offsets',async()=>{
 const results=await municipalBaseline();
 expect(results).toHaveLength(5571);
 expect(new Set(results.map(m=>m.uf)).size).toBe(27);
 expect(new Set(results.map(m=>m.uf+m.code)).size).toBe(5571);
 expect(results.some(m=>m.updatedAt.endsWith('-03:00'))).toBe(true);
 expect(results.every(m=>Number.isFinite(Date.parse(m.updatedAt)))).toBe(true);
});
