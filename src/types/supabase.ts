export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type GenericRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          role: "customer" | "farmer" | "admin";
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          role: "customer" | "farmer" | "admin";
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: "customer" | "farmer" | "admin";
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      farmer_applications: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          phone: string;
          farm_name: string;
          city: string;
          products: string;
          experience: string | null;
          bio: string | null;
          status: "pending" | "approved" | "rejected";
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          phone: string;
          farm_name: string;
          city: string;
          products: string;
          experience?: string | null;
          bio?: string | null;
          status?: "pending" | "approved" | "rejected";
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          phone?: string;
          farm_name?: string;
          city?: string;
          products?: string;
          experience?: string | null;
          bio?: string | null;
          status?: "pending" | "approved" | "rejected";
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, {
      Row: Record<string, unknown>;
    }>;
    Functions: Record<string, {
      Args: Record<string, unknown>;
      Returns: unknown;
    }>;
    Enums: Record<string, string[]>;
    CompositeTypes: Record<string, {
      [key: string]: unknown;
    }>;
  };
}
