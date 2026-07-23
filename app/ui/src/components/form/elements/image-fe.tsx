/**
 * ImageFe — image upload + crop field. Stores the cropped image as a
 * base64 data-URI string in the form value.
 *
 * Mirrors the legacy `~/components/form/elements/image-fe.tsx`:
 * - opens a Dialog with `react-image-crop` after a file is picked
 * - debounces the canvas preview, then writes the cropped data-URI back to
 *   the field on Save
 * - all internal upload/crop UI state lives in this component, not Redux
 */

import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import {
  Box,
  Breakpoint,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  Slider,
  Stack,
  Typography,
} from '@mui/material';
import IconFileUpload from '@mui/icons-material/Upload';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import type { SxProps, Theme } from '@mui/material/styles';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Compress from 'compress.js';
import { useTranslation } from 'next-i18next';
import centerAspectCrop from '~/components/avatar-input/center-aspect-crop';
import { canvasPreview } from '~/components/avatar-input/canvas-preview';
import { useDebounceEffect } from '~/components/avatar-input/use-debounce-effect';
import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFormController } from '~/_lib/forms/runtime/use-form-controller';
import { useDefaultLabel } from './use-default-label';
import { FeGridItem } from './fe-grid-item';

const compress = new Compress();

export interface ImageFeProps {
  name: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  maxPixels?: number;
  aspect?: number;
  circularCrop?: boolean;
  formId?: string;
  /** Grid item span (1-12). Defaults to 12. */
  xs?: number;
  hideLabel?: boolean;
  layout?: 'default' | 'therapist-profile';
  cropDialogFullScreen?: boolean;
  cropDialogMaxWidth?: Breakpoint;
  cropDialogPaperSx?: SxProps<Theme>;
  cropDialogBodySx?: SxProps<Theme>;
}

