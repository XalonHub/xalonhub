import ClientProvider from './ClientProvider';
import { UIProvider } from '../services/uiContext';
import Header from '../components/Header';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        <UIProvider>
          <ClientProvider>
            <Header />
            {children}
          </ClientProvider>
        </UIProvider>
      </body>
    </html>
  );
}
