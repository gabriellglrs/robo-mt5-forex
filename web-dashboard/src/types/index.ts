export interface Trade {
  id: number;
  ticket: number;
  symbol: string;
  magic: number;
  type: 'BUY' | 'SELL';
  timeframe: string;
  strategy: string;
  entry_price: number;
  entry_time: string;
  exit_price?: number;
  exit_time?: string;
  sl: number;
  tp: number;
  pnl: number;
  status: 'OPEN' | 'CLOSED';
  indicators_json: Record<string, number | string | boolean>;
}

export interface RobotStatus {
  status: 'running' | 'stopped' | 'error' | 'starting';
  pid?: number;
  started_at?: string;
  trailing_actions?: string[];
  last_cycle_action?: string;
  current_pnl?: number;
}

export interface Metrics {
  pnl: number;
  win_rate: number;
  total_trades: number;
  recent_trades: Trade[];
}

export interface FimatheAsset {
  symbol: string;
  price: number;
  status_phase: string;
  status_text: string;
  signal?: string;
  trend_direction?: string;
  trend_slope_points?: number;
  trend_timeframe?: string;
  rule_id?: string;
  rule_name?: string;
  next_trigger?: string;
  rule_trace?: Record<string, string>;
  channel_high?: number;
  channel_low?: number;
  channel_mid?: number;
  point_a?: number;
  point_b?: number;
  projection_50?: number;
  projection_80?: number;
  projection_85?: number;
  projection_100?: number;
  breakout_ok?: boolean;
  pullback_ok?: boolean;
  grouping_ok?: boolean;
  grouping_range_points?: number;
  open_positions: number;
  max_open_positions: number;
  current_pnl?: number;
  trading_type?: string;
  box_locked?: boolean;
  box_locked_at?: string;
}

export interface RuntimeSnapshot {
  status: string;
  updated_at: string;
  symbols: Record<string, FimatheAsset>;
  recent_events: Record<string, unknown>[];
  account?: {
    balance: number;
    equity: number;
    profit: number;
  };
}
