from rest_framework import serializers
from .models import School, Student

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['id', 'name', 'school', 'created_at']


