# core/urls.py
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import SchoolViewSet, StudentViewSet, EmotionEntryViewSet, UserViewSet, login_view, logout_view

router = DefaultRouter()
router.register(r"schools", SchoolViewSet)
router.register(r'students', StudentViewSet, basename='student')
router.register(r'emotions', EmotionEntryViewSet, basename='emotion')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('auth/token', login_view, name='login'),
    path('auth/logout', logout_view, name='logout'),
] + router.urls
