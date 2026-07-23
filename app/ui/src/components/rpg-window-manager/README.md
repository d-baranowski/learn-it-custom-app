# RpgWindowManager

A centralized window/dialog management system built on Redux for managing multiple forms and dialogs across the application.

## Overview

RpgWindowManager provides a global state-based approach to opening and managing dialogs/forms throughout the application. It allows any component to open or close forms via Redux actions, supports multiple simultaneous windows, and tracks window positions for a consistent user experience.

## Features

- ✅ **Redux-based state management** - All window state stored in Redux
- ✅ **Open forms from anywhere** - Dispatch actions to open/close dialogs globally
- ✅ **Multiple simultaneous windows** - Support for multiple open dialogs
- ✅ **Draggable & resizable** - Built on existing RpgDialog component
- ✅ **Z-index management** - Automatic window stacking and bring-to-front
- ✅ **Position & size persistence** - Window dimensions tracked in Redux state
- ✅ **Form registry pattern** - Dynamic form loading

## Architecture

### Components

1. **windows-slice.ts** - Redux slice managing window state
2. **RpgWindowManager** - Component that renders all open windows
3. **hooks.ts** - Redux hooks for window actions
4. **use-open-form.ts** - Convenient hook for opening forms

### State Structure

```typescript
interface WindowReduxState {
  id: string;              // Unique window ID
  formName: string;        // Name of the form component
  title: string;           // Window title
  isOpen: boolean;         // Open/closed state
  maxWidth: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isFullScreen?: boolean;
  draggable?: boolean;
  formProps?: Record<string, any>; // Props to pass to form
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  zIndex?: number;
}
```

## Setup

### 1. Register Forms

Forms must be registered before they can be opened by the window manager.
This is done via the **Form Registry context** (the provider is mounted in `_app.tsx`).

The app-root provider calls `initializeFormRegistry(registerForm)` automatically.
If you need to register additional forms dynamically (e.g. lazy loaded routes), use `useRegisterForm`:

```typescript
import {useRegisterForm} from '~/hooks/use-form-registry';
import {CustomerForm} from '~/sections/core/customer/customer_form';

function RegisterCustomerFormOnce() {
  const registerForm = useRegisterForm();

  React.useEffect(() => {
    registerForm('CustomerForm', CustomerForm);
  }, [registerForm]);

  return null;
}
```

### 2. Integration (Already Done)

The RpgWindowManager is already integrated into `_app.tsx` and the Redux store includes the windows reducer.

## Usage

### Opening a Form

Use the `useOpenForm` hook from anywhere in your application:

```typescript
import { useOpenForm } from '~/hooks/use-open-form';

function MyComponent() {
  const openForm = useOpenForm();

  const handleEditTherapy = (therapyId: string) => {
    openForm({
      formName: 'TherapyForm',
      title: 'Edit Therapy',
      formProps: { id: therapyId },
      maxWidth: 'lg',
      draggable: true,
    });
  };

  const handleCreateSession = () => {
    openForm({
      formName: 'SessionForm',
      title: 'Create Session',
      maxWidth: 'md',
    });
  };

  return (
    <>
      <button onClick={() => handleEditTherapy('123')}>Edit Therapy</button>
      <button onClick={handleCreateSession}>Create Session</button>
    </>
  );
}
```

### Using Window Actions Directly

For more control, use the `useWindowActions` hook:

```typescript
import { useWindowActions } from '~/_lib/window/state/hooks';

function MyComponent() {
  const { openWindow, closeWindow, closeAllWindows } = useWindowActions();

  const handleOpen = () => {
    openWindow({
      formName: 'TherapyForm',
      title: 'New Therapy',
      maxWidth: 'lg',
      formProps: { /* custom props */ },
    });
  };

  return (
    <>
      <button onClick={handleOpen}>Open Therapy Form</button>
      <button onClick={closeAllWindows}>Close All Windows</button>
    </>
  );
}
```

### Accessing All Open Windows

```typescript
import { useWindows } from '~/_lib/window/state/hooks';

function WindowList() {
  const windows = useWindows();
  const windowsList = Object.values(windows);

  return (
    <div>
      <h3>Open Windows: {windowsList.length}</h3>
      {windowsList.map(w => (
        <div key={w.id}>{w.title}</div>
      ))}
    </div>
  );
}
```

## Redux Actions

### Available Actions

```typescript
import {
  windowOpen,
  windowClose,
  windowUpdatePosition,
  windowUpdateSize,
  windowBringToFront,
  windowCloseAll,
} from '~/_lib/window/state/windows-slice';

// Dispatch directly if needed
dispatch(windowOpen({ formName: 'TherapyForm', title: 'Edit Therapy' }));
dispatch(windowClose({ windowId: 'window-id-123' }));
dispatch(windowBringToFront({ windowId: 'window-id-123' }));
dispatch(windowCloseAll());
```

## Form Requirements

Forms used with RpgWindowManager should accept these props:

```typescript
interface FormProps {
  id?: string;           // Optional: for editing existing items
  onCancel: () => void;  // Called when form is cancelled
  afterSave: () => void; // Called after successful save
  // ... any other custom props via formProps
}
```

Example form:

```typescript
interface Props {
  id?: string;
  afterSave: () => void;
  onCancel: () => void;
  customProp?: string;
}

export const MyForm: React.FC<Props> = ({ id, afterSave, onCancel, customProp }) => {
  // Form implementation
  return <div>Form content</div>;
};
```

## Migration from useDialog

**Before (using local state):**
```typescript
const dialog = useDialog('Therapy');

<Dialog isOpen={dialog.open} close={dialog.handleClose}>
  <TherapyForm onCancel={dialog.handleClose} afterSave={afterSave} />
</Dialog>
```

**After (using RpgWindowManager):**
```typescript
const openForm = useOpenForm();

// Just call openForm when needed
openForm({
  formName: 'TherapyForm',
  title: 'Edit Therapy',
  formProps: { id: therapyId }
});

// No need to render Dialog - RpgWindowManager handles it
```

## Benefits

1. **Decoupled Dialog Management** - Forms don't need to manage their own dialog state
2. **Global Access** - Open forms from anywhere without prop drilling
3. **Better UX** - Multiple windows, drag & drop, persistent positions
4. **Redux DevTools** - Debug window state like any other Redux state
5. **Testability** - Window state is easily mockable and testable

## Future Enhancements

- ✅ Position persistence (already tracked in Redux)
- 🔲 Save window positions to localStorage
- 🔲 Window minimization
- 🔲 Keyboard shortcuts (Ctrl+W to close, etc.)
- 🔲 Window tabs/grouping
- 🔲 Custom window decorations per form type
