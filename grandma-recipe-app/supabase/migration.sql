-- ============================================================
-- Grandma Recipe App — Full Database Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ========================
-- 1. Custom ENUM Types
-- ========================
CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
CREATE TYPE group_role AS ENUM ('admin', 'member');
CREATE TYPE unit_preference AS ENUM ('metric', 'imperial');

-- ========================
-- 2. Tables
-- ========================

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  preferred_units unit_preference NOT NULL DEFAULT 'metric',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Groups
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Group Members
CREATE TABLE group_members (
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role group_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recipes
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  servings INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  source_url TEXT,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  public_slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recipe ↔ Category junction
CREATE TABLE recipe_categories (
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, category_id)
);

-- Ingredients
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC,
  unit TEXT,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Instructions
CREATE TABLE instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  text TEXT NOT NULL
);

-- Instruction ↔ Ingredient junction (per-step ingredient usage)
CREATE TABLE instruction_ingredients (
  instruction_id UUID NOT NULL REFERENCES instructions(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity NUMERIC,
  unit TEXT,
  PRIMARY KEY (instruction_id, ingredient_id)
);

-- Meal Plans
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  week_start_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start_date)
);

-- Meal Plan Entries
CREATE TABLE meal_plan_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  meal_type meal_type NOT NULL
);

-- Grocery Lists
CREATE TABLE grocery_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE SET NULL,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  share_code TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grocery List Merchants
CREATE TABLE grocery_list_merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grocery_list_id UUID NOT NULL REFERENCES grocery_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Grocery List Items
CREATE TABLE grocery_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grocery_list_id UUID NOT NULL REFERENCES grocery_lists(id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES grocery_list_merchants(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity NUMERIC,
  unit TEXT,
  is_checked BOOLEAN NOT NULL DEFAULT false,
  source_recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  is_manual BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- ========================
-- 3. Indexes
-- ========================
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_group_id ON recipes(group_id);
CREATE INDEX idx_recipes_public_slug ON recipes(public_slug) WHERE public_slug IS NOT NULL;
CREATE INDEX idx_recipes_is_public ON recipes(is_public) WHERE is_public = true;
CREATE INDEX idx_ingredients_recipe_id ON ingredients(recipe_id);
CREATE INDEX idx_ingredients_name ON ingredients(name);
CREATE INDEX idx_instructions_recipe_id ON instructions(recipe_id);
CREATE INDEX idx_instruction_ingredients_instruction_id ON instruction_ingredients(instruction_id);
CREATE INDEX idx_instruction_ingredients_ingredient_id ON instruction_ingredients(ingredient_id);
CREATE INDEX idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX idx_meal_plan_entries_meal_plan_id ON meal_plan_entries(meal_plan_id);
CREATE INDEX idx_grocery_lists_user_id ON grocery_lists(user_id);
CREATE INDEX idx_grocery_list_items_list_id ON grocery_list_items(grocery_list_id);
CREATE INDEX idx_grocery_list_items_merchant_id ON grocery_list_items(merchant_id);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);

-- ========================
-- 4. Auto-update updated_at trigger
-- ========================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ========================
-- 5. Auto-create profile on signup
-- ========================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ========================
-- 6. Security-definer helper (avoids infinite RLS recursion)
-- ========================
CREATE OR REPLACE FUNCTION public.get_my_group_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT group_id FROM group_members WHERE user_id = auth.uid();
$$;

-- ========================
-- 7. Row Level Security
-- ========================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruction_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_list_merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_list_items ENABLE ROW LEVEL SECURITY;

-- ---- PROFILES ----
CREATE POLICY "Users can view any profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ---- GROUPS ----
CREATE POLICY "Group members can view their groups"
  ON groups FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT public.get_my_group_ids())
  );

CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group admins can update their groups"
  ON groups FOR UPDATE
  TO authenticated
  USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Group admins can delete their groups"
  ON groups FOR DELETE
  TO authenticated
  USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ---- GROUP MEMBERS ----
CREATE POLICY "Group members can view members of their groups"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    group_id IN (SELECT public.get_my_group_ids())
  );

CREATE POLICY "Users can join groups (insert themselves)"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups (delete themselves) or admins can remove"
  ON group_members FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR group_id IN (SELECT public.get_my_group_ids())
  );

