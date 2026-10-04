// Supabase JS v2 requires this metadata for typed query inference.
export type Database = {
  __InternalSupabase: { PostgrestVersion: "12" };
  public: {
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Tables: {
      business: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          photo_url: string | null;
          pin_encrypted: string;
          active_wifi_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          photo_url?: string | null;
          pin_encrypted: string;
          active_wifi_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          photo_url?: string | null;
          pin_encrypted?: string;
          active_wifi_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      wifi_config: {
        Row: {
          id: string;
          business_id: string;
          label: string;
          ssid: string;
          password_encrypted: string;
          security: "WPA2" | "WPA3" | "open";
          hidden: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          label: string;
          ssid: string;
          password_encrypted: string;
          security: "WPA2" | "WPA3" | "open";
          hidden?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          label?: string;
          ssid?: string;
          password_encrypted?: string;
          security?: "WPA2" | "WPA3" | "open";
          hidden?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      tag: {
        Row: {
          uid: string;
          batch: string | null;
          status: "registered" | "provisioned" | "revoked" | "suspect";
          signature: string | null;
          business_id: string | null;
          wifi_config_id: string | null;
          lock_password_encrypted: string | null;
          registered_at: string;
          provisioned_at: string | null;
        };
        Insert: {
          uid: string;
          batch?: string | null;
          status?: "registered" | "provisioned" | "revoked" | "suspect";
          signature?: string | null;
          business_id?: string | null;
          wifi_config_id?: string | null;
          lock_password_encrypted?: string | null;
          registered_at?: string;
          provisioned_at?: string | null;
        };
        Update: {
          batch?: string | null;
          status?: "registered" | "provisioned" | "revoked" | "suspect";
          signature?: string | null;
          business_id?: string | null;
          wifi_config_id?: string | null;
          lock_password_encrypted?: string | null;
          provisioned_at?: string | null;
        };
        Relationships: [];
      };
      tag_event: {
        Row: {
          id: string;
          tag_uid: string;
          type:
            | "registered"
            | "checked"
            | "provisioned"
            | "rejected"
            | "suspect"
            | "reprovisioned"
            | "released";
          user_id: string | null;
          result: "success" | "failure";
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tag_uid: string;
          type:
            | "registered"
            | "checked"
            | "provisioned"
            | "rejected"
            | "suspect"
            | "reprovisioned"
            | "released";
          user_id?: string | null;
          result: "success" | "failure";
          note?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
  };
};
