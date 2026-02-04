# Employee Duplicate Check - Issue Fixed

## Problem
When trying to add an employee, you received the error:
```
Route POST /api/employees/check-duplicates not found
```

## Root Cause
The REST API endpoint for checking duplicate employees (`/api/employees/check-duplicates`) was missing. The functionality only existed as a Socket.IO event handler but not as a REST endpoint.

## Solution Implemented

### 1. Added REST Controller Function
**File:** `backend/controllers/rest/employee.controller.js`

Added `checkDuplicates` function that:
- Validates email is provided
- Checks for duplicate email in the database (excluding soft-deleted records)
- Checks for duplicate phone if provided (excluding soft-deleted records)
- Returns appropriate error response if duplicates found
- Returns success if no duplicates

### 2. Added REST API Route
**File:** `backend/routes/api/employees.js`

Added route:
```javascript
POST /api/employees/check-duplicates
```

Route features:
- Requires authentication
- Requires company context
- Restricted to admin, hr, and superadmin roles
- Placed BEFORE the main employee creation route to ensure proper routing

### 3. Database Cleanup Script
**File:** `backend/scripts/cleanup-duplicate-employee.js`

Created a utility script to help clean up any lingering employee records.

## How to Use

### Clean Up Duplicate Records
Run the cleanup script to remove any existing records for an email:

```bash
cd backend
node scripts/cleanup-duplicate-employee.js sudhakar@amasqis.ai
```

This will:
- Search all companies for employees with that email
- Show details of all records found
- Permanently delete ALL records (including soft-deleted ones)
- Confirm the email is now available

### Test the Fix
1. Restart the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Try adding an employee with the email again
   - The system will now properly check for duplicates
   - If the email was cleaned up, it should work
   - If duplicates exist, you'll get a clear error message

## API Endpoint Details

### Request
```http
POST /api/employees/check-duplicates
Content-Type: application/json
Authorization: Bearer <token>

{
  "email": "user@example.com",
  "phone": "+1234567890"  // optional
}
```

### Success Response (No Duplicates)
```json
{
  "success": true,
  "data": {
    "done": true
  },
  "message": "No duplicates found"
}
```

### Error Response (Duplicate Email)
```json
{
  "done": false,
  "error": "Email already registered",
  "field": "email"
}
```

### Error Response (Duplicate Phone)
```json
{
  "done": false,
  "error": "Phone number already registered",
  "field": "phone"
}
```

## Next Steps

1. **Clean up the database** using the script above
2. **Restart the backend** server
3. **Test adding** an employee with the previously problematic email
4. The issue should be resolved!

## Files Modified

1. `backend/controllers/rest/employee.controller.js` - Added checkDuplicates controller
2. `backend/routes/api/employees.js` - Added check-duplicates route
3. `backend/scripts/cleanup-duplicate-employee.js` - New cleanup utility script
