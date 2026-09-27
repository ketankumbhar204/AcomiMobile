import { compactBedVisualSize } from '../compactBedVisualSize';

describe('compactBedVisualSize', () => {
  it('clamps small phones to 90dp', () => {
    expect(compactBedVisualSize(320)).toBe(90);
  });

  it('scales on typical Android widths', () => {
    expect(compactBedVisualSize(360)).toBe(94);
    expect(compactBedVisualSize(412)).toBe(107);
  });

  it('clamps large phones to 140dp', () => {
    expect(compactBedVisualSize(600)).toBe(140);
  });
});
