'use client';

import React, {createContext, type ReactNode, useContext, useEffect, useState} from 'react';
import {useQuery} from '@connectrpc/connect-query';
import {getPermissions} from '@gen/core/me/v1/me-MeService_connectquery';
import {Permission} from "@gen/permissions";
import { useSession } from '~/auth/session-provider';

export interface UserPermissionsContextType {
  can: (ability: string, key: string) => Promise<boolean>;
  canAccess: (p: Permission) => boolean;
  canCreate: (p: Permission) => boolean;
  canUpdate: (p: Permission) => boolean;
  canSoftDelete: (p: Permission) => boolean;
  canDelete: (p: Permission) => boolean
  canImport: (p: Permission) => boolean;
  //canExport: (p: Permission) => boolean;
  refetch?: () => void;
  loading: boolean;
  error: boolean;
  ready: boolean;
}

export const UserPermissionsContext = createContext<UserPermissionsContextType>({
  can: () => Promise.resolve(false),
  canAccess: () => false,
  canCreate: () => false,
  canUpdate: () => false,
  canSoftDelete: () => false,
  canDelete: () => false,
  canImport: () => false,
  loading: false,
  error: false,
  ready: false
});

export const UserPermissionsConsumer = UserPermissionsContext.Consumer;

interface UserPermissionsProviderProps {
  children?: ReactNode;
}

interface UserPermissionsState {
  access: Record<string, boolean>;
  groups: Record<string, string[]>;
  ready: boolean;
}

export const UserPermissionsProvider: React.FC<UserPermissionsProviderProps> = (props) => {
  const {children} = props;

  const [userPermissions, setUserPermissions] = useState<UserPermissionsState>({
    access: {},
    groups: {},
    ready: false,
  });

  const session = useSession();

  const {data, error, isLoading, isError} = useQuery(getPermissions, {}, {
    refetchInterval: 1000 * 60,
    enabled: !!session.session
  });

  useEffect(() => {
    console.error(error);
  }, [error]);

  useEffect(() => {
    if (!data) {
      return;
    }

    // Inline hasRead so the effect's deps stay just `data` — the helper
    // defined below the effect closes over `data` itself anyway, so
    // referencing it as a dep would only churn the linter without
    // changing behaviour.
    const enforce = data.Enforce !== false;
    const checkRead = (abilities: string[]): boolean =>
      !enforce || abilities.includes('List') || abilities.includes('Get');

    let access: Record<string, boolean> = {};
    let groups: Record<string, string[]> = {};

    Object.entries(data.groups).forEach(([k, v]) => {
      access[k] = checkRead(v.abilities);
      groups[k] = v.abilities;
    });

    // Functional update — don't capture stale `userPermissions` and don't
    // need to depend on it.
    setUserPermissions((prev) => ({
      ...prev,
      access: access,
      groups: groups,
      ready: true,
    }));

  }, [data]);

  const hasAllAccess = (): boolean => {
    if (data?.Enforce === false) {
      return true;
    }
    return data?.groups?.All?.abilities?.includes("All") || false;
  }

  const can = async (ability: string, key: string): Promise<boolean> => {
    if (hasAllAccess()) {
      return true;
    }

    if (!userPermissions.ready) {
      return false;
    }

    if (!userPermissions.access[key]) {
      return false;
    }

    return userPermissions.groups[key].includes(ability);
  };

  const canAccess = (p: Permission): boolean => {
    if (hasAllAccess()) {
      return true;
    }
    return userPermissions.access[p.Key];
  };

  const canCreate = (p: Permission): boolean => {
    if (hasAllAccess()) {
      return true;
    }
    let abilities = userPermissions.groups[p.Key];
    if (!abilities) {
      return false;
    }
    return abilities.includes('Create');
  };

  const canUpdate = (p: Permission): boolean => {
    if (hasAllAccess()) {
      return true;
    }
    if (data?.Enforce === false) {
      return true;
    }
    let abilities = userPermissions.groups[p.Key];
    if (!abilities) {
      return false;
    }
    return abilities.includes('Update');
  };

  const canSoftDelete = (p: Permission): boolean => {
    if (hasAllAccess()) {
      return true;
    }
    if (data?.Enforce === false) {
      return true;
    }
    let abilities = userPermissions.groups[p.Key];
    if (!abilities) {
      return false;
    }
    return abilities.includes('SoftDelete');
  };

  const canDelete = (p: Permission): boolean => {
    if (hasAllAccess()) {
      return true;
    }
    if (data?.Enforce === false) {
      return true;
    }
    let abilities = userPermissions.groups[p.Key];
    if (!abilities) {
      return false;
    }
    return abilities.includes('Delete');
  };

  const canImport = (p: Permission): boolean => {
    if (data?.Enforce === false) {
      return true;
    }
    let abilities = userPermissions.groups[p.Key];
    if (!abilities) {
      return false;
    }
    return abilities.includes('Import');
  };

  const hasRead = (abilities: string[]): boolean => {
    if (data?.Enforce === false) {
      return true;
    }
    // check if Read is allowed
    return abilities.includes('List') || abilities.includes('Get');
  };

  const reload = () => {
    // void refetch();
  };

  return (
    <UserPermissionsContext.Provider value={{
      can: can,
      canAccess: canAccess,
      canCreate: canCreate,
      canUpdate: canUpdate,
      canSoftDelete: canSoftDelete,
      canDelete: canDelete,
      canImport: canImport,
      refetch: reload,
      loading: isLoading,
      error: isError,
      ready: userPermissions.ready
    }}>
      {children}
    </UserPermissionsContext.Provider>
  );
};

export const useUserPermissions = (): UserPermissionsContextType => {
  const context = useContext(UserPermissionsContext);
  if (!context) {
    throw new Error('useUserPermissions must be used within an UserPermissionsProvider');
  }
  return context;
};
