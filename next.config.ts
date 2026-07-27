import type { NextConfig } from 'next';

// GitHub Pages serves this from https://<user>.github.io/tierlist, so all
// paths/assets need the repo name prefixed. Only applied in the CI build
// (see .github/workflows/deploy.yml) so `npm run dev`/local builds still
// serve from the root.
const BASE_PATH = process.env.GITHUB_PAGES_BUILD ? '/tierlist' : '';

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
