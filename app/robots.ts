export function robots(): RobotsConfig {
  const rules: RobotRule[] = [
    { userAgent: '*', allow: '/' },
    { userAgent: 'Googlebot', allow: '/' },
  ];

  const sitemap: RobotsConfig['sitemap'] =
    'https://cutout.one/sitemap.xml';

  return { rules, sitemap };
}