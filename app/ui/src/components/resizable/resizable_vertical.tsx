import React, {useEffect, useRef} from 'react';
// @ts-ignore TODO https://kochiyaocean.github.io/react-resizable-area/
import {ResizableArea} from 'react-resizable-area'
import Box from '@mui/material/Box';

interface Props {
    saveStateInLocalStorageKey: string
    children: [React.ReactElement, React.ReactElement];
}

const ResizableVertical: React.FunctionComponent<Props> = function ResizableVertical(props) {
    const {saveStateInLocalStorageKey} = props
    const [width, setWidth] = React.useState<number>(50);
    const ref = useRef()

    useEffect(() => {
        if (!ref.current) {
            return
        }
        // @ts-ignore
        ref.current.setSize({ width: { percent: width }, height: { percent: 100 } })
    }, [width])

    return (
        <Box sx={{ display: "flex", direction: "row", height: "100%", width: "100%" }}>
            <ResizableArea
                ref={ref}
                disable={{height: true}}
                minimumWidth={{px: 50, percent: 0}}
                minimumHeight={{px: 50, percent: 0}}
                usePercentageResize={{height: true, width: true}}
                initHeight={{percent: 100}}
                initWidth={{percent: width ? width : 50}}
                // @ts-ignore
                onResizing={({width, _}) => {
                    setWidth(width.percent)
                }}
            >
                <Box sx={{
                    boxSizing: "border-box",
                    borderRight: "2px solid #e9ecee",
                    width: "100%",
                    height: "100%"
                }}>
                    {React.Children.toArray(props.children)[0]}
                </Box>
            </ResizableArea>
            <Box sx={{width: 100 - width + "%", height: "100%"}}>
                {React.Children.toArray(props.children)[1]}
            </Box>
        </Box>
    );
};

export default ResizableVertical;
