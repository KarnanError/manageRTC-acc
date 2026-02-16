# Duplicate Pages Cleanup Report

**Generated:** 2026-02-15T13:41:58.394Z
**Database:** AmasQIS

## 📊 Summary

| Metric | Count |
|--------|-------|
| **Total Pages Before** | 136 |
| **Duplicate Pairs Found** | 2 |
| **Pages to Remove** | 2 |
| **Pages to Keep** | 2 |
| **Total Pages After** | 134 |

## 🔄 Duplicate Page Pairs

These pages exist with BOTH flat and prefixed names. The flat versions will be REMOVED and the prefixed versions will be KEPT.

### 1. Users

**❌ TO REMOVE (Flat Name):**
- **Name:** `users`
- **Display:** Users
- **Route:** `users`
- **Category:** none
- **Menu Group:** No

**✅ TO KEEP (Prefixed Name):**
- **Name:** `admin.users`
- **Display:** Users
- **Route:** `users`
- **Category:** none
- **Menu Group:** No

**Reason for Removal:**
Flat naming convention is inconsistent. Prefixed naming (admin.*) provides better organization and follows the established pattern.

### 2. Roles & Permissions

**❌ TO REMOVE (Flat Name):**
- **Name:** `roles-permissions`
- **Display:** Roles & Permissions
- **Route:** `roles-permissions`
- **Category:** none
- **Menu Group:** No

**✅ TO KEEP (Prefixed Name):**
- **Name:** `admin.roles-permissions`
- **Display:** Roles & Permissions
- **Route:** `roles-permissions`
- **Category:** none
- **Menu Group:** No

**Reason for Removal:**
Flat naming convention is inconsistent. Prefixed naming (admin.*) provides better organization and follows the established pattern.

## 🧹 Cleanup Results

| Metric | Count |
|--------|-------|
| **Pages Removed** | 2 |
| **Permissions Removed** | 2 |
| **Role Permissions Removed** | 0 |

### Final State:
- **Total Pages:** 134
- **Total Permissions:** 134
- **Total Role Permissions:** 84

## 🗑️ Pages Removed

- `users` (Users)
- `roles-permissions` (Roles & Permissions)

## ✅ Pages Kept (Prefixed Versions)

- `admin.users` (Users)
- `admin.roles-permissions` (Roles & Permissions)
