import { execFileSync } from 'child_process';
import path from 'path';

describe('hardcoded UI string scanner', () => {
  it('runs without throwing and stays under the soft ceiling', () => {
    const script = path.join(__dirname, '../../../scripts/scan-hardcoded-ui.cjs');
    const output = execFileSync(process.execPath, [script], { encoding: 'utf8' });
    const jsonStart = output.indexOf('{');
    const jsonEnd = output.lastIndexOf('}');
    expect(jsonStart).toBeGreaterThanOrEqual(0);
    const parsed = JSON.parse(output.slice(jsonStart, jsonEnd + 1)) as { count: number };
    // Soft ceiling — raise intentionally when new known leftovers are accepted.
    expect(parsed.count).toBeLessThanOrEqual(40);
  });
});
