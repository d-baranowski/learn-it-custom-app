import {useCallback, useState} from 'react';

interface DialogControllerState<T> {
  data?: T;
  open: boolean;
}

export interface DialogController<T> {
  data?: T;
  handleClose: () => void;
  handleOpen: (data?: T, title?: string) => void;
  open: boolean;
  maxWidth: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  setMaxWidth: (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => void;
  title: string;
}

export function useDialog<T = unknown>(subject?: string): DialogController<T> {
  const [state, setState] = useState<DialogControllerState<any>>({
    open: false,
    data: undefined,
  });

  const [size, setSize] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');

  const [title, setTitle] = useState<string>('');

  const handleOpen = useCallback((data?: T, title?: string): void => {
    console.log(data,title);
    if (!title) {
      setTitle(data ? `Edit ${subject}` : `Create ${subject}`);
    } else {
      setTitle(title);
    }

    setState({
      open: true,
      data,
    });
  }, [subject]);

  const handleClose = useCallback((): void => {
    setState({
      open: false,
      data: undefined,
    });

    // delay setting title to empty string to allow animation to complete
    setTimeout(() =>
      setTitle(''), 200,
    );
  }, []);

  return {
    data: state.data,
    handleClose,
    handleOpen,
    open: state.open,
    maxWidth: size,
    setMaxWidth: setSize,
    title: title,
  };
}
