import React from 'react';
import ResizableHorizontal from "./resizable_horizontal";
import ResizableVertical from "./resizable_vertical";
import Box from '@mui/material/Box';

interface Props {
    saveStateInLocalStorageKey: string
    children: [React.ReactElement, React.ReactElement, React.ReactElement, React.ReactElement];
}

const ResizableQuadrupal: React.FunctionComponent<Props> = function ResizableQuadrupal(props) {
    const {saveStateInLocalStorageKey} = props;
    const childArray = React.Children.toArray(props.children)

    return (
        <Box sx={{height: "100%", width: "100%"}}>
            <ResizableHorizontal saveStateInLocalStorageKey={saveStateInLocalStorageKey+"1"}>
                <Box sx={{height: "100%", width: "100%"}}>
                    <ResizableVertical saveStateInLocalStorageKey={saveStateInLocalStorageKey+"2"}>
                        <Box sx={{height: "100%", width: "100%"}}>
                            {childArray[0]}
                        </Box>
                        <Box sx={{height: "100%", width: "100%"}}>
                            {childArray[1]}
                        </Box>
                    </ResizableVertical>
                </Box>
                <Box sx={{height: "100%", width: "100%"}}>
                    <ResizableVertical saveStateInLocalStorageKey={saveStateInLocalStorageKey+"3"}>
                        <Box sx={{height: "100%", width: "100%"}}>
                            {childArray[2]}
                        </Box>
                        <Box sx={{height: "100%", width: "100%"}}>
                            {childArray[3]}
                        </Box>
                    </ResizableVertical>
                </Box>
            </ResizableHorizontal>
        </Box>
    );
};

export default ResizableQuadrupal;
