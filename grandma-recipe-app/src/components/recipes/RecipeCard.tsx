import Link from "next/link";
import { Clock, Users } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import type { Recipe, Category } from "@/src/lib/types/database";

interface RecipeCardProps {
  recipe: Recipe & { categories?: Category[] };
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const totalTime =
    (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);

  return (
    <Link href={`/recipes/${recipe.id}`}>
      <Card className="overflow-hidden transition-shadow hover:shadow-lg group cursor-pointer h-full">
        <div className="aspect-[4/3] relative bg-muted overflow-hidden">
          {recipe.photo_url ? (
            <img
              src={recipe.photo_url}
              alt={recipe.title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <span className="text-4xl">🍳</span>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-base line-clamp-1 mb-1">{recipe.title}</h3>
          {recipe.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {recipe.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {totalTime > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {totalTime} min
              </span>
            )}
            {recipe.servings > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {recipe.servings}
              </span>
            )}
          </div>
          {recipe.categories && recipe.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {recipe.categories.slice(0, 3).map((cat) => (
                <Badge key={cat.id} variant="secondary" className="text-xs">
                  {cat.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
