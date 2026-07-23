import React, {useEffect, useRef} from 'react';
// @ts-ignore TODO https://kochiyaocean.github.io/react-resizable-area/
import {ResizableArea} from 'react-resizable-area'
import Box from '@mui/material/Box';
import usePersistedState from "~/hooks/use-persisted-state";

interface Props {
    saveStateInLocalStorageKey: string
    minHeightPx?: number
    initialHeightPercent?: 25
    children: [React.ReactElement, React.ReactElement];
}

const ResizableHorizontal: React.FunctionComponent<Props> = function ResizableHorizontal(props) {
    const {
        saveStateInLocalStorageKey,
        minHeightPx = 50,
        initialHeightPercent = 50
    } = props
    const [height, setHeight] = usePersistedState<number>(initialHeightPercent, saveStateInLocalStorageKey);
    const ref = useRef()

    useEffect(() => {
        if (!ref.current) {
            return
        }
        // @ts-ignore
        ref.current.setSize({width: {percent: 100}, height: {percent: height}})
    }, [height])

    return (
        <ResizableHorizontalContext.Provider value={{ topPercent: height, bottomPercent: 100 - height }}>
            <ResizableArea
                ref={ref}
                disable={{width: true}}
                minimumWidth={{px: 50, percent: 0}}
                minimumHeight={{px: minHeightPx, percent: 0}}
                usePercentageResize={{height: true, width: true}}
                initWidth={{percent: 100}}
                initHeight={{percent: height ? height : initialHeightPercent}}
                height={height}
                // @ts-ignore
                onResizing={({_, height}) => {
                    setHeight(height.percent)
                }}
            >
                <Box
                    data-bottom-height={100 - height + "%"}
                    sx={{
                        boxSizing: "border-box",
                        borderBottom: "2px solid #e9ecee",
                        width: "100%",
                        height: "100%",
                        overflow: "hidden"
                    }}
                >
                    {React.Children.toArray(props.children)[0]}
                </Box>
            </ResizableArea>
            <Box sx={{height: 100 - height + "%", width: "100%"}}>
                {React.Children.toArray(props.children)[1]}
            </Box>
        </ResizableHorizontalContext.Provider>
    );
};

export type ResizableHorizontalContextType = {
    topPercent: number;
    bottomPercent: number;
}

const ResizableHorizontalContext = React.createContext<ResizableHorizontalContextType>({
    topPercent: 50,
    bottomPercent: 50
})

export const useResizableHorizontalContext = () => {
    return React.useContext(ResizableHorizontalContext)
}

export default ResizableHorizontal;
