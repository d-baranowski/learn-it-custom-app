import type {FC, MouseEvent, ReactElement} from 'react';
import {cloneElement, useContext} from 'react';

import {DropdownContext} from './dropdown-context';

interface DropdownButtonProps {
  children: ReactElement;
}

export const DropdownTrigger: FC<DropdownButtonProps> = (props) => {
  const { children } = props;
  const { onTriggerEnter, onTriggerLeave } = useContext(DropdownContext);

  return cloneElement(children, {
    onMouseEnter: (event: MouseEvent<HTMLElement>) => {
      children.props.onMouseEnter?.(event);
      onTriggerEnter(event);
    },
    onMouseLeave: (event: MouseEvent<HTMLElement>) => {
      children.props.onMouseLeave?.(event);
      onTriggerLeave(event);
    },
  });
};
