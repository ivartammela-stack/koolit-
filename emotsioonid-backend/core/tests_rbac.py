"""
RBAC and object-level permission tests.

Tests verify:
1. Teacher A cannot access Teacher B's students/emotions
2. Admin can access all students/emotions
3. 404 (not 403) is returned when object exists but is outside scope
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import School, Student, EmotionEntry

User = get_user_model()


class RBACTestCase(TestCase):
    """Base test case with setup data"""
    
    def setUp(self):
        """Create test users, students, and emotions"""
        # Create schools
        self.school1 = School.objects.create(name="Test School 1")
        self.school2 = School.objects.create(name="Test School 2")
        
        # Create users
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@test.local',
            password='admin123',
            role='admin'
        )
        
        self.teacher_a = User.objects.create_user(
            username='teacher_a',
            email='teachera@test.local',
            password='teacher123',
            role='teacher',
            class_label='9A'
        )
        
        self.teacher_b = User.objects.create_user(
            username='teacher_b',
            email='teacherb@test.local',
            password='teacher123',
            role='teacher',
            class_label='10B'
        )
        
        self.counselor = User.objects.create_user(
            username='counselor',
            email='counselor@test.local',
            password='counselor123',
            role='counselor',
            class_label='9A'
        )
        
        # Create students
        self.student_9a = Student.objects.create(
            first_name='John',
            last_name='Doe',
            class_label='9A',
            school=self.school1
        )
        
        self.student_10b = Student.objects.create(
            first_name='Jane',
            last_name='Smith',
            class_label='10B',
            school=self.school1
        )
        
        # Create emotion entries
        self.emotion_9a = EmotionEntry.objects.create(
            student=self.student_9a,
            emotion='happy',
            note='Feeling good',
            created_by=self.teacher_a
        )
        
        self.emotion_10b = EmotionEntry.objects.create(
            student=self.student_10b,
            emotion='sad',
            note='Feeling down',
            created_by=self.teacher_b
        )
        
        # API clients
        self.client_admin = APIClient()
        self.client_teacher_a = APIClient()
        self.client_teacher_b = APIClient()
        self.client_counselor = APIClient()
        
        # Login
        self.client_admin.force_authenticate(user=self.admin)
        self.client_teacher_a.force_authenticate(user=self.teacher_a)
        self.client_teacher_b.force_authenticate(user=self.teacher_b)
        self.client_counselor.force_authenticate(user=self.counselor)


class StudentAccessTests(RBACTestCase):
    """Test student access control"""
    
    def test_admin_can_access_all_students(self):
        """Admin should see all students"""
        response = self.client_admin.get('/api/students/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_teacher_a_can_access_own_class_students(self):
        """Teacher A should see only 9A students"""
        response = self.client_teacher_a.get('/api/students/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['class_label'], '9A')
    
    def test_teacher_b_can_access_own_class_students(self):
        """Teacher B should see only 10B students"""
        response = self.client_teacher_b.get('/api/students/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['class_label'], '10B')
    
    def test_teacher_a_cannot_access_teacher_b_student_detail(self):
        """Teacher A should get 404 when accessing Teacher B's student"""
        response = self.client_teacher_a.get(f'/api/students/{self.student_10b.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        # Verify it's 404, not 403 (security: avoid info leakage)
        self.assertNotEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_teacher_b_cannot_access_teacher_a_student_detail(self):
        """Teacher B should get 404 when accessing Teacher A's student"""
        response = self.client_teacher_b.get(f'/api/students/{self.student_9a.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertNotEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_counselor_can_access_shared_class_students(self):
        """Counselor should see students from their assigned class"""
        response = self.client_counselor.get('/api/students/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['class_label'], '9A')
    
    def test_admin_can_access_any_student_detail(self):
        """Admin should access any student"""
        response = self.client_admin.get(f'/api/students/{self.student_9a.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        response = self.client_admin.get(f'/api/students/{self.student_10b.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class EmotionEntryAccessTests(RBACTestCase):
    """Test emotion entry access control"""
    
    def test_admin_can_access_all_emotions(self):
        """Admin should see all emotion entries"""
        response = self.client_admin.get('/api/emotions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_teacher_a_can_access_own_class_emotions(self):
        """Teacher A should see only emotions from 9A students"""
        response = self.client_teacher_a.get('/api/emotions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.emotion_9a.id)
    
    def test_teacher_b_can_access_own_class_emotions(self):
        """Teacher B should see only emotions from 10B students"""
        response = self.client_teacher_b.get('/api/emotions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.emotion_10b.id)
    
    def test_teacher_a_cannot_access_teacher_b_emotion_detail(self):
        """Teacher A should get 404 when accessing Teacher B's emotion"""
        response = self.client_teacher_a.get(f'/api/emotions/{self.emotion_10b.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertNotEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_teacher_b_cannot_access_teacher_a_emotion_detail(self):
        """Teacher B should get 404 when accessing Teacher A's emotion"""
        response = self.client_teacher_b.get(f'/api/emotions/{self.emotion_9a.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertNotEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_teacher_a_cannot_create_emotion_for_teacher_b_student(self):
        """Teacher A should get 404 when creating emotion for Teacher B's student"""
        response = self.client_teacher_a.post('/api/emotions/', {
            'student_id': self.student_10b.id,
            'emotion': 'anxious',
            'note': 'Test note'
        })
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertNotEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_teacher_a_can_create_emotion_for_own_student(self):
        """Teacher A should create emotion for their own student"""
        response = self.client_teacher_a.post('/api/emotions/', {
            'student_id': self.student_9a.id,
            'emotion': 'excited',
            'note': 'Looking forward to weekend'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_teacher_a_cannot_access_emotions_by_teacher_b_student(self):
        """Teacher A should get 404 when accessing emotions by Teacher B's student"""
        response = self.client_teacher_a.get(f'/api/emotions/by-student/{self.student_10b.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertNotEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_teacher_a_can_access_emotions_by_own_student(self):
        """Teacher A should access emotions by their own student"""
        response = self.client_teacher_a.get(f'/api/emotions/by-student/{self.student_9a.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_admin_can_access_emotions_by_any_student(self):
        """Admin should access emotions by any student"""
        response = self.client_admin.get(f'/api/emotions/by-student/{self.student_9a.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        response = self.client_admin.get(f'/api/emotions/by-student/{self.student_10b.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_counselor_can_access_shared_class_emotions(self):
        """Counselor should see emotions from their assigned class"""
        response = self.client_counselor.get('/api/emotions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.emotion_9a.id)


class IsolationTests(RBACTestCase):
    """Test complete isolation between teachers"""
    
    def test_teacher_isolation_complete(self):
        """Verify Teacher A and Teacher B are completely isolated"""
        # Teacher A's view
        response_a = self.client_teacher_a.get('/api/students/')
        student_ids_a = [s['id'] for s in response_a.data]
        
        # Teacher B's view
        response_b = self.client_teacher_b.get('/api/students/')
        student_ids_b = [s['id'] for s in response_b.data]
        
        # No overlap
        self.assertEqual(len(set(student_ids_a) & set(student_ids_b)), 0)
        
        # Teacher A cannot access Teacher B's students
        for student_id in student_ids_b:
            response = self.client_teacher_a.get(f'/api/students/{student_id}/')
            self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Teacher B cannot access Teacher A's students
        for student_id in student_ids_a:
            response = self.client_teacher_b.get(f'/api/students/{student_id}/')
            self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

