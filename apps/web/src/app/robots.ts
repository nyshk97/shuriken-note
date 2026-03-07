import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/p/"],
      },
    ],
    sitemap: "https://d0ne1s.com/sitemap.xml",
  };
}
