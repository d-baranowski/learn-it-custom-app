import React, {useEffect} from "react";

import {useBreadcrumbs} from "~/providers/breadcrumbs";
import {nanoid} from "nanoid";
import {SvgIconProps} from "@mui/material/SvgIcon";

interface BreadcrumbProps {
  label: string;
  href?: string;
  icon?: React.ComponentType<SvgIconProps>;
}

const Breadcrumb: React.FunctionComponent<BreadcrumbProps> = (props) => {
  const {
    label,
    href,
    icon,
  } = props

  const id = `bc-${nanoid(6)}`

  const {addBreadcrumb, removeBreadcrumb} = useBreadcrumbs()

  useEffect(() => {
    addBreadcrumb({
      id,
      label,
      href,
      icon,
    });

    return () => {
      removeBreadcrumb(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return null

};

export default Breadcrumb
