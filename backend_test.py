import requests
import sys
import json
from datetime import datetime

class JudicialInstitutionsAPITester:
    def __init__(self, base_url="https://legal-monitor-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_token = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_auth=True):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        # Only add auth if explicitly requested and token exists
        if use_auth and self.token and not headers:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        print(f"   Auth: {'Yes' if use_auth and self.token else 'No'}")
        
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
        """Test get institutions endpoint - PUBLIC"""
        success, response = self.run_test(
            "Get Institutions (PUBLIC)",
            "GET", 
            "institutii",
            200,
            use_auth=False
        )
        if success and 'institutii' in response:
            institutii = response['institutii']
            print(f"   Found {len(institutii)} institutions")
            
            # Check structure - each institution should have key and name
            if len(institutii) > 0:
                first_inst = institutii[0]
                if 'key' in first_inst and 'name' in first_inst:
                    print(f"   ✅ Institution structure correct: {first_inst['key']} -> {first_inst['name']}")
                else:
                    print(f"   ❌ Institution structure incorrect: {first_inst}")
                    return False
            
            # Check alphabetical sorting by name
            names = [inst['name'] for inst in institutii]
            sorted_names = sorted(names)
            if names == sorted_names:
                print(f"   ✅ Institutions are sorted alphabetically")
            else:
                print(f"   ❌ Institutions are NOT sorted alphabetically")
                print(f"   First few: {names[:5]}")
                print(f"   Should be: {sorted_names[:5]}")
                return False
            
            # Check for expected number of institutions (around 232)
            if len(institutii) >= 200:
                print(f"   ✅ Institution count looks correct: {len(institutii)}")
            else:
                print(f"   ⚠️  Institution count seems low: {len(institutii)}")
        
        return success

    def test_public_search_dosare(self):
        """Test public case search functionality - NO AUTH REQUIRED"""
        # Test basic search without auth
        success, response = self.run_test(
            "Public Search Cases (NO AUTH)",
            "POST",
            "dosare/search",
            200,
            data={
                "numar_dosar": "123/2024",
                "institutie": "TribunalulBUCURESTI",
                "page": 1,
                "page_size": 20
            },
            use_auth=False
        )
        
        if success:
            # Check pagination metadata
            required_keys = ['results', 'total_count', 'page', 'page_size', 'total_pages']
            missing_keys = [key for key in required_keys if key not in response]
            if missing_keys:
                print(f"   ❌ Missing pagination keys: {missing_keys}")
                return False
            
            print(f"   ✅ Pagination metadata present")
            print(f"   Results: {len(response.get('results', []))}")
            print(f"   Total count: {response.get('total_count', 0)}")
            print(f"   Page: {response.get('page', 0)}")
            print(f"   Page size: {response.get('page_size', 0)}")
            print(f"   Total pages: {response.get('total_pages', 0)}")
            
            # Check page size limit (max 20)
            if response.get('page_size', 0) > 20:
                print(f"   ❌ Page size {response.get('page_size')} exceeds max 20")
                return False
            
            print(f"   ✅ Page size within limit (≤20)")
        
        return success

    def test_public_search_empty_results(self):
        """Test public search with no results"""
        success, response = self.run_test(
            "Public Search Empty Results (NO AUTH)",
            "POST",
            "dosare/search",
            200,
            data={
                "numar_dosar": "NONEXISTENT/999999/2099",
                "page": 1,
                "page_size": 20
            },
            use_auth=False
        )
        
        if success:
            # Check empty results structure
            if response.get('total_count') != 0:
                print(f"   ❌ Expected total_count: 0, got: {response.get('total_count')}")
                return False
            
            if not isinstance(response.get('results'), list) or len(response.get('results', [])) != 0:
                print(f"   ❌ Expected empty results array, got: {response.get('results')}")
                return False
            
            print(f"   ✅ Empty results structure correct")
        
        return success

    def test_public_search_error_format(self):
        """Test public search error response format"""
        success, response = self.run_test(
            "Public Search Error Format (NO AUTH)",
            "POST",
            "dosare/search",
            200,  # API returns 200 with error key for validation errors
            data={
                "data_start": "invalid-date-format",
                "page": 1,
                "page_size": 20
            },
            use_auth=False
        )
        
        if success:
            # Check error response has only 'error' key
            if 'error' not in response:
                print(f"   ❌ Expected 'error' key in response")
                return False
            
            # Check no other keys besides 'error'
            extra_keys = [key for key in response.keys() if key != 'error']
            if extra_keys:
                print(f"   ❌ Error response has extra keys: {extra_keys}")
                return False
            
            print(f"   ✅ Error response format correct (only 'error' key)")
            print(f"   Error message: {response.get('error')}")
        
        return success

    def test_public_bulk_search(self):
        """Test public bulk case search - NO AUTH REQUIRED"""
        success, response = self.run_test(
            "Public Bulk Search Cases (NO AUTH)",
            "POST", 
            "dosare/search/bulk",
            200,
            data={
                "numere_dosare": ["123/2024", "456/2024"],
                "institutie": "TribunalulBUCURESTI",
                "page": 1,
                "page_size": 20
            },
            use_auth=False
        )
        
        if success:
            # Check pagination metadata
            required_keys = ['results', 'total_count', 'page', 'page_size', 'total_pages']
            missing_keys = [key for key in required_keys if key not in response]
            if missing_keys:
                print(f"   ❌ Missing pagination keys: {missing_keys}")
                return False
            
            print(f"   ✅ Bulk search pagination metadata present")
            print(f"   Results: {len(response.get('results', []))}")
            print(f"   Errors: {len(response.get('errors', []))}")
        
        return success

    def test_monitored_cases_requires_auth(self):
        """Test that monitored cases endpoints require authentication"""
        # Test GET monitored cases without auth (expect 403 or 401)
        success1, response1 = self.run_test(
            "Get Monitored Cases (NO AUTH - should fail)",
            "GET",
            "monitorizare", 
            403,  # FastAPI returns 403 for missing auth
            use_auth=False
        )
        
        # Test POST monitored cases without auth (expect 403 or 401)
        success2, response2 = self.run_test(
            "Add Monitored Case (NO AUTH - should fail)",
            "POST",
            "monitorizare",
            403,  # FastAPI returns 403 for missing auth
            data={
                "numar_dosar": "TEST/123/2024",
                "institutie": "TribunalulBUCURESTI",
                "alias": "Test Case"
            },
            use_auth=False
        )
        
        if success1 and success2:
            print(f"   ✅ Monitored cases properly require authentication")
        
        return success1 and success2

    def test_add_monitored_case(self):
        """Test adding a case to monitoring"""
        # Use a unique case number to avoid conflicts
        unique_case = f"TEST/{datetime.now().strftime('%H%M%S')}/2024"
        
        success, response = self.run_test(
            "Add Monitored Case",
            "POST",
            "monitorizare",
            200,
            data={
                "numar_dosar": unique_case,
                "institutie": "TribunalulBUCURESTI",
                "alias": "Test Case"
            }
        )
        
        if success:
            print(f"   Added case: {response.get('numar_dosar')}")
            return response.get('id')
        return None

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
            self.admin_token = response['access_token']  # Set admin token since this is admin user
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
            headers={'Authorization': ''}  # Empty auth header
        )
        return success

def main():
    print("🚀 Starting Judicial Institutions API Tests")
    print("=" * 50)
    
    tester = JudicialInstitutionsAPITester()
    
    # Test sequence - focusing on institutions and public search functionality
    tests = [
        ("Health Check", tester.test_health_check),
        ("Get Institutions (PUBLIC)", tester.test_get_institutii),
        ("Public Search Cases", tester.test_public_search_dosare),
        ("Public Search Empty Results", tester.test_public_search_empty_results),
        ("Public Search Error Format", tester.test_public_search_error_format),
        ("Public Bulk Search", tester.test_public_bulk_search),
        ("Monitored Cases Require Auth", tester.test_monitored_cases_requires_auth),
        
        # Test with authentication for comparison
        ("Register/Login for Auth Tests", tester.test_register_admin),
        ("Monitored Cases (WITH AUTH)", tester.test_monitored_cases),
        ("Add Monitored Case (WITH AUTH)", tester.test_add_monitored_case),
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