export const ImageFe: React.FC<ImageFeProps> = ({
  name,
  label,
  required = false,
  disabled = false,
  readonly,
  maxPixels = 800,
  aspect = 16 / 9,
  circularCrop = false,
  formId: propFormId,
  xs = 12,
  hideLabel = false,
  layout = 'default',
  cropDialogFullScreen = false,
  cropDialogMaxWidth = 'sm',
  cropDialogPaperSx,
  cropDialogBodySx,
}) => {
  const ctxFormId = useFormId();
  const formId = propFormId ?? ctxFormId;
  const resolvedLabel = useDefaultLabel(name, label);
  const { t } = useTranslation('common');
  const { field, fieldState } = useFormController<string | undefined>({ formId, name });

  const value = field.value ?? '';
  const [imgSrc, setImgSrc] = useState<string>(value);
  const [altImgSrc, setAltImgSrc] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [croppedSrc, setCroppedSrc] = useState<string>(value);
  const [dialogOpen, setDialogOpen] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate] = useState(0);
  const [fileValue, setFileValue] = useState('');

  useEffect(() => {
    setImgSrc(value);
  }, [value]);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    const data = await compress.compress([file], {
      maxWidth: maxPixels,
      maxHeight: maxPixels,
      resize: true,
    });
    const base64Src = data[0].prefix + data[0].data;
    setAltImgSrc(base64Src);
    setDialogOpen(true);
    setIsProcessing(false);
  };

  const onCropImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  };

  useDebounceEffect(
    async () => {
      if (
        completedCrop?.width &&
        completedCrop?.height &&
        imgRef.current &&
        previewCanvasRef.current
      ) {
        setIsProcessing(true);
        canvasPreview(
          imgRef.current,
          previewCanvasRef.current,
          completedCrop,
          scale,
          rotate
        );
        previewCanvasRef.current.toBlob((blob) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const data = ev.target?.result;
            if (data) {
              setCroppedSrc(data as string);
              setIsProcessing(false);
            }
          };
          reader.onerror = () => setIsProcessing(false);
          if (blob) reader.readAsDataURL(blob);
        });
      }
    },
    100,
    [completedCrop, scale, rotate]
  );

  const borderColor = fieldState.error ? 'error.main' : '#C8C5B9';

  return (
    <FeGridItem xs={xs}>
      <FormControl fullWidth error={!!fieldState.error} required={required}>
        {!hideLabel ? (
          <InputLabel
            shrink
            sx={{
              position: 'relative',
              left: '-12px',
              top: '5px',
              marginTop: 1,
              color: fieldState.error ? 'error.main' : 'text.primary',
              '&.Mui-focused': {
                color: fieldState.error ? 'error.main' : 'primary.main',
              },
            }}
          >
            {resolvedLabel}
          </InputLabel>
        ) : null}

        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          fullScreen={cropDialogFullScreen}
          fullWidth
          maxWidth={cropDialogMaxWidth}
          PaperProps={{
            sx: {
              ...(cropDialogPaperSx || {}),
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              pb: 1,
            }}
          >
            <Typography variant="h6" component="span">
              {resolvedLabel || t('Image Selector')}
            </Typography>
            <IconButton edge="end" onClick={() => setDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ width: '100%' }}>
              <Stack spacing={2} direction="row" sx={{ mb: 2 }} alignItems="center">
                <IconButton onClick={() => setScale((p) => p - 0.1)} disabled={scale === 0.1}>
                  <ZoomOutIcon />
                </IconButton>
                <Slider
                  value={scale}
                  step={0.1}
                  min={0.1}
                  max={3}
                  onChange={(_, v) => setScale(v as number)}
                />
                <IconButton onClick={() => setScale((p) => p + 0.1)} disabled={scale === 3}>
                  <ZoomInIcon />
                </IconButton>
              </Stack>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 420,
                ...cropDialogBodySx,
              }}
            >
              <Box sx={{ maxWidth: '100%', overflow: 'auto' }}>
                {!!altImgSrc && (
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={aspect}
                    circularCrop={circularCrop}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      ref={imgRef}
                      alt={resolvedLabel}
                      src={altImgSrc}
                      style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
                      onLoad={onCropImageLoad}
                    />
                  </ReactCrop>
                )}
                <canvas
                  ref={previewCanvasRef}
                  style={{
                    objectFit: 'contain',
                    display: 'none',
                    width: completedCrop?.width || 0,
                    height: completedCrop?.height || 0,
                  }}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => {
                setImgSrc(croppedSrc);
                setDialogOpen(false);
                field.onChange(croppedSrc);
              }}
              disabled={isProcessing}
              variant="contained"
            >
              {t('Save')}
            </Button>
          </DialogActions>
        </Dialog>

        <Box sx={{ marginTop: hideLabel ? 0 : 1 }}>
          <input
            ref={fileInputRef}
            accept="image/*"
            type="file"
            hidden
            style={{ display: 'none' }}
            value={fileValue}
            onClick={() => setFileValue('')}
            onChange={handleUpload}
          />
          <Box
            role="button"
            tabIndex={disabled || readonly ? -1 : 0}
            onClick={() => {
              if (!disabled && !readonly) fileInputRef.current?.click();
            }}
            onKeyDown={(e) => {
              if (disabled || readonly) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            sx={{
              width: '100%',
              height: 'auto',
              borderRadius: layout === 'therapist-profile' ? 2 : 1,
              padding: layout === 'therapist-profile' ? 0 : 2,
              cursor: disabled || readonly ? 'default' : 'pointer',
              '&:hover': {
                backgroundColor: 'action.hover',
                '.upload-hint': { display: 'flex' },
              },
            }}
          >
            {layout === 'therapist-profile' ? (
              <Box sx={{ display: 'flex', gap: 1.75, alignItems: 'stretch', width: '100%' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: '#F6F4EE',
                    border: '1px dashed',
                    borderColor,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary',
                    flexShrink: 0,
                  }}
                >
                  {imgSrc ? (
                    <Box
                      component="img"
                      src={imgSrc}
                      alt={resolvedLabel}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <PersonOutlineIcon sx={{ fontSize: 30 }} />
                  )}
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    minHeight: 80,
                    borderRadius: 1.5,
                    bgcolor: '#F6F4EE',
                    border: '1px dashed',
                    borderColor,
                    px: 2,
                    py: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    gap: 0.25,
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'text.primary' }}>
                    {t('Drag an image here, or')}{' '}
                    <Box
                      component="span"
                      sx={{ color: '#534AB7', textDecoration: 'underline', textUnderlineOffset: 2 }}
                    >
                      {t('browse')}
                    </Box>
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('PNG or JPG')} · {t('max 5 MB')} · {t('square 800x800 recommended')}
                  </Typography>
                </Box>
              </Box>
            ) : imgSrc ? (
              <Box sx={{ position: 'relative', width: '100%' }}>
                <Box
                  component="img"
                  src={imgSrc}
                  alt={resolvedLabel}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: 300,
                    objectFit: 'contain',
                  }}
                />
                <Box
                  className="upload-hint"
                  sx={{
                    display: 'none',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    color: 'white',
                    padding: 2,
                    borderRadius: 1,
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <IconFileUpload />
                  <span>{t('Change Image')}</span>
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  py: 4,
                  border: fieldState.error ? '2px solid' : '2px dashed',
                  borderColor: fieldState.error ? 'error.main' : 'grey.400',
                  borderRadius: 1,
                  width: '100%',
                }}
              >
                <IconFileUpload sx={{ fontSize: 48, color: 'text.secondary' }} />
                <span>{t('Upload Image')}</span>
              </Box>
            )}
          </Box>
        </Box>
        {fieldState.error && <FormHelperText error>{fieldState.error.message}</FormHelperText>}
      </FormControl>
    </FeGridItem>
  );
};
