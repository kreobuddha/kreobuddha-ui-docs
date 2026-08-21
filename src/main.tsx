import { ViteReactSSG } from 'vite-react-ssg';

import '@/styles/layers.css';
import '@/styles/library.css';
import '@fontsource/jetbrains-mono/latin.css';
import '@fontsource/jetbrains-mono/cyrillic.css';
import '@/styles/base.css';
import '@/styles/shell.css';
import '@/styles/docs.css';
import '@/styles/components-page.css';
import '@/styles/theme.css';
import '@/styles/search.css';
import '@/styles/landing.css';
import '@/styles/mobile.css';

import { routes } from './routes';

export const createRoot = ViteReactSSG({ routes, basename: import.meta.env.BASE_URL });
