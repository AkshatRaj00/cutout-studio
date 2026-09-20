Add a return statement that bundles the `rules` and `sitemap` into the expected `RobotsConfig` object, e.g.:

```ts
  const sitemap: RobotsConfig['sitemap'] =
    'https://cutout.onepersonai.in/site/sitemap.xml';

  return { rules, sitemap };
}
```