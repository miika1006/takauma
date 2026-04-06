export type PageProps = {
	locale: string;
};

/** Narrowed translation function type (key → string). */
export type TFunction = (key: string, options?: Record<string, unknown>) => string;
