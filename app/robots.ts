import { MetadataRoute } from 'next';

/**
 * Generates the robots.txt configuration for the site.
 *
 * @returns {MetadataRoute.Robots} The robots configuration object adhering to Next.js's `MetadataRoute.Robots` type.
 */
export function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
      },
    ],
    sitemap: 'https://cutout.onepersonai.in/sitemap.xml',
  };
}
