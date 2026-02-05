import requests
import sys
import json
from datetime import datetime

class PortalDosareAPITester:
    def __init__(self, base_url="https://legal-monitor-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_token = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token and not headers:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.text}")
                except:
                    pass
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "health",
            200
        )
        return success

    def test_get_institutii(self):
        """Test get institutions endpoint"""
        success, response = self.run_test(
            "Get Institutions",
            "GET", 
            "institutii",
            200
        )
        if success and 'institutii' in response:
            print(f"   Found {len(response['institutii'])} institutions")
        return success

    def test_register_admin(self):
        """Test user registration (first user becomes admin)"""
        test_email = "admin@test.ro"
        test_password = "test123"
        
        # Try to register, but expect it might fail if user exists
        success, response = self.run_test(
            "Register Admin User",
            "POST",
            "auth/register",
            200,
            data={
                "email": test_email,
                "password": test_password,
                "name": "Test Admin"
            }
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Admin registered with role: {response['user']['role']}")
            return True
        else:
            # If registration fails (user exists), try to login instead
            print("   Registration failed (user likely exists), trying login...")
            return self.test_login()

    def test_login(self):
        """Test user login"""
        success, response = self.run_test(
            "Login User",
            "POST",
            "auth/login", 
            200,
            data={
                "email": "admin@test.ro",
                "password": "test123"
            }
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Logged in as: {response['user']['name']} ({response['user']['role']})")
            return True
        return False

    def test_get_me(self):
        """Test get current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_search_dosare(self):
        """Test case search functionality"""
        # Test basic search
        success, response = self.run_test(
            "Search Cases",
            "POST",
            "dosare/search",
            200,
            data={
                "numar_dosar": "123/2024",
                "institutie": "TribunalulBUCURESTI"
            }
        )
        
        if success:
            print(f"   Search returned {response.get('count', 0)} results")
        
        return success

    def test_bulk_search(self):
        """Test bulk case search"""
        success, response = self.run_test(
            "Bulk Search Cases",
            "POST", 
            "dosare/search/bulk",
            200,
            data={
                "numere_dosare": ["123/2024", "456/2024"],
                "institutie": "TribunalulBUCURESTI"
            }
        )
        
        if success:
            print(f"   Bulk search returned {response.get('count', 0)} results")
            print(f"   Errors: {len(response.get('errors', []))}")
        
        return success

    def test_monitored_cases(self):
        """Test monitored cases functionality"""
        # Get monitored cases (should be empty initially)
        success, response = self.run_test(
            "Get Monitored Cases",
            "GET",
            "monitorizare", 
            200
        )
        
        if success:
            print(f"   Found {response.get('count', 0)} monitored cases")
        
        return success

    def test_add_monitored_case(self):
        """Test adding a case to monitoring"""
        success, response = self.run_test(
            "Add Monitored Case",
            "POST",
            "monitorizare",
            200,
            data={
                "numar_dosar": "TEST/123/2024",
                "institutie": "TribunalulBUCURESTI",
                "alias": "Test Case"
            }
        )
        
        if success:
            print(f"   Added case: {response.get('numar_dosar')}")
            return response.get('id')
        return None

    def test_notifications(self):
        """Test notifications functionality"""
        success, response = self.run_test(
            "Get Notifications",
            "GET",
            "notifications",
            200
        )
        
        if success:
            print(f"   Found {len(response.get('notifications', []))} notifications")
            print(f"   Unread: {response.get('unread_count', 0)}")
        
        return success

    def test_admin_endpoints(self):
        """Test admin-only endpoints"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        # Test admin users endpoint
        success1, response1 = self.run_test(
            "Admin Get Users",
            "GET",
            "admin/users",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success1:
            print(f"   Found {response1.get('count', 0)} users")
        
        # Test admin stats endpoint  
        success2, response2 = self.run_test(
            "Admin Get Stats",
            "GET",
            "admin/stats",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success2:
            print(f"   Stats - Users: {response2.get('total_users', 0)}, Monitored: {response2.get('total_monitored_cases', 0)}")
        
        return success1 and success2

    def test_invalid_login(self):
        """Test invalid login credentials"""
        success, response = self.run_test(
            "Invalid Login",
            "POST",
            "auth/login",
            401,
            data={
                "email": "invalid@test.ro", 
                "password": "wrongpass"
            }
        )
        return success

    def test_unauthorized_access(self):
        """Test accessing protected endpoint without token"""
        success, response = self.run_test(
            "Unauthorized Access",
            "GET",
            "auth/me",
            401,
            headers={}  # No auth header
        )
        return success

def main():
    print("🚀 Starting Portal Dosare API Tests")
    print("=" * 50)
    
    tester = PortalDosareAPITester()
    
    # Test sequence
    tests = [
        ("Health Check", tester.test_health_check),
        ("Get Institutions", tester.test_get_institutii),
        ("Register Admin", tester.test_register_admin),
        ("Login User", tester.test_login),
        ("Get Current User", tester.test_get_me),
        ("Search Cases", tester.test_search_dosare),
        ("Bulk Search", tester.test_bulk_search),
        ("Get Monitored Cases", tester.test_monitored_cases),
        ("Add Monitored Case", tester.test_add_monitored_case),
        ("Get Notifications", tester.test_notifications),
        ("Admin Endpoints", tester.test_admin_endpoints),
        ("Invalid Login", tester.test_invalid_login),
        ("Unauthorized Access", tester.test_unauthorized_access)
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            if not result:
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if failed_tests:
        print(f"❌ Failed tests: {', '.join(failed_tests)}")
        return 1
    else:
        print("✅ All tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())