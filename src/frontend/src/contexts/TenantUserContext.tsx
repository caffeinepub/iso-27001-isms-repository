import { createContext, useContext } from "react";

export interface TenantUserInfo {
  id: string;
  fullName: string;
  email: string;
  companyName: string;
  domain: string;
  role: string;
}

interface TenantUserContextValue {
  tenantUser: TenantUserInfo | null;
}

const TenantUserContext = createContext<TenantUserContextValue>({
  tenantUser: null,
});

export function TenantUserProvider({
  children,
  tenantUser,
}: {
  children: React.ReactNode;
  tenantUser: TenantUserInfo | null;
}) {
  return (
    <TenantUserContext.Provider value={{ tenantUser }}>
      {children}
    </TenantUserContext.Provider>
  );
}

export function useTenantUser() {
  return useContext(TenantUserContext);
}
