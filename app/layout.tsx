import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
// import { AuthProvider } from './config/AuthContext';
import { FirebaseProvider } from './firebase/FirebaseProvider';
import { PopupProvider } from './components/popup/PopupContext';
import GlobalPopup from './components/popup/GlobalPopup';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'Tier List!',
	description: 'Tier list maker yup',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en'>
			<head>
				<link
					rel='stylesheet'
					href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
				/>
			</head>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<FirebaseProvider>
					<PopupProvider>
						{children} <GlobalPopup />
					</PopupProvider>
				</FirebaseProvider>
			</body>
		</html>
	);
}
