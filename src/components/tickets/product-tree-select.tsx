import type { ProductTreeNode } from "@/lib/workspaces";

function flattenProducts(nodes: ProductTreeNode[], depth = 0): Array<{ id: string; label: string }> {
  return nodes.flatMap((node) => [
    {
      id: node.id,
      label: `${"  ".repeat(depth)}${depth ? "-> " : ""}${node.name}`,
    },
    ...flattenProducts(node.children, depth + 1),
  ]);
}

export function ProductTreeSelect({
  name,
  products,
  defaultValue,
}: {
  name: string;
  products: ProductTreeNode[];
  defaultValue?: string;
}) {
  const options = flattenProducts(products);

  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-sky-400 focus:bg-white"
      required
    >
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
