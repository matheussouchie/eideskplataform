export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      domains: {
        Row: {
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      departments: {
        Row: {
          created_at: string;
          domain_id: string;
          id: string;
          name: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          domain_id: string;
          id?: string;
          name: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          domain_id?: string;
          id?: string;
          name?: string;
          workspace_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          domain_id: string;
          full_name: string | null;
          id: string;
          is_active: boolean;
          team_id: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          domain_id: string;
          full_name?: string | null;
          id: string;
          is_active?: boolean;
          team_id?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          domain_id?: string;
          full_name?: string | null;
          id?: string;
          is_active?: boolean;
          team_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          created_at: string;
          domain_id: string;
          id: string;
          name: string;
          parent_id: string | null;
        };
        Insert: {
          created_at?: string;
          domain_id: string;
          id?: string;
          name: string;
          parent_id?: string | null;
        };
        Update: {
          created_at?: string;
          domain_id?: string;
          id?: string;
          name?: string;
          parent_id?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          domain_id: string;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          domain_id: string;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          domain_id?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          created_at: string;
          department_id: string;
          domain_id: string;
          id: string;
          name: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          department_id: string;
          domain_id: string;
          id?: string;
          name: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          department_id?: string;
          domain_id?: string;
          id?: string;
          name?: string;
          workspace_id?: string;
        };
        Relationships: [];
      };
      ticket_statuses: {
        Row: {
          created_at: string;
          domain_id: string;
          id: string;
          name: string;
          order: number;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          domain_id: string;
          id?: string;
          name: string;
          order: number;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          domain_id?: string;
          id?: string;
          name?: string;
          order?: number;
          workspace_id?: string;
        };
        Relationships: [];
      };
      workspaces: {
        Row: {
          created_at: string;
          created_by: string;
          domain_id: string;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          domain_id: string;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          domain_id?: string;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_memberships: {
        Row: {
          created_at: string;
          domain_id: string;
          id: number;
          role: Database["public"]["Enums"]["workspace_role"];
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          domain_id: string;
          id?: number;
          role?: Database["public"]["Enums"]["workspace_role"];
          user_id: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          domain_id?: string;
          id?: number;
          role?: Database["public"]["Enums"]["workspace_role"];
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [];
      };
      tickets: {
        Row: {
          assignee_id: string | null;
          assigned_to: string | null;
          category_id: string;
          created_at: string;
          department_id: string;
          description: string;
          domain_id: string;
          id: string;
          priority: Database["public"]["Enums"]["ticket_priority"];
          product_id: string;
          requester_id: string;
          status: Database["public"]["Enums"]["ticket_status"];
          status_id: string;
          team_id: string;
          title: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          assignee_id?: string | null;
          assigned_to?: string | null;
          category_id: string;
          created_at?: string;
          department_id: string;
          description: string;
          domain_id: string;
          id?: string;
          priority?: Database["public"]["Enums"]["ticket_priority"];
          product_id: string;
          requester_id: string;
          status?: Database["public"]["Enums"]["ticket_status"];
          status_id?: string;
          team_id: string;
          title: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          assignee_id?: string | null;
          assigned_to?: string | null;
          category_id?: string;
          created_at?: string;
          department_id?: string;
          description?: string;
          domain_id?: string;
          id?: string;
          priority?: Database["public"]["Enums"]["ticket_priority"];
          product_id?: string;
          requester_id?: string;
          status?: Database["public"]["Enums"]["ticket_status"];
          status_id?: string;
          team_id?: string;
          title?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [];
      };
      ticket_comments: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          domain_id: string;
          id: string;
          internal: boolean;
          ticket_id: string;
          workspace_id: string;
        };
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          domain_id: string;
          id?: string;
          internal?: boolean;
          ticket_id: string;
          workspace_id: string;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          domain_id?: string;
          id?: string;
          internal?: boolean;
          ticket_id?: string;
          workspace_id?: string;
        };
        Relationships: [];
      };
      ticket_attachments: {
        Row: {
          bucket_id: string;
          comment_id: string;
          content_type: string | null;
          created_at: string;
          domain_id: string;
          file_name: string;
          file_size: number;
          id: string;
          storage_path: string;
          ticket_id: string;
          uploaded_by: string;
          workspace_id: string;
        };
        Insert: {
          bucket_id?: string;
          comment_id: string;
          content_type?: string | null;
          created_at?: string;
          domain_id: string;
          file_name: string;
          file_size: number;
          id?: string;
          storage_path: string;
          ticket_id: string;
          uploaded_by: string;
          workspace_id: string;
        };
        Update: {
          bucket_id?: string;
          comment_id?: string;
          content_type?: string | null;
          created_at?: string;
          domain_id?: string;
          file_name?: string;
          file_size?: number;
          id?: string;
          storage_path?: string;
          ticket_id?: string;
          uploaded_by?: string;
          workspace_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      archive_workspace_agent: {
        Args: {
          agent_user_id: string;
          workspace_uuid: string;
        };
        Returns: undefined;
      };
      current_domain_id: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      is_domain_admin: {
        Args: {
          domain_uuid: string;
        };
        Returns: boolean;
      };
      is_domain_member: {
        Args: {
          domain_uuid: string;
        };
        Returns: boolean;
      };
      is_workspace_member: {
        Args: {
          workspace_uuid: string;
        };
        Returns: boolean;
      };
      provision_workspace_agent: {
        Args: {
          agent_full_name: string;
          agent_user_id: string;
          team_uuid: string;
          workspace_uuid: string;
        };
        Returns: undefined;
      };
      update_workspace_agent: {
        Args: {
          active: boolean;
          agent_full_name: string;
          agent_user_id: string;
          team_uuid: string;
          workspace_uuid: string;
        };
        Returns: undefined;
      };
      workspace_user_role: {
        Args: {
          workspace_uuid: string;
        };
        Returns: Database["public"]["Enums"]["workspace_role"] | null;
      };
    };
    Enums: {
      ticket_priority: "low" | "medium" | "high" | "urgent";
      ticket_status: "open" | "in_progress" | "resolved" | "closed";
      workspace_role: "owner" | "admin" | "agent" | "requester";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
