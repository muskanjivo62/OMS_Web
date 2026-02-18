from django.db import models
from django.contrib.auth.models import AbstractUser
# Create your models here.

class Company(models.Model):
    name = models.CharField(max_length= 100,unique = True)
    is_active = models.BooleanField(default = True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta: 
        verbose_name_plural = "Companies"
    
    def __str__(self):
        return self.name

class MainGroup(models.Model):
    name = models.CharField(max_length= 35 ,unique = True)
    is_active = models.BooleanField(default = True)
    created_at = models.DateTimeField(auto_now_add = True)
    
    class Meta:
        verbose_name = "Main Group"
        verbose_name_plural = "Main Groups"

    def __str__(self):
        return self.name

class State(models.Model):
    name = models.CharField(max_length= 20,unique = True)
    code = models.CharField(max_length = 10,unique = True)
    is_active = models.BooleanField(default=True) 

    class Meta:
        verbose_name = "State"
        verbose_name_plural = "States"

    def __str__(self):
        return self.name    

class UserRole(models.Model):
    name = models.CharField(max_length=50, unique=True)  # e.g. admin, manager, operator
    display_name = models.CharField(max_length=100)       # e.g. Admin, Manager, Operator
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'users_role'
        ordering = ['name']

    def __str__(self):
        return self.display_name        

class User(AbstractUser):
    first_name = None
    last_name = None
    
    name = models.CharField(max_length = 150)
    email = models.EmailField(max_length=15, blank=True, null=True)
    phone = models.CharField(max_length = 15, blank = True, null= True)
    role = models.ForeignKey(
    'users.UserRole',
    on_delete=models.PROTECT,
    related_name='users',
    null=True,
    blank=True,
    )
    
    company = models.ManyToManyField(Company, blank=True, related_name='users')
    main_group = models.ManyToManyField(MainGroup, blank=True, related_name='users')
    state = models.ManyToManyField(State, blank=True, related_name='users')
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):  
        return self.username


    