-- ---- CATEGORIES ----
CREATE POLICY "Users can view own categories and group categories"
  ON categories FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR group_id IN (SELECT public.get_my_group_ids())
  );

CREATE POLICY "Users can create categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ---- RECIPES ----
CREATE POLICY "Users can view own recipes, group recipes, and public recipes"
  ON recipes FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_public = true
    OR group_id IN (SELECT public.get_my_group_ids())
  );

CREATE POLICY "Users can create recipes"
  ON recipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes"
  ON recipes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own recipes"
  ON recipes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ---- RECIPE CATEGORIES ----
CREATE POLICY "Users can view recipe_categories for visible recipes"
  ON recipe_categories FOR SELECT
  USING (
    recipe_id IN (
      SELECT id FROM recipes WHERE user_id = auth.uid()
        OR is_public = true
        OR group_id IN (SELECT public.get_my_group_ids())
    )
  );

CREATE POLICY "Users can manage recipe_categories for own recipes"
  ON recipe_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    recipe_id IN (SELECT id FROM recipes WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete recipe_categories for own recipes"
  ON recipe_categories FOR DELETE
  TO authenticated
  USING (
    recipe_id IN (SELECT id FROM recipes WHERE user_id = auth.uid())
  );

-- ---- INGREDIENTS ----
CREATE POLICY "Users can view ingredients for visible recipes"
  ON ingredients FOR SELECT
  USING (
    recipe_id IN (
      SELECT id FROM recipes WHERE user_id = auth.uid()
        OR is_public = true
        OR group_id IN (SELECT public.get_my_group_ids())
    )
  );

CREATE POLICY "Users can manage ingredients for own recipes"
  ON ingredients FOR INSERT
  TO authenticated
  WITH CHECK (
    recipe_id IN (SELECT id FROM recipes WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update ingredients for own recipes"
  ON ingredients FOR UPDATE
  TO authenticated
  USING (recipe_id IN (SELECT id FROM recipes WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete ingredients for own recipes"
  ON ingredients FOR DELETE
  TO authenticated
  USING (recipe_id IN (SELECT id FROM recipes WHERE user_id = auth.uid()));

-- ---- INSTRUCTIONS ----
CREATE POLICY "Users can view instructions for visible recipes"
  ON instructions FOR SELECT
  USING (
    recipe_id IN (
      SELECT id FROM recipes WHERE user_id = auth.uid()
        OR is_public = true
        OR group_id IN (SELECT public.get_my_group_ids())
    )
  );

CREATE POLICY "Users can manage instructions for own recipes"
  ON instructions FOR INSERT
  TO authenticated
  WITH CHECK (
    recipe_id IN (SELECT id FROM recipes WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update instructions for own recipes"
  ON instructions FOR UPDATE
  TO authenticated
  USING (recipe_id IN (SELECT id FROM recipes WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete instructions for own recipes"
  ON instructions FOR DELETE
  TO authenticated
  USING (recipe_id IN (SELECT id FROM recipes WHERE user_id = auth.uid()));

-- ---- INSTRUCTION INGREDIENTS ----
CREATE POLICY "Users can view instruction_ingredients for visible recipes"
  ON instruction_ingredients FOR SELECT
  USING (
    instruction_id IN (
      SELECT i.id FROM instructions i
      JOIN recipes r ON r.id = i.recipe_id
      WHERE r.user_id = auth.uid()
        OR r.is_public = true
        OR r.group_id IN (SELECT public.get_my_group_ids())
    )
  );

CREATE POLICY "Users can manage instruction_ingredients for own recipes"
  ON instruction_ingredients FOR INSERT
  TO authenticated
  WITH CHECK (
    instruction_id IN (
      SELECT i.id FROM instructions i
      JOIN recipes r ON r.id = i.recipe_id
      WHERE r.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update instruction_ingredients for own recipes"
  ON instruction_ingredients FOR UPDATE
  TO authenticated
  USING (
    instruction_id IN (
      SELECT i.id FROM instructions i
      JOIN recipes r ON r.id = i.recipe_id
      WHERE r.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete instruction_ingredients for own recipes"
  ON instruction_ingredients FOR DELETE
  TO authenticated
  USING (
    instruction_id IN (
      SELECT i.id FROM instructions i
      JOIN recipes r ON r.id = i.recipe_id
      WHERE r.user_id = auth.uid()
    )
  );

-- ---- MEAL PLANS ----
CREATE POLICY "Users can view own and group meal plans"
  ON meal_plans FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR group_id IN (SELECT public.get_my_group_ids())
  );

CREATE POLICY "Users can create meal plans"
  ON meal_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans"
  ON meal_plans FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own meal plans"
  ON meal_plans FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ---- MEAL PLAN ENTRIES ----
CREATE POLICY "Users can view entries for their meal plans"
  ON meal_plan_entries FOR SELECT
  TO authenticated
  USING (
    meal_plan_id IN (
      SELECT id FROM meal_plans WHERE user_id = auth.uid()
        OR group_id IN (SELECT public.get_my_group_ids())
    )
  );

CREATE POLICY "Users can manage entries for own meal plans"
  ON meal_plan_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    meal_plan_id IN (SELECT id FROM meal_plans WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update entries for own meal plans"
  ON meal_plan_entries FOR UPDATE
  TO authenticated
  USING (meal_plan_id IN (SELECT id FROM meal_plans WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete entries for own meal plans"
  ON meal_plan_entries FOR DELETE
  TO authenticated
  USING (meal_plan_id IN (SELECT id FROM meal_plans WHERE user_id = auth.uid()));

-- ---- GROCERY LISTS ----
CREATE POLICY "Users can view own grocery lists, group lists, and shared lists"
  ON grocery_lists FOR SELECT
  USING (
    user_id = auth.uid()
    OR group_id IN (SELECT public.get_my_group_ids())
    OR (is_shared = true AND share_code IS NOT NULL)
  );

CREATE POLICY "Users can create grocery lists"
  ON grocery_lists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own grocery lists"
  ON grocery_lists FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own grocery lists"
  ON grocery_lists FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ---- GROCERY LIST MERCHANTS ----
CREATE POLICY "Users can view merchants for their grocery lists"
  ON grocery_list_merchants FOR SELECT
  USING (
    grocery_list_id IN (
      SELECT id FROM grocery_lists WHERE user_id = auth.uid()
        OR group_id IN (SELECT public.get_my_group_ids())
        OR (is_shared = true AND share_code IS NOT NULL)
    )
  );

CREATE POLICY "Users can manage merchants for own grocery lists"
  ON grocery_list_merchants FOR INSERT
  TO authenticated
  WITH CHECK (
    grocery_list_id IN (SELECT id FROM grocery_lists WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update merchants for own grocery lists"
  ON grocery_list_merchants FOR UPDATE
  TO authenticated
  USING (grocery_list_id IN (SELECT id FROM grocery_lists WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete merchants for own grocery lists"
  ON grocery_list_merchants FOR DELETE
  TO authenticated
  USING (grocery_list_id IN (SELECT id FROM grocery_lists WHERE user_id = auth.uid()));

-- ---- GROCERY LIST ITEMS ----
CREATE POLICY "Users can view items for their grocery lists"
  ON grocery_list_items FOR SELECT
  USING (
    grocery_list_id IN (
      SELECT id FROM grocery_lists WHERE user_id = auth.uid()
        OR group_id IN (SELECT public.get_my_group_ids())
        OR (is_shared = true AND share_code IS NOT NULL)
    )
  );

CREATE POLICY "Users can manage items for own grocery lists"
  ON grocery_list_items FOR INSERT
  TO authenticated
  WITH CHECK (
    grocery_list_id IN (SELECT id FROM grocery_lists WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update items for accessible grocery lists"
  ON grocery_list_items FOR UPDATE
  USING (
    grocery_list_id IN (
      SELECT id FROM grocery_lists WHERE user_id = auth.uid()
        OR group_id IN (SELECT public.get_my_group_ids())
        OR (is_shared = true AND share_code IS NOT NULL)
    )
  );

CREATE POLICY "Users can delete items for own grocery lists"
  ON grocery_list_items FOR DELETE
  TO authenticated
  USING (grocery_list_id IN (SELECT id FROM grocery_lists WHERE user_id = auth.uid()));

-- ========================
-- 7. Storage Bucket
-- ========================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('recipe-photos', 'recipe-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- Storage policies
CREATE POLICY "Authenticated users can upload recipe photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'recipe-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view recipe photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recipe-photos');

CREATE POLICY "Users can update their own recipe photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'recipe-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own recipe photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'recipe-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
