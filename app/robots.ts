import type { MetadataRoute } from 'next';

/**
 * Represents a single rule in the robots.txt configuration.
 *
 * @type {MetadataRoute.Robots['rules'][number]}
 */
type RobotRule = MetadataRoute.Robots['rules'][number];

/**
 * Generates the robots.txt configuration for the site.
 *
 * @returns {MetadataRoute.Robots} The robots configuration object adhering to Next.js's `MetadataRoute.Robots` type.
 */
export function robots(): MetadataRoute.Robots {
  const rules: RobotRule[] = [
    {
      userAgent: '*',
      allow: '/',
    },
    {
      userAgent: 'Googlebot',
      allow: '/',
    },
  ];

  const sitemap: MetadataRoute.Robots['sitemap'] =
    'https://cutout.onepersonai.in/sitemap.xml';

  return {
    rules,
    sitemap,
  };
}
