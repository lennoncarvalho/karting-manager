/**
 * Typed row models that mirror the Supabase schema documented in
 * `kartarados/specs/010-angular-rewrite/spec.md §5`. Keep these in sync
 * with the live database (run `supabase gen types typescript` to refresh
 * a generated mirror under `src/app/core/database.types.ts` if desired —
 * the manual types below are intentionally narrow for type ergonomics).
 */

export type Uuid = string;
export type IsoDate = string;        // YYYY-MM-DD
export type IsoTimestamp = string;   // YYYY-MM-DDTHH:mm:ss(±tz)

export interface Season {
  id: Uuid;
  name: string;
  start_date: IsoDate;
  end_date: IsoDate;
  is_ongoing: boolean;
  accent_color: string; // #RRGGBB
  created_at?: IsoTimestamp;
  updated_at?: IsoTimestamp;
}

export interface Cup {
  id: Uuid;
  season_id: Uuid;
  name: string;
  start_date: IsoDate;
  end_date: IsoDate;
  created_at?: IsoTimestamp;
  updated_at?: IsoTimestamp;
}

export interface Driver {
  id: Uuid;
  email: string;
  name: string;
  nickname?: string | null;
  birth_date?: IsoDate | null;
  sex?: string | null;
  blood_type?: string | null;
  weight?: number | null;
  picture_url?: string | null;
  created_at?: IsoTimestamp;
  updated_at?: IsoTimestamp;
}

export interface Race {
  id: Uuid;
  season_id: Uuid;
  cup_id?: Uuid | null;
  name: string;
  location: string;
  race_datetime: IsoTimestamp;
  affects_championship: boolean;
  created_at?: IsoTimestamp;
  updated_at?: IsoTimestamp;
}

export type PenaltyType =
  | 'disqualification'
  | 'cone_tire_warning'
  | 'race_direction_warning'
  | 'stop_and_go'
  | 'missing_club_shirt'
  | 'custom';

export interface Penalty {
  id: Uuid;
  race_result_id: Uuid;
  penalty_type: PenaltyType;
  penalty_name: string;
  point_deduction: number; // <= 0
  count: number;           // > 0
}

export interface RaceResult {
  id: Uuid;
  race_id: Uuid;
  driver_id: Uuid;
  finish_position: number;
  grid_start_position?: number | null;
  best_lap_time?: string | null;
  is_disqualified: boolean;
  comments?: string | null;
  created_at?: IsoTimestamp;
  updated_at?: IsoTimestamp;
  // Joined relations (loaded via Supabase `select('*, drivers(*), penalties(*)')`)
  drivers?: Driver | null;
  penalties?: Penalty[];
}

