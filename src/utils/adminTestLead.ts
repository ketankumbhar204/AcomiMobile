/** Authoritative test flag from the registration or active-space API. */
export function isMarkedTestLead(testLead: boolean | null | undefined): boolean {
  return testLead === true;
}
