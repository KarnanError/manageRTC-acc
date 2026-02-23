# Leave Settings Page - 500 Error Fix

**Error**: `Failed to load resource: the server responded with a status of 500 (Internal Server Error)` on `/api/leave-types`

**Root Cause**: Missing `companyId` in Clerk user metadata

---

## Quick Fix (Development)

Add to `.env` file:
```bash
DEV_COMPANY_ID=698195cc0afbe3284fd5aa60
```

Then restart backend:
```bash
cd backend
npm run dev
```

---

## Available Companies

| Company | ID | Email |
|---------|-----|-------|
| manageRTC | `698195cc0afbe3284fd5aa60` | sudhakarmurugan023@gmail.com |
| amasQIS.ai | `6982468548550225cc5585a9` | hr@amasqis.ai |
| Zeninzo | `6982d04e31086341a9788aed` | harizhari5848@gmail.com |
| ABC | `698856b731b9532153c96c3e` | sudhakarnanofficial@gmail.com |

---

## Permanent Fix

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Users** → Select your user
3. Go to **User Metadata** → **Public Metadata**
4. Add the following:
   ```json
   {
     "companyId": "698195cc0afbe3284fd5aa60",
     "role": "admin"
   }
   ```
5. Click **Save**
6. **Sign out** and **Sign back in** to refresh your session

---

## How to Check Your Current User Info

Look for the **Role Debugger** component on the Leave Settings page (if visible), or check the browser console for debug logs when loading the page.

---

## Why This Happens

The Leave Settings page uses multi-tenant architecture:
- Each company has its own MongoDB database (named by `companyId`)
- Leave types are stored in the company's own database
- Without a `companyId`, the system doesn't know which database to query

---

## Files Modified

1. `backend/utils/apiResponse.js` - Fixed sendSuccess parameter order
2. `backend/controllers/rest/leaveType.controller.js` - Fixed sendSuccess call
3. `backend/config/db.js` - Added better error message for missing companyId
4. `backend/seed/listCompanies.js` - New script to list companies

---

## Verification

After setting `companyId`:

1. Sign out and sign back in
2. Go to Leave Settings page
3. You should see 9 default leave types:
   - Annual Leave (15 days)
   - Sick Leave (10 days)
   - Casual Leave (12 days)
   - Maternity Leave (90 days)
   - Paternity Leave (5 days)
   - Bereavement Leave (3 days)
   - Compensatory Off (0 days)
   - Loss of Pay (0 days, unpaid)
   - Special Leave (5 days)
