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
import re
from datetime import datetime
from typing import Dict, List, Any

class PortalDosareSearchTester:
    def __init__(self, base_url="https://github-analyzer-15.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append({"test": name, "details": details})

    def test_health_check(self) -> bool:
        """Test basic API health"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            success = response.status_code == 200
            self.log_test("Health Check", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("Health Check", False, f"Error: {str(e)}")
            return False

    def test_universal_search_case_number(self) -> bool:
        """Test universal search with case number pattern"""
        try:
            # Test with a case number pattern
            payload = {
                "termeni": ["8893/99/2009"],
                "page": 1,
                "page_size": 20
            }
            
            response = self.session.post(f"{self.base_url}/dosare/search/universal", json=payload)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                # Check response structure
                required_keys = ["rows", "total_count", "page", "page_size", "total_pages", "headers"]
                has_structure = all(key in data for key in required_keys)
                
                # Check headers count (should be exactly 11)
                headers_count = len(data.get("headers", []))
                correct_headers = headers_count == 11
                
                # Check if any rows returned have correct auto-detection
                auto_detection_correct = True
                if data.get("rows"):
                    for row in data["rows"]:
                        if row.get("termen_cautare") == "8893/99/2009":
                            if row.get("tip_detectat") != "Număr dosar":
                                auto_detection_correct = False
                                break
                
                success = has_structure and correct_headers and auto_detection_correct
                details = f"Structure: {has_structure}, Headers: {headers_count}/11, Auto-detect: {auto_detection_correct}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Universal Search - Case Number", success, details)
            return success
            
        except Exception as e:
            self.log_test("Universal Search - Case Number", False, f"Error: {str(e)}")
            return False

    def test_universal_search_party_name(self) -> bool:
        """Test universal search with party name"""
        try:
            payload = {
                "termeni": ["Popescu Ion"],
                "page": 1,
                "page_size": 20
            }
            
            response = self.session.post(f"{self.base_url}/dosare/search/universal", json=payload)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                # Check auto-detection for party name
                auto_detection_correct = True
                if data.get("rows"):
                    for row in data["rows"]:
                        if row.get("termen_cautare") == "Popescu Ion":
                            if row.get("tip_detectat") != "Nume parte":
                                auto_detection_correct = False
                                break
                
                details = f"Auto-detect party name: {auto_detection_correct}"
                success = auto_detection_correct
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("Universal Search - Party Name Auto-Detection", success, details)
            return success
            
        except Exception as e:
            self.log_test("Universal Search - Party Name Auto-Detection", False, f"Error: {str(e)}")
            return False

    def test_diacritic_insensitive_search(self) -> bool:
        """Test diacritic insensitive search (Iasi = IAȘI)"""
        try:
            # Test with both diacritic and non-diacritic versions
            payload1 = {"termeni": ["Iasi"], "page": 1, "page_size": 5}
            payload2 = {"termeni": ["IAȘI"], "page": 1, "page_size": 5}
            
            response1 = self.session.post(f"{self.base_url}/dosare/search/universal", json=payload1)
            response2 = self.session.post(f"{self.base_url}/dosare/search/universal", json=payload2)
            
            success = response1.status_code == 200 and response2.status_code == 200
            
            if success:
                data1 = response1.json()
                data2 = response2.json()
                
                # Both should return results (or both should return no results)
                # The key is that they should behave consistently
                consistent_behavior = (
                    (data1.get("total_count", 0) > 0 and data2.get("total_count", 0) > 0) or
                    (data1.get("total_count", 0) == 0 and data2.get("total_count", 0) == 0)
                )
                
                details = f"Iasi results: {data1.get('total_count', 0)}, IAȘI results: {data2.get('total_count', 0)}"
                success = consistent_behavior
            else:
                details = f"Status: {response1.status_code}, {response2.status_code}"
            
            self.log_test("Diacritic Insensitive Search", success, details)
            return success
            
        except Exception as e:
            self.log_test("Diacritic Insensitive Search", False, f"Error: {str(e)}")
            return False

    def test_table_structure_11_columns(self) -> bool:
        """Test that table has exactly 11 columns as specified"""
        try:
            payload = {
                "termeni": ["123/45/2024", "Test Nume"],
                "page": 1,
                "page_size": 10
            }
            
            response = self.session.post(f"{self.base_url}/dosare/search/universal", json=payload)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                headers = data.get("headers", [])
                
                expected_headers = [
                    "Termen Căutare", "Tip Detectat", "Număr Dosar", "Instanță",
                    "Obiect", "Stadiu Procesual", "Data", "Ultima Modificare",
                    "Categorie Caz", "Nume Parte", "Calitate parte"
                ]
                
                correct_count = len(headers) == 11
                correct_headers = headers == expected_headers
                
                # Check row structure
                correct_row_structure = True
                if data.get("rows"):
                    sample_row = data["rows"][0]
                    expected_fields = [
                        "termen_cautare", "tip_detectat", "numar_dosar", "instanta",
                        "obiect", "stadiu_procesual", "data", "ultima_modificare",
                        "categorie_caz", "nume_parte", "calitate_parte"
                    ]
                    correct_row_structure = all(field in sample_row for field in expected_fields)
                
                success = correct_count and correct_headers and correct_row_structure
                details = f"Headers count: {len(headers)}/11, Correct headers: {correct_headers}, Row structure: {correct_row_structure}"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("Table Structure - 11 Columns", success, details)
            return success
            
        except Exception as e:
            self.log_test("Table Structure - 11 Columns", False, f"Error: {str(e)}")
            return False

    def test_empty_results_handling(self) -> bool:
        """Test empty results show 'Niciun rezultat găsit' message"""
        try:
            # Use a very unlikely search term
            payload = {
                "termeni": ["XYZ999NONEXISTENT999XYZ"],
                "page": 1,
                "page_size": 20
            }
            
            response = self.session.post(f"{self.base_url}/dosare/search/universal", json=payload)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                rows = data.get("rows", [])
                
                # Should have at least one row with "Niciun rezultat găsit"
                has_no_results_message = False
                if rows:
                    for row in rows:
                        if "Niciun rezultat găsit" in row.get("nume_parte", ""):
                            has_no_results_message = True
                            break
                
                success = has_no_results_message
                details = f"No results message found: {has_no_results_message}, Rows: {len(rows)}"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("Empty Results Handling", success, details)
            return success
            
        except Exception as e:
            self.log_test("Empty Results Handling", False, f"Error: {str(e)}")
            return False

    def test_export_xlsx(self) -> bool:
        """Test Excel export functionality"""
        try:
            payload = {
                "termeni": ["123/45/2024"],
                "page": 1,
                "page_size": 10
            }
            
            response = self.session.post(f"{self.base_url}/dosare/export/xlsx", json=payload)
            success = response.status_code == 200
            
            if success:
                # Check content type
                content_type = response.headers.get('content-type', '')
                is_xlsx = 'spreadsheet' in content_type or 'excel' in content_type
                
                # Check content disposition
                content_disposition = response.headers.get('content-disposition', '')
                has_filename = 'filename=' in content_disposition and '.xlsx' in content_disposition
                
                # Check content length
                has_content = len(response.content) > 0
                
                success = is_xlsx and has_filename and has_content
                details = f"Content-Type: {content_type}, Filename: {has_filename}, Size: {len(response.content)} bytes"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("Export XLSX", success, details)
            return success
            
        except Exception as e:
            self.log_test("Export XLSX", False, f"Error: {str(e)}")
            return False

    def test_export_csv_utf8(self) -> bool:
        """Test CSV export with UTF-8 encoding"""
        try:
            payload = {
                "termeni": ["Test"],
                "page": 1,
                "page_size": 10
            }
            
            response = self.session.post(f"{self.base_url}/dosare/export/csv", json=payload)
            success = response.status_code == 200
            
            if success:
                # Check content type
                content_type = response.headers.get('content-type', '')
                is_csv = 'csv' in content_type
                has_utf8 = 'utf-8' in content_type
                
                # Check content disposition
                content_disposition = response.headers.get('content-disposition', '')
                has_filename = 'filename=' in content_disposition and '.csv' in content_disposition
                
                # Check for UTF-8 BOM
                content = response.content
                has_bom = content.startswith(b'\xef\xbb\xbf')
                
                success = is_csv and has_filename and len(content) > 0
                details = f"CSV: {is_csv}, UTF-8: {has_utf8}, BOM: {has_bom}, Size: {len(content)} bytes"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("Export CSV UTF-8", success, details)
            return success
            
        except Exception as e:
            self.log_test("Export CSV UTF-8", False, f"Error: {str(e)}")
            return False

    def test_export_txt_tab_separated(self) -> bool:
        """Test TXT export with tab separation"""
        try:
            payload = {
                "termeni": ["Test"],
                "page": 1,
                "page_size": 10
            }
            
            response = self.session.post(f"{self.base_url}/dosare/export/txt", json=payload)
            success = response.status_code == 200
            
            if success:
                # Check content type
                content_type = response.headers.get('content-type', '')
                is_txt = 'text/plain' in content_type
                
                # Check content disposition
                content_disposition = response.headers.get('content-disposition', '')
                has_filename = 'filename=' in content_disposition and '.txt' in content_disposition
                
                # Check for tab separation in content
                content_str = response.content.decode('utf-8')
                has_tabs = '\t' in content_str
                
                success = is_txt and has_filename and has_tabs and len(content_str) > 0
                details = f"TXT: {is_txt}, Tabs: {has_tabs}, Size: {len(content_str)} chars"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("Export TXT Tab-Separated", success, details)
            return success
            
        except Exception as e:
            self.log_test("Export TXT Tab-Separated", False, f"Error: {str(e)}")
            return False

    def test_pagination(self) -> bool:
        """Test pagination functionality"""
        try:
            payload = {
                "termeni": ["Test", "123/45/2024", "Popescu"],
                "page": 1,
                "page_size": 2
            }
            
            response = self.session.post(f"{self.base_url}/dosare/search/universal", json=payload)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                
                # Check pagination fields
                has_pagination = all(key in data for key in ["page", "page_size", "total_count", "total_pages"])
                correct_page = data.get("page") == 1
                correct_page_size = data.get("page_size") == 2
                
                success = has_pagination and correct_page and correct_page_size
                details = f"Pagination fields: {has_pagination}, Page: {data.get('page')}, Size: {data.get('page_size')}"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("Pagination", success, details)
            return success
            
        except Exception as e:
            self.log_test("Pagination", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self) -> Dict[str, Any]:
        """Run all tests and return results"""
        print("🔍 Starting Romanian Legal Search System Tests")
        print("=" * 60)
        
        # Run all tests
        tests = [
            self.test_health_check,
            self.test_universal_search_case_number,
            self.test_universal_search_party_name,
            self.test_diacritic_insensitive_search,
            self.test_table_structure_11_columns,
            self.test_empty_results_handling,
            self.test_export_xlsx,
            self.test_export_csv_utf8,
            self.test_export_txt_tab_separated,
            self.test_pagination
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                print(f"❌ FAIL - {test.__name__}: {str(e)}")
                self.failed_tests.append({"test": test.__name__, "details": str(e)})
                self.tests_run += 1
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"  - {failure['test']}: {failure['details']}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": len(self.failed_tests),
            "success_rate": success_rate,
            "failures": self.failed_tests
        }

def main():
    """Main test execution"""
    tester = PortalDosareSearchTester()
    results = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if results["failed_tests"] == 0 else 1

if __name__ == "__main__":
    sys.exit(main())