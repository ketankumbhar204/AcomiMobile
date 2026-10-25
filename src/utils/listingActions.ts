export type ListingActionInput = {
  publication?: string | null;
  kind?: string | null;
  spaceType?: string | null;
  spaceId?: string | null;
  operationalManagementAvailable?: boolean;
  accommodationPath?: string | null;
  mealsPath?: string | null;
  publicPath?: string | null;
};

export function showsResidentialInventory(listing: ListingActionInput): boolean {
  return (
    listing.publication === 'LIVE' &&
    listing.operationalManagementAvailable === true &&
    Boolean(listing.spaceId) &&
    listing.kind !== 'MESS' &&
    listing.spaceType !== 'MESS' &&
    Boolean(listing.accommodationPath)
  );
}

export function showsMealsWorkspace(listing: ListingActionInput): boolean {
  return (
    listing.publication === 'LIVE' &&
    listing.operationalManagementAvailable === true &&
    (listing.kind === 'MESS' || listing.spaceType === 'MESS') &&
    Boolean(listing.mealsPath)
  );
}

export function isPendingLead(listing: ListingActionInput): boolean {
  return listing.publication === 'PENDING' && !listing.spaceId;
}
