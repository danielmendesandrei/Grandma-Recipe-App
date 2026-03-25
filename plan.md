# Plan: Grandma Recipe App

A full-featured recipe management app built with Next.js 16 + Supabase, deployable on Vercel, usable as a PWA on Android and in desktop browsers. Supports personal and group recipe management, weekly meal planning with grocery list generation, and multi-merchant shopping lists.

## Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui
- **Backend/DB**: Supabase (PostgreSQL + Auth + Storage + Row-Level Security)
- **Auth**: Supabase Auth — email/password + Google OAuth
- **PWA**: next-pwa for Android installability
- **Deployment**: Vercel
- **Extras**: Lucide icons, react-hot-toast, jsPDF + html2canvas (export)

## Database Schema (13 tables)

### profiles
- id (uuid, PK, FK → auth.users.id)
- display_name (text)
- avatar_url (text, nullable)
- preferred_units (enum: 'metric' | 'imperial', default 'metric')
- created_at (timestamptz)

### groups
- id (uuid, PK)
- name (text)
- created_by (uuid, FK → profiles.id)
- invite_code (text, unique, 8-char random)
- created_at (timestamptz)

### group_members
- group_id (uuid, FK → groups.id)
- user_id (uuid, FK → profiles.id)
- role (enum: 'admin' | 'member')
- joined_at (timestamptz)
- PK: (group_id, user_id)

### categories
- id (uuid, PK)
- name (text)
- color (text, nullable — hex color)
- icon (text, nullable — lucide icon name)
- user_id (uuid, FK → profiles.id)
- group_id (uuid, FK → groups.id, nullable) — if set, shared with group
- created_at (timestamptz)

### recipes
- id (uuid, PK)
- title (text, not null)
- description (text, nullable)
- photo_url (text, nullable)
- prep_time_minutes (int, nullable)
- cook_time_minutes (int, nullable)
- servings (int, default 1)
- notes (text, nullable)
- source_url (text, nullable)
- user_id (uuid, FK → profiles.id)
- group_id (uuid, FK → groups.id, nullable)
- is_public (boolean, default false)
- public_slug (text, unique, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)

### recipe_categories (junction)
- recipe_id (uuid, FK → recipes.id ON DELETE CASCADE)
- category_id (uuid, FK → categories.id ON DELETE CASCADE)
- PK: (recipe_id, category_id)

### ingredients
- id (uuid, PK)
- recipe_id (uuid, FK → recipes.id ON DELETE CASCADE)
- name (text, not null)
- quantity (numeric, nullable)
- unit (text, nullable)
- order_index (int)

### instructions
- id (uuid, PK)
- recipe_id (uuid, FK → recipes.id ON DELETE CASCADE)
- step_number (int)
- text (text, not null)

### instruction_ingredients (junction — links ingredients to the step that uses them)
- instruction_id (uuid, FK → instructions.id ON DELETE CASCADE)
- ingredient_id (uuid, FK → ingredients.id ON DELETE CASCADE)
- quantity (numeric, nullable) — portion used in this step (null = "all of it")
- unit (text, nullable) — unit for the portion (null = inherit from ingredient)
- PK: (instruction_id, ingredient_id)

### meal_plans
- id (uuid, PK)
- user_id (uuid, FK → profiles.id)
- group_id (uuid, FK → groups.id, nullable)
- week_start_date (date — always a Monday)
- created_at (timestamptz)
- UNIQUE: (user_id, week_start_date) or (group_id, week_start_date)

### meal_plan_entries
- id (uuid, PK)
- meal_plan_id (uuid, FK → meal_plans.id ON DELETE CASCADE)
- recipe_id (uuid, FK → recipes.id)
- day_of_week (int, 0=Mon...6=Sun)
- meal_type (enum: 'breakfast' | 'lunch' | 'dinner' | 'snack')

### grocery_lists
- id (uuid, PK)
- name (text)
- user_id (uuid, FK → profiles.id)
- group_id (uuid, FK → groups.id, nullable)
- meal_plan_id (uuid, FK → meal_plans.id, nullable)
- is_shared (boolean, default false)
- share_code (text, unique, nullable)
- created_at (timestamptz)

### grocery_list_merchants
- id (uuid, PK)
- grocery_list_id (uuid, FK → grocery_lists.id ON DELETE CASCADE)
- name (text)
- order_index (int)

