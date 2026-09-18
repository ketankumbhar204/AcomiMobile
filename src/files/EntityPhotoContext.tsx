import React, { createContext, useContext } from 'react';

type EntityPhotoContextValue = {
  spaceId: string;
  canEdit: boolean;
};

const EntityPhotoContext = createContext<EntityPhotoContextValue | null>(null);

export function EntityPhotoProvider({
  spaceId,
  canEdit,
  children,
}: {
  spaceId: string;
  canEdit: boolean;
  children: React.ReactNode;
}) {
  return (
    <EntityPhotoContext.Provider value={{ spaceId, canEdit }}>
      {children}
    </EntityPhotoContext.Provider>
  );
}

export function useEntityPhotoContext(): EntityPhotoContextValue | null {
  return useContext(EntityPhotoContext);
}
