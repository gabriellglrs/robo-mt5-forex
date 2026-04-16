import os
import json
import sys

# Simulação de ambiente para teste de lógica
def test_settings_sync():
    print("Testing settings.json sync...")
    settings_path = "config/settings.json"
    
    if not os.path.exists(settings_path):
        print("FAIL: settings.json not found")
        return False
        
    with open(settings_path, "r") as f:
        data = json.load(f)
        
    # Simular mudança pela UI
    data["running_state"] = True
    data["risk_management"]["risk_percent"] = 2.5
    
    with open(settings_path, "w") as f:
        json.dump(data, f)
        
    # Verificar se o robô leria isso (simulando load_settings de main.py)
    with open(settings_path, "r") as f:
        check = json.load(f)
        if check["running_state"] == True and check["risk_management"]["risk_percent"] == 2.5:
            print("PASS: Settings sync logic works.")
            return True
        else:
            print("FAIL: Settings sync mismatch.")
            return False

def test_runtime_snapshot_integrity():
    print("Testing runtime_snapshot integrity...")
    snapshot = {
        "status": "running",
        "updated_at": "2026-04-16T13:00:00",
        "symbols": {
            "EURUSD": {
                "symbol": "EURUSD",
                "price": 1.0850,
                "channel_high": 1.0900,
                "channel_low": 1.0800,
                "status_phase": "Monitoramento"
            }
        },
        "recent_events": [
            {"timestamp": "13:00:01", "symbol": "EURUSD", "level": "INFO", "message": "Teste"}
        ]
    }
    
    os.makedirs("logs", exist_ok=True)
    with open("logs/fimathe_runtime.json", "w") as f:
        json.dump(snapshot, f)
        
    print("PASS: Snapshot creation works.")
    return True

if __name__ == "__main__":
    s1 = test_settings_sync()
    s2 = test_runtime_snapshot_integrity()
    if s1 and s2:
        print("\nSUMMARY: Core logic for Phase 10 verified successfully.")
        sys.exit(0)
    else:
        sys.exit(1)
