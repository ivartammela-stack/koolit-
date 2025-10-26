# core/serializers.py
from rest_framework import serializers
from .models import School, Student, EmotionEntry, User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'class_label']
        read_only_fields = ['id']

class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = ['id', 'name', 'created_at']

class StudentSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = Student
        fields = ['id', 'first_name', 'last_name', 'full_name', 'class_label', 'school', 'created_at']

class EmotionEntrySerializer(serializers.ModelSerializer):
    student_id = serializers.IntegerField(write_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = EmotionEntry
        fields = ['id', 'student_id', 'emotion', 'note', 'created_by_username', 'created_at']
        read_only_fields = ['id', 'created_at', 'created_by_username']
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        student_id = validated_data.pop('student_id')
        validated_data['student_id'] = student_id
        return super().create(validated_data)
