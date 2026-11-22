import { colors, spacing, radii, typography, layout } from '../src/theme/tokens';

describe('Design Foundation and Tokens', () => {
  it('has valid editorial color palette matching Figma v2', () => {
    expect(colors.ivory).toBe('#F8F4EA');
    expect(colors.forest).toBe('#184235');
    expect(colors.terracotta).toBe('#C1654A');
    expect(colors.sage).toBe('#A8B89A');
    expect(colors.brass).toBe('#C79B4D');
    expect(colors.ink).toBe('#2C2A27');
  });

  it('provides required layout constants', () => {
    expect(layout.referenceWidth).toBe(390);
    expect(layout.horizontalInset).toBe(24);
    expect(layout.minimumTouchTarget).toBeGreaterThanOrEqual(48);
  });

  it('defines consistent spacing and radii scales', () => {
    expect(spacing[4]).toBe(16);
    expect(spacing[6]).toBe(24);
    expect(radii.pill).toBe(999);
  });

  it('defines editorial typography tokens', () => {
    expect(typography.displayXL.fontFamily).toBe('PlayfairDisplay-Regular');
    expect(typography.body.fontFamily).toBe('Inter-Regular');
    expect(typography.body.fontSize).toBe(14);
  });
});
