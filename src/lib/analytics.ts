import { UAParser } from "ua-parser-js";

export interface ClickData {
  referer: string | null;
  country: string | null;
  device: string;
  browser: string;
  os: string;
}

export function parseClickData(headers: Headers): ClickData {
  const ua = new UAParser(headers.get("user-agent") || "");
  const deviceType = ua.getDevice().type;

  let device = "desktop";
  if (deviceType === "mobile") device = "mobile";
  else if (deviceType === "tablet") device = "tablet";

  const country =
    headers.get("x-vercel-ip-country") ||
    headers.get("cf-ipcountry") ||
    headers.get("x-country") ||
    null;

  return {
    referer: headers.get("referer") || null,
    country,
    device,
    browser: ua.getBrowser().name || "Unknown",
    os: ua.getOS().name || "Unknown",
  };
}
