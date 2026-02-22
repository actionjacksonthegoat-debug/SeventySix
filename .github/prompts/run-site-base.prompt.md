---
agent: agent
description: Automated full-site walkthrough using Chrome DevTools MCP with screenshots and report
---

# Run Site Base — Full Application Walkthrough

Automate a complete walkthrough of the SeventySix application using Chrome DevTools MCP.
Navigate every page, exercise core features, capture screenshots, and generate a pass/fail report.

**Target**: Dev environment (`https://localhost:4200`)
**Output**: `.dev-tools-output/walkthrough-report.md` + `.dev-tools-output/screenshots/*.png`

---

## Prerequisites

Before starting, ask the user:

> Is your dev environment running? (Started with `npm start` — app available at `https://localhost:4200`)

If the user says no, tell them to run `npm start` and wait for it to be ready before continuing. Do NOT start the environment yourself.

---

## Cleanup (ALWAYS runs first)

Delete the entire `.dev-tools-output/` folder if it exists and create fresh directories. Run in terminal:

```powershell
if (Test-Path ".dev-tools-output") { Remove-Item ".dev-tools-output" -Recurse -Force }
New-Item -ItemType Directory -Path ".dev-tools-output/screenshots" -Force
```

Confirm cleanup completed before proceeding.

---

## Credentials

Get the seeded admin credentials by running:

```powershell
cd SeventySix.Server/SeventySix.Api; dotnet user-secrets list
```

Look for:
- `AdminSeeder:Email` — the admin email (default: `admin@seventysix.local`)
- `AdminSeeder:InitialPassword` — the admin password (default: `SeventySixAdmin76!`)

Store these values for use in the login step. If the user secrets command fails, ask the user for the admin email and password.

---

## MFA Code Retrieval

When a login triggers MFA email verification, retrieve the code using PostgreSQL MCP:

```sql
SELECT "TemplateData"->>'code' AS "MfaCode"
FROM "ElectronicNotifications"."EmailQueue"
WHERE "EmailType" = 'MfaVerification'
ORDER BY "CreateDate" DESC
LIMIT 1;
```

The `MfaCode` column in the result is the 6-digit code. Enter it in the MFA verification form.

If PostgreSQL MCP is not available, ask the user to provide the MFA code manually.

---

## Report Tracking

Maintain a running record of each step's result throughout the walkthrough:
- Step number and description
- Status: PASSED or FAILED
- Error details if FAILED
- Screenshot filename(s)

### Error Detection (after EVERY action)

After every click, form submission, or navigation:

1. Check for error snackbars:
   ```javascript
   document.querySelector('.mat-mdc-snack-bar-container')?.textContent || null
   ```
2. Check for alert banners:
   ```javascript
   document.querySelector('[role="alert"]')?.textContent || null
   ```
3. Use `list_console_messages` to check for new `error`-level messages (ignore warnings)

If an error is found AND the current step is NOT "Click Create Error Log button" (Step 9), add it to the error tracking list.

### Continue-on-Failure (CRITICAL)

**On failure of ANY step**: Log the error, take a screenshot of the current state, record the step as FAILED with error details, and CONTINUE to the next step. NEVER abort the walkthrough due to a single step failure.

---

## Walkthrough Steps

### Step 1: Landing Page

1. Navigate to `https://localhost:4200/`
2. Wait for the page to load fully
3. Take screenshot → `step-01-landing-hero.png`
4. Scroll to the bottom of the page
5. Take screenshot → `step-01-landing-footer.png`
6. Check for console errors
7. Record result

### Step 2: Sandbox Page

1. Navigate to `https://localhost:4200/sandbox`
2. Wait for the page to load
3. Take screenshot → `step-02-sandbox.png`
4. Check for console errors
5. Record result

### Step 3: Login Page (View Only)

1. Navigate to `https://localhost:4200/auth/login`
2. Wait for the login form to be visible
3. Take screenshot → `step-03-login.png`
4. Verify fields exist: email input, password input, sign-in button
5. Record result

### Step 4: Register Page (View Only)

