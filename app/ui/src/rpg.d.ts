import {ValidationResult} from '~/validation/types';

interface RpgWindow extends Window {
  validateMessage: (jsonMessage: string) => ValidationResult
  go: any
}

declare let window: RpgWindow;
