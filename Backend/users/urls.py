from django.urls import path
from .views import LoginView, ProfileView,StateListView,CompanyListView,MainGroupListView,CreateUserView,RoleListView
# from rest_framework_simplejwt.views import (
#     TokenObtainPairView,
#     TokenRefreshView,
# )


urlpatterns = [
    
    path('login/', LoginView.as_view(), name='login'),
    path('profile/', ProfileView.as_view(), name='profile'),

    # Master data APIS
    path('states/',StateListView.as_view(),name='states'),
    path('companies/',CompanyListView.as_view(),name='companies'),
    path('mainGroup/', MainGroupListView.as_view(), name='mainGroup'),
    path('users/create/', CreateUserView.as_view(), name='create-user'),
    path('roles/', RoleListView.as_view(), name='roles-list'),

]