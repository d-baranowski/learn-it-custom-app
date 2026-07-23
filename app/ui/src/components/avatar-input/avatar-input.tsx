import React, {ChangeEvent, useState} from "react";
import Compress from "compress.js";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import ReactCrop, {Crop, PixelCrop} from "react-image-crop";
import {canvasPreview} from "./canvas-preview";
import {useDebounceEffect} from "./use-debounce-effect";
import IconFileUpload from '@mui/icons-material/Upload';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import "react-image-crop/dist/ReactCrop.css";
import centerAspectCrop from "~/components/avatar-input/center-aspect-crop";
import {useTranslation} from "next-i18next";
import Dialog2Backdrop from "../dialog/dialog2-backdrop";
import Dialog2 from "../dialog/dialog2";
import { nanoid } from "nanoid";

const compress = new Compress();

type AvatarInputProps = {
    src: string;
    maxPixels?: number;
    onSave: (base64ImgSrc: string) => void;
};

const AvatarInput: React.FC<AvatarInputProps> = (props) => {
    const {src = "", maxPixels = 300, onSave} = props;
    const [imgSrc, setImgSrc] = useState<string>(src);
    // use alt image source to avoid display the temporary image in the background
    const [altImgSrc, setAltImgSrc] = useState<string>("");
    const {t} = useTranslation('common');
    React.useEffect(() => {
        setImgSrc(src)
    }, [src])
    const [isProcessing, setIsProcessing] = useState(false);
    const [croppedSrc, setCroppedSrc] = useState<string>(src);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const previewCanvasRef = React.useRef<HTMLCanvasElement>(null);
    const imgRef = React.useRef<HTMLImageElement>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [scale, setScale] = useState(1);
    const rotate = 0;
    const aspect = 1 / 1;
    const [fileValue, setFileValue] = React.useState("")
    const windowIdRef = React.useRef(`avatar-selector-${nanoid(10)}`);
    const windowId = windowIdRef.current;

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
        setIsProcessing(false); // Reset processing state

    };

    function onCropImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        if (aspect) {
            const {width, height} = e.currentTarget;
            setCrop(centerAspectCrop(width, height, aspect));
        }
    }

    useDebounceEffect(
        async () => {
            if (
                completedCrop?.width &&
                completedCrop?.height &&
                imgRef.current &&
                previewCanvasRef.current
            ) {
                setIsProcessing(true); // Start processing
                // We use canvasPreview as it's much faster than imgPreview.
                canvasPreview(
                    imgRef.current,
                    previewCanvasRef.current,
                    completedCrop,
                    scale,
                    rotate,
                );

                previewCanvasRef.current.toBlob((blob) => {
                    // 1. Create a FileReader instance
                    const reader = new FileReader();
                    // 2. Add a handler for the 'onload' event
                    reader.onload = (e) => {
                        // 5. Get the result when the 'onload' event is triggered.
                        const base64data = reader.result;
                        if (base64data) {
                            setCroppedSrc(base64data as string);
                            setIsProcessing(false); // Stop processing
                        }
                    };
                    // 3. Add a handler for the 'onerror' event
                    reader.onerror = () => {
                        console.log("error");
                        setIsProcessing(false); // Stop processing
                    };
                    // 4. Call 'readAsDataURL' method
                    if (blob) {
                        reader.readAsDataURL(blob);
                    }
                });
            }
        },
        100,
        [completedCrop, scale, rotate],
    );

    const closeDialog = React.useCallback(() => {
        setDialogOpen(false);
    }, []);

    return (
        <>
        <Dialog2Backdrop isOpen={dialogOpen} onClick={closeDialog}>
            <Dialog2
                windowId={windowId}
                close={closeDialog}
                title={'Avatar Selector'}
                isOpen={dialogOpen}
                initialWidth="sm"
                draggable={false}
                resizable={false}
            >
                <Box sx={{width: "100%"}}>
                    <Stack
                        spacing={2}
                        direction="row"
                        sx={{mb: 1}}
                        alignItems="center"
                    >
                        <IconButton
                            onClick={() => setScale((prev) => prev - 0.1)}
                            disabled={scale === 0.1}
                        >
                            <ZoomOutIcon/>
                        </IconButton>
                        <Slider
                            value={scale}
                            step={0.1}
                            min={0.1}
                            max={3}
                            onChange={(e, v) => {
                                setScale(v as number);
                            }}
                        />
                        <IconButton
                            onClick={() => setScale((prev) => prev + 0.1)}
                            disabled={scale === 3}
                        >
                            <ZoomInIcon/>
                        </IconButton>
                    </Stack>
                </Box>
                <Box sx={{display: "flex", justifyContent: "center"}}>
                    <Box>
                        {!!altImgSrc && (
                            <ReactCrop
                                crop={crop}
                                onChange={(_, percentCrop) => {setCrop(percentCrop)}}
                                onComplete={(c) => setCompletedCrop(c)}
                                aspect={aspect}
                                circularCrop
                            >
                                {/* react-image-crop needs a ref'd HTML img;
                                    next/image can't supply that, and the src
                                    is a base64 data-URI anyway. */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    ref={imgRef}
                                    alt="Avatar Image"
                                    src={altImgSrc}
                                    style={{transform: `scale(${scale}) rotate(${rotate}deg)`}}
                                    onLoad={onCropImageLoad}
                                />
                            </ReactCrop>
                        )}
                        <canvas
                            ref={previewCanvasRef}
                            style={{
                                objectFit: "contain",
                                display: "none",
                                width: completedCrop?.width || 0,
                                height: completedCrop?.height || 0,
                            }}
                        />
                    </Box>
                </Box>
                <Button
                    onClick={() => {
                      setImgSrc(croppedSrc);
                      setDialogOpen(false);
                      onSave(croppedSrc);

                    }}
                    fullWidth
                    disabled={isProcessing} // Disable button while processing
                >
                    {t("Save")}
                </Button>
            </Dialog2>
        </Dialog2Backdrop>
            <IconButton
                component="label"
                sx={{
                    "&:hover": {
                        ".avatar-upload-hint": {
                            display: "unset",
                        },
                    },
                }}
            >
                <input
                    accept="image/*"
                    type="file"
                    hidden
                    value={fileValue}
                    onClick={function () {
                        setFileValue("")
                    }}
                    onChange={handleUpload}
                />

                <Avatar
                    src={imgSrc}
                    sx={{width: "80px", height: "80px"}}
                />

                <Box
                    hidden
                    className="avatar-upload-hint"
                    sx={{
                        position: "absolute",
                        top: "65%",
                        left: "55%",
                    }}
                >
                    <IconFileUpload/>
                </Box>
            </IconButton>
        </>
    );
};

export default AvatarInput;
