# RBAC and Object-Level Permissions

## Overview

This document describes the Role-Based Access Control (RBAC) and object-level permissions implemented in the Emotsioonid backend API.

## Roles

The system defines four roles:

1. **admin** - Full access to all objects (students, emotions, users, schools)
2. **teacher** - Access only to students and emotions from their assigned class(es)
3. **counselor** - Access to students and emotions from their assigned class(es) (currently same as teacher, future: multiple classes)
4. **student** - Access only to their own data (future implementation)

## Permission Rules

### Admin
- ✅ Full read/write access to all students
- ✅ Full read/write access to all emotion entries
- ✅ Full access to user management
- ✅ Full access to school management

### Teacher / Counselor
- ✅ Read access to students in their `class_label`
- ✅ Read access to emotion entries for students in their `class_label`
- ✅ Create emotion entries for students in their `class_label`
- ❌ Cannot access students outside their `class_label`
- ❌ Cannot access emotion entries outside their `class_label`
- ❌ Cannot create emotion entries for students outside their `class_label`

### Student
- ❌ Currently not implemented (future: access only to own data)

## Endpoint Matrix

| Endpoint | Admin | Teacher | Counselor | Student |
|----------|-------|---------|-----------|---------|
| `GET /api/students/` | All | Own class | Own class | None |
| `GET /api/students/{id}/` | Any | Own class (404 if other) | Own class (404 if other) | None |
| `GET /api/emotions/` | All | Own class | Own class | None |
| `GET /api/emotions/{id}/` | Any | Own class (404 if other) | Own class (404 if other) | None |
| `POST /api/emotions/` | Any student | Own class (404 if other) | Own class (404 if other) | None |
| `GET /api/emotions/by-student/{id}/` | Any student | Own class (404 if other) | Own class (404 if other) | None |

## Security: 404 vs 403

**Critical Security Rule:** When an object exists but is outside the user's scope, the API returns **404 (Not Found)** instead of **403 (Forbidden)**.

### Why 404?
- **Information Leakage Prevention:** A 403 response reveals that the object exists, which is sensitive information
- **404 Response:** Indicates the object doesn't exist (from the user's perspective), preventing information disclosure
- **Example:** If Teacher A tries to access Student ID 123 from Teacher B's class, they get 404, not 403

### Implementation
The `IsAdminOrReadOwnClass` permission class raises `NotFound` (404) when:
- Object exists in database
- Object is outside user's scope (different class_label)
- User is not admin

## Attack Scenarios

### Scenario 1: Teacher Enumeration Attack
**Attack:** Teacher A tries to enumerate all students by guessing IDs.

**Protection:**
- Teacher A can only see students from their own class via list endpoint
- Accessing a student outside their class returns 404 (not 403)
- No information leakage about existence of other students

**Test:** `test_teacher_a_cannot_access_teacher_b_student_detail`

### Scenario 2: Cross-Class Emotion Access
**Attack:** Teacher A tries to read emotion entries from Teacher B's students.

**Protection:**
- Emotion entries are filtered by student's class_label
- Accessing emotion from another class returns 404
- Cannot create emotions for students outside their class

**Test:** `test_teacher_a_cannot_access_teacher_b_emotion_detail`, `test_teacher_a_cannot_create_emotion_for_teacher_b_student`

### Scenario 3: Admin Privilege Escalation
**Attack:** Teacher tries to access admin-only endpoints or modify their role.

**Protection:**
- Admin-only endpoints check `user.role == 'admin'`
- User management endpoints require admin role
- Role modification requires admin privileges

**Test:** Admin access tests verify full access, teacher tests verify restrictions

## Implementation Details

### Permission Classes

#### `IsAdminOrReadOwnClass`
- Base permission class for Student and EmotionEntry access
- Checks object-level permissions
- Raises `NotFound` (404) if object is outside scope

#### `IsAdminOrFilterByClass`
- Mixin for ViewSets to pre-filter querysets
- Filters by `class_label` for teachers/counselors
- Returns all objects for admin

### ViewSet Overrides

#### `StudentViewSet`
- Inherits from `IsAdminOrFilterByClass`
- Uses `IsAdminOrReadOwnClass` permission
- Overrides `get_object()` to enforce object-level permission

#### `EmotionEntryViewSet`
- Inherits from `IsAdminOrFilterByClass`
- Uses `IsAdminOrReadOwnClass` permission
- Overrides `get_object()` and `perform_create()` to enforce permissions
- `by_student()` action checks student access before returning emotions

## Testing

All RBAC functionality is tested in `core/tests_rbac.py`:

- **StudentAccessTests:** Student list/detail access control
- **EmotionEntryAccessTests:** Emotion entry access control
- **IsolationTests:** Complete isolation between teachers

Run tests:
```bash
python manage.py test core.tests_rbac
```

## Future Enhancements

1. **Student Role:** Implement student access to their own data
2. **Multiple Classes:** Allow counselors to be assigned to multiple classes
3. **School-Level Permissions:** Add school-level access control
4. **Audit Logging:** Log all access attempts for security auditing

