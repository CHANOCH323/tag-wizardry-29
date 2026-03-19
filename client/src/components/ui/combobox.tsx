import * as React from "react";
import { cn } from "@/lib/utils";

export interface ComboboxItem {
  value: string;
  label: string;
}

interface ComboboxProps {
  value: string;
  items: ComboboxItem[];
  onValueChange: (value: string) => void;
  onSelect: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function Combobox({
  value,
  items,
  onValueChange,
  onSelect,
  placeholder,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [hoverIndex, setHoverIndex] = React.useState<number>(0);

  const filtered = React.useMemo(
    () => items.filter((item) => item.label.toLowerCase().includes(value.toLowerCase())),
    [items, value],
  );

  const selectItem = (item: ComboboxItem) => {
    onSelect(item.value);
    onValueChange(item.label);
    setOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onValueChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-md border bg-popover p-1 shadow-lg">
          {filtered.map((item, index) => (
            <button
              key={item.value}
              type="button"
              className={cn(
                "w-full rounded px-2 py-1 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                index === hoverIndex && "bg-accent text-accent-foreground",
              )}
              onMouseEnter={() => setHoverIndex(index)}
              onClick={() => selectItem(item)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