1. Navigate to `https://localhost:4200/auth/register`
2. Wait for the registration form to be visible
3. Take screenshot → `step-04-register.png`
4. Verify email input field exists
5. Record result

### Step 5: Forgot Password Page (View Only)

1. Navigate to `https://localhost:4200/auth/forgot-password`
2. Wait for the forgot password form to be visible
3. Take screenshot → `step-05-forgot-password.png`
4. Verify email input field exists
5. Record result

### Step 6: Admin Login

1. Navigate to `https://localhost:4200/auth/login`
2. Fill the email field with the admin email from user secrets
3. Fill the password field with the admin password from user secrets
4. If an Altcha captcha widget is visible, click the checkbox/widget and wait for it to complete
5. Click the Sign In button
6. Wait for navigation — expect one of:
   - MFA verify page (`/auth/mfa/verify`) → proceed to Step 7
   - Admin dashboard (`/admin/dashboard`) → skip to Step 8
7. Take screenshot → `step-06-login-submit.png`
8. Check for error banners
9. Record result

### Step 7: MFA Verification (conditional)

**Only execute if redirected to `/auth/mfa/verify` after login.**

1. Take screenshot → `step-07-mfa-form.png`
2. Use PostgreSQL MCP to retrieve the MFA code:
   ```sql
   SELECT "TemplateData"->>'code' AS "MfaCode"
   FROM "ElectronicNotifications"."EmailQueue"
   WHERE "EmailType" = 'MfaVerification'
   ORDER BY "CreateDate" DESC
   LIMIT 1;
   ```
3. Fill the code input field with the 6-digit code
4. Click the verify/submit button
5. Wait for navigation away from the MFA page
6. Check for error banners
7. Record result

If PostgreSQL MCP is unavailable, **ask the user to provide the MFA code**.

### Step 8: Admin Dashboard — All Tabs

1. Navigate to `https://localhost:4200/admin/dashboard`
2. Wait for page content to load
3. Take screenshot → `step-09-dashboard-overview.png`
4. Click the "API Metrics" tab → wait for content → take screenshot → `step-09-dashboard-api.png`
5. Click the "Cache Metrics" tab → wait for content → take screenshot → `step-09-dashboard-cache.png`
6. Click the "External Systems" tab → wait for content → take screenshot → `step-09-dashboard-external.png`
7. Check for console errors
8. Record result

### Step 9: Admin Dashboard — Create Log Entries

1. Click the "External Systems" tab on the dashboard
2. Scroll down to the "Log Validations" card (dev-only section)
3. Find and click the "Info" button
4. Wait briefly for the action to complete
5. Take screenshot → `step-09-info-log-created.png`
6. Find and click the "Error" button
7. **IMPORTANT**: An error snackbar IS EXPECTED after clicking the "Error" button — do NOT flag this as a walkthrough error
8. Take screenshot → `step-09-error-log-created.png`
9. Record result (PASSED if both buttons were clickable and responded)

### Step 10: User Management — List View

1. Navigate to `https://localhost:4200/admin/users`
2. Wait for the data table to load (rows visible)
3. Take screenshot → `step-10-user-list.png`
4. If a search input is visible, type "admin" and wait for filtering
5. Take screenshot → `step-10-user-search.png`
6. Clear the search and wait for full list to reload
7. Check for console errors
8. Record result

### Step 11: User Management — Create User

1. Navigate to `https://localhost:4200/admin/users/create`
2. Wait for the stepper to be visible
3. **Step 1 — Basic Information**:
   - Fill username: `walkthrough_test_user`
   - Fill email: `walkthrough_test@test.local`
   - Take screenshot → `step-11-create-user-step1.png`
   - Click Next
4. **Step 2 — Account Details**:
   - Fill "Display Name": `Walkthrough Test User`
   - Leave "Active User" checkbox checked (default)
   - Take screenshot → `step-11-create-user-step2.png`
   - Click Next
5. **Step 3 — Roles (Optional)**:
   - Available roles are "Developer" and "Admin" — select one if desired, or skip
   - Take screenshot → `step-11-create-user-step3.png`
   - Click Next
6. **Step 4 — Review & Submit**:
   - Take screenshot → `step-11-create-user-step4.png`
   - Click the "Create User" button
   - Wait for redirect to user list page
