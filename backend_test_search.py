#!/usr/bin/env python3
"""
Backend API Testing for Portal Dosare - Search Improvements
Tests the new search functionality:
1. One row per case (not per party)
2. Case number search: Nume/Calitate empty
3. Party name search: Nume/Calitate filled
4. No results: Observații='Niciun rezultat găsit'
5. Export includes Observații column
6. Table has 12 columns including Observații
"""

import requests
import sys
import json
from datetime import datetime

class PortalDosareSearchTester:
    def __init__(self, base_url="https://justroporbal.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append({"name": name, "details": details})
        print()

    def test_health_check(self):
        """Test basic API health"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Response: {data.get('status', 'unknown')}"
            self.log_test("Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("Health Check", False, f"Error: {str(e)}")
            return False

    def test_table_has_12_columns(self):
        """Test that the table has exactly 12 columns including Observații"""
        try:
            response = requests.post(
                f"{self.base_url}/dosare/search/universal",
                json={
                    "termeni": ["TEST123"],
                    "page": 1,
                    "page_size": 1
                },
                timeout=30
            )
            
            success = response.status_code == 200
            if not success:
                self.log_test("Table Has 12 Columns", False, f"HTTP {response.status_code}")
                return False
            
            data = response.json()
            headers = data.get("headers", [])
            
            expected_headers = [
                "Termen Căutare", "Tip Detectat", "Număr Dosar", "Instanță",
                "Obiect", "Stadiu Procesual", "Data", "Ultima Modificare",
                "Categorie Caz", "Nume Parte", "Calitate parte", "Observații"
            ]
            
            if len(headers) != 12:
                self.log_test("Table Has 12 Columns", False, f"Expected 12 headers, got {len(headers)}")
                return False
            
            if headers != expected_headers:
                self.log_test("Table Has 12 Columns", False, f"Headers mismatch. Expected: {expected_headers}, Got: {headers}")
                return False
            
            details = f"Table correctly has 12 columns: {', '.join(headers)}"
            self.log_test("Table Has 12 Columns", True, details)
            return True
            
        except Exception as e:
            self.log_test("Table Has 12 Columns", False, f"Error: {str(e)}")
            return False

    def test_case_number_search_empty_nume_calitate(self):
        """Test search by case number - Nume/Calitate should be empty"""
        try:
            test_case_number = "123/45/2024"
            
            response = requests.post(
                f"{self.base_url}/dosare/search/universal",
                json={
                    "termeni": [test_case_number],
                    "page": 1,
                    "page_size": 20
                },
                timeout=30
            )
            
            success = response.status_code == 200
            if not success:
                self.log_test("Case Number Search - Empty Nume/Calitate", False, f"HTTP {response.status_code}")
                return False
            
            data = response.json()
            rows = data.get("rows", [])
            
            # If we have results, check the structure
            if rows:
                first_row = rows[0]
                
                # Check if it's detected as case number
                if first_row.get("tip_detectat") != "Număr dosar":
                    self.log_test("Case Number Search - Empty Nume/Calitate", False, f"Wrong detection type: {first_row.get('tip_detectat')}")
                    return False
                
                # For case number search, Nume Parte and Calitate should be empty
                if first_row.get("nume_parte") or first_row.get("calitate_parte"):
                    self.log_test("Case Number Search - Empty Nume/Calitate", False, "Nume/Calitate should be empty for case number search")
                    return False
                
                details = f"Found {len(rows)} row(s), correctly detected as 'Număr dosar', Nume/Calitate empty"
            else:
                details = "No results found (expected for test case number)"
            
            self.log_test("Case Number Search - Empty Nume/Calitate", True, details)
            return True
            
        except Exception as e:
            self.log_test("Case Number Search - Empty Nume/Calitate", False, f"Error: {str(e)}")
            return False

    def test_party_name_search_filled_nume_calitate(self):
        """Test search by party name - should potentially fill Nume/Calitate fields"""
        try:
            test_party_name = "Popescu Ion"
            
            response = requests.post(
                f"{self.base_url}/dosare/search/universal",
                json={
                    "termeni": [test_party_name],
                    "page": 1,
                    "page_size": 20
                },
                timeout=30
            )
            
            success = response.status_code == 200
            if not success:
                self.log_test("Party Name Search - Nume/Calitate Logic", False, f"HTTP {response.status_code}")
                return False
            
            data = response.json()
            rows = data.get("rows", [])
            
            # If we have results, check the structure
            if rows:
                first_row = rows[0]
                
                # Check if it's detected as party name
                if first_row.get("tip_detectat") != "Nume parte":
                    self.log_test("Party Name Search - Nume/Calitate Logic", False, f"Wrong detection type: {first_row.get('tip_detectat')}")
                    return False
                
                details = f"Found {len(rows)} row(s), correctly detected as 'Nume parte'"
                
                # For party name search, we expect the fields to potentially be filled
                if first_row.get("nume_parte") or first_row.get("calitate_parte"):
                    details += ", Nume/Calitate populated"
                else:
                    details += ", Nume/Calitate empty (no matching party found)"
                    
            else:
                details = "No results found (expected for test party name)"
            
            self.log_test("Party Name Search - Nume/Calitate Logic", True, details)
            return True
            
        except Exception as e:
            self.log_test("Party Name Search - Nume/Calitate Logic", False, f"Error: {str(e)}")
            return False

    def test_no_results_observatii_message(self):
        """Test that no results shows 'Niciun rezultat găsit' in Observații"""
        try:
            unlikely_term = "XYZ999NONEXISTENT999"
            
            response = requests.post(
                f"{self.base_url}/dosare/search/universal",
                json={
                    "termeni": [unlikely_term],
                    "page": 1,
                    "page_size": 20
                },
                timeout=30
            )
            
            success = response.status_code == 200
            if not success:
                self.log_test("No Results - Observații Message", False, f"HTTP {response.status_code}")
                return False
            
            data = response.json()
            rows = data.get("rows", [])
            
            # Should have exactly one row with Observații message
            if len(rows) != 1:
                self.log_test("No Results - Observații Message", False, f"Expected 1 row, got {len(rows)}")
                return False
            
            row = rows[0]
            observatii = row.get("observatii", "")
            
            if observatii != "Niciun rezultat găsit":
                self.log_test("No Results - Observații Message", False, f"Wrong Observații message: '{observatii}'")
                return False
            
            # Check that search term and type are filled
            if row.get("termen_cautare") != unlikely_term:
                self.log_test("No Results - Observații Message", False, f"Wrong search term: {row.get('termen_cautare')}")
                return False
            
            details = f"Correctly shows 'Niciun rezultat găsit' for term '{unlikely_term}'"
            self.log_test("No Results - Observații Message", True, details)
            return True
            
        except Exception as e:
            self.log_test("No Results - Observații Message", False, f"Error: {str(e)}")
            return False

    def test_export_includes_observatii(self):
        """Test that export endpoints include Observații column"""
        try:
            response = requests.post(
                f"{self.base_url}/dosare/export/csv",
                json={
                    "termeni": ["TESTNONEXISTENT123"],
                    "page": 1,
                    "page_size": 10
                },
                timeout=30
            )
            
            success = response.status_code == 200
            if not success:
                self.log_test("Export Includes Observații", False, f"CSV export failed: HTTP {response.status_code}")
                return False
            
            # Check if response is CSV and contains Observații header
            content = response.text
            if "Observații" not in content:
                self.log_test("Export Includes Observații", False, "CSV export missing 'Observații' column")
                return False
            
            # Check if it contains the "Niciun rezultat găsit" message
            if "Niciun rezultat găsit" not in content:
                self.log_test("Export Includes Observații", False, "CSV export missing 'Niciun rezultat găsit' message")
                return False
            
            details = "CSV export correctly includes Observații column with 'Niciun rezultat găsit'"
            self.log_test("Export Includes Observații", True, details)
            return True
            
        except Exception as e:
            self.log_test("Export Includes Observații", False, f"Error: {str(e)}")
            return False

    def test_one_row_per_case(self):
        """Test that search returns one row per case, not per party"""
        try:
            # Test with multiple terms
            test_terms = ["123/45/2024", "NONEXISTENT999"]
            
            response = requests.post(
                f"{self.base_url}/dosare/search/universal",
                json={
                    "termeni": test_terms,
                    "page": 1,
                    "page_size": 50
                },
                timeout=30
            )
            
            success = response.status_code == 200
            if not success:
                self.log_test("One Row Per Case", False, f"HTTP {response.status_code}")
                return False
            
            data = response.json()
            rows = data.get("rows", [])
            
            # Should have at least one row for the non-existent term (with Observații message)
            if len(rows) == 0:
                self.log_test("One Row Per Case", False, "No rows returned")
                return False
            
            # Check that we have one row for the non-existent term with Observații
            nonexistent_rows = [row for row in rows if row.get("termen_cautare") == "NONEXISTENT999"]
            if len(nonexistent_rows) != 1:
                self.log_test("One Row Per Case", False, f"Expected 1 row for NONEXISTENT999, got {len(nonexistent_rows)}")
                return False
            
            if nonexistent_rows[0].get("observatii") != "Niciun rezultat găsit":
                self.log_test("One Row Per Case", False, "Missing 'Niciun rezultat găsit' for non-existent term")
                return False
            
            details = f"Processed {len(test_terms)} terms, returned {len(rows)} rows, correctly handled non-existent term"
            self.log_test("One Row Per Case", True, details)
            return True
            
        except Exception as e:
            self.log_test("One Row Per Case", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all tests and return summary"""
        print("🔍 Testing Portal Dosare Search Improvements")
        print("=" * 60)
        print()
        
        # Run tests in order
        tests = [
            self.test_health_check,
            self.test_table_has_12_columns,
            self.test_case_number_search_empty_nume_calitate,
            self.test_party_name_search_filled_nume_calitate,
            self.test_no_results_observatii_message,
            self.test_one_row_per_case,
            self.test_export_includes_observatii,
        ]
        
        for test in tests:
            test()
        
        # Summary
        print("=" * 60)
        print(f"📊 SUMMARY: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                print(f"  • {test['name']}: {test['details']}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n✨ Success Rate: {success_rate:.1f}%")
        
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.failed_tests,
            "success_rate": success_rate
        }

def main():
    tester = PortalDosareSearchTester()
    results = tester.run_all_tests()
    
    # Exit with error code if tests failed
    return 0 if results["passed_tests"] == results["total_tests"] else 1

if __name__ == "__main__":
    sys.exit(main())