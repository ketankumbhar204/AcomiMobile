import { readFileSync } from 'fs';
import { join } from 'path';
import { buildLocationSearchParams } from '../locationSearchQuery';

describe('buildLocationSearchParams', () => {
  it('sends the full multi-keyword query and optional ranking context', () => {
    const params = buildLocationSearchParams({
      q: 'aundh pune',
      state: 'MAHARASHTRA',
      district: 'Pune',
      taluk: 'Haveli',
    });

    expect(params.q).toBe('aundh pune');
    expect(params.limit).toBe(20);
    expect(params.state).toBe('MAHARASHTRA');
    expect(params.district).toBe('Pune');
    expect(params.taluk).toBe('Haveli');
  });

  it('omits empty context so search is not filtered client-side', () => {
    const params = buildLocationSearchParams({
      q: 'hinjewadi',
      state: '  ',
      district: undefined,
      taluk: null,
    });

    expect(params.q).toBe('hinjewadi');
    expect(params).not.toHaveProperty('state');
    expect(params).not.toHaveProperty('district');
    expect(params).not.toHaveProperty('taluk');
  });

  it('does not invent a locations.json path', () => {
    const serialized = JSON.stringify(buildLocationSearchParams({ q: 'Aundh' }));
    expect(serialized).not.toContain('locations.json');
    expect(serialized).not.toContain('reference/locations');
  });
});

describe('locationsApi search wiring', () => {
  it('uses the shared query builder and context params', () => {
    const source = readFileSync(join(__dirname, '../locationsApi.ts'), 'utf8');
    expect(source).toContain('buildLocationSearchParams');
    expect(source).toContain('/locations/search');
    expect(source).not.toContain('locations.json');
    expect(source).toMatch(/state:\s*options\.state/);
    expect(source).toMatch(/district:\s*options\.district/);
    expect(source).toMatch(/taluk:\s*options\.taluk/);
  });
});

describe('FindAPlace discovery alignment with the website', () => {
  it('prompts for location, keeps search separate, and skips mess rent filters', () => {
    const source = readFileSync(join(__dirname, '../../screens/FindAPlaceScreen.tsx'), 'utf8');
    expect(source).toContain('shouldPromptDiscoverLocation');
    expect(source).toContain('rankingContext');
    expect(source).toContain('minRent: isMess ? null');
    expect(source).toContain("type: apiType");
    expect(source).toContain('types: placeTypes');
    expect(source).not.toContain('locations.json');
    expect(source).not.toContain('reference/locations');
  });
});
