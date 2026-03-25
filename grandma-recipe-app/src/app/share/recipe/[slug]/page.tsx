import { createClient } from "@/src/lib/supabase/server";
import { notFound } from "next/navigation";
import { Clock, Users } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import type { RecipeWithDetails } from "@/src/lib/types/database";

export default async function PublicRecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: recipe, error } = await supabase
    .from("recipes")
    .select(
      `
      *,
      ingredients ( * ),
      instructions (
        *,
        instruction_ingredients (
          *,
          ingredient:ingredients ( * )
        )
      )
    `
    )
    .eq("public_slug", slug)
    .eq("is_public", true)
    .single();

  if (error || !recipe) notFound();

  const r = recipe as any;

  // Fetch categories
  const { data: recipeCats } = await supabase
    .from("recipe_categories")
    .select("categories ( * )")
    .eq("recipe_id", r.id);

  const categories =
    recipeCats?.map((rc: any) => rc.categories).filter(Boolean) ?? [];

  const ingredients = [...(r.ingredients ?? [])].sort(
    (a: any, b: any) => a.order_index - b.order_index
  );
  const instructions = [...(r.instructions ?? [])].sort(
    (a: any, b: any) => a.step_number - b.step_number
  );

  const totalTime =
    (r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        {/* Hero photo */}
        {r.photo_url && (
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <img
              src={r.photo_url}
              alt={r.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div>
          <h1 className="text-3xl font-bold text-foreground">{r.title}</h1>
          {r.description && (
            <p className="text-muted-foreground mt-2">{r.description}</p>
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {r.prep_time_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Prep: {r.prep_time_minutes}m
            </span>
          )}
          {r.cook_time_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Cook: {r.cook_time_minutes}m
            </span>
          )}
          {totalTime > 0 && (
            <span className="font-medium">Total: {totalTime}m</span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {r.servings} servings
          </span>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat: any) => (
              <Badge key={cat.id} variant="secondary">
                {cat.name}
              </Badge>
            ))}
          </div>
        )}

        <Separator />

        {/* Ingredients */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Ingredients</h2>
          <ul className="space-y-2">
            {ingredients.map((ing: any) => (
              <li key={ing.id} className="flex items-center gap-2 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {ing.quantity != null && (
                  <span className="font-medium">{ing.quantity}</span>
                )}
                {ing.unit && (
                  <span className="text-muted-foreground">{ing.unit}</span>
                )}
                <span>{ing.name}</span>
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        {/* Instructions */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Instructions</h2>
          <ol className="space-y-4">
            {instructions.map((inst: any, idx: number) => (
              <li key={inst.id} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  {idx + 1}
                </span>
                <div>
                  <p className="text-sm">{inst.text}</p>
                  {inst.instruction_ingredients?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {inst.instruction_ingredients.map((link: any) => (
                        <Badge
                          key={`${link.instruction_id}-${link.ingredient_id}`}
                          variant="outline"
                          className="text-xs"
                        >
                          {link.ingredient?.name}
                          {link.quantity != null && ` (${link.quantity}${link.unit ? ` ${link.unit}` : ""})`}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Notes */}
        {r.notes && (
          <>
            <Separator />
            <div>
              <h2 className="text-xl font-semibold mb-2">Notes</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {r.notes}
              </p>
            </div>
          </>
        )}

        <Separator />
        <p className="text-center text-xs text-muted-foreground">
          Shared from Grandma&apos;s Recipe App
        </p>
      </div>
    </div>
  );
}
