"use client";

import { useState, useCallback } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import {
  Plus, Trash2, GripVertical, Upload, Clock, Users, Link as LinkIcon, X,
} from "lucide-react";
import type { Category } from "@/src/lib/types/database";

// ---- Types ----
export interface IngredientInput {
  tempId: string;
  name: string;
  quantity: string;
  unit: string;
}

export interface StepIngredientLink {
  ingredientTempId: string;
  quantity: string;
  unit: string;
}

export interface InstructionInput {
  tempId: string;
  text: string;
  linkedIngredients: StepIngredientLink[];
}

export interface RecipeFormData {
  title: string;
  description: string;
  photo: File | null;
  existingPhotoUrl: string | null;
  prepTime: string;
  cookTime: string;
  servings: string;
  sourceUrl: string;
  notes: string;
  ingredients: IngredientInput[];
  instructions: InstructionInput[];
  categoryIds: string[];
}

interface RecipeFormProps {
  initialData?: Partial<RecipeFormData>;
  categories: Category[];
  onSubmit: (data: RecipeFormData) => Promise<void>;
  submitLabel: string;
}

let nextTempId = 1;
function genTempId() {
  return `temp_${nextTempId++}`;
}

function createEmptyIngredient(): IngredientInput {
  return { tempId: genTempId(), name: "", quantity: "", unit: "" };
}

function createEmptyInstruction(): InstructionInput {
  return { tempId: genTempId(), text: "", linkedIngredients: [] };
}

// Fuzzy match: checks if ingredient name appears in step text
// Handles plurals (onion/onions), case insensitive
function findIngredientMentions(
  stepText: string,
  ingredients: IngredientInput[]
): IngredientInput[] {
  if (!stepText.trim()) return [];
  const lower = stepText.toLowerCase();
  return ingredients.filter((ing) => {
    if (!ing.name.trim()) return false;
    const name = ing.name.toLowerCase().trim();
    // Check exact, plural (s), plural (es)
    return (
      lower.includes(name) ||
      lower.includes(name + "s") ||
      lower.includes(name + "es") ||
      (name.endsWith("s") && lower.includes(name.slice(0, -1))) ||
      (name.endsWith("es") && lower.includes(name.slice(0, -2)))
    );
  });
}