### grocery_list_items
- id (uuid, PK)
- grocery_list_id (uuid, FK → grocery_lists.id ON DELETE CASCADE)
- merchant_id (uuid, FK → grocery_list_merchants.id, nullable) — null = general/unassigned
- name (text, not null)
- quantity (numeric, nullable)
- unit (text, nullable)
- is_checked (boolean, default false)
- source_recipe_id (uuid, FK → recipes.id, nullable)
- is_manual (boolean, default false)
- order_index (int)

## RLS Policies (Key rules)
- **Recipes**: Owner can CRUD. Group members can read/create if group_id matches. Public recipes (is_public=true) readable by anyone via public_slug.
- **Groups**: Members can read. Admin can update/delete. Creator is first admin.
- **Meal Plans**: Owner or group members can CRUD.
- **Grocery Lists**: Owner or group members can CRUD. Shared lists readable by anyone with share_code.
- **Categories**: Owner can CRUD. Group categories visible to group members.
- **Profiles**: Owner can read/update own profile. Other users can read display_name + avatar.

## Route Structure (App Router)

```
src/app/
├── (auth)/
│   ├── login/page.tsx
│   └── signup/page.tsx
├── (main)/                    ← authenticated layout with nav
│   ├── layout.tsx             ← sidebar/bottom nav shell
│   ├── page.tsx               ← dashboard/home
│   ├── recipes/
│   │   ├── page.tsx           ← browse/search recipes
│   │   ├── new/page.tsx       ← create recipe
│   │   └── [id]/
│   │       ├── page.tsx       ← view recipe detail
│   │       └── edit/page.tsx  ← edit recipe
│   ├── categories/
│   │   ├── page.tsx           ← manage categories
│   │   └── [id]/page.tsx      ← recipes in category
│   ├── meal-plan/
│   │   └── page.tsx           ← weekly planner
│   ├── grocery-list/
│   │   ├── page.tsx           ← all grocery lists
│   │   └── [id]/page.tsx      ← specific list with merchants
│   ├── groups/
│   │   ├── page.tsx           ← my groups
│   │   └── [id]/page.tsx      ← group detail + members
│   └── settings/
│       └── page.tsx           ← profile, units, preferences
├── share/
│   ├── recipe/[slug]/page.tsx ← public recipe view (no auth)
│   └── grocery/[code]/page.tsx← shared grocery list (no auth)
├── join/[code]/page.tsx       ← join group by invite link (no auth → auth redirect)
```

## Key Shared Code

```
src/
├── lib/
│   ├── supabase/
│   │   ├── client.ts          ← browser Supabase client
│   │   ├── server.ts          ← server-side Supabase client
│   │   └── middleware.ts      ← auth session refresh
│   ├── utils/
│   │   ├── units.ts           ← metric↔imperial conversion maps
│   │   ├── scaling.ts         ← serving size scaling logic
│   │   └── grocery.ts         ← ingredient consolidation logic
│   └── types/
│       └── database.ts        ← generated Supabase types
├── components/
│   ├── ui/                    ← shadcn/ui components
│   ├── recipes/
│   │   ├── RecipeCard.tsx
│   │   ├── RecipeForm.tsx
│   │   ├── IngredientList.tsx
│   │   ├── InstructionSteps.tsx
│   │   └── StepIngredientChips.tsx  ← inline ingredient badges per step
│   ├── meal-plan/
│   │   ├── WeekGrid.tsx
│   │   └── MealSlot.tsx
│   ├── grocery/
│   │   ├── GroceryItem.tsx
│   │   └── MerchantSection.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── BottomNav.tsx      ← mobile bottom navigation
│   │   └── Sidebar.tsx        ← desktop sidebar
│   └── auth/
│       └── AuthForm.tsx
├── hooks/
│   ├── useRecipes.ts
│   ├── useMealPlan.ts
│   └── useGroceryList.ts
├── middleware.ts              ← Next.js middleware for auth guard
```

## Implementation Phases

