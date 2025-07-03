export type PropertyPair = {
	propertyA: string;
	propertyB: string;
};

export type PropertyRelationSettings = {
	propertyPairs: PropertyPair[];
};

export type FileContentModification = {
	originalContent: string;
	modifiedContent: string;
	hasChanges: boolean;
};