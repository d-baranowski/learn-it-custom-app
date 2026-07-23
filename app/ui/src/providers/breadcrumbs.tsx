import React, {createContext, ReactNode, useCallback, useContext, useState} from 'react';
import {SvgIconProps} from '@mui/material/SvgIcon';

export interface Breadcrumb {
    id: string;
    label: string;
    href?: string;
    icon?: React.ComponentType<SvgIconProps>;
}

interface BreadcrumbsContextProps {
    addBreadcrumb: (crumb: Breadcrumb) => void;
    removeBreadcrumb: (id: string) => void;
    breadcrumbs: Breadcrumb[];
}

const BreadcrumbsContext = createContext<BreadcrumbsContextProps | undefined>(undefined);

interface BreadcrumbsProviderProps {
    children: ReactNode;
}

export const BreadcrumbsProvider = ({ children }: BreadcrumbsProviderProps) => {
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);

    const addBreadcrumb = useCallback((crumb: Breadcrumb) => {
        setBreadcrumbs((prevBreadcrumbs) => [...prevBreadcrumbs, crumb]);
    }, []);

    const removeBreadcrumb = useCallback((id: string) => {
        setBreadcrumbs((prevBreadcrumbs) =>
            prevBreadcrumbs.filter((breadcrumb) => breadcrumb.id !== id),
        );
    }, []);

    const value = { addBreadcrumb, removeBreadcrumb, breadcrumbs };

    return (
        <BreadcrumbsContext.Provider value={value}>
            {children}
        </BreadcrumbsContext.Provider>
    );
};

export const useBreadcrumbs = () => {
    const context = useContext(BreadcrumbsContext);
    if (context === undefined) {
        throw new Error('useBreadcrumbs must be used within a BreadcrumbsProvider');
    }
    return context;
};