7. Check for error banners
8. Record result

### Step 12: User Management — Edit User Detail

1. Navigate to `https://localhost:4200/admin/users`
2. Wait for user table to load
3. Click on the first user row to open the detail page (`/admin/users/:id`)
4. Wait for the user detail page to load
5. Take screenshot → `step-12-user-detail.png`
6. Locate the full name field and append " - Walkthrough Edit"
7. Click Save Changes button
8. Wait for save confirmation (snackbar or page update)
9. Take screenshot → `step-12-user-detail-saved.png`
10. Look for the Audit Info expansion panel — click to expand if collapsed
11. Take screenshot → `step-12-user-audit.png`
12. Check for error banners
13. Record result

### Step 13: Log Management

1. Navigate to `https://localhost:4200/admin/logs`
2. Wait for log data table to load
3. Take screenshot → `step-13-log-list.png`
4. Click on the first log row to open the detail dialog
5. Wait for dialog to appear
6. Take screenshot → `step-13-log-detail.png`
7. Close the dialog (click close button or press Escape)
8. If sort headers are visible, click one to change sort order
9. Take screenshot → `step-13-log-sorted.png`
10. Check for error banners
11. Record result

### Step 14: Permission Request Management

1. Navigate to `https://localhost:4200/admin/permission-requests`
2. Wait for the data table to load (or empty state if no requests)
3. Take screenshot → `step-14-permission-requests.png`
4. If there are pending requests:
   a. Click Approve on one request → wait for refresh → take screenshot → `step-14-permission-approved.png`
   b. Click Reject on another request → wait for refresh → take screenshot → `step-14-permission-rejected.png`
5. If no pending requests exist, note "No pending permission requests" and move on
6. Check for error banners
7. Record result

### Step 15: Profile Page

1. Navigate to `https://localhost:4200/account`
2. Wait for the profile card to load
3. Take screenshot → `step-15-profile.png`
4. Locate the full name input field and modify it (append " - Verified")
5. Click Save button
6. Wait for save confirmation
7. Take screenshot → `step-15-profile-saved.png`
8. Check for "Linked Accounts" section (GitHub connect/disconnect)
9. Take screenshot → `step-15-profile-linked.png`
10. Check for error banners
11. Record result

### Step 16: Request Permissions Page

1. Navigate to `https://localhost:4200/account/permissions`
2. Wait for the page to load
3. Take screenshot → `step-16-request-permissions.png`
4. If role checkboxes are visible (roles available to request):
   a. Check one role checkbox
   b. Fill the optional message textarea with "Walkthrough permission test"
   c. Take screenshot → `step-16-request-permissions-filled.png`
   d. Click Submit button
   e. Wait for confirmation
   f. Take screenshot → `step-16-request-permissions-submitted.png`
5. If "No additional roles available" message is shown, note it and move on
6. Check for error banners
7. Record result

### Step 17: Developer Style Guide

1. Navigate to `https://localhost:4200/developer/style-guide`
2. Wait for the style guide page to load
3. Take screenshot → `step-17-style-guide.png`
4. Click through each tab and take a screenshot of each:
   - Colors → `step-17-style-colors.png`
   - Typography → `step-17-style-typography.png`
   - Buttons → `step-17-style-buttons.png`
   - Forms → `step-17-style-forms.png`
   - Tables → `step-17-style-tables.png`
   - Feedback → `step-17-style-feedback.png`
   - Icons → `step-17-style-icons.png`
   - Loading States → `step-17-style-loading.png`
5. Check for console errors
6. Record result

### Step 18: Password Change Test (walkthrough_test_user)

**This step tests the password change flow using the `walkthrough_test_user` created in Step 11 — NOT the seeded admin.**

