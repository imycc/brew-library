import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const config: NextConfig = {
  output: 'export',
  basePath: '/brew-library',
  trailingSlash: true,
  images: {unoptimized: true},
  poweredByHeader: false
};
export default createNextIntlPlugin('./src/i18n/request.ts')(config);
