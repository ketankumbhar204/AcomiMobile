import React, { createContext, useContext } from 'react';

export type MoveInBedFace = {
  memberName: string;
  moveInDate: string | null;
  rent: number | null;
  deposit: number | null;
  stayKind?: 'MONTHLY' | 'SHORT' | 'OPEN_ENDED' | null;
};

type BedInventoryFaceValue = {
  moveInsByBedId: ReadonlyMap<string, MoveInBedFace>;
};

const BedInventoryFaceContext = createContext<BedInventoryFaceValue>({
  moveInsByBedId: new Map(),
});

export function BedInventoryFaceProvider({
  moveInsByBedId,
  children,
}: {
  moveInsByBedId: ReadonlyMap<string, MoveInBedFace>;
  children: React.ReactNode;
}) {
  return (
    <BedInventoryFaceContext.Provider value={{ moveInsByBedId }}>
      {children}
    </BedInventoryFaceContext.Provider>
  );
}

export function useMoveInBedFace(bedId: string): MoveInBedFace | null {
  return useContext(BedInventoryFaceContext).moveInsByBedId.get(bedId) ?? null;
}
