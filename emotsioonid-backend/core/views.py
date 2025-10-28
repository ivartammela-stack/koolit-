from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate, login, logout
from .models import School, Student, EmotionEntry, User
from .serializers import SchoolSerializer, StudentSerializer, EmotionEntrySerializer, UserSerializer, UserCreateSerializer

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

class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter students by teacher's class if teacher, show all if admin"""
        user = self.request.user
        if user.role == 'admin':
            return Student.objects.all()
        elif user.class_label:
            return Student.objects.filter(class_label=user.class_label)
        return Student.objects.none()

class EmotionEntryViewSet(viewsets.ModelViewSet):
    serializer_class = EmotionEntrySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter emotions by teacher's students"""
        user = self.request.user
        if user.role == 'admin':
            return EmotionEntry.objects.all()
        elif user.class_label:
            return EmotionEntry.objects.filter(student__class_label=user.class_label)
        return EmotionEntry.objects.none()
    
    @action(detail=False, methods=['get'], url_path='by-student/(?P<student_id>[^/.]+)')
    def by_student(self, request, student_id=None):
        """Get all emotion entries for a specific student"""
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
