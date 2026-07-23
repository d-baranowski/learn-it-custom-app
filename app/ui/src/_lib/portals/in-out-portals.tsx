import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

/**
 * Portal registry to track portal targets
 */
const portalRegistry = new Map<string, HTMLElement>();

/**
 * Hook to check if we're on the client side
 */
function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * OutPortal - Creates a portal target container
 * This is where portal content will be rendered
 */
export const OutPortal: React.FC<{
  id: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ id, className, style }) => {
  const isClient = useIsClient();
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isClient || !containerRef.current) return;

    // Register the portal target
    portalRegistry.set(id, containerRef.current);

    return () => {
      // Unregister on cleanup
      portalRegistry.delete(id);
    };
  }, [id, isClient]);

  return <div ref={containerRef} id={`portal-input-${id}`} className={className} style={style} />;
};

/**
 * InPortal - Renders content into a portal target
 * Safe for SSR - only renders on client side
 */
export const InPortal: React.FC<{
  targetId: string;
  children: React.ReactNode;
  open: boolean;
}> = ({ targetId, children, open }) => {
  const isClient = useIsClient();
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isClient || !open) {
      setPortalTarget(null);
      return;
    }

    // Get the portal target from registry
    const target = portalRegistry.get(targetId);

    if (target) {
      setPortalTarget(target);
      return;
    } else {
      // If target doesn't exist yet, wait and retry
      const checkInterval = setInterval(() => {
        const newTarget = portalRegistry.get(targetId);
        if (newTarget) {
          setPortalTarget(newTarget);
          clearInterval(checkInterval);
        }
      }, 100);

      // Cleanup interval after 5 seconds
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        console.warn(`Portal target "${targetId}" not found after 5 seconds`);
      }, 5000);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }
  }, [targetId, isClient, open]);

  // Don't render on server side
  if (!isClient || !open || !portalTarget) {
    return null;
  }

  // Use ReactDOM.createPortal to render children into the target
  return ReactDOM.createPortal(children, portalTarget);
};
