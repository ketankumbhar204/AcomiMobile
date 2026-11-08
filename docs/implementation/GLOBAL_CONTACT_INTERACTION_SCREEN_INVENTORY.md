# Global Contact Interaction — Screen Inventory

**Date:** 2026-11-08
**App:** AcomiMobile (React Native Android)

Discovery searched for `ContactNumberLine`, `formatMemberContactNumber`, `memberMobile`, `mobileNumber`, `tel:`, `wa.me`, `telHref`, `whatsappHref`, `Phone` icons, and contact-related detail rows.

| Screen / Feature | UI component | Contact role | Current behaviour | Source field | Proposed integration | Status |
|---|---|---|---|---|---|---|
| Payments list | `UniversalPaymentCard` → `ContactNumberLine` | Member | Plain text | `payment.memberMobile` | Interactive `ContactNumberLine` | Integrated |
| Payment details / sheet | `PaymentRecordDetails` → `ContactNumberLine` | Member | Plain text | `payment.memberMobile` | Interactive `ContactNumberLine` | Integrated |
| Create payment | `CreatePaymentScreen` → `ContactNumberLine` | Member | Plain text | `member.mobileNumber` | Interactive `ContactNumberLine` | Integrated |
| Members list | `MemberListCard` → `ContactNumberLine` | Member | Plain text | formatted mobile | Interactive `ContactNumberLine` + name | Integrated |
| Members pending invites | `MembersScreen` → `ContactNumberLine` | Invitee | Plain text | `invitation.mobileNumber` | Interactive `ContactNumberLine` | Integrated |
| Occupancy member picker | `OccupancyMemberPickerModal` → `ContactNumberLine` | Member | Plain text | `member.mobileNumber` | Interactive `ContactNumberLine` | Integrated |
| Member details header | `MemberCompactHeader` | Member | Plain text + icon | `member.mobileNumber` | `ContactNumberLine` / open sheet | Integrated |
| Member profile tab | `MemberProfileTab` → `MemberDetailRow` | Member / emergency | Plain text | `mobileNumber`, `emergencyContactMobile` | Tappable contact rows | Integrated |
| Occupied bed stay | `OccupiedBedStaySection` | Occupant | Plain text | loaded member mobile | `ContactNumberLine` | Integrated |
| Meal response members | `MealResponseMembersScreen` card | Member | Plain text in card | `row.mobileNumber` | Nested tappable number | Integrated |
| Service contacts list | `ServiceContactsScreen` | Vendor / service | Direct call / WhatsApp buttons | `primaryPhone`, `whatsappPhone` | Shared sheet on number tap; keep quick buttons or route via sheet | Integrated |
| Service contact details | `ServiceContactDetailsScreen` | Vendor / service | Display + Call/WhatsApp buttons | primary / alternate / WhatsApp | Number tap → sheet; buttons call shared actions | Integrated |
| Owner contact (discovery) | `OwnerContactCard` | Owner | Direct dial / WhatsApp | owner mobiles | Number → shared sheet | Integrated |
| Received enquiries | `ReceivedEnquiriesScreen` | Requester | Direct tel/sms links | `requesterMobile` | Shared sheet | Integrated |
| My enquiries | `MyEnquiriesScreen` | Listing contact | Direct tel/sms | enquiry contact mobile | Shared sheet | Integrated |
| Admin enquiry detail | `AdminEnquiryDetailScreen` | Requester | Plain `AdminDetailField` | `requesterMobile` | Tappable via contact open | Integrated |
| Admin property / mess detail | `AdminPropertyDetailScreen`, `AdminMessDetailScreen` | Owner | Plain field | `mobileNumber` | Tappable open | Integrated |
| Space details | `SpaceDetailsScreen` | Space contact | Plain field | `space.contactNumber` | Tappable open | Integrated |
| Occupancy wizard banners / review | Various wizard steps | Member | Inline plain text | `member.mobileNumber` | Compact tappable where standalone | Integrated (standalone displays) |
| Selected inventory summary | `SelectedInventorySummaryCard` | Member | Plain text | `memberMobile` | Tappable | Integrated |
| Auth / register / OTP / change mobile | Form inputs | Self | Editable input | draft mobile | **Not applicable** (entry, not contact) | N/A |
| Add / Edit / Invite member | Form inputs | New member | Editable input | form state | **Not applicable** | N/A |
| Create / Edit space contact field | Form inputs | Space | Editable input | form state | **Not applicable** | N/A |
| Admin create test user / add property | Form inputs | Registration | Editable input | form state | **Not applicable** | N/A |
| Payment reminder WhatsApp | Reminder composer | Member | Sends templated reminder | `memberMobile` | **Not applicable** (workflow send, not display tap) | N/A |
| Inquiry credits WhatsApp CTA | Support CTA | Support | Opens wa.me with message | config number | **Not applicable** (marketing/support CTA) | N/A |
| User profile (own number) | `UserProfileFields` | Self | Display own number | `user.mobileNumber` | Optional; typically not “contact other” | Excluded (self profile) |
| Masked / unavailable numbers | Various | — | Em dash / “not available” | — | Do not open sheet | Preserved |

**Totals (discovery):** 30+ display sites reviewed · ~22 applicable · form/auth/self/workflow CTAs excluded.
