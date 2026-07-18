import { createGetInitialProps } from '@mantine/next';
import Document from 'next/document';

// Handles emotion CSS-in-JS SSR — ensures styles render on the server
// so there's no flash of unstyled content on first load.
const getInitialProps = createGetInitialProps();

export default class _Document extends Document {
  static getInitialProps = getInitialProps;
}