export function RecipeForm({ initialData, categories, onSubmit, submitLabel }: RecipeFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [photo, setPhoto] = useState<File | null>(initialData?.photo ?? null);
  const [existingPhotoUrl] = useState(initialData?.existingPhotoUrl ?? null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    initialData?.existingPhotoUrl ?? null
  );
  const [prepTime, setPrepTime] = useState(initialData?.prepTime ?? "");
  const [cookTime, setCookTime] = useState(initialData?.cookTime ?? "");
  const [servings, setServings] = useState(initialData?.servings ?? "4");
  const [sourceUrl, setSourceUrl] = useState(initialData?.sourceUrl ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [ingredients, setIngredients] = useState<IngredientInput[]>(
    initialData?.ingredients?.length ? initialData.ingredients : [createEmptyIngredient()]
  );
  const [instructions, setInstructions] = useState<InstructionInput[]>(
    initialData?.instructions?.length ? initialData.instructions : [createEmptyInstruction()]
  );
  const [categoryIds, setCategoryIds] = useState<string[]>(
    initialData?.categoryIds ?? []
  );
  const [submitting, setSubmitting] = useState(false);

  // ---- Photo handling ----
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }

  // ---- Ingredient CRUD ----
  function addIngredient() {
    setIngredients((prev) => [...prev, createEmptyIngredient()]);
  }
  function removeIngredient(tempId: string) {
    setIngredients((prev) => prev.filter((i) => i.tempId !== tempId));
    // Also remove from all instruction links
    setInstructions((prev) =>
      prev.map((inst) => ({
        ...inst,
        linkedIngredients: inst.linkedIngredients.filter(
          (li) => li.ingredientTempId !== tempId
        ),
      }))
    );
  }
  function updateIngredient(tempId: string, field: keyof IngredientInput, value: string) {
    setIngredients((prev) =>
      prev.map((i) => (i.tempId === tempId ? { ...i, [field]: value } : i))
    );
  }

  // ---- Instruction CRUD ----
  function addInstruction() {
    setInstructions((prev) => [...prev, createEmptyInstruction()]);
  }
  function removeInstruction(tempId: string) {
    setInstructions((prev) => prev.filter((i) => i.tempId !== tempId));
  }
  function updateInstructionText(tempId: string, text: string) {
    setInstructions((prev) =>
      prev.map((inst) => {
        if (inst.tempId !== tempId) return inst;
        // Auto-detect ingredients mentioned in text
        const mentions = findIngredientMentions(text, ingredients);
        const existingIds = new Set(inst.linkedIngredients.map((li) => li.ingredientTempId));
        const newLinks = mentions
          .filter((m) => !existingIds.has(m.tempId))
          .map((m) => ({
            ingredientTempId: m.tempId,
            quantity: "",
            unit: "",
          }));
        return {
          ...inst,
          text,
          linkedIngredients: [...inst.linkedIngredients, ...newLinks],
        };
      })
    );
  }

  // ---- Step-Ingredient linking ----
  function addIngredientToStep(instructionTempId: string, ingredientTempId: string) {
    setInstructions((prev) =>
      prev.map((inst) => {
        if (inst.tempId !== instructionTempId) return inst;
        if (inst.linkedIngredients.some((li) => li.ingredientTempId === ingredientTempId))
          return inst;
        return {
          ...inst,
          linkedIngredients: [
            ...inst.linkedIngredients,
            { ingredientTempId, quantity: "", unit: "" },
          ],
        };
      })
    );
  }
  function removeIngredientFromStep(instructionTempId: string, ingredientTempId: string) {
    setInstructions((prev) =>
      prev.map((inst) => {
        if (inst.tempId !== instructionTempId) return inst;
        return {
          ...inst,
          linkedIngredients: inst.linkedIngredients.filter(
            (li) => li.ingredientTempId !== ingredientTempId
          ),
        };
      })
    );
  }
  function updateStepIngredientPortion(
    instructionTempId: string,
    ingredientTempId: string,
    field: "quantity" | "unit",
    value: string
  ) {
    setInstructions((prev) =>
      prev.map((inst) => {
        if (inst.tempId !== instructionTempId) return inst;
        return {
          ...inst,
          linkedIngredients: inst.linkedIngredients.map((li) =>
            li.ingredientTempId === ingredientTempId ? { ...li, [field]: value } : li
          ),
        };
      })
    );
  }

  // ---- Category toggle ----
  function toggleCategory(catId: string) {
    setCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  }

  // ---- Get ingredient by tempId ----
  const getIngredient = useCallback(
    (tempId: string) => ingredients.find((i) => i.tempId === tempId),
    [ingredients]
  );

  // ---- Unlinked ingredients for a step ----
  function getUnlinkedIngredients(instruction: InstructionInput) {
    const linkedIds = new Set(instruction.linkedIngredients.map((li) => li.ingredientTempId));
    return ingredients.filter((i) => i.name.trim() && !linkedIds.has(i.tempId));
  }

  // ---- Submit ----
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        title,
        description,
        photo,
        existingPhotoUrl,
        prepTime,
        cookTime,
        servings,
        sourceUrl,
        notes,
        ingredients,
        instructions,
        categoryIds,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {/* ---- Photo ---- */}
      <div className="space-y-2">
        <Label>Photo</Label>
        <div className="flex items-center gap-4">
          {photoPreview ? (
            <div className="relative w-32 h-24 rounded-lg overflow-hidden bg-muted">
              <img src={photoPreview} alt="Preview" className="object-cover w-full h-full" />
              <button
                type="button"
                onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                className="absolute top-1 right-1 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : null}
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
            <Upload className="h-4 w-4" />
            {photoPreview ? "Change photo" : "Upload photo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </label>
        </div>
      </div>

      {/* ---- Title ---- */}
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Recipe name"
          required
        />
      </div>

      {/* ---- Description ---- */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A brief description of the dish..."
          rows={2}
        />
      </div>

      {/* ---- Time & Servings ---- */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="prepTime" className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> Prep (min)
          </Label>
          <Input
            id="prepTime"
            type="number"
            min="0"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
            placeholder="15"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cookTime" className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> Cook (min)
          </Label>
          <Input
            id="cookTime"
            type="number"
            min="0"
            value={cookTime}
            onChange={(e) => setCookTime(e.target.value)}
            placeholder="30"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="servings" className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> Servings
          </Label>
          <Input
            id="servings"
            type="number"
            min="1"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            placeholder="4"
          />
        </div>
      </div>

      {/* ---- Source URL ---- */}
      <div className="space-y-2">
        <Label htmlFor="sourceUrl" className="flex items-center gap-1">
          <LinkIcon className="h-3.5 w-3.5" /> Source URL
        </Label>
        <Input
          id="sourceUrl"
          type="url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      {/* ---- Categories ---- */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <Label>Categories</Label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className="inline-flex"
              >
                <Badge
                  variant={categoryIds.includes(cat.id) ? "default" : "outline"}
                  className="cursor-pointer"
                >
                  {cat.name}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* ---- Ingredients ---- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Ingredients</Label>
          <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        <div className="space-y-2">
          {ingredients.map((ing, idx) => (
            <div key={ing.tempId} className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                className="w-20"
                placeholder="Qty"
                value={ing.quantity}
                onChange={(e) => updateIngredient(ing.tempId, "quantity", e.target.value)}
              />
              <Input
                className="w-20"
                placeholder="Unit"
                value={ing.unit}
                onChange={(e) => updateIngredient(ing.tempId, "unit", e.target.value)}
              />
              <Input
                className="flex-1"
                placeholder="Ingredient name"
                value={ing.name}
                onChange={(e) => updateIngredient(ing.tempId, "name", e.target.value)}
                required={idx === 0}
              />
              {ingredients.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeIngredient(ing.tempId)}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* ---- Instructions with per-step ingredients ---- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Instructions</Label>
          <Button type="button" variant="outline" size="sm" onClick={addInstruction}>
            <Plus className="h-4 w-4 mr-1" /> Add Step
          </Button>
        </div>
        <div className="space-y-4">
          {instructions.map((inst, idx) => (
            <Card key={inst.tempId} className="relative">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0 mt-1">
                    {idx + 1}
                  </span>
                  <Textarea
                    className="flex-1"
                    placeholder="Describe this step..."
                    value={inst.text}
                    onChange={(e) => updateInstructionText(inst.tempId, e.target.value)}
                    rows={2}
                    required={idx === 0}
                  />
                  {instructions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeInstruction(inst.tempId)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Linked ingredients for this step */}
                {inst.linkedIngredients.length > 0 && (
                  <div className="ml-9 space-y-1.5">
                    <span className="text-xs text-muted-foreground font-medium">
                      Ingredients for this step:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {inst.linkedIngredients.map((li) => {
                        const ing = getIngredient(li.ingredientTempId);
                        if (!ing) return null;
                        const label = li.quantity
                          ? `${li.quantity}${li.unit ? " " + li.unit : ""} ${ing.name}`
                          : `${ing.quantity ? ing.quantity : ""}${ing.unit ? " " + ing.unit : ""} ${ing.name}`.trim();
                        return (
                          <Badge
                            key={li.ingredientTempId}
                            variant="secondary"
                            className="gap-1 pr-1"
                          >
                            <span className="text-xs">{label || ing.name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                removeIngredientFromStep(inst.tempId, li.ingredientTempId)
                              }
                              className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                    {/* Portion editing for each linked ingredient */}
                    <div className="space-y-1 mt-1">
                      {inst.linkedIngredients.map((li) => {
                        const ing = getIngredient(li.ingredientTempId);
                        if (!ing) return null;
                        return (
                          <div key={li.ingredientTempId} className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground w-24 truncate">{ing.name}:</span>
                            <Input
                              className="h-7 w-16 text-xs"
                              placeholder="Qty"
                              value={li.quantity}
                              onChange={(e) =>
                                updateStepIngredientPortion(inst.tempId, li.ingredientTempId, "quantity", e.target.value)
                              }
                            />
                            <Input
                              className="h-7 w-16 text-xs"
                              placeholder="Unit"
                              value={li.unit}
                              onChange={(e) =>
                                updateStepIngredientPortion(inst.tempId, li.ingredientTempId, "unit", e.target.value)
                              }
                            />
                            <span className="text-muted-foreground text-[10px]">(blank = all)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add ingredient to step manually */}
                {getUnlinkedIngredients(inst).length > 0 && (
                  <div className="ml-9">
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-muted-foreground mr-1 py-0.5">Link:</span>
                      {getUnlinkedIngredients(inst).map((ing) => (
                        <button
                          key={ing.tempId}
                          type="button"
                          onClick={() => addIngredientToStep(inst.tempId, ing.tempId)}
                        >
                          <Badge variant="outline" className="text-xs cursor-pointer hover:bg-secondary">
                            + {ing.name}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* ---- Notes ---- */}
      <div className="space-y-2">
        <Label htmlFor="notes">Personal Notes / Tips</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any tips, variations, or memories..."
          rows={3}
        />
      </div>

      {/* ---- Submit ---- */}
      <div className="flex gap-3 justify-end pt-4">
        <Button type="submit" disabled={submitting} size="lg">
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
