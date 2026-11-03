
import type { Tenant } from "../types/tenant";

export const normalizeTenantDomain = (
  value: string
): string => {
  let hostname = value.trim().toLowerCase();

  hostname = hostname.replace(/^https?:\/\//, "");
  hostname = hostname.split("/")[0];
  hostname = hostname.split("?")[0];
  hostname = hostname.split("#")[0];
  hostname = hostname.split(":")[0];

  if (!hostname) {
    throw new Error("Please enter your organization URL.");
  }

  return hostname;
};

export const resolveTenant = async (
  hostname: string
): Promise<Tenant> => {
  const domain = normalizeTenantDomain(hostname);

  // Extract tenant slug from organization domain
  if (!domain.endsWith(".livetag.in")) {
    throw new Error(
      "Please enter a valid organization URL, such as app.livetag.in."
    );
  }

  const slug = domain.replace(".livetag.in", "");

  if (!slug || slug === "www" || slug.includes(".")) {
    throw new Error("Invalid organization subdomain.");
  }

  // No API request here.
  // The backend receives the tenant slug through x-tenant-id.
  return {
    id: slug,
    slug,
    domain,
    name: slug,
  };
};
