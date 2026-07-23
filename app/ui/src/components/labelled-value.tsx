import React from 'react';
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";

interface LabelledValueProps {
    label: string;
    value?: string;
    loading?: boolean;
}

const LabelledValue: React.FC<LabelledValueProps> = (props) => {
    const {
        label,
        value = "Empty",
        loading
    } = props;
    return (
        <Stack
            alignItems="center"
            direction="row"
            spacing={1}
        >
            <Typography color={"text.secondary"} fontWeight="500">{label}:</Typography>
            <Typography color={value ? "" : "text.secondary"}>{loading ?
                <Skeleton animation={"wave"} width={"300px"}/> : value}</Typography>
        </Stack>
    )
}

export default LabelledValue