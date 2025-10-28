# core/serializers.py
from rest_framework import serializers
from .models import School, Student, EmotionEntry, User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'class_label', 'first_name', 'last_name', 'is_active']
        read_only_fields = ['id']

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role', 'class_label', 'first_name', 'last_name', 'is_active']
        read_only_fields = ['id']
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

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
