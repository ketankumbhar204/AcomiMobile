# Account deletion (Play Store)

## In-app

Profile & Settings → Delete account → confirmation → `DELETE /api/v1/auth/me` → session cleared → login.

## Web (required by Google Play)

https://app.acomi.in/delete-account

Works without installing the app. Verify with mobile number and password, then delete.

Privacy policy: https://app.acomi.in/privacy  
(Also linked from Profile → Privacy Policy.)

These HTTPS URLs use the existing ACOMI web domain. They go live when the web app is deployed; they are not live until that deploy.

## Behaviour

The backend **deletes/anonymizes personal account data**. It does not only deactivate the login.

Deleted: login, profile, photos, documents, memberships, that user's notifications, pending invites they sent.

Retained (anonymized where they held this user's personal details): spaces, occupancy, meals, payments, complaints, and other property records.

Same mobile number can register again.

Network/server failure leaves the user signed in on mobile.
