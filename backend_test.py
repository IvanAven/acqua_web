import requests
import sys
import json
from datetime import datetime, date, timedelta

class AcquaAPITester:
    def __init__(self, base_url="https://acqua-customer-hub.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.customer_token = None
        self.customer_email = None
        self.order_id = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if method == 'GET' and isinstance(response_data, list):
                        print(f"   Response: {len(response_data)} items")
                    elif isinstance(response_data, dict) and len(str(response_data)) < 200:
                        print(f"   Response: {response_data}")
                except:
                    pass
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Raw response: {response.text[:200]}")

            return success, response.json() if success else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login and store token"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@acqua.com", "password": "admin123"}
        )
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   Admin user: {response.get('user', {}).get('name', 'Unknown')}")
            return True
        return False

    def test_customer_registration(self):
        """Test customer registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        self.customer_email = f"test_customer_{timestamp}@test.com"
        
        customer_data = {
            "name": "Test Customer",
            "email": self.customer_email,
            "password": "TestPass123!",
            "phone": "5551234567",
            "address": "Test Address 123"
        }
        
        success, response = self.run_test(
            "Customer Registration",
            "POST",
            "auth/register",
            200,
            data=customer_data
        )
        if success and 'access_token' in response:
            self.customer_token = response['access_token']
            print(f"   Registered customer: {response.get('user', {}).get('name', 'Unknown')}")
            return True
        return False

    def test_customer_login(self):
        """Test customer login"""
        if not self.customer_email:
            print("❌ No customer email available for login test")
            return False
            
        success, response = self.run_test(
            "Customer Login",
            "POST", 
            "auth/login",
            200,
            data={"email": self.customer_email, "password": "TestPass123!"}
        )
        if success and 'access_token' in response:
            self.customer_token = response['access_token']
            return True
        return False

    def test_auth_me_customer(self):
        """Test /auth/me endpoint for customer"""
        if not self.customer_token:
            print("❌ No customer token available")
            return False
            
        success, _ = self.run_test(
            "Get Current User (Customer)",
            "GET",
            "auth/me",
            200,
            token=self.customer_token
        )
        return success

    def test_auth_me_admin(self):
        """Test /auth/me endpoint for admin"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
            
        success, _ = self.run_test(
            "Get Current User (Admin)",
            "GET", 
            "auth/me",
            200,
            token=self.admin_token
        )
        return success

    def test_create_order(self):
        """Test creating a new order"""
        if not self.customer_token:
            print("❌ No customer token available")
            return False

        tomorrow = (date.today() + timedelta(days=1)).isoformat()
        order_data = {
            "quantity": 3,
            "delivery_address": "Test Delivery Address 456",
            "delivery_date": tomorrow,
            "delivery_time": "09:00-12:00",
            "notes": "Test order notes"
        }
        
        success, response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data=order_data,
            token=self.customer_token
        )
        if success and 'id' in response:
            self.order_id = response['id']
            print(f"   Order ID: {self.order_id}")
            return True
        return False

    def test_get_customer_orders(self):
        """Test getting customer orders"""
        if not self.customer_token:
            print("❌ No customer token available")
            return False
            
        success, response = self.run_test(
            "Get Customer Orders",
            "GET",
            "orders",
            200,
            token=self.customer_token
        )
        return success

    def test_get_all_orders_admin(self):
        """Test getting all orders (admin)"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
            
        success, response = self.run_test(
            "Get All Orders (Admin)",
            "GET",
            "orders",
            200,
            token=self.admin_token
        )
        return success

    def test_update_order_status(self):
        """Test updating order status (admin only)"""
        if not self.admin_token or not self.order_id:
            print("❌ No admin token or order ID available")
            return False
            
        success, response = self.run_test(
            "Update Order Status",
            "PUT",
            f"orders/{self.order_id}/status",
            200,
            data={"status": "in_transit"},
            token=self.admin_token
        )
        return success

    def test_get_customers_admin(self):
        """Test getting customers list (admin only)"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
            
        success, response = self.run_test(
            "Get Customers (Admin)",
            "GET",
            "customers",
            200,
            token=self.admin_token
        )
        return success

    def test_get_stats_customer(self):
        """Test getting customer stats"""
        if not self.customer_token:
            print("❌ No customer token available")
            return False
            
        success, response = self.run_test(
            "Get Customer Stats",
            "GET",
            "stats",
            200,
            token=self.customer_token
        )
        return success

    def test_get_stats_admin(self):
        """Test getting admin stats"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
            
        success, response = self.run_test(
            "Get Admin Stats",
            "GET",
            "stats", 
            200,
            token=self.admin_token
        )
        return success

    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        success, _ = self.run_test(
            "Unauthorized Access Test",
            "GET",
            "auth/me",
            401
        )
        return success

def main():
    print("🚀 Starting ACQUA API Tests")
    print("=" * 50)
    
    tester = AcquaAPITester()

    # Authentication Tests
    print("\n📝 AUTHENTICATION TESTS")
    if not tester.test_admin_login():
        print("❌ Admin login failed, stopping tests")
        return 1

    if not tester.test_customer_registration():
        print("❌ Customer registration failed, stopping tests") 
        return 1

    if not tester.test_customer_login():
        print("❌ Customer login failed")

    if not tester.test_auth_me_admin():
        print("❌ Admin /auth/me failed")

    if not tester.test_auth_me_customer():
        print("❌ Customer /auth/me failed")

    # Authorization Tests
    print("\n🔒 AUTHORIZATION TESTS")
    tester.test_unauthorized_access()

    # Order Management Tests  
    print("\n📦 ORDER MANAGEMENT TESTS")
    if tester.test_create_order():
        tester.test_get_customer_orders()
        tester.test_get_all_orders_admin()
        tester.test_update_order_status()
    else:
        print("❌ Order creation failed, skipping related tests")

    # Customer Management Tests
    print("\n👥 CUSTOMER MANAGEMENT TESTS") 
    tester.test_get_customers_admin()

    # Statistics Tests
    print("\n📊 STATISTICS TESTS")
    tester.test_get_stats_customer()
    tester.test_get_stats_admin()

    # Final Results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed - check backend implementation")
        return 1

if __name__ == "__main__":
    sys.exit(main())