"use client";

import { useState } from "react";
import { BookPlus, Check, Loader2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import toast from "react-hot-toast";
import { importRecipeAction } from "./actions";

interface ImportRecipeButtonProps {
  recipeId: string;
  isLoggedIn: boolean;
  isOwner: boolean;
}

export function ImportRecipeButton({
  recipeId,
  isLoggedIn,
  isOwner,
}: ImportRecipeButtonProps) {
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  if (isOwner) return null;

  async function handleImport() {
    if (!isLoggedIn) {
      toast.error("Sign in to save this recipe to your collection");
      return;
    }

    setImporting(true);
    try {
      toast.success("Recipe added to your collection!");
      await importRecipeAction(recipeId);
    } catch (error) {
      // redirect() throws NEXT_REDIRECT — let it propagate
      if (error instanceof Error && error.message === "NEXT_REDIRECT") {
        throw error;
      }
      toast.error(
        error instanceof Error ? error.message : "Failed to import recipe",
      );
      setImporting(false);
    }
  }

  if (imported) {
    return (
      <Button disabled variant="outline" className="w-full">
        <Check className="mr-2 h-4 w-4" />
        Added to your recipes
      </Button>
    );
  }

  return (
    <Button onClick={handleImport} disabled={importing} className="w-full">
      {importing ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <BookPlus className="mr-2 h-4 w-4" />
      )}
      {importing ? "Saving..." : "Add to My Recipes"}
    </Button>
  );
}
