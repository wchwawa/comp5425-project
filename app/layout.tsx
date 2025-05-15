import { Geist } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';



const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Podcast & News RAG System',
  description: 'The fastest way to build apps with Next.js and Supabase'
};

const geistSans = Geist({
  display: 'swap',
  subsets: ['latin']
});

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className={`bg-[#000000] relative`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen flex flex-col z-10">
            <div className="flex-1 w-full flex flex-col">
              <div className="flex flex-col w-full z-10 flex-1">{children}</div>
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
