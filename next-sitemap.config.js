/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "https://mercatolist.com",
  generateRobotsTxt: true,
  sitemapSize: 5000,
  changefreq: "daily",
  priority: 0.7,
  exclude: [
    "/my-listings/*",
    "/inquiries",
    "/saved",
    "/collections/*",
    "/saved-searches",
    "/profile",
    "/public-profile",
    "/clients",
    "/admin/*",
    "/api/*",
    "/login",
    "/register/*",
    "/verify-email",
    "/complete-profile",
  ],
  additionalPaths: async (config) => {
    const paths = [];

    // Borough pages
    const boroughs = [
      "manhattan",
      "brooklyn",
      "queens",
      "bronx",
      "staten-island",
    ];
    for (const borough of boroughs) {
      paths.push({
        loc: `/boroughs/${borough}`,
        changefreq: "weekly",
        priority: 0.8,
      });
    }

    // Category pages (generated dynamically in production)
    // Neighborhood pages (generated dynamically in production)
    // Borough + Category combo pages (generated dynamically in production)

    return paths;
  },
  robotsTxtOptions: {
    additionalSitemaps: [
      // Server-side sitemaps for dynamic listing pages
      // Will be configured when Meilisearch/DB is connected
    ],
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/my-listings/",
          "/inquiries",
          "/saved",
          "/collections/",
          "/saved-searches",
          "/profile",
          "/admin/",
          "/login",
          "/register/",
        ],
      },
    ],
  },
};
