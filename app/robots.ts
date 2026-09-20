Add the missing return statement to finish the `robots` function:

```ts
export function robots(): RobotsConfig {
  const rules: RobotRule[] = [
    { userAgent: '*', allow: '/' },
    { userAgent: 'Googlebot', allow: '/' },
  ];

  const sitemap: RobotsConfig['sitemap'] =
    'https://cutout.one/sitemap.xml';

  return { rules, sitemap };
}
```

This returns the required `rules` and `sitemap` fields, satisfying `MetadataRoute.Robots`.