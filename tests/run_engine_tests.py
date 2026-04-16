import sys
import os

# Add root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from tests.test_fimathe_state_engine import (
    test_resolve_rule_meta,
    test_state_machine_no_data,
    test_state_machine_lateral,
    test_state_machine_no_ab,
    test_state_machine_out_of_region,
    test_state_machine_no_grouping,
    test_state_machine_no_breakout,
    test_state_machine_no_pullback,
    test_state_machine_far_from_sr,
    test_state_machine_full_buy,
    test_state_machine_full_sell
)

def run_tests():
    tests = [
        test_resolve_rule_meta,
        test_state_machine_no_data,
        test_state_machine_lateral,
        test_state_machine_no_ab,
        test_state_machine_out_of_region,
        test_state_machine_no_grouping,
        test_state_machine_no_breakout,
        test_state_machine_no_pullback,
        test_state_machine_far_from_sr,
        test_state_machine_full_buy,
        test_state_machine_full_sell
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            print(f"Running {test.__name__}...", end=" ")
            test()
            print("OK")
            passed += 1
        except Exception as e:
            print(f"FAILED: {e}")
            failed += 1
            
    print(f"\nResults: {passed} passed, {failed} failed")
    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
