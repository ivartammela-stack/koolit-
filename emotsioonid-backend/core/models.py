from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    """Custom user model with role and class_label"""
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('teacher', 'Teacher'),
        ('counselor', 'Counselor'),
        ('student', 'Student'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='teacher')
    class_label = models.CharField(max_length=50, blank=True, null=True, help_text="Klassi nimetus, mida õpetaja õpetab või kuhu õpilane kuulub")
    
    class Meta:
        db_table = 'auth_user'

class School(models.Model):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Student(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    class_label = models.CharField(max_length=50, help_text="Klassi nimetus")
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="students", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __str__(self):
        return self.full_name

class EmotionEntry(models.Model):
    """Emotsioonide kirjed õpilaste kohta"""
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="emotions")
    emotion = models.CharField(max_length=100, help_text="Emotsiooni kirjeldus (nt. rõõmus, kurb)")
    note = models.TextField(blank=True, null=True, help_text="Lisainformatsioon või kontekst")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="emotion_entries")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Emotion Entries"

    def __str__(self):
        return f"{self.student.full_name} - {self.emotion} ({self.created_at.strftime('%Y-%m-%d')})"
