"""
RBAC and object-level permissions for the emotsioonid app.

Rules:
- Admin: Full access to all objects
- Teacher: Can only access students/emotions from their own class(es)
- Counselor: Can access students/emotions from their assigned classes (future: multiple classes)
- Student: Can only access their own data (future implementation)

Security: Returns 404 (not 403) when object is outside scope to avoid information leakage.
"""
from rest_framework import permissions
from rest_framework.exceptions import NotFound
from .models import Student, EmotionEntry


class IsAdminOrReadOwnClass(permissions.BasePermission):
    """
    Permission class for Student and EmotionEntry access.
    
    - Admin: Full access
    - Teacher/Counselor: Only objects from their class_label
    - Returns 404 if object exists but is outside scope (security: avoid info leakage)
    """
    
    def has_permission(self, request, view):
        """Check if user has permission to access the view"""
        if not request.user or not request.user.is_authenticated:
            return False
        return True
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user can access specific object.
        Returns 404 if object exists but is outside user's scope.
        """
        user = request.user
        
        # Admin has full access
        if user.role == 'admin':
            return True
        
        # For Student objects
        if isinstance(obj, Student):
            # Teacher/Counselor can only access students from their class
            if user.role in ['teacher', 'counselor']:
                if user.class_label and obj.class_label == user.class_label:
                    return True
                # Object exists but outside scope - return 404
                raise NotFound("Student not found")
            # Student can only access themselves (future: link User to Student)
            if user.role == 'student':
                raise NotFound("Student not found")
            return False
        
        # For EmotionEntry objects
        if isinstance(obj, EmotionEntry):
            # Teacher/Counselor can only access emotions from their class students
            if user.role in ['teacher', 'counselor']:
                if user.class_label and obj.student.class_label == user.class_label:
                    return True
                # Object exists but outside scope - return 404
                raise NotFound("Emotion entry not found")
            # Student can only access their own emotions (future)
            if user.role == 'student':
                raise NotFound("Emotion entry not found")
            return False
        
        return False


class IsAdminOrFilterByClass:
    """
    Mixin for ViewSets to filter queryset by user's class.
    Used in get_queryset() to pre-filter objects.
    """
    
    def get_queryset(self):
        """
        Filter queryset based on user role.
        - Admin: All objects
        - Teacher/Counselor: Only objects from their class_label
        - Student: Only their own objects (future)
        """
        user = self.request.user
        queryset = super().get_queryset()
        
        if user.role == 'admin':
            return queryset
        
        if user.role in ['teacher', 'counselor']:
            if user.class_label:
                # Filter by class_label for Student
                if hasattr(queryset.model, 'class_label'):
                    return queryset.filter(class_label=user.class_label)
                # Filter by student's class_label for EmotionEntry
                if hasattr(queryset.model, 'student'):
                    return queryset.filter(student__class_label=user.class_label)
            return queryset.none()
        
        if user.role == 'student':
            # Future: filter by user.student relationship
            return queryset.none()
        
        return queryset.none()

