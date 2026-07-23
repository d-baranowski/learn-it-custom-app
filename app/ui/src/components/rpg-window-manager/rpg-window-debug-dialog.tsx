import React, {useState, useEffect} from 'react';
import {
  Drawer,
  IconButton,
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Stack,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  ButtonGroup,
  Menu,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {useWindows} from '~/_lib/window/state/hooks';
import ReactDOM from 'react-dom';
import {useFormRegistryContext} from '~/providers/form-registry';
import {useWindowActions} from '~/_lib/window/state/hooks';
import {useTheme} from '@mui/material/styles';

const RpgWindowDebugDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const windows = useWindows();
  const formRegistry = useFormRegistryContext();
  const windowActions = useWindowActions();
  const theme = useTheme();
  const menuZIndex = (theme?.zIndex?.modal ?? 1300) + 200;

  // Simple portal-based menu renderer to avoid z-index/portal issues inside Drawer
  const MenuPortal: React.FC<{
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
  }> = ({anchorEl, open, onClose, children}) => {
    if (!open || !anchorEl || typeof document === 'undefined') return null;
    const rect = anchorEl.getBoundingClientRect();
    // position under the anchor but clamp to viewport so menu isn't off-screen
    const preferredTop = rect.bottom + window.scrollY;
    const preferredLeft = rect.left + window.scrollX;
    const maxLeft = window.innerWidth - 240; // leave room for minWidth
    const maxTop = window.innerHeight - 40;
    const top = Math.min(preferredTop, Math.max(8, maxTop));
    const left = Math.min(preferredLeft, Math.max(8, maxLeft));
    // eslint-disable-next-line no-console
    console.debug('MenuPortal position', {preferredTop, preferredLeft, top, left, rect});

    const node = (
      <Box
        sx={{
          position: 'fixed',
          top,
          left,
          zIndex: menuZIndex,
          backgroundColor: (theme as any).palette?.background?.paper ?? '#fff',
          boxShadow: (theme as any).shadows?.[4] ?? '0 2px 8px rgba(0,0,0,0.2)',
          borderRadius: 1,
          minWidth: 220,
          overflow: 'auto',
          border: '1px solid rgba(0,0,0,0.08)',
        }}
        role="menu"
      >
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1.25, py: 0.5, borderBottom: '1px solid rgba(0,0,0,0.04)'}}>
          <Typography variant="subtitle2">Windows</Typography>
          <IconButton size="small" onClick={onClose} aria-label="Close menu">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box>
          {children}
        </Box>
      </Box>
    );

    return ReactDOM.createPortal(node, document.body);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+D or Cmd+Shift+D
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  const windowsList = Object.values(windows);
  const windowsEntries = Object.entries(windows || {}) as [string, any][];
  // Debug: show entries in console to help diagnose empty dropdown
  // (left in place for now — remove when satisfied)
  // eslint-disable-next-line no-console
  console.debug('RpgWindowDebugDialog windowsEntries:', windowsEntries);
  const registeredFormNames = Object.keys(formRegistry.registry || {});

  // Local controls for dispatching actions
  const [selectedWindowId, setSelectedWindowId] = useState<string | ''>('');
  const [posX, setPosX] = useState<number>(100);
  const [posY, setPosY] = useState<number>(100);
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(600);
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // If there is at least one window entry, pick the first by default and initialize controls
    if (!selectedWindowId && windowsEntries.length > 0) {
      const [firstId, firstWindow] = windowsEntries[0];
      setSelectedWindowId(String(firstId));
      if (firstWindow?.position) {
        setPosX(firstWindow.position.x ?? 100);
        setPosY(firstWindow.position.y ?? 100);
      }
      if (firstWindow?.size) {
        setWidth(firstWindow.size.width ?? 800);
        setHeight(firstWindow.size.height ?? 600);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowsEntries.length]);

  // Keep selectedWindowId valid when windows change
  useEffect(() => {
    if (!selectedWindowId && windowsEntries.length === 0) return;
    const exists = windowsEntries.some(([id]) => String(id) === String(selectedWindowId));
    if (!exists) {
      if (windowsEntries.length > 0) {
        setSelectedWindowId(String(windowsEntries[0][0]));
      } else {
        setSelectedWindowId('');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowsEntries.length, selectedWindowId]);

  const handleSelectWindow = (id: string) => {
    setSelectedWindowId(id);
    const w = windows[id];
    if (w?.position) {
      setPosX(w.position.x ?? 100);
      setPosY(w.position.y ?? 100);
    }
    if (w?.size) {
      setWidth(w.size.width ?? 800);
      setHeight(w.size.height ?? 600);
    }
  };

  // Convenience: open a sample form
  const handleOpenSample = () => {
    windowActions.openWindow({ formName: 'TherapyForm', title: 'Debug: TherapyForm', maxWidth: 'md' });
  };

  const dispatchIfSelected = (cb: (id: string) => void) => {
    if (!selectedWindowId) return;
    cb(selectedWindowId);
  };

  const updatePosition = () => {
    dispatchIfSelected((id) => windowActions.updateWindowPosition(id, { x: posX, y: posY }));
  };

  const updateSize = () => {
    dispatchIfSelected((id) => windowActions.updateWindowSize(id, { width, height }));
  };

  const setActiveTab = () => {
    dispatchIfSelected((id) => windowActions.setWindowActiveTab(id, tabIndex));
  };

  return (
    <Drawer
      anchor="right"
      variant="persistent"
      open={open}
      PaperProps={{
        sx: {
          width: 520,
          maxWidth: '100%',
          // Sit well above Dialog2's backdrop and Dialog2 windows
          zIndex: (theme: any) => (theme.zIndex?.modal ?? 1300) + 100,
          height: '100vh',
          position: 'fixed',
          top: 0,
          right: 0,
          pointerEvents: 'auto',
        },
      }}
      ModalProps={{
        // persistent drawers are non-modal, but keep this for explicitness
        keepMounted: true,
        // Make sure the drawer is rendered into document.body so it isn't trapped by other stacking contexts
        container: () => (typeof document !== 'undefined' ? document.body : null),
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" px={2} py={1}>
        <Typography variant="h6">Window Manager Debug Info</Typography>
        <IconButton onClick={handleClose} size="small" aria-label="Close debug panel">
          <CloseIcon />
        </IconButton>
      </Box>

      <Box p={2} sx={{overflow: 'auto', height: 'calc(100vh - 64px)'}}>
        <Box sx={{mb: 2}}>
          <Typography variant="caption" color="text.secondary">
            Press Ctrl+Shift+D (or Cmd+Shift+D) to toggle this panel
          </Typography>
        </Box>

        {/* Actions panel */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Actions</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button variant="contained" color="primary" onClick={handleOpenSample}>Open sample form</Button>
                <Button variant="outlined" color="secondary" onClick={() => windowActions.closeAllWindows()}>Close all windows</Button>
              </Stack>

              <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                <Typography variant="body2" color="text.secondary">
                  Windows: {windowsList.length}
                </Typography>
                <Button size="small" onClick={() => {
                  if (windowsEntries.length > 0) handleSelectWindow(String(windowsEntries[0][0]));
                }}>Select first</Button>
              </Box>

              {/* Menu-based selector — more reliable inside Drawer */}
              <Box sx={{display: 'flex', gap: 1, alignItems: 'center'}}>
                <Box sx={{position: 'relative', width: '100%'}}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={(e) => {
                    // eslint-disable-next-line no-console
                    console.debug('RpgWindowDebugDialog: opening menu; entries:', windowsEntries);
                    setMenuAnchor(e.currentTarget);
                    setMenuOpen(true);
                  }}
                  disabled={windowsEntries.length === 0}
                >
                   {selectedWindowId ? ((windows?.[selectedWindowId]?.title ?? windows?.[selectedWindowId]?.formName) || selectedWindowId) : '(none)'}
                 </Button>
                <MenuPortal anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => { setMenuAnchor(null); setMenuOpen(false); }}>
                  {windowsEntries.map(([id, w]) => (
                    <Box
                      key={String(id)}
                      onClick={() => {
                        handleSelectWindow(String(id));
                        setMenuAnchor(null);
                        setMenuOpen(false);
                      }}
                      sx={{
                        px: 2,
                        py: 1,
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: (theme as any).palette.action.hover },
                      }}
                    >
                      {(w && (w.title ?? w.formName)) || String(id)}
                    </Box>
                  ))}
                </MenuPortal>

                {/* Inline fallback menu shown inside Drawer if portal/popover fails */}
                {menuOpen && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      right: 0,
                      zIndex: (theme as any).zIndex?.modal ?? 1400,
                      backgroundColor: (theme as any).palette?.background?.paper,
                      boxShadow: (theme as any).shadows?.[3],
                      borderRadius: 1,
                      overflow: 'auto',
                      maxHeight: 300,
                    }}
                    role="menu"
                  >
                    {windowsEntries.map(([id, w]) => (
                      <Box
                        key={`inline-${String(id)}`}
                        onClick={() => {
                          handleSelectWindow(String(id));
                          setMenuAnchor(null);
                          setMenuOpen(false);
                        }}
                        sx={{px: 2, py: 1, cursor: 'pointer', '&:hover': { backgroundColor: (theme as any).palette.action.hover }}}
                      >
                        {(w && (w.title ?? w.formName)) || String(id)}
                      </Box>
                    ))}
                  </Box>
                )}
                </Box>
              </Box>

              {/* ALWAYS VISIBLE DEBUG LIST - helps confirm entries exist and are clickable */}
              {windowsEntries.length > 0 && (
                <Box sx={{mt: 1, mb: 1}}>
                  <Typography variant="caption" color="text.secondary">Debug: available windows</Typography>
                  <Box sx={{display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5}}>
                    {windowsEntries.map(([id, w]) => (
                      <Box
                        key={`debug-${String(id)}`}
                        onClick={() => handleSelectWindow(String(id))}
                        sx={{px: 1, py: 0.5, cursor: 'pointer', borderRadius: 0.5, '&:hover': { backgroundColor: (theme as any).palette.action.hover }}}
                      >
                        <Typography variant="body2">{(w && (w.title ?? w.formName)) || String(id)} <Typography component="span" sx={{color: 'text.secondary'}}>– {String(id)}</Typography></Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              <Stack direction="row" spacing={1}>
                <ButtonGroup variant="outlined">
                  <Button onClick={() => dispatchIfSelected((id) => windowActions.bringWindowToFront(id))}>Bring to front</Button>
                  <Button onClick={() => dispatchIfSelected((id) => windowActions.closeWindow(id))}>Close</Button>
                  <Button onClick={() => dispatchIfSelected((id) => windowActions.minimizeWindow(id))}>Minimize</Button>
                  <Button onClick={() => dispatchIfSelected((id) => windowActions.restoreWindow(id))}>Restore</Button>
                  <Button onClick={() => dispatchIfSelected((id) => windowActions.toggleMinimizeWindow(id))}>Toggle Minimize</Button>
                  <Button onClick={() => dispatchIfSelected((id) => windowActions.toggleFullScreenWindow(id))}>Toggle Fullscreen</Button>
                </ButtonGroup>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <TextField label="Pos X" type="number" size="small" value={posX} onChange={(e) => setPosX(Number(e.target.value))} />
                <TextField label="Pos Y" type="number" size="small" value={posY} onChange={(e) => setPosY(Number(e.target.value))} />
                <Button variant="contained" onClick={updatePosition} disabled={!selectedWindowId}>Update Position</Button>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <TextField label="Width" type="number" size="small" value={width} onChange={(e) => setWidth(Number(e.target.value))} />
                <TextField label="Height" type="number" size="small" value={height} onChange={(e) => setHeight(Number(e.target.value))} />
                <Button variant="contained" onClick={updateSize} disabled={!selectedWindowId}>Update Size</Button>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <TextField label="Active Tab" type="number" size="small" value={tabIndex} onChange={(e) => setTabIndex(Number(e.target.value))} />
                <Button variant="contained" onClick={setActiveTab} disabled={!selectedWindowId}>Set Active Tab</Button>
                <Button variant="outlined" onClick={() => dispatchIfSelected((id) => windowActions.clearWindowUiState(id))} disabled={!selectedWindowId}>Clear UI State</Button>
              </Stack>
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">
              Active Windows ({windowsList.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box
              component="pre"
              sx={{
                backgroundColor: '#f5f5f5',
                padding: 2,
                borderRadius: 1,
                overflow: 'auto',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
              }}
            >
              {JSON.stringify(windowsList, null, 2)}
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">
              Registered Forms ({registeredFormNames.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box
              component="pre"
              sx={{
                backgroundColor: '#f5f5f5',
                padding: 2,
                borderRadius: 1,
                overflow: 'auto',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
              }}
            >
              {JSON.stringify(registeredFormNames, null, 2)}
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Raw Windows State</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box
              component="pre"
              sx={{
                backgroundColor: '#f5f5f5',
                padding: 2,
                borderRadius: 1,
                overflow: 'auto',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
              }}
            >
              {JSON.stringify(windows, null, 2)}
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Form Registry Context</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box
              component="pre"
              sx={{
                backgroundColor: '#f5f5f5',
                padding: 2,
                borderRadius: 1,
                overflow: 'auto',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
              }}
            >
              {JSON.stringify(
                {
                  registeredFormNames,
                  isInitialized: formRegistry.isInitialized,
                  contextKeys: Object.keys(formRegistry),
                },
                null,
                2,
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Drawer>
   );
 };

 export default RpgWindowDebugDialog;
