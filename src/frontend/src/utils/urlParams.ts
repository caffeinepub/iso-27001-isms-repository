/**
 * Utility functions for parsing and managing URL parameters
 * Works with both hash-based and browser-based routing
 */

/**
 * Extracts a URL parameter from the current URL
 * Works with both query strings (?param=value) and hash-based routing (#/?param=value)
 *
 * @param paramName - The name of the parameter to extract
 * @returns The parameter value if found, null otherwise
 */
export function getUrlParameter(paramName: string): string | null {
  // Try to get from regular query string first
  const urlParams = new URLSearchParams(window.location.search);
  const regularParam = urlParams.get(paramName);

  if (regularParam !== null) {
    return regularParam;
  }

  // If not found, try to extract from hash (for hash-based routing)
  const hash = window.location.hash;
  const queryStartIndex = hash.indexOf("?");

  if (queryStartIndex !== -1) {
    const hashQuery = hash.substring(queryStartIndex + 1);
    const hashParams = new URLSearchParams(hashQuery);
    return hashParams.get(paramName);
  }

  return null;
}

/**
 * Stores a parameter in sessionStorage for persistence across navigation
 */
export function storeSessionParameter(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Failed to store session parameter ${key}:`, error);
  }
}

/**
 * Retrieves a parameter from sessionStorage
 */
export function getSessionParameter(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch (error) {
    console.warn(`Failed to retrieve session parameter ${key}:`, error);
    return null;
  }
}

/**
 * Gets a parameter from URL or sessionStorage (URL takes precedence)
 */
export function getPersistedUrlParameter(
  paramName: string,
  storageKey?: string,
): string | null {
  const key = storageKey || paramName;

  const urlValue = getUrlParameter(paramName);
  if (urlValue !== null) {
    storeSessionParameter(key, urlValue);
    return urlValue;
  }

  return getSessionParameter(key);
}

/**
 * Removes a parameter from sessionStorage
 */
export function clearSessionParameter(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to clear session parameter ${key}:`, error);
  }
}

/**
 * Removes a specific parameter from the URL hash without reloading the page
 */
function clearParamFromHash(paramName: string): void {
  if (!window.history.replaceState) {
    return;
  }

  const hash = window.location.hash;
  if (!hash || hash.length <= 1) {
    return;
  }

  const hashContent = hash.substring(1);
  const queryStartIndex = hashContent.indexOf("?");

  if (queryStartIndex === -1) {
    return;
  }

  const routePath = hashContent.substring(0, queryStartIndex);
  const queryString = hashContent.substring(queryStartIndex + 1);

  const params = new URLSearchParams(queryString);
  params.delete(paramName);

  const newQueryString = params.toString();
  let newHash = routePath;

  if (newQueryString) {
    newHash += `?${newQueryString}`;
  }

  const newUrl =
    window.location.pathname +
    window.location.search +
    (newHash ? `#${newHash}` : "");
  window.history.replaceState(null, "", newUrl);
}

/**
 * Gets a secret from the URL hash fragment only (more secure than query params)
 */
export function getSecretFromHash(paramName: string): string | null {
  const existingSecret = getSessionParameter(paramName);
  if (existingSecret !== null) {
    return existingSecret;
  }

  const hash = window.location.hash;
  if (!hash || hash.length <= 1) {
    return null;
  }

  const hashContent = hash.substring(1);
  const params = new URLSearchParams(hashContent);
  const secret = params.get(paramName);

  if (secret) {
    storeSessionParameter(paramName, secret);
    clearParamFromHash(paramName);
    return secret;
  }

  return null;
}

/**
 * Gets a secret parameter with fallback chain: hash -> sessionStorage
 */
export function getSecretParameter(paramName: string): string | null {
  return getSecretFromHash(paramName);
}

const ADMIN_TOKEN_KEY = "caffeineAdminToken";

/**
 * Reads the Caffeine admin token from the URL.
 * Supports:
 *   - Query string: ?caffeineAdminToken=TOKEN
 *   - Hash fragment: #caffeineAdminToken=TOKEN
 *   - Hash query: #/?caffeineAdminToken=TOKEN
 * Does NOT persist to sessionStorage to avoid infinite-loop side effects.
 */
export function getAdminTokenFromUrl(): string | null {
  // 1. Query string
  const qs = new URLSearchParams(window.location.search);
  const qsToken = qs.get(ADMIN_TOKEN_KEY);
  if (qsToken) return qsToken;

  // 2. Raw hash fragment: #caffeineAdminToken=TOKEN
  const hash = window.location.hash;
  if (hash) {
    const bare = new URLSearchParams(hash.replace(/^#\/?/, ""));
    const bareToken = bare.get(ADMIN_TOKEN_KEY);
    if (bareToken) return bareToken;
  }

  return null;
}

/**
 * Removes the admin token from the URL bar (both query string and hash).
 */
export function clearAdminTokenFromUrl(): void {
  if (!window.history.replaceState) return;

  // Remove from query string
  const qs = new URLSearchParams(window.location.search);
  if (qs.has(ADMIN_TOKEN_KEY)) {
    qs.delete(ADMIN_TOKEN_KEY);
    const newSearch = qs.toString() ? `?${qs.toString()}` : "";
    window.history.replaceState(
      null,
      "",
      window.location.pathname + newSearch + window.location.hash,
    );
  }

  // Remove from hash
  const hash = window.location.hash;
  if (hash?.includes(ADMIN_TOKEN_KEY)) {
    const withoutHash = hash.replace(/^#/, "");
    const parts = withoutHash.split("?");
    const route = parts[0] || "";
    const hashQs = parts[1]
      ? new URLSearchParams(parts[1])
      : new URLSearchParams();
    hashQs.delete(ADMIN_TOKEN_KEY);
    const newHashQs = hashQs.toString();
    const newHash = newHashQs
      ? `#${route}?${newHashQs}`
      : route
        ? `#${route}`
        : "";
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search + newHash,
    );
  }
}
