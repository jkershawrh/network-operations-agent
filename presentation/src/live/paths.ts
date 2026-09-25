/**
 * Resolve application endpoints relative to the Story mount.
 *
 * The Story runs at `/story/` on a direct Route and beneath an order-scoped
 * `/proxy/tool/story/story/` mount in Launchpad. Moving up one path segment
 * reaches the application API in both environments without escaping the
 * participant entitlement gateway.
 */
export const storyEndpoint = (path: string): string =>
  new URL(`../${path.replace(/^\/+/, '')}`, window.location.href).pathname