1. Navigate to `https://localhost:4200/auth/login`
2. Fill the email field with `walkthrough_test@test.local`
3. Fill the password field with the temporary password shown in Step 11's confirmation (the system generates one) — if no temporary password was shown, use `SeventySixAdmin76!` (the default initial password for admin-created users)
4. If an Altcha captcha widget is visible, click the checkbox/widget and wait for it to complete
5. Click the Sign In button
6. Wait for navigation — expect redirect to `/auth/change-password` (admin-created users require password change)
7. Take screenshot → `step-18-change-password-form.png`
8. Fill current password (same as login password)
9. Fill new password: `WalkthroughNewPass76!`
10. Fill confirm password: `WalkthroughNewPass76!`
11. Click submit
12. Wait for navigation — the app will redirect to `/auth/login` because all tokens are invalidated after a password change
13. Take screenshot → `step-18-change-password-success.png`
14. Check for error banners
15. Record result

> **NOTE**: This step may fail if `walkthrough_test_user` doesn't require a password change or if the temporary password is unknown. Record the result either way and continue.

### Step 19: Error Pages

1. Navigate to `https://localhost:4200/error/401`
2. Wait for the unauthorized page to render
3. Take screenshot → `step-19-error-401.png`
4. Navigate to `https://localhost:4200/error/403`
5. Wait for the forbidden page to render
6. Take screenshot → `step-19-error-403.png`
7. Navigate to `https://localhost:4200/this-page-does-not-exist`
8. Wait for the 404 page to render (wildcard catch-all route)
9. Take screenshot → `step-19-error-404.png`
10. Check for console errors
11. Record result

### Step 20: Create Second Test User

1. Navigate to `https://localhost:4200/admin/users/create`
2. **Step 1 — Basic Information**:
   - Fill username: `walkthrough_user_2`
   - Fill email: `walkthrough_user_2@test.local`
   - Take screenshot → `step-20-create-user-step1.png`
   - Click Next
3. **Step 2 — Account Details**:
   - Fill "Display Name": `Walkthrough User Two`
   - Click Next
4. **Step 3 — Roles**: Skip (click Next)
5. **Step 4 — Review & Submit**:
   - Take screenshot → `step-20-review.png`
   - Click the "Create User" button
   - Wait for redirect to user list page
6. Take screenshot → `step-20-user-created.png`
7. Check for error banners
8. Record result

### Step 21: Logout

1. Find and click the user menu button in the top-right header area
2. Click "Logout" from the dropdown menu
3. Wait for navigation to the login or home page
4. Take screenshot → `step-21-logout.png`
5. Check for console errors
6. Record result

---

## User Interaction Handling

If any step requires user interaction that Chrome DevTools MCP cannot automate:
1. Ask the user to perform the action manually
2. Wait for the user to confirm completion
3. Continue with the next automated step

Known cases:
- MFA code retrieval if PostgreSQL MCP is unavailable — ask user for the code
- Altcha captcha widget may need manual solving if it doesn't auto-complete
- OAuth flows (GitHub login) — skip these, note as "skipped (requires OAuth redirect)"

---

## Report Generation

After ALL walkthrough steps have completed (whether PASSED or FAILED), create `.dev-tools-output/walkthrough-report.md`:

```markdown
# SeventySix Site Walkthrough Report

**Generated**: {current date and time}
**Target**: https://localhost:4200
**Admin User**: {email used}

---

## Error Banners Detected

{List any unexpected error banners found during the walkthrough.
Exclude errors from "Create Error Log" button clicks (Step 9).
If none: "No unexpected error banners detected."}

## Console Errors Detected

{List any console errors found during the walkthrough.
If none: "No console errors detected."}

---

## Step Results

| # | Step | Status | Notes |
|---|------|--------|-------|
| 1 | Landing page | PASSED/FAILED | |
| 2 | Sandbox page | PASSED/FAILED | |
| ... | ... | ... | ... |

---

## Summary

- **Total Steps**: {N}
- **Passed**: {N}
- **Failed**: {N}
- **Screenshots**: `.dev-tools-output/screenshots/`

---

## Screenshots Index

| Screenshot | Step |
|------------|------|
| step-01-landing-hero.png | Step 1 |
| ... | ... |
```

After writing the report, tell the user:

> **Walkthrough complete!**
> - Report: `.dev-tools-output/walkthrough-report.md`
> - Screenshots: `.dev-tools-output/screenshots/`
> - {X}/{Y} steps passed
