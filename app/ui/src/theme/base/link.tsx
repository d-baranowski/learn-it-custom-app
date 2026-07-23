import {forwardRef} from "react";
import type {LinkProps} from 'next/link';
import NextLink from "next/link";

export const LinkBehaviour = forwardRef(function LinkBehaviour(props: LinkProps, ref: any) {
    return <NextLink ref={ref} {...props} />;
});
