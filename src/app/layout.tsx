import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Header } from '@/components/Header';
import { ThemeProvider, themeScript } from '@/lib/theme';

export const metadata: Metadata = {
  title: 'MediaScan Developer Platform',
  description:
    'API documentation for the MediaScan IP monitoring platform. Monitor infringements across social media, video platforms, app stores, and the open web.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Anti-flash: apply theme class before first paint */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <Header />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
