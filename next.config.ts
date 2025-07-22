import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: '**', // WARNING: Not recommended for production! Use specific domains.
			},
		],
	},
	reactStrictMode: false, // Disabled to prevent re-rendering.
};

export default nextConfig;
