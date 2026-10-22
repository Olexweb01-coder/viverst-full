/* Paystack charges, shown at checkout. The same calculation as
   public.paystack_charge in supabase/migrations/021_paystack_charges.sql:
   the server works it out again for every order and that is what is charged;
   this only shows the customer the same figure before they pay.
   Paystack takes 1.5% + NGN 100 of a local payment (the NGN 100 waived under
   NGN 2,500, the whole charge capped at NGN 2,000). The charge is the smallest
   whole-naira amount that leaves the full price after Paystack's cut.
   Amounts are in kobo. */

export const paystackFee = (gross) =>
  Math.min(Math.ceil((gross * 15) / 1000) + (gross >= 250000 ? 10000 : 0), 200000)

export function paystackCharge(net) {
  if (!(net > 0)) return 0
  const works = (c) => c - paystackFee(c) >= net
  let best = null
  for (const guess of [Math.ceil((net * 1000) / 985), Math.ceil(((net + 10000) * 1000) / 985), net + 200000]) {
    let c = Math.ceil(guess / 100) * 100                       // whole naira
    while (!works(c)) c += 100
    if (best === null || c < best) best = c
  }
  while (best - 100 >= net && works(best - 100)) best -= 100  // the smallest that still works
  return best - net
}
