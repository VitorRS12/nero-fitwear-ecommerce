import { X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/product-images";

export interface VariantDraft {
  id?: string;
  sku: string;
  color: string | null;
  color_hex: string | null;
  size: string | null;
  price: number | null;
  stock: number;
}

interface VariantMatrixProps {
  baseSlug: string;
  variants: VariantDraft[];
  onChange: (variants: VariantDraft[]) => void;
}

const DEFAULT_SIZES = ["P", "M", "G", "GG"];

/** Monta as combinações de cor x tamanho com código e estoque. */
export function VariantMatrix({ baseSlug, variants, onChange }: VariantMatrixProps) {
  const [colorName, setColorName] = useState("");
  const [colorHex, setColorHex] = useState("#111111");
  const [sizeName, setSizeName] = useState("");

  {variants.some((variant) => variant.stock === 0) ? (
    <p className="text-sm text-muted-foreground">
      Existem combinações com estoque zero. Esses tamanhos ficarão bloqueados na loja. 
    </p>
  ): null}


  const colors = Array.from(
    new Map(
      variants
        .filter((v) => v.color)
        .map((v) => [v.color as string, v.color_hex ?? "#111111"] as const),
    ).entries(),
  );
  const sizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean) as string[]));

  const makeSku = (color: string, size: string) =>
    [slugify(baseSlug || "peca"), slugify(color), slugify(size)]
      .filter(Boolean)
      .join("-")
      .toUpperCase();

  const addColor = () => {
    const name = colorName.trim();
    if (!name) return;
    const targetSizes = sizes.length > 0 ? sizes : DEFAULT_SIZES;
    const additions = targetSizes
      .filter((size) => !variants.some((v) => v.color === name && v.size === size))
      .map((size) => ({
        sku: makeSku(name, size),
        color: name,
        color_hex: colorHex,
        size,
        price: null,
        stock: 0,
      }));
    onChange([...variants, ...additions]);
    setColorName("");
  };

  const addSize = () => {
    const size = sizeName.trim().toUpperCase();
    if (!size) return;
    const targetColors = colors.length > 0 ? colors.map(([name, hex]) => ({ name, hex })) : [];
    if (targetColors.length === 0) {
      onChange([
        ...variants,
        { sku: makeSku("unico", size), color: null, color_hex: null, size, price: null, stock: 0 },
      ]);
    } else {
      const additions = targetColors
        .filter(({ name }) => !variants.some((v) => v.color === name && v.size === size))
        .map(({ name, hex }) => ({
          sku: makeSku(name, size),
          color: name,
          color_hex: hex,
          size,
          price: null,
          stock: 0,
        }));
      onChange([...variants, ...additions]);
    }
    setSizeName("");
  };

  const removeColor = (name: string) => onChange(variants.filter((v) => v.color !== name));
  const removeSize = (size: string) => onChange(variants.filter((v) => v.size !== size));

  const update = (index: number, patch: Partial<VariantDraft>) => {
    onChange(variants.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Adicionar cor</Label>
          <div className="flex gap-2">
            <Input
              value={colorName}
              placeholder="Preto"
              onChange={(e) => setColorName(e.target.value)}
            />
            <input
              type="color"
              aria-label="Amostra da cor"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              className="h-9 w-12 rounded border border-border bg-transparent"
            />
            <Button type="button" variant="outline" onClick={addColor}>
              +
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {colors.map(([name, hex]) => (
              <span
                key={name}
                className="label-caps inline-flex items-center gap-2 border border-border px-2 py-1"
              >
                <span className="size-3 rounded-full" style={{ backgroundColor: hex }} />
                {name}
                <button
                  type="button"
                  onClick={() => removeColor(name)}
                  aria-label={`Remover ${name}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Adicionar tamanho</Label>
          <div className="flex gap-2">
            <Input value={sizeName} placeholder="M" onChange={(e) => setSizeName(e.target.value)} />
            <Button type="button" variant="outline" onClick={addSize}>
              +
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {sizes.map((size) => (
              <span
                key={size}
                className="label-caps inline-flex items-center gap-2 border border-border px-2 py-1"
              >
                {size}
                <button
                  type="button"
                  onClick={() => removeSize(size)}
                  aria-label={`Remover ${size}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {variants.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Adicione ao menos uma cor ou tamanho para controlar o estoque.
        </p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full text-sm">
            <thead className="bg-graphite text-left">
              <tr className="label-caps">
                <th className="p-3">Cor</th>
                <th className="p-3">Tamanho</th>
                <th className="p-3">Código</th>
                <th className="p-3">Preço próprio</th>
                <th className="p-3">Estoque</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {variants.map((variant, index) => (
                <tr
                  key={variant.id ?? `${variant.color}-${variant.size}-${index}`}
                  className="border-t border-border"
                >
                  <td className="p-3">{variant.color ?? "—"}</td>
                  <td className="p-3">{variant.size ?? "—"}</td>
                  <td className="p-2">
                    <Input
                      value={variant.sku}
                      onChange={(e) => update(index, { sku: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="usa o preço da peça"
                      value={variant.price ?? ""}
                      onChange={(e) =>
                        update(index, {
                          price: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min="0"
                      value={variant.stock}
                      onChange={(e) => update(index, { stock: Number(e.target.value || 0) })}
                    />
                  </td>
                  <td className="p-2 text-right">
                    <button
                      type="button"
                      aria-label="Remover combinação"
                      onClick={() => onChange(variants.filter((_, i) => i !== index))}
                    >
                      <X className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
