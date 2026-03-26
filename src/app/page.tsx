import { HomeClient } from "./home-client";
import { getRequestSiteConfig } from "@/lib/site-config";
import { getTurnstileSiteKey, isTurnstileEnabled } from "@/lib/turnstile";

export default async function HomePage() {
  const siteConfig = await getRequestSiteConfig();
  const turnstileSiteKey = isTurnstileEnabled()
    ? getTurnstileSiteKey()
    : null;

  return (
    <HomeClient
      siteConfig={siteConfig}
      turnstileSiteKey={turnstileSiteKey}
    />
  );
}
