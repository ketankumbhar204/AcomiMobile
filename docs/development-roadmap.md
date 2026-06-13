# CountIn Development Roadmap

## Phase 1 - Foundation

✅ Authentication

* Send OTP
* Verify OTP
* JWT Authentication
* Session Management
* Logout
* Current User

---

## Phase 2 - Spaces Module

### Space Management

* Create Space
* Edit Space
* View Space Details
* Delete Space (Optional)

### My Spaces

* List Spaces
* Search Spaces
* Space Switcher
* Default Space Selection

### Membership Management

* Invite Members
* Accept Invitation
* Cancel Invitation
* View Members
* Role Management

### Space Types

* PG
* Mess
* Hostel
* Co-Living
* Rental

### Space Settings

* General Information
* Notifications
* Language Settings
* Space Archive / Deactivate

---

## Phase 3 - Members Module

### Member Management

* Add Member
* Edit Member
* View Member Profile

### Member Profile

* Member Status
* Emergency Contact
* App User Linking

### Document Management

* Aadhaar
* PAN
* Passport
* Other Documents
* Verification Status

### Deposit Management

* Deposit Amount
* Deposit Paid
* Deposit Refunded
* Deposit Balance

### Member Notes

* Internal Notes
* Remarks

### Member History

* Status History
* Deposit History
* Profile Change History

---

## Phase 4 - Accommodation Management (Current Focus)

### Goal

Manage physical accommodation structure and occupancy across:

* PG
* Hostel
* Co-Living
* Rental

Mess spaces do not use Accommodation Management.

### Structure UI

* ✅ Inline name edit on list rows (building, floor, unit, room, bed)
* Full edit screens kept for other fields

### Occupancy Management

* Allocate member to bed / room / unit (by space type)
* Transfer member
* Vacate member
* Member accommodation section + occupancy history

### Property Structure

#### Buildings

* Create Building
* Edit Building
* View Building
* Deactivate Building

#### Floors

* Create Floor
* Edit Floor
* View Floor
* Deactivate Floor

#### Units

* Create Unit
* Edit Unit
* View Unit
* Deactivate Unit

#### Rooms

* Create Room
* Edit Room
* View Room
* Deactivate Room

#### Beds

* Create Bed
* Edit Bed
* View Bed
* Deactivate Bed

### Space Type Rules

#### PG / Hostel

Building → Floor → Room → Bed · Member → Bed

#### Co-Living

Building → Unit → Room → Bed · Member → Bed or Room

#### Rental

Building → Unit (optional Room) · Member → Unit

#### Mess

Accommodation not applicable (Members, Meals, Availability, Billing)

### Occupancy Management ✅

* Allocate Member (Bed / Room / Unit by space type)
* Transfer Member
* Vacate Member
* Occupancy history

### Availability Management

* Available / Occupied beds & rooms
* Vacant units

### Accommodation Status

Available · Occupied · Reserved · Maintenance · Blocked

### Capacity, Dashboard & Search

* Room & bed capacity
* Structure & occupancy metrics
* Filter by building, floor, unit, room, status

### Permissions

* OWNER — full access
* MANAGER — operate, no structure delete
* TENANT — own allocation read-only
* CUSTOMER — no access
* STAFF — limited read

### Out of Scope (Phase 4)

Rent, billing, payments, deposits, meals, availability polls, complaints, maintenance tickets

---

## Phase 5 - Meal Management

### Menu Master

* Breakfast Menu
* Lunch Menu
* Dinner Menu

### Menu Planning

* Daily Menu Planning
* Weekly Menu Planning

### Meal Tracking

* Meal Consumption
* Special Meal Requests

### Menu History

* Daily History
* Weekly History

---

## Phase 6 - Availability Management (USP)

### Meal Availability Polls

* Breakfast Poll
* Lunch Poll
* Dinner Poll

### Response Collection

* App Responses
* WhatsApp Responses

### Headcount Engine

* Expected Breakfast Count
* Expected Lunch Count
* Expected Dinner Count

### Forecasting

* Daily Forecast
* Weekly Forecast

### Reports

* Food Wastage Report
* Attendance Report
* Consumption Trends

---

## Phase 7 - Payment Management

* Rent Collection
* Subscription Collection
* Deposit Management
* Payment History
* Payment Reminders

---

## Phase 8 - Complaints & Notices

* Complaint Management
* Notice Board
* Notifications

---

## Phase 9 - Reports & Dashboard

* Occupancy Reports
* Payment Reports
* Meal Reports
* Business Dashboard

---

## Future Enhancements

* Multi-language Support
* WhatsApp Automation
* AI Demand Prediction
* QR Meal Check-In
* UPI Integration
* Advanced Analytics
