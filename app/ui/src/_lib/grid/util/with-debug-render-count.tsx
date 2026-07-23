import React, {useRef} from 'react';

// Define a type for the additional prop `debugDisplayRenderCount`
export interface WithDebugRenderCountProps {
  debugDisplayRenderCount?: boolean;
  debugDisplayRenderCountName?: string;
}

// Create the HOC with proper TypeScript support
function withDebugRenderCount<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const ComponentWithRenderCount: React.FC<P & WithDebugRenderCountProps> = (props) => {
    const { debugDisplayRenderCount, debugDisplayRenderCountName = "render-count", ...restProps } = props;
    const renderCount = useRef(0);
    renderCount.current += 1;

    return (
      <>
        <WrappedComponent {...(restProps as P)} />
        {debugDisplayRenderCount && (
          <div data-testid={debugDisplayRenderCountName}>Render count: {renderCount.current}</div>
        )}
      </>
    );
  };

  // Copy display name for easier debugging in the React DevTools
  ComponentWithRenderCount.displayName = `withDebugRenderCount(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return ComponentWithRenderCount;
}

export default withDebugRenderCount;
