import { MantineProvider, TypographyStylesProvider } from '@mantine/core';
import type { AppProps } from 'next/app';
import '../src/index.scss';

// Global MantineProvider wraps every page — replaces src/App.tsx
export default function App({ Component, pageProps }: AppProps) {
  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <TypographyStylesProvider>
        <Component {...pageProps} />
      </TypographyStylesProvider>
    </MantineProvider>
  );
}
