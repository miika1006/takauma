import React, { useEffect, useLayoutEffect, useRef } from "react";
import { TFunction } from "../common/types";
import "photoswipe/dist/photoswipe.css";
import styles from "../styles/slider.module.css";
import { Gallery, Item } from "react-photoswipe-gallery";
import { isMobile } from "react-device-detect";
import usePrevious from "../common/hooks/use-previous";

interface SliderProps {
	t: TFunction;
	items: SliderItem[];
	loading: boolean;
}
interface ImageGalleryProps {
	t: TFunction;
	items: SliderItem[];
}
export interface SliderItem {
	id?: string | null | undefined;
	thumbnailLink?: string | null | undefined;
	webContentLink?: string | null | undefined;
	imageMediaMetadata?: {
		width?: number;
		height?: number;
	};
}
export interface ImageItemProps {
	item: SliderItem;
}

interface Colcade {
	new (element: string, options: any): Object;
	option: (options: any) => void;
	reload: () => void;
	append: (items: any[]) => void;
	prepend: (items: any[]) => void;
}

/**
 * Build a direct-loadable high-resolution URL for a publicly-shared Google
 * Drive file.  webContentLink is a download-redirect and cannot be used as
 * an <img> src (CORS / redirect chain blocks image load in PhotoSwipe).
 */
function buildFullSizeUrl(item: SliderItem): string {
	if (item.id) {
		return `https://drive.google.com/thumbnail?id=${item.id}&sz=w4000`;
	}
	// Fallback: enlarge the thumbnail URL by bumping the size suffix.
	return item.thumbnailLink?.replace(/=[swh][\d]+(-[a-z]+)*$/, "=s4000") ?? "";
}

export default function Slider({ t, items, loading }: SliderProps) {
	const colcade = useRef<Colcade | null>(null);
	const previousLoading = usePrevious<boolean>(loading);

	useLayoutEffect(() => {
		if (
			!isMobile &&
			previousLoading === true &&
			loading === false &&
			colcade.current &&
			items.length > 0
		) {
			console.log("Reloading colcade");
			colcade.current.reload();
		}
	}, [items, loading, previousLoading]);

	useEffect(() => {
		const loadColcade = async () => {
			const Colcade: any = await import("colcade").then(
				(module) => module.default
			);

			colcade.current = new Colcade(`.${styles.grid}`, {
				columns: `.${styles.gridcol}`,
				items: `.${styles.griditem}`,
			});
		};
		if (!isMobile && colcade.current === null && items.length > 0)
			loadColcade();
	}, [items]);

	return isMobile ? (
		<ImageGallery t={t} items={items} />
	) : (
		<div className={styles.grid}>
			<div className={styles.gridcol + " " + styles.gridcolone}></div>
			<div className={styles.gridcol + " " + styles.gridcoltwo}></div>
			<div className={styles.gridcol + " " + styles.gridcolthree}></div>
			<div className={styles.gridcol + " " + styles.gridcolfour}></div>
			<ImageGallery t={t} items={items} />
		</div>
	);
}
export function ImageItem({ item }: ImageItemProps) {
	const fullSizeUrl = buildFullSizeUrl(item);
	const width = item.imageMediaMetadata?.width || undefined;
	const height = item.imageMediaMetadata?.height || undefined;

	return (
		<Item
			original={fullSizeUrl}
			thumbnail={item.thumbnailLink ?? ""}
			width={width}
			height={height}
		>
			{({ ref, open }) => (
				<img
					className={styles.griditem}
					alt={`photo_${item.id}`}
					ref={ref as React.Ref<HTMLImageElement>}
					onClick={open}
					src={item.thumbnailLink ?? ""}
				/>
			)}
		</Item>
	);
}

export function ImageGallery({ t, items }: ImageGalleryProps) {
	return (
		<Gallery
			options={{
				closeTitle: t("close"),
				zoomTitle: t("zoom"),
				arrowNextTitle: t("next"),
				arrowPrevTitle: t("previous"),
			}}
			withDownloadButton={true}
		>
			{items.map((item) => (
				<ImageItem item={item} key={`photo_${item.id}`} />
			))}
		</Gallery>
	);
}
