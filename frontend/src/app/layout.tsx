import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { NavBar } from '@/components/shared/tubelight-navbar';
import { ThemeProvider } from 'next-themes';
import './globals.css';

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

const navItems = [
  {
    name: 'Search',
    url: '/search',
    iconName: 'search',
  },
  {
    name: 'Pattern Analyzer',
    url: '/pattern-analyzer',
    iconName: 'cog',
  },
];

export const metadata: Metadata = {
  title: 'GitLLM - Advanced GitHub Code Search',
  description:
    'Enhanced GitHub code search with natural language queries using LLM',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative min-h-screen bg-slate-50 flex flex-col">
            <div className="sticky top-0 z-50 w-full">
              <NavBar items={navItems} />
            </div>
            <main className="flex-grow">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
