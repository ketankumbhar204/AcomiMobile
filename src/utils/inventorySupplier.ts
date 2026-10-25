export type SupplierChoice = {
  supplierId: string;
  name: string;
};

export type SupplierWrite = {
  supplierId: string | null;
  /** Empty string clears the supplier. Null means an existing id was selected. */
  supplierName: string | null;
};

/** Saved supplier name. Does not invent a catalog default such as General Supplies. */
export function supplierDisplayName(
  item: { supplierId?: string | null; supplierName?: string | null },
  suppliers: SupplierChoice[],
): string | null {
  const saved = item.supplierName?.trim();
  if (saved) return saved;
  if (!item.supplierId) return null;
  const match = suppliers.find(supplier => supplier.supplierId === item.supplierId);
  return match?.name.trim() || null;
}

/**
 * Select an existing supplier when the typed name matches, otherwise store the
 * custom name. A blank field clears the supplier.
 */
export function supplierWrite(typedName: string, suppliers: SupplierChoice[]): SupplierWrite {
  const name = typedName.trim();
  if (!name) {
    return { supplierId: null, supplierName: '' };
  }
  const match = suppliers.find(
    supplier => supplier.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase(),
  );
  if (match) {
    return { supplierId: match.supplierId, supplierName: null };
  }
  return { supplierId: null, supplierName: name.slice(0, 150) };
}
