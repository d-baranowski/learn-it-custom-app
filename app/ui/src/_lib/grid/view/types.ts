export type GridViewStoreEntry = {
	viewName: string,
	isActive: boolean,
	autoSave: boolean,
	isFavourite?: boolean,
	gridState: string, // encoded grid store
}

export type GridName = Exclude<string, "views">
