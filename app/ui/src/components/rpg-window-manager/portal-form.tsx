import React, { useEffect } from 'react';
import {FormProps} from "~/components/form/form-props";
import _ from 'lodash';
import { OutPortal } from '~/_lib/portals/in-out-portals';

function PortalForm<T>(props: FormProps<T> & {registerName: string}) {
  const {
    id,
    afterSave = _.noop,
    onCancel = _.noop,
    registerName
  } = props;


  return (
    <OutPortal id={registerName} />
  );
};

export default PortalForm;
