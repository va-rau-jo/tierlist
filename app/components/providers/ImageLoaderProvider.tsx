'use client';

import React, {
	createContext,
	useContext,
	useCallback,
	useEffect,
	ReactNode,
	useState,
	useRef,
} from 'react';

export const enum ImageLoadStatus {
	LOADED = 'loaded',
	LOADING = 'loading',
	FAILED = 'failed',
}

interface ImageLoaderContextType {
	getImageStatus: (imageUrl: string) => ImageLoadStatus;
	ensureImageLoaded: (imageUrl: string) => void;
}

const ImageLoaderContext = createContext<ImageLoaderContextType | undefined>(undefined);

interface ImageLoaderProviderProps {
	children: ReactNode;
}

export const ImageLoaderProvider: React.FC<ImageLoaderProviderProps> = ({ children }) => {
	const [imageMap, setImageMap] = useState<Map<string, ImageLoadStatus>>(new Map());
	const imageMapRef = useRef(imageMap);
	imageMapRef.current = imageMap;
	const pendingLoads = useRef(new Set<string>());

	const updateMap = (imageUrl: string, status: ImageLoadStatus) => {
		setImageMap((prevMap) => new Map(prevMap).set(imageUrl, status));
	};

	// Load via Image() so cross-origin URLs work without CORS (unlike fetch).
	const ensureImageLoaded = useCallback((imageUrl: string) => {
		if (!imageUrl || imageMapRef.current.has(imageUrl) || pendingLoads.current.has(imageUrl)) {
			return;
		}

		pendingLoads.current.add(imageUrl);
		updateMap(imageUrl, ImageLoadStatus.LOADING);

		const img = new window.Image();
		img.onload = () => {
			pendingLoads.current.delete(imageUrl);
			updateMap(imageUrl, ImageLoadStatus.LOADED);
		};
		img.onerror = () => {
			pendingLoads.current.delete(imageUrl);
			updateMap(imageUrl, ImageLoadStatus.FAILED);
		};
		img.src = imageUrl;
	}, []);

	// Read-only: never start loads or setState here (callers must use ensureImageLoaded in an effect).
	const getImageStatus = useCallback(
		(imageUrl: string): ImageLoadStatus => {
			if (!imageUrl) {
				return ImageLoadStatus.FAILED;
			}
			return imageMap.get(imageUrl) ?? ImageLoadStatus.LOADING;
		},
		[imageMap]
	);

	const contextValue = {
		getImageStatus,
		ensureImageLoaded,
	};

	return <ImageLoaderContext.Provider value={contextValue}>{children}</ImageLoaderContext.Provider>;
};

export const useImageLoader = () => {
	const context = useContext(ImageLoaderContext);
	if (context === undefined) {
		throw new Error('useImageLoader must be used within an ImageLoaderProvider');
	}
	return context;
};

/** Tracks load status for a URL; kicks off loading in an effect (safe during render). */
export const useImageStatus = (imageUrl: string): ImageLoadStatus => {
	const { getImageStatus, ensureImageLoaded } = useImageLoader();

	useEffect(() => {
		ensureImageLoaded(imageUrl);
	}, [imageUrl, ensureImageLoaded]);

	return getImageStatus(imageUrl);
};
