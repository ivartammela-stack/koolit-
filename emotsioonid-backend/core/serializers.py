# core/serializers.py
from rest_framework import serializers
from .models import School, Student

class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = ['id', 'name', 'created_at']

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['id', 'name', 'school', 'created_at']
