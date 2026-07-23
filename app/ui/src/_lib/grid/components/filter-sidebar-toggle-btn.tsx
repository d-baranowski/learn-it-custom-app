import React from "react";
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import useFilters from '~/_lib/grid/hooks/use-filters';
import {useGridSettings} from '~/_lib/grid/context/grid-settings-context';

interface Props {

}

const FilterSidebarToggleBtn: React.FC<Props> = (props) => {
	const {gridName} = useGridSettings();
	const {hasFilters} = useFilters(gridName);

	if (hasFilters) {
		return <FilterAltIcon />
	}

	return <FilterAltOutlinedIcon />
}

export default FilterSidebarToggleBtn
