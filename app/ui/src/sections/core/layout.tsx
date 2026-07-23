import React, {FC, ReactNode} from "react";
import {Layout} from "~/layouts";
import Breadcrumb from "~/components/breadcrumb/breadcrumb";


interface LayoutProps {
  children?: ReactNode;
}

export const CoreLayout: FC<LayoutProps> = (props) => {
  const {children} = props;

  return <>
    <Layout>
      <Breadcrumb label="Core"/>
      {children}
    </Layout>
  </>
}
