from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Company, MainGroup, State, UserRole

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRole
        fields = ['id', 'name', 'display_name']

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name']

class MainGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = MainGroup
        fields = ['id', 'name']

class StateSerializer(serializers.ModelSerializer):
    class Meta:
        model = State
        fields = ['id', 'name', 'code']

class UserSerializer(serializers.ModelSerializer):
    company = serializers.SerializerMethodField()
    main_group = serializers.SerializerMethodField()
    state = serializers.SerializerMethodField()
    role = serializers.CharField(source='role.name', read_only=True)
    role_display = serializers.CharField(source='role.display_name', default=None, read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'name', 'username', 'email', 'phone',
            'role','role_display', 'company', 'main_group', 'state', 'is_active'
        ]

    def get_company(self, obj):
        if not obj.company:
            return None
        return CompanySerializer(obj.company).data

    def get_main_group(self, obj):
        if not obj.main_group:
            return None
        return MainGroupSerializer(obj.main_group).data

    def get_state(self, obj):
        if not obj.state:
            return None
        return StateSerializer(obj.state).data

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(
            username=data.get('username'),
            password=data.get('password')
        )
        if not user:
            raise serializers.ValidationError('Invalid username or password')
        if not user.is_active:
            raise serializers.ValidationError('User account is disabled')
        data['user'] = user
        return data

class CreateUserSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=6)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    phone = serializers.CharField(max_length=15, required=False, allow_blank=True, allow_null=True)

    # Accept integer IDs for foreign keys
    role = serializers.PrimaryKeyRelatedField(queryset=UserRole.objects.all(), required=False, allow_null=True)
    company = serializers.PrimaryKeyRelatedField(queryset=Company.objects.all(), required=False, allow_null=True)
    main_group = serializers.PrimaryKeyRelatedField(queryset=MainGroup.objects.all(), required=False, allow_null=True)
    state = serializers.PrimaryKeyRelatedField(queryset=State.objects.all(), required=False, allow_null=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already exists')
        return value

    def validate_email(self, value):
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already exists')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user
   
