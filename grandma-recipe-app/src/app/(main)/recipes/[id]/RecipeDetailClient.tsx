"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Clock, Users, Edit, Trash2, Share2, ExternalLink, ArrowLeft, FileDown,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/src/components/ui/dialog";
import { IngredientList } from "@/src/components/recipes/IngredientList";
import { InstructionSteps } from "@/src/components/recipes/InstructionSteps";
import { ServingScaler } from "@/src/components/recipes/ServingScaler";
import { SystemToggle } from "@/src/components/recipes/UnitConverter";
import { deleteRecipeAction, togglePublicAction } from "./actions";
import type { RecipeWithDetails, Category } from "@/src/lib/types/database";
import Link from "next/link";

interface RecipeDetailClientProps {
  recipe: RecipeWithDetails;
  isOwner: boolean;
}

export function RecipeDetailClient({ recipe, isOwner }: RecipeDetailClientProps) {
  const router = useRouter();
  const [scaleFactor, setScaleFactor] = useState(1);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [targetSystem, setTargetSystem] = useState<"metric" | "imperial" | null>(null);

  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteRecipeAction(recipe.id);
      toast.success("Recipe deleted");
      router.push("/recipes");
    } catch {
      toast.error("Failed to delete recipe");
      setDeleting(false);
    }
  }

  async function handleTogglePublic() {
    try {
      await togglePublicAction(recipe.id, !recipe.is_public);
      toast.success(recipe.is_public ? "Recipe is now private" : "Recipe is now public!");
      router.refresh();
    } catch {
      toast.error("Failed to update sharing");
    }
  }

  function toggleIngredient(id: string) {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function exportAsPdf() {
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      let y = 20;
      const lineHeight = 7;
      const margin = 15;
      const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;

      function addText(text: string, fontSize: number, bold = false) {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        const lines = doc.splitTextToSize(text, pageWidth);
        for (const line of lines) {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(line, margin, y);
          y += lineHeight;
        }
      }

      addText(recipe.title, 20, true);
      y += 3;
      if (recipe.description) { addText(recipe.description, 11); y += 3; }

      const meta: string[] = [];
      if (recipe.prep_time_minutes) meta.push(`Prep: ${recipe.prep_time_minutes}m`);
      if (recipe.cook_time_minutes) meta.push(`Cook: ${recipe.cook_time_minutes}m`);
      if (totalTime > 0) meta.push(`Total: ${totalTime}m`);
      meta.push(`Servings: ${recipe.servings}`);
      if (meta.length) { addText(meta.join("  |  "), 10); y += 3; }

      addText("Ingredients", 14, true);
      for (const ing of recipe.ingredients) {
        const parts = [ing.quantity?.toString(), ing.unit, ing.name].filter(Boolean).join(" ");
        addText(`• ${parts}`, 10);
      }
      y += 3;

      addText("Instructions", 14, true);
      recipe.instructions.forEach((inst, idx) => {
        addText(`${idx + 1}. ${inst.text}`, 10);
        y += 1;
      });

      if (recipe.notes) {
        y += 3;
        addText("Notes", 14, true);
        addText(recipe.notes, 10);
      }

      doc.save(`${recipe.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
      toast.success("PDF downloaded!");
    } catch {
      toast.error("Failed to export PDF");
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <Link href="/recipes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to recipes
      </Link>

      {/* Hero photo */}
      {recipe.photo_url && (
        <div className="aspect-[16/9] rounded-xl overflow-hidden bg-muted">
          <img
            src={recipe.photo_url}
            alt={recipe.title}
            className="object-cover w-full h-full"
          />
        </div>
      )}

      {/* Title & actions */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{recipe.title}</h1>
          {recipe.description && (
            <p className="text-muted-foreground mt-1">{recipe.description}</p>
          )}
        </div>
        {isOwner && (
          <div className="flex gap-2 shrink-0">
            <Link href={`/recipes/${recipe.id}/edit`}>
              <Button variant="outline" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" size="icon" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleTogglePublic}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={exportAsPdf} title="Export as PDF">
              <FileDown className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Metadata bar */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {recipe.prep_time_minutes && (
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" /> Prep: {recipe.prep_time_minutes} min
          </span>
        )}
        {recipe.cook_time_minutes && (
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" /> Cook: {recipe.cook_time_minutes} min
          </span>
        )}
        {totalTime > 0 && (
          <span className="flex items-center gap-1 font-medium text-foreground">
            Total: {totalTime} min
          </span>
        )}
        <span className="flex items-center gap-1">
          <Users className="h-4 w-4" /> {recipe.servings} servings
        </span>
      </div>

      {/* Categories */}
      {recipe.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {recipe.categories.map((cat) => (
            <Link key={cat.id} href={`/categories/${cat.id}`}>
              <Badge variant="secondary">{cat.name}</Badge>
            </Link>
          ))}
        </div>
      )}

      {/* Source URL */}
      {recipe.source_url && (
        <a
          href={recipe.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Original source
        </a>
      )}

      {/* Public share link */}
      {recipe.is_public && recipe.public_slug && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <span className="text-muted-foreground">Public link: </span>
          <code className="text-primary text-xs break-all">
            {typeof window !== "undefined" ? window.location.origin : ""}/share/recipe/{recipe.public_slug}
          </code>
        </div>
      )}

      <Separator />

      {/* Serving scaler */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold">Ingredients</h2>
        <div className="flex items-center gap-3">
          <SystemToggle targetSystem={targetSystem} onToggle={setTargetSystem} />
          <ServingScaler baseServings={recipe.servings} onChange={setScaleFactor} />
        </div>
      </div>

      {/* Ingredients */}
      <IngredientList
        ingredients={recipe.ingredients}
        scaleFactor={scaleFactor}
        checkedIds={checkedIngredients}
        onToggle={toggleIngredient}
        targetSystem={targetSystem}
      />

      <Separator />

      {/* Instructions */}
      <h2 className="text-lg font-semibold">Instructions</h2>
      <InstructionSteps
        instructions={recipe.instructions}
        scaleFactor={scaleFactor}
      />

      {/* Notes */}
      {recipe.notes && (
        <>
          <Separator />
          <div>
            <h2 className="text-lg font-semibold mb-2">Notes</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {recipe.notes}
            </p>
          </div>
        </>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recipe</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{recipe.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
