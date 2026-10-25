import { readFileSync } from 'fs';
import { join } from 'path';

function source(relativePath: string): string {
  return readFileSync(join(__dirname, '../../../..', relativePath), 'utf8');
}

describe('discover listing card layout', () => {
  const card = source('src/components/discovery/DiscoverSpaceCard.tsx');
  const screen = source('src/screens/FindAPlaceScreen.tsx');

  it('uses the website card hierarchy for places and mess', () => {
    expect(card).toContain('aspectRatio: 16 / 10');
    expect(card).toContain('<ListingInfoChips');
    expect(card).toContain("surface={isMess ? 'meals' : 'places'}");
    expect(card).toContain('showRepresentativeLabel={false}');
    expect(card).toContain('onPress={onPress}');
    expect(card).toContain("onViewSection('contact')");
    expect(card).toContain('contactViewed');
    expect(card).not.toContain('testBadge');
    expect(card).not.toContain('width: 118');
    const pressableStart = card.indexOf('style={({ pressed }) => [styles.mediaPress');
    const heartStart = card.indexOf('<FavoriteHeartButton');
    const pressableEnd = card.indexOf('</Pressable>', pressableStart);
    const clipEnd = card.lastIndexOf('overflow: \'hidden\'');
    expect(pressableStart).toBeGreaterThan(-1);
    expect(heartStart).toBeGreaterThan(pressableEnd);
    expect(card.indexOf('styles.heartSlot')).toBeGreaterThan(card.indexOf('styles.clip'));
    expect(clipEnd).toBeGreaterThan(-1);
    expect(card).toContain('pointerEvents="none"');
    expect(card).toContain('collapsable={false}');
    expect(card).not.toContain('elevation: 30');
    const heart = source('src/components/discovery/FavoriteHeartButton.tsx');
    expect(heart).toContain('elevation: 0');
    expect(heart).toContain('toggle(spaceId)');
    expect(screen).toContain('<DiscoverSpaceCard');
    expect(screen).toContain("? 'MESS'");
  });
});
