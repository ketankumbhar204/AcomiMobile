import { resolveSelectedCategoryId } from '../useMenuLibrary';

describe('resolveSelectedCategoryId', () => {
  const ids = ['breads', 'rice'];

  it('keeps All selected when the library has categories', () => {
    expect(resolveSelectedCategoryId(null, ids)).toBeNull();
  });

  it('keeps a category that is still in the catalog', () => {
    expect(resolveSelectedCategoryId('rice', ids)).toBe('rice');
  });

  it('returns to All when the selected category was removed', () => {
    expect(resolveSelectedCategoryId('breakfast', ids)).toBeNull();
  });

  it('clears the selection when the catalog is empty', () => {
    expect(resolveSelectedCategoryId('rice', [])).toBeNull();
  });
});
