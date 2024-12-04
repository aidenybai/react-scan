import './globals.css';
import localFont from 'next/font/local';
import Header from '../components/header';
import Footer from '../components/footer';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata = {
  title: 'React Scan',
  description: 'scan ur app',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="title" content="React Scan" />
        <meta
          name="description"
          content="React Scan automatically detects and highlights components that cause performance issues in your React app. Drop it in anywhere – script tag, npm, you name it!"
        />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://react-scan.million.dev" />
        <meta property="og:title" content="React Scan" />
        <meta
          property="og:description"
          content="React Scan automatically detects and highlights components that cause performance issues in your React app. Drop it in anywhere – script tag, npm, you name it!"
        />
        <meta
          property="og:image"
          content="https://react-scan.million.dev/banner.png"
        />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://react-scan.million.dev" />
        <meta property="twitter:title" content="React Scan" />
        <meta
          property="twitter:description"
          content="React Scan automatically detects and highlights components that cause performance issues in your React app. Drop it in anywhere – script tag, npm, you name it!"
        />
        <meta
          property="twitter:image"
          content="https://react-scan.million.dev/banner.png"
        />

        <link rel="icon" href="/logo.svg" type="image/svg+xml" />

        <meta
          name="keywords"
          content="react, performance, debugging, developer tools, web development, javascript"
        />
        <meta name="author" content="Aiden Bai" />
        <meta name="theme-color" content="#8b5cf6" />
        <link rel="canonical" href="https://react-scan.million.dev" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <div className="px-8 sm:px-20 pt-20 pb-4 max-w-[700px] mx-auto ">
          <Header />
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}