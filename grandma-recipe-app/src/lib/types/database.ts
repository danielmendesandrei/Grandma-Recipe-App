export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type GroupRole = "admin" | "member";
export type UnitPreference = "metric" | "imperial";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          preferred_units: UnitPreference;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          preferred_units?: UnitPreference;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_url?: string | null;
          preferred_units?: UnitPreference;
          created_at?: string;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          created_by: string;
          invite_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_by: string;
          invite_code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_by?: string;
          invite_code?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          role: GroupRole;
          joined_at: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
          role?: GroupRole;
          joined_at?: string;
        };
        Update: {
          group_id?: string;
          user_id?: string;
          role?: GroupRole;
          joined_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          color: string | null;
          icon: string | null;
          user_id: string;
          group_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string | null;
          icon?: string | null;
          user_id: string;
          group_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string | null;
          icon?: string | null;
          user_id?: string;
          group_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      recipes: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          photo_url: string | null;
          prep_time_minutes: number | null;
          cook_time_minutes: number | null;
          servings: number;
          notes: string | null;
          source_url: string | null;
          user_id: string;
          group_id: string | null;
          is_public: boolean;
          public_slug: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          photo_url?: string | null;
          prep_time_minutes?: number | null;
          cook_time_minutes?: number | null;
          servings?: number;
          notes?: string | null;
          source_url?: string | null;
          user_id: string;
          group_id?: string | null;
          is_public?: boolean;
          public_slug?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          photo_url?: string | null;
          prep_time_minutes?: number | null;
          cook_time_minutes?: number | null;
          servings?: number;
          notes?: string | null;
          source_url?: string | null;
          user_id?: string;
          group_id?: string | null;
          is_public?: boolean;
          public_slug?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recipe_categories: {
        Row: {
          recipe_id: string;
          category_id: string;
        };
        Insert: {
          recipe_id: string;
          category_id: string;
        };
        Update: {
          recipe_id?: string;
          category_id?: string;
        };
        Relationships: [];
      };
      ingredients: {
        Row: {
          id: string;
          recipe_id: string;
          name: string;
          quantity: number | null;
          unit: string | null;
          order_index: number;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          name: string;
          quantity?: number | null;
          unit?: string | null;
          order_index: number;
        };
        Update: {
          id?: string;
          recipe_id?: string;
          name?: string;
          quantity?: number | null;
          unit?: string | null;
          order_index?: number;
        };
        Relationships: [];
      };
      instructions: {
        Row: {
          id: string;
          recipe_id: string;
          step_number: number;
          text: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          step_number: number;
          text: string;
        };
        Update: {
          id?: string;
          recipe_id?: string;
          step_number?: number;
          text?: string;
        };
        Relationships: [];
      };
      instruction_ingredients: {
        Row: {
          instruction_id: string;
          ingredient_id: string;
          quantity: number | null;
          unit: string | null;
        };
        Insert: {
          instruction_id: string;
          ingredient_id: string;
          quantity?: number | null;
          unit?: string | null;
        };
        Update: {
          instruction_id?: string;
          ingredient_id?: string;
          quantity?: number | null;
          unit?: string | null;
        };
        Relationships: [];
      };
      meal_plans: {
        Row: {
          id: string;
          user_id: string;
          group_id: string | null;
          week_start_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          group_id?: string | null;
          week_start_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          group_id?: string | null;
          week_start_date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      meal_plan_entries: {
        Row: {
          id: string;
          meal_plan_id: string;
          recipe_id: string;
          day_of_week: number;
          meal_type: MealType;
        };
        Insert: {
          id?: string;
          meal_plan_id: string;
          recipe_id: string;
          day_of_week: number;
          meal_type: MealType;
        };
        Update: {
          id?: string;
          meal_plan_id?: string;
          recipe_id?: string;
          day_of_week?: number;
          meal_type?: MealType;
        };
        Relationships: [];
      };
      grocery_lists: {
        Row: {
          id: string;
          name: string;
          user_id: string;
          group_id: string | null;
          meal_plan_id: string | null;
          is_shared: boolean;
          share_code: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          user_id: string;
          group_id?: string | null;
          meal_plan_id?: string | null;
          is_shared?: boolean;
          share_code?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          user_id?: string;
          group_id?: string | null;
          meal_plan_id?: string | null;
          is_shared?: boolean;
          share_code?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      grocery_list_merchants: {
        Row: {
          id: string;
          grocery_list_id: string;
          name: string;
          order_index: number;
        };
        Insert: {
          id?: string;
          grocery_list_id: string;
          name: string;
          order_index: number;
        };
        Update: {
          id?: string;
          grocery_list_id?: string;
          name?: string;
          order_index?: number;
        };
        Relationships: [];
      };
      grocery_list_items: {
        Row: {
          id: string;
          grocery_list_id: string;
          merchant_id: string | null;
          name: string;
          quantity: number | null;
          unit: string | null;
          is_checked: boolean;
          source_recipe_id: string | null;
          is_manual: boolean;
          order_index: number;
        };
        Insert: {
          id?: string;
          grocery_list_id: string;
          merchant_id?: string | null;
          name: string;
          quantity?: number | null;
          unit?: string | null;
          is_checked?: boolean;
          source_recipe_id?: string | null;
          is_manual?: boolean;
          order_index: number;
        };
        Update: {
          id?: string;
          grocery_list_id?: string;
          merchant_id?: string | null;
          name?: string;
          quantity?: number | null;
          unit?: string | null;
          is_checked?: boolean;
          source_recipe_id?: string | null;
          is_manual?: boolean;
          order_index?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      meal_type: MealType;
      group_role: GroupRole;
      unit_preference: UnitPreference;
    };
  };
}

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Group = Database["public"]["Tables"]["groups"]["Row"];
export type GroupMember = Database["public"]["Tables"]["group_members"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Recipe = Database["public"]["Tables"]["recipes"]["Row"];
export type Ingredient = Database["public"]["Tables"]["ingredients"]["Row"];
export type Instruction = Database["public"]["Tables"]["instructions"]["Row"];
export type InstructionIngredient = Database["public"]["Tables"]["instruction_ingredients"]["Row"];
export type MealPlan = Database["public"]["Tables"]["meal_plans"]["Row"];
export type MealPlanEntry = Database["public"]["Tables"]["meal_plan_entries"]["Row"];
export type GroceryList = Database["public"]["Tables"]["grocery_lists"]["Row"];
export type GroceryListMerchant = Database["public"]["Tables"]["grocery_list_merchants"]["Row"];
export type GroceryListItem = Database["public"]["Tables"]["grocery_list_items"]["Row"];

// Extended types for joined queries
export type RecipeWithDetails = Recipe & {
  ingredients: Ingredient[];
  instructions: (Instruction & {
    instruction_ingredients: (InstructionIngredient & {
      ingredient: Ingredient;
    })[];
  })[];
  categories: Category[];
};

export type MealPlanWithEntries = MealPlan & {
  meal_plan_entries: (MealPlanEntry & {
    recipe: Recipe;
  })[];
};

export type GroceryListWithItems = GroceryList & {
  grocery_list_items: GroceryListItem[];
  grocery_list_merchants: GroceryListMerchant[];
};
