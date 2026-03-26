import { HomeClient } from "./home-client";
import { getRequestSiteConfig } from "@/lib/site-config";

export default async function HomePage() {
  const siteConfig = await getRequestSiteConfig();

  return <HomeClient siteConfig={siteConfig} />;
}
