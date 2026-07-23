import type {NextComponentType, NextPageContext} from 'next/dist/shared/lib/utils';
import type {ReactElement, ReactNode} from 'react';
import {Subject} from "@gen/api/v1/permission_pb";
import {IUser} from "@gen/interface";
import {Service} from "@gen/shared/v1/enum_pb";

declare module 'next' {
  export declare type NextPage<P = {}, IP = P> = NextComponentType<NextPageContext, IP, P> & {
    getLayout?: (page: ReactElement) => ReactNode;
    restrictAccess?: boolean;
    service?: Service;
    subject?: Subject;
  };
  export declare type NextConfig = {}
}
