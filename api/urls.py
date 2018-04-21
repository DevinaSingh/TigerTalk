from django.urls import path, re_path
from rest_framework.urlpatterns import format_suffix_patterns
from rest_framework.routers import DefaultRouter
from . import views

urlpatterns = [
    path('posts/', views.PostList.as_view()),
    path('posts/<int:pk>/', views.PostDetail.as_view()),
    path('posts/<int:pk>/comments/', views.PostCommentList.as_view()),
    path('posts/<int:pk>/u/', views.PostUpvote.as_view()),
    path('posts/<int:pk>/d/', views.PostDownvote.as_view()),
    path('posts/<int:pk>/c/', views.PostClearVote.as_view()),
    path('comments/', views.CommentList.as_view()),
    path('comments/<int:pk>/', views.CommentDetail.as_view()),
    path('comments/<int:pk>/u/', views.CommentUpvote.as_view()),
    path('comments/<int:pk>/d/', views.CommentDownvote.as_view()),
    path('comments/<int:pk>/c/', views.CommentClearVote.as_view()),
    path('users/', views.UserList.as_view()),
    path('users/<int:pk>/', views.UserDetail.as_view()),
]

urlpatterns = format_suffix_patterns(urlpatterns)
