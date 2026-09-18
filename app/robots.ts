import type { MetadataRoute } from 'next';

/**
 * Represents a single rule in the robots.txt configuration.
 *
 * @type {MetadataRoute.Robots['rules'][number]}
 */
export type RobotRule = MetadataRoute.Robots['rules'][number];

/**
 * Internal type describing the full robots configuration.
 * Extends Next.js `MetadataRoute.Robots` to keep the public contract unchanged.
 */
type RobotsConfig = MetadataRoute.Robots;

/**
 * Generates the robots.txt configuration for the site.
 *
 * @returns {RobotsConfig} The robots configuration object adhering to Next.js's
 * `MetadataRoute.Robots` type.
 */
export function robots(): RobotsConfig {
  // Define the rules with explicit `RobotRule` typing. No `as const` is needed
  // because `RobotRule[]` already captures the required shape.
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

  // The sitemap URL conforms to the `sitemap` property of `MetadataRoute.Robots`.
  const sitemap: RobotsConfig['sitemap'] =
    'https://cutout.onepersonai.in/sitemap.xml';

  return {
    rules,
    sitemap,
  };
}
