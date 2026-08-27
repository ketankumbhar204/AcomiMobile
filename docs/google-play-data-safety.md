# Google Play Data safety — internal draft

Do **not** paste this into Play Console until the account-deletion backend and web pages are deployed.

Based on current ACOMI mobile, web, and backend source. Items not found in the repositories are marked not collected.

| Data type | Collected? | Shared with other users of a space? | Purpose | Required? | Retention | Deletion |
|-----------|------------|--------------------------------------|---------|-----------|-----------|----------|
| Phone number | Yes (account) | Space members can see member mobile numbers used in operations | Account, password auth | Required to sign in | While account is active | Removed/anonymized on account deletion |
| Name | Yes | Yes, on profile/member records | Profile, operations | Required after profile setup | While account is active | Anonymized (`Deleted user` / `Deleted member`) |
| Email | Optional | Not as a directory; stored on the user profile | Profile | Optional | While account is active | Cleared |
| Physical address | Optional on profile; space address is property data | Space address visible to space members | Profile / property | Optional for profile | Profile cleared on deletion; space address retained | Profile address deleted; space address retained |
| User IDs | Yes (UUID) | Internal FKs | Auth, operations | Required | Anonymized user row kept for FKs | Row kept, personal fields stripped |
| Photos | Optional profile photo and document/payment proof images the user uploads | Property operators can review documents and payment proofs | Profile, KYC review, payment proof | Optional | Until deletion or operator workflows | Profile/document files unlinked; payment proofs on space payments retained as business records |
| Authentication | Password (hashed on the server). OTP endpoints still exist but are not used in the current production UI | No | Sign-in | Required | Password hash stored; plaintext never stored | Login disabled; leftover JWT rejected |

| Payment info | Operational ledgers and uploaded payment proofs. **Not** a card gateway. No PAN/card numbers in code | Space operators | Property collections | As used in the space | Business records retained | Personal account unlinked; payment rows kept |
| App activity | In-app operational use (occupancy, meals, complaints) stored as business records | Space members by role | Product features | Feature-dependent | Business records retained | Personal identity stripped from linked member/login |
| Diagnostics / analytics | **Not found** (no Sentry/Firebase/Crashlytics/analytics SDK in mobile or web) | No | — | — | — | — |
| Device identifiers | **Not found** as a product analytics store | No | — | — | — | — |
| Precise location | **Not collected** | — | — | — | — | — |
| Contacts | **Not collected** | — | — | — | — | — |
| SMS content | **Not collected** (the current production app does not request or read SMS) | — | — | — | — | — |

Account deletion web URL for Play Console (after web deploy): `https://app.acomi.in/delete-account`

In-app path: Profile → Delete account
