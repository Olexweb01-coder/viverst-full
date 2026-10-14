/* Leaves the app for an external page (the Paystack checkout). The headless
   test replaces window.__viverstRedirect to observe the destination. */
export function redirectTo(url) {
  if (typeof window.__viverstRedirect === 'function') { window.__viverstRedirect(url); return }
  window.location.assign(url)
}
