import type { NextConfig } from 'next';

// GitHub Pages serves this from https://<user>.github.io/tierlist, so all
// paths/assets need the repo name prefixed.
const BASE_PATH = '/tierlist';

const nextConfig: NextConfig = {
	output: 'export',
	basePath: BASE_PATH,
	assetPrefix: BASE_PATH,
	images: {
		// No image-optimization server exists on static hosts like GitHub Pages.
		unoptimized: true,
	},
	reactStrictMode: false, // Disabled to prevent re-rendering.
};

export default nextConfig;
