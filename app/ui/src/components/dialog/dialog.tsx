import React, {useCallback, useEffect, useMemo, useState} from "react";
import Box from "@mui/material/Box";
import MaterialDialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import Paper, {PaperProps} from "@mui/material/Paper";
import CloseIcon from '@mui/icons-material/Close';
import {Rnd} from "react-rnd";
import {nanoid} from "nanoid";
import {Theme} from "@mui/material/styles/createTheme";
import {SxProps} from "@mui/material/styles";
import { Breakpoint, Modal, ModalProps } from '@mui/material';
import { Backdrop, BackdropProps } from '@mui/material'

interface Props {
  title: string;
  isOpen: boolean;
  isFullScreen?: boolean;
  close: () => void;
  maxWidth?: Breakpoint;
  draggable?: boolean;
  headerStyles?:  SxProps<Theme> ;
  padding?: string;
  paperProps?: PaperProps
}

// @deprecated use Dialog2 instead
const Dialog: React.FunctionComponent<React.PropsWithChildren<Props>> =
  function Dialog(props) {
    const {
      children,
      isOpen,
      isFullScreen,
      close,
      title,
      maxWidth = "sm",
      draggable = false,
      headerStyles = {},
      padding = "0px 10px 10px 10px",
    } = props;

    const dialogID = useMemo(() => `modal_${nanoid(10)}`, []);

    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    // Track window size for centering
    useEffect(() => {
      const updateSize = () => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Calculate center position and default size
    const dialogDefaults = useMemo(() => {
      const defaultWidth = maxWidth === 'xs' ? 300 :
                          maxWidth === 'sm' ? 600 :
                          maxWidth === 'md' ? 900 :
                          maxWidth === 'lg' ? 1200 : 1536;
      const defaultHeight = 400;

      return {
        x: Math.max(0, (windowSize.width - defaultWidth) / 2),
        y: Math.max(0, (windowSize.height - defaultHeight) / 2),
        width: defaultWidth,
      };
    }, [windowSize, maxWidth]);

    const paperComponent = useMemo(() => {
      if (draggable) {
        return function DraggablePaperComponent(props: PaperProps) {
          return (
            <Rnd
              default={{
                x: dialogDefaults.x,
                y: dialogDefaults.y,
                width: dialogDefaults.width,
                height: "auto",
              }}
              testid="rnd-component-dialog-wrapper"
              minWidth={300}
              minHeight={200}
              dragHandleClassName="drag-handle"
              bounds="window"
              enableResizing={{
                top: false,
                right: true,
                bottom: true,
                left: false,
                topRight: false,
                bottomRight: true,
                bottomLeft: false,
                topLeft: false,
              }}
            >
              <Paper data-testid={"Paper component"} {...props} style={{ width: '100%', height: '100%' }} />
            </Rnd>
          );
        };
      }

      return undefined;
    }, [draggable, dialogDefaults]);

    const closeDialog = useCallback(
      (event: object, reason: string) => {
        if (reason !== "backdropClick") {
          close();
        }
      },
      [close],
    );

    //  For own sanity simply use this instead: https://www.youtube.com/watch?v=SuqU904ZHA4
    return (
      <MaterialDialog
        fullScreen={isFullScreen}
        open={isOpen}
        onClose={closeDialog}
        aria-labelledby={dialogID}
        closeAfterTransition
        disablePortal={true}

        sx={{
          // backdropFilter: "blur(3px)",
          backgroundColor:'rgba(0,0,30,0.4)',
          zIndex: 1300,
          paddingTop: 0,
        }}
        fullWidth={!draggable}
        maxWidth={!draggable ? maxWidth : false}
        slots={{
          backdrop: CustomBackdrop,
          root: CustomRoot,
        }}
        PaperComponent={paperComponent}
        PaperProps={props.paperProps}
      >
        <DialogTitle
          id={dialogID}
          className={draggable ? "drag-handle" : ""}
          sx={{
            backgroundColor: "#111926",
            color: "#fff",
            pl: "22px",
            pt: "5px",
            pb: "3px",
            cursor: draggable ? "move" : "inherit",
            ...headerStyles,
            fontWeight: 500,
          }}
        >
          <Grid
            justifyContent="space-between"
            container
          >
            <Grid item xs={11}>
              {title}
            </Grid>

            <Grid sx={{marginRight: "0px"}}> {/*10px*/}
              <Box sx={{cursor: "pointer"}}>
                <CloseIcon onClick={close}/>
              </Box>
            </Grid>
          </Grid>
        </DialogTitle>
        <DialogContent
          sx={{
            padding: {padding},
            position: "relative",
            overflow: draggable ? "auto" : "initial",
            flex: draggable ? 1 : "initial",
          }}
        >
          <Box sx={{padding: padding, maxHeight: "none"}}>{children}</Box>
        </DialogContent>
      </MaterialDialog>
    );
  };


const CustomBackdrop = React.forwardRef<HTMLDivElement, BackdropProps>(
  function CustomBackdrop(props, ref) {
    return (
      <Box
        ref={ref}
        data-testid="custom-backdrop"
        {...props}
        sx={{
          backgroundColor: "red !important",
          // backdropFilter: 'blur(6px)',
        }}
      />
    )
  }
)


const CustomRoot = React.forwardRef<HTMLDivElement, ModalProps>(
  function CustomRoot(props, ref) {
    const { children, ...rest } = props

    return (
      <Box
        ref={ref}
        {...rest}
        data-testid="custom-modal-root"
        sx={{
          ...rest.sx,
          backgroundColor: "rgba(0,0,0,0) !important",
          position: "absolute",
          zIndex: -1,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        {children}
      </Box>
    )
  }
)

export default Dialog;
