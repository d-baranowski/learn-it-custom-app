import type {FC} from 'react';
import {useState} from 'react';
// import {search} from '@gen/api/v1/search-SearchService_connectquery'
import {useRouter} from "~/hooks/use-router";
import {useTheme} from "@mui/material/styles";

interface SearchDialogProps {
	onClose?: () => void;
	open?: boolean;
}

interface EntityMap {
	[key: string]: EntityMapEntry
}
interface EntityMapEntry {
	link: (id: string) => string
	color: string
}

// map tableName returned in the search result response to a link function
const entityMap: EntityMap = {
	// customer: {
	// 	// link: paths.customers.accounts.detail,
	// 	color: '#f0e68c',
	// },
	// sms_customer_connection: {
	// 	link: paths.customers.connections.detail,
	// 	color: '#add8e6',
	// },
	// nis_customer_connection: {
	// 	link: paths.customers.connections.detail,
	// 	color: '#add8e6',
	// },
	// provider: {
	// 	link: paths.providers.accounts.detail,
	// 	color: '#98fb98',
	// },
	// sms_provider_connection: {
	// 	link: paths.providers.connections.detail,
	// 	color: '#ffe4e1',
	// },
	// nis_provider_connection: {
	// 	link: paths.providers.connections.detail,
	// 	color: '#ffe4e1',
	// },
	// sms_product: {
	// 	link: paths.products.rates.detail,
	// 	color: '#c7d59f',
	// },
	// nis_product: {
	// 	link: paths.products.rates.detail,
	// 	color: '#c7d59f',
	// },
}
const getLink = (tableName: string, id: string) => {
	if (entityMap[tableName]) {
		return entityMap[tableName].link(id)
	}
	return ''
}


const getColor = (tableName: string) => {
	if (entityMap[tableName]) {
		return entityMap[tableName].color
	}
	return 'transparent'
}

export const SearchDialog: FC<SearchDialogProps> = (props) => {
	const {onClose, open = false, ...other} = props;
	const [value, setValue] = useState<string>('');
	const [activeIndex, setActiveIndex] = useState<number>(-1);
	const theme = useTheme()

	const router = useRouter()

	// const {data, isLoading, refetch} = useQuery({
	// 	...search.useQuery({
	// 		query: value
	// 	}),
	// 	enabled: !!value,
	// 	keepPreviousData: false,
	// })

	// const navigate = (tableName: string, id: string) => {
	// 	const href = getLink(tableName, id)
	// 	if (!!href) {
	// 		// window.location.href = href // this will cause a full page rerender
	// 		setValue('')
	// 		router.push(href, {shallow: false})
	// 		onClose && onClose()
	// 	}
	// }
	// const handleKeyPress = (event: KeyboardEvent) => {
	// 	if (!data) return
  //
	// 	if (event.key === 'ArrowDown') {
	// 		setActiveIndex((prevIndex) => Math.min(prevIndex + 1, data.results.length - 1));
	// 	} else if (event.key === 'ArrowUp') {
	// 		setActiveIndex((prevIndex) => Math.max(prevIndex - 1, 0));
	// 	} else if (event.key === 'Enter' && activeIndex >= 0) {
	// 		const selectedItem = data.results[activeIndex];
	// 		navigate(selectedItem.tableName, selectedItem.id);
	// 	}
	// };
	// // bind keydown listener when dialog is open
	// useEffect(() => {
	// 	window.addEventListener('keydown', handleKeyPress);
	// 	return () => window.removeEventListener('keydown', handleKeyPress);
	// });
  //
	// const onChangeHandler = debounce((value) => {
	// 	setValue(value)
	// 	setActiveIndex(-1)
	// }, 200);

  // TODO search dialog
  return <div></div>

	// return (
	// 	<Dialog
	// 		fullWidth
	// 		maxWidth="sm"
	// 		onClose={onClose}
	// 		open={open}
	// 		// fix dialog position to avoid it jumping around when loading results
	// 		PaperProps={{
	// 			style: {top: '20px', position: 'absolute'}
	// 		}}
	// 		{...other}
	// 	>
	// 		<Stack
	// 			alignItems="center"
	// 			direction="row"
	// 			justifyContent="space-between"
	// 			spacing={3}
	// 			sx={{
	// 				mt: 1,
	// 				px: 3,
	// 				py: 0,
	// 			}}
	// 		>
	// 			<Typography variant="h6">Search</Typography>
	// 			<IconButton
	// 				color="inherit"
	// 				onClick={onClose}
	// 			>
	// 				<SvgIcon>
	// 					<XIcon/>
	// 				</SvgIcon>
	// 			</IconButton>
	// 		</Stack>
	// 		<DialogContent>
	// 			<Box sx={{mb: 1}}>
	// 				<TextField
	// 					fullWidth
	// 					InputProps={{
	// 						autoComplete: 'off',
	// 						startAdornment: (
	// 							<InputAdornment position="start">
	// 								<SvgIcon>
	// 									<SearchMdIcon/>
	// 								</SvgIcon>
	// 							</InputAdornment>
	// 						),
	// 					}}
	// 					label="Search"
	// 					onChange={(event): void => onChangeHandler(event.target.value)}
	// 					placeholder="Search..."
	// 					autoFocus={true}
	// 				/>
	// 			</Box>
	// 			{!!value && isLoading && (
	// 				<Box
	// 					sx={{
	// 						display: 'flex',
	// 						justifyContent: 'center',
	// 						mt: 3,
	// 					}}
	// 				>
	// 					<CircularProgress/>
	// 				</Box>
	// 			)}
	// 			{!!value && data && data.results.map((r, index) => (
  //
	// 				<Box key={index}
	// 					 sx={{
	// 						 display: 'flex',
	// 						 alignItems: 'center',
	// 						 justifyContent: 'space-between',
	// 						 px: 1, py: 1,
	// 						 backgroundColor: index === activeIndex ? theme.palette.action.hover : 'transparent',
	// 						 borderRadius: 1,
	// 						 cursor: 'pointer',
	// 					 }}
	// 					 onMouseOver={() => {
	// 						 setActiveIndex(index)
	// 					 }}
	// 					 onClick={() => {
	// 						 navigate(r.tableName, r.id)
	// 					 }}
  //
	// 				>
	// 					<Typography variant="subtitle2">
	// 						{r.name}
	// 					</Typography>
	// 					<Chip label={r.subject} size="small" sx={{
	// 						backgroundColor: getColor(r.tableName),
	// 					}}/>
	// 				</Box>
	// 			))}
	// 		</DialogContent>
	// 	</Dialog>
	// );
};

