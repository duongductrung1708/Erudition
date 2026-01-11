"""
Simple test script for MongoDB API
Run: python test_api.py
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_user_signup():
    """Test user registration"""
    print("\n=== Test 1: User Signup ===")
    url = f"{BASE_URL}/users/signup"
    data = {
        "email": "test@example.com",
        "password": "test123456",
        "full_name": "Test User"
    }
    response = requests.post(url, json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.json() if response.status_code == 200 else None

def test_login():
    """Test login"""
    print("\n=== Test 2: Login ===")
    url = f"{BASE_URL}/login/access-token"
    data = {
        "username": "test@example.com",
        "password": "test123456"
    }
    response = requests.post(url, data=data)
    print(f"Status: {response.status_code}")
    result = response.json() if response.status_code == 200 else None
    if result:
        print(f"Token: {result.get('access_token', '')[:50]}...")
    return result.get("access_token") if result else None

def test_get_current_user(token):
    """Test get current user"""
    print("\n=== Test 3: Get Current User ===")
    url = f"{BASE_URL}/users/me"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.json() if response.status_code == 200 else None

def test_create_chatbot(token):
    """Test create chatbot"""
    print("\n=== Test 4: Create Chatbot ===")
    url = f"{BASE_URL}/chatbot/"
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "name": "Test Chatbot",
        "organization": "Test Org",
        "description": "Test description",
        "temperature": 0.7,
        "guard_rails": "Be helpful",
        "quota_limit": 1000,
        "window_type": "day",
        "window_size": 10,
        "is_disabled": False
    }
    response = requests.post(url, json=data, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    result = response.json() if response.status_code == 200 else None
    return result.get("id") if result else None

def test_get_chatbots(token):
    """Test get chatbots"""
    print("\n=== Test 5: Get Chatbots ===")
    url = f"{BASE_URL}/chatbot/get_chatbots_by_owner"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.json() if response.status_code == 200 else None

def main():
    print("=" * 50)
    print("MongoDB API Test Script")
    print("=" * 50)
    
    # Test 1: Signup
    user = test_user_signup()
    if not user:
        print("\n❌ Signup failed. Check if user already exists or server is running.")
        return
    
    # Test 2: Login
    token = test_login()
    if not token:
        print("\n❌ Login failed.")
        return
    
    # Test 3: Get current user
    current_user = test_get_current_user(token)
    if not current_user:
        print("\n❌ Get current user failed.")
        return
    
    # Test 4: Create chatbot
    chatbot_id = test_create_chatbot(token)
    if not chatbot_id:
        print("\n⚠️ Create chatbot failed (might need chatbot creator role).")
    else:
        # Test 5: Get chatbots
        test_get_chatbots(token)
    
    print("\n" + "=" * 50)
    print("✅ Basic tests completed!")
    print("=" * 50)

if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("\n❌ Cannot connect to server. Make sure backend is running:")
        print("   cd E:\\WED\\Erudition\\backend")
        print("   uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload")
    except Exception as e:
        print(f"\n❌ Error: {e}")

