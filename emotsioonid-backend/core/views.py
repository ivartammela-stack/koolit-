from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import NotFound
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import get_object_or_404
from .models import School, Student, EmotionEntry, User
from .serializers import SchoolSerializer, StudentSerializer, EmotionEntrySerializer, UserSerializer, UserCreateSerializer
from .permissions import IsAdminOrReadOwnClass, IsAdminOrFilterByClass

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Login endpoint - returns user data on success"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        serializer = UserSerializer(user)
        return Response({
            'access_token': 'session',  # Frontend expects this
            'token_type': 'bearer',
            'user': serializer.data
        })
    return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Logout endpoint"""
    logout(request)
    return Response({'detail': 'Logged out successfully'})

class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.all().order_by("name")
    serializer_class = SchoolSerializer
    permission_classes = [IsAuthenticated]

class StudentViewSet(IsAdminOrFilterByClass, viewsets.ModelViewSet):
    """
    ViewSet for Student model with RBAC and object-level permissions.
    
    - Admin: Full access to all students
    - Teacher/Counselor: Only students from their class_label
    - Returns 404 if student exists but is outside user's scope
    """
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOwnClass]
    queryset = Student.objects.all()
    
    def get_object(self):
        """
        Override to enforce object-level permission.
        Returns 404 if object exists but is outside scope.
        """
        obj = super().get_object()
        # Permission check will raise NotFound if outside scope
        self.check_object_permissions(self.request, obj)
        return obj

class EmotionEntryViewSet(IsAdminOrFilterByClass, viewsets.ModelViewSet):
    """
    ViewSet for EmotionEntry model with RBAC and object-level permissions.
    
    - Admin: Full access to all emotion entries
    - Teacher/Counselor: Only emotions from students in their class_label
    - Returns 404 if emotion entry exists but is outside user's scope
    """
    serializer_class = EmotionEntrySerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOwnClass]
    queryset = EmotionEntry.objects.all()
    
    def get_object(self):
        """
        Override to enforce object-level permission.
        Returns 404 if object exists but is outside scope.
        """
        obj = super().get_object()
        # Permission check will raise NotFound if outside scope
        self.check_object_permissions(self.request, obj)
        return obj
    
    def perform_create(self, serializer):
        """
        Create emotion entry with permission check.
        Ensures student is in user's class before creating.
        """
        user = self.request.user
        student_id = serializer.validated_data.get('student_id')
        
        if user.role == 'admin':
            # Admin can create for any student
            pass
        elif user.role in ['teacher', 'counselor']:
            # Teacher/Counselor can only create for students in their class
            if not user.class_label:
                raise NotFound("Cannot create emotion entry: no class assigned")
            try:
                student = Student.objects.get(id=student_id, class_label=user.class_label)
            except Student.DoesNotExist:
                # Student exists but outside scope - return 404
                raise NotFound("Student not found")
        else:
            raise NotFound("Cannot create emotion entry")
        
        serializer.save(created_by=user)
    
    @action(detail=False, methods=['get'], url_path='by-student/(?P<student_id>[^/.]+)')
    def by_student(self, request, student_id=None):
        """
        Get all emotion entries for a specific student.
        Returns 404 if student exists but is outside user's scope.
        """
        user = request.user
        
        # Check if student exists and is in user's scope
        if user.role == 'admin':
            student = get_object_or_404(Student, id=student_id)
        elif user.role in ['teacher', 'counselor']:
            if not user.class_label:
                raise NotFound("Student not found")
            try:
                student = Student.objects.get(id=student_id, class_label=user.class_label)
            except Student.DoesNotExist:
                # Student exists but outside scope - return 404
                raise NotFound("Student not found")
        else:
            raise NotFound("Student not found")
        
        # Get emotions for this student (already filtered by get_queryset)
        queryset = self.get_queryset().filter(student_id=student_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for managing users (teachers and admins). Only accessible by admins."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Only admins can see users"""
        if self.request.user.role == 'admin':
            return User.objects.all().order_by('username')
        return User.objects.none()
    
    def get_serializer_class(self):
        """Use UserCreateSerializer for create/update to handle password"""
        if self.action in ['create', 'update', 'partial_update']:
            return UserCreateSerializer
        return UserSerializer
    
    def perform_create(self, serializer):
        """Admin can create new users"""
        if self.request.user.role != 'admin':
            raise PermissionError("Only admins can create users")
        serializer.save()
    
    def perform_update(self, serializer):
        """Admin can update users"""
        if self.request.user.role != 'admin':
            raise PermissionError("Only admins can update users")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Admin can delete users, but not themselves"""
        if self.request.user.role != 'admin':
            raise PermissionError("Only admins can delete users")
        if instance.id == self.request.user.id:
            raise PermissionError("You cannot delete yourself")
        instance.delete()