### Phase 1: Foundation & Auth (Steps 1–6)
1. Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`, shadcn/ui init, `lucide-react`, `react-hot-toast`
2. Set up Supabase project: create project in Supabase dashboard, get URL + anon key, create `.env.local`
3. Create Supabase client utilities: `lib/supabase/client.ts` (createBrowserClient), `lib/supabase/server.ts` (createServerClient with cookies)
4. Create `middleware.ts` at project root for auth session refresh on every request (standard Supabase SSR pattern)
5. Create database schema: run SQL migration in Supabase SQL editor for all tables, enums, indexes, and RLS policies
6. Build auth pages: login + signup with email/password and Google OAuth button; redirect to dashboard on success; handle errors with toast notifications

### Phase 2: Layout & Navigation (Steps 7–9)
7. Install and configure shadcn/ui components: Button, Input, Card, Dialog, DropdownMenu, Select, Tabs, Sheet, Checkbox, Label, Textarea, Badge, Avatar, Separator, Skeleton
8. Build responsive app shell: sidebar for desktop (≥768px), bottom tab nav for mobile (<768px); tabs = Home, Recipes, Meal Plan, Grocery, Settings
9. Build dashboard/home page: recent recipes (last 5), quick-add recipe button, this week's meal plan summary, active grocery list summary

### Phase 3: Recipe CRUD (Steps 10–15) — *depends on Phase 1 & 2*
10. Create recipe form component (`RecipeForm.tsx`): title, description, photo upload (to Supabase Storage `recipe-photos` bucket), prep/cook time, servings, source URL, notes, dynamic ingredient list (add/remove/reorder), dynamic instruction steps (add/remove/reorder) with per-step ingredient linking, category multi-select. **Ingredient-step linking**: as the user types a step, auto-detect mentions of ingredient names and suggest linking them (fuzzy match against the recipe's ingredient list). User can accept/dismiss auto-suggestions, or manually attach ingredients to a step via a dropdown/chip selector. For each linked ingredient, user can specify the portion used in that step (e.g., "½ of the onions") or leave blank to mean "all of it".
11. Build "Create Recipe" page using RecipeForm — Server Action to insert recipe + ingredients + instructions + category associations in a transaction
12. Build "View Recipe" page: hero photo, metadata bar (prep/cook/servings), ingredient list with unit toggle and serving scaler, numbered instructions with **inline ingredient chips** below each step (showing name + quantity needed for that step, respecting the current unit toggle and serving scale), edit/delete actions (owner only), share button
13. Build "Edit Recipe" page: pre-populate RecipeForm with existing data, Server Action to update
14. Build "Delete Recipe": confirmation dialog, cascade delete via FK
15. Build "Recipes" browse page: grid of RecipeCards, search bar (searches title + ingredient names via Supabase full-text or ILIKE), filter by category dropdown, sort by (newest, A-Z, cook time)

### Phase 4: Categories (Steps 16–18) — *parallel with Phase 3*
16. Build category management page: list existing categories with edit/delete, create new category form (name, optional color)
17. Build category detail page: show recipes in that category as a grid
18. Integrate category selection into RecipeForm (multi-select, option to create new inline)

### Phase 5: Meal Planning (Steps 19–22) — *depends on Phase 3*
19. Build WeekGrid component: 7 columns (Mon-Sun) × 3-4 rows (Breakfast, Lunch, Dinner, Snack); each cell shows recipe card thumbnail or empty "+" button; week navigation (prev/next week arrows, "this week" shortcut)
20. Build "Add recipe to slot" flow: clicking "+" opens a dialog/sheet with recipe search/browse; select a recipe → creates meal_plan_entry
21. Remove recipe from slot: click on filled slot → option to remove
22. Auto-create/navigate meal plans: if no plan exists for the selected week, create one on first recipe assignment

### Phase 6: Grocery List (Steps 23–28) — *depends on Phase 5*
23. Build "Generate from Meal Plan" action: collects all ingredients from all recipes in the current week's meal plan; consolidates duplicates by matching ingredient name (case-insensitive, trimmed); sums quantities when units match; creates grocery_list + grocery_list_items
24. Build grocery list view page: checklist of items grouped by assigned merchant (or "General" if none); each item shows checkbox, name, quantity+unit, and source recipe badge
25. Build "check off" interaction: toggle is_checked with optimistic UI update
26. Build manual item addition: text input at bottom of list to add custom items
27. Build merchant management: "Add Store" button → creates a merchant; drag/long-press items to move between general ↔ merchant sub-lists; reorder merchants
28. Build share grocery list: toggle "Share" → generates a public link with share_code; shared view is read-only but allows checking items (via share_code auth)

### Phase 7: Groups & Sharing (Steps 29–34) — *depends on Phase 3*
29. Build group creation page: name input → generates invite_code; creator becomes admin
30. Build group detail page: member list with roles, invite link display/copy, leave/delete group
31. Build join flow: `/join/[code]` page validates code, adds user as member, redirects to group
32. Add group context to recipes: when creating a recipe, option to assign it to a group; group recipes visible to all members; filter recipes page by "My Recipes" vs group name
33. Build public recipe sharing: "Share" button on recipe detail → toggle is_public, generate public_slug; public page at `/share/recipe/[slug]` with full recipe view (no auth needed, read-only)
34. Build recipe export: "Export as PDF" button → generates a styled PDF via jsPDF; "Export as Image" button → captures recipe card as PNG via html2canvas

### Phase 8: Polish & PWA (Steps 35–40)
35. Add PWA support: web manifest (name, icons, theme color), service worker via next-pwa, "Add to Home Screen" prompt on Android
36. Implement unit conversion toggle: global toggle in settings (preferred_units); recipe detail page shows ingredients in selected unit system; conversion utility handles common cooking units (cups↔ml, oz↔g, °F↔°C, lb↔kg, tsp↔ml, tbsp↔ml)
37. Implement serving scaler: stepper control on recipe detail to adjust servings; multiply all ingredient quantities proportionally; display scaled quantities
38. Add loading skeletons for all pages (Skeleton from shadcn), error boundaries, and empty states (e.g., "No recipes yet — add your first!")
39. Add toast notifications for all mutations (create/update/delete success/error)
40. Responsive design QA: test all pages at mobile (375px), tablet (768px), desktop (1280px) breakpoints; ensure touch targets ≥44px on mobile

## Supabase Storage
- Bucket: `recipe-photos` (public, max 5MB, image/* only)
- Path pattern: `{user_id}/{recipe_id}/{filename}`
- Use Supabase Storage policies: authenticated users can upload to their own folder, anyone can read public recipe photos

## Key UX Details
- **Inline step ingredients**: each instruction step displays small chips/badges below the step text showing the ingredients needed for that step with their quantities. Auto-detected from step text during creation (fuzzy match against recipe's ingredient list — handles plurals, abbreviations like "onion" matching "onions", "tomato" matching "tomatoes"). User can manually add/remove/adjust linked ingredients. Quantities scale with the serving scaler and convert with the unit toggle. Chips are tappable on mobile to highlight the ingredient in the full list above.
- **Search by ingredient**: query `ingredients` table with ILIKE on `name`, join to get parent recipes
- **Ingredient consolidation**: group by normalized ingredient name (lowercase, trimmed), sum quantities when units match, list separately when units differ
- **Optimistic updates**: check off grocery items instantly, sync in background
- **Mobile-first**: bottom nav with 5 tabs, swipe-friendly card layouts, large touch targets
- **Design language**: clean whites/creams, warm accent color (terracotta/amber), card-based recipe grid with prominent photos, rounded corners, gentle shadows — inspired by NYT Cooking / Julienne aesthetic

## Verification Checklist
1. **Auth**: sign up with email → verify → login works; login with Google works; session persists across page reloads; middleware redirects unauthenticated to /login
2. **Recipe CRUD**: create recipe with all fields + photo → appears in list; edit updates correctly; delete removes recipe and cascades to ingredients/instructions
3. **Search**: type ingredient name (e.g., "chicken") → shows all recipes containing chicken in ingredients
4. **Categories**: create category → assign recipes → browse by category shows correct recipes; delete category does not delete recipes
5. **Meal Plan**: add recipes to 3+ slots across different days → grid displays correctly; navigate between weeks → persists data
6. **Grocery List**: generate from meal plan → all ingredients appear; duplicate ingredients consolidated; check off items → persists; add manual items; create merchant → move items between merchants
7. **Groups**: create group → invite link works → second user joins → shared recipes visible to both
8. **Sharing**: make recipe public → public link accessible without login; export as PDF/image produces readable output
9. **PWA**: on Android Chrome → "Add to Home Screen" prompt appears; app launches in standalone mode
10. **Responsive**: all pages functional at 375px, 768px, 1280px widths
11. **RLS**: user A cannot see user B's private recipes via direct API call; group members can see group recipes; non-members cannot

## Decisions & Out-of-Scope for MVP
- No recipe import from URL — marked as future feature
- English only for MVP
- No offline editing — PWA caches for read-only viewing of previously loaded recipes
- No nutritional info or difficulty level for MVP
- Grocery list sharing is via public link (read + check off); no real-time collaboration for MVP
- Merchant assignment is manual (drag items between lists), not category-based defaults

## Future Considerations (v2)
- **Real-time grocery list sync** — Supabase Realtime for live check-off sync between family members shopping together
- **Recipe photos per instruction step** — instructions table could gain a `photo_url` column
- **Dark mode** — Tailwind + shadcn/ui support it natively; add toggle in settings
- **Recipe import from URL** — parse structured data (JSON-LD) from recipe websites
- **Multi-language support** — i18n framework for Spanish + other languages
