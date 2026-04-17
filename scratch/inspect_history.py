import MetaTrader5 as mt5
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Inspector")

def inspect_tickets(tickets):
    if not mt5.initialize():
        print("Falha ao iniciar MT5")
        return

    from_date = datetime(2026, 1, 1)
    to_date = datetime.now() + timedelta(days=1)

    for ticket in tickets:
        print(f"\n--- Inspecionando Ticket #{ticket} ---")
        # Busca por POSITION
        deals_pos = mt5.history_deals_get(from_date, to_date, position=ticket)
        print(f"Deals por POSITION ({ticket}): {len(deals_pos) if deals_pos else 0}")
        if deals_pos:
            for d in deals_pos:
                print(f"  Deal: ID={d.ticket}, PosID={d.position_id}, Symbol={d.symbol}, Time={datetime.fromtimestamp(d.time)}, Profit={d.profit}, Entry={d.entry}")

        # Busca por TICKET (ordem)
        deals_tick = mt5.history_deals_get(from_date, to_date, ticket=ticket)
        print(f"Deals por TICKET ({ticket}): {len(deals_tick) if deals_tick else 0}")
        if deals_tick:
            for d in deals_tick:
                print(f"  Deal: ID={d.ticket}, PosID={d.position_id}, Symbol={d.symbol}, Time={datetime.fromtimestamp(d.time)}, Profit={d.profit}, Entry={d.entry}")

    mt5.shutdown()

if __name__ == "__main__":
    # Inspecionar alguns tickets que vieram errados no banco
    inspect_tickets([1598560272, 1597178445, 1594802877])
