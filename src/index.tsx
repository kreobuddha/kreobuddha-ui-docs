import './index.css';

import { ViteReactSSG } from 'vite-react-ssg';

import { routes } from '@configs/routesConfig';

export const createRoot = ViteReactSSG({ routes, basename: import.meta.env.BASE_URL });
