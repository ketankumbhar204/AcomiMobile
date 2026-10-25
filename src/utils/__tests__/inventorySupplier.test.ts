import { supplierDisplayName, supplierWrite } from '../inventorySupplier';

const suppliers = [
  { supplierId: 'seed', name: 'General Supplies' },
  { supplierId: 'city', name: 'City Linens' },
];

describe('inventorySupplier', () => {
  it('shows the saved supplier name', () => {
    expect(
      supplierDisplayName({ supplierId: 'seed', supplierName: 'General Supplies' }, []),
    ).toBe('General Supplies');
  });

  it('does not invent a supplier when the item has none', () => {
    expect(supplierDisplayName({ supplierId: null, supplierName: null }, suppliers)).toBeNull();
  });

  it('falls back to the supplier list only when the item id is saved', () => {
    expect(supplierDisplayName({ supplierId: 'city', supplierName: null }, suppliers)).toBe(
      'City Linens',
    );
  });

  it('selects an existing supplier without creating a duplicate name', () => {
    expect(supplierWrite('  general supplies ', suppliers)).toEqual({
      supplierId: 'seed',
      supplierName: null,
    });
  });

  it('sends a custom name when it does not match a supplier', () => {
    expect(supplierWrite('Linen House', suppliers)).toEqual({
      supplierId: null,
      supplierName: 'Linen House',
    });
  });

  it('clears the supplier when the field is blank', () => {
    expect(supplierWrite('   ', suppliers)).toEqual({
      supplierId: null,
      supplierName: '',
    });
  });
});
