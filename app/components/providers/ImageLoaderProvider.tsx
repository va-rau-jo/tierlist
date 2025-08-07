'use client';

import React, { createContext, useContext, useCallback, ReactNode, useState } from 'react';

export const enum ImageLoadStatus {
	LOADED = 'loaded',
	LOADING = 'loading',
	FAILED = 'failed',
}

interface ImageLoaderContextType {
	getImageStatus: (imageUrl: string) => ImageLoadStatus;
}

const ImageLoaderContext = createContext<ImageLoaderContextType | undefined>(undefined);

interface ImageLoaderProviderProps {
	children: ReactNode;
}

export const ImageLoaderProvider: React.FC<ImageLoaderProviderProps> = ({ children }) => {
	// Maps imageUrl to the status of the image
	const [imageMap, setImageMap] = useState<Map<string, ImageLoadStatus>>(new Map());

	const updateMap = (imageUrl: string, status: ImageLoadStatus) => {
		setImageMap((prevMap) => new Map(prevMap).set(imageUrl, status));
	};

	// Function to fetch an image and add it to the cache
	const fetchImage = useCallback(
		async (imageUrl: string) => {
			try {
				if (imageMap.has(imageUrl)) {
					return;
				}
				const response = await fetch(imageUrl);
				if (response.ok) {
					const contentType = response.headers.get('Content-Type');
					if (contentType && contentType.startsWith('image/')) {
						updateMap(imageUrl, ImageLoadStatus.LOADED);
						return;
					}
				}
				updateMap(imageUrl, ImageLoadStatus.FAILED);
			} catch {
				updateMap(imageUrl, ImageLoadStatus.FAILED);
			}
		},
		[imageMap]
	);

	// Function to get an image and add it to the cache
	const getImageStatus = useCallback(
		(imageUrl: string): ImageLoadStatus => {
			if (!imageUrl) {
				return ImageLoadStatus.FAILED;
			}

			if (imageMap.has(imageUrl)) {
				return imageMap.get(imageUrl) || ImageLoadStatus.FAILED;
			}
			fetchImage(imageUrl);
			return ImageLoadStatus.LOADING;
		},
		[fetchImage, imageMap]
	);

	const contextValue = {
		getImageStatus,
		fetchImage,
	};

	return <ImageLoaderContext.Provider value={contextValue}>{children}</ImageLoaderContext.Provider>;
};

// Custom hook to consume the context easily
export const useImageLoader = () => {
	const context = useContext(ImageLoaderContext);
	if (context === undefined) {
		throw new Error('useImageLoader must be used within an ImageLoaderProvider');
	}
	return context;
};
