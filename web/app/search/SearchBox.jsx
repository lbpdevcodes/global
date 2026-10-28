import { useCombobox } from "downshift";
import { useState } from "react";
import { matchedAlias, searchEntities } from "../lib/search.js";

const optionLabel = (entity, query) => {
  const alias = matchedAlias(entity, query);
  return alias ? `${entity.name} (${alias})` : entity.name;
};

// The keyboard and screen-reader path to every country.
export function SearchBox({ entities, onSelect, inputRef }) {
  const [query, setQuery] = useState("");
  const results = searchEntities(entities, query);
  const { isOpen, highlightedIndex, getInputProps, getItemProps, getLabelProps, getMenuProps } = useCombobox({
    items: results,
    inputValue: query,
    itemToString: (entity) => entity?.name ?? "",
    onInputValueChange: ({ inputValue }) => setQuery(inputValue ?? ""),
    onSelectedItemChange: ({ selectedItem }) => selectedItem && onSelect(selectedItem.code),
  });
  const showEmpty = isOpen && query.trim() && results.length === 0;
  return (
    <div className="relative w-full max-w-sm">
      <label {...getLabelProps()} className="sr-only">Search countries</label>
      <input {...getInputProps({ ref: inputRef })} placeholder="Search countries" autoComplete="off"
        className="w-full rounded-full border border-neutral-700 bg-neutral-900/90 px-4 py-2 text-sm shadow-lg placeholder:text-neutral-500 focus:border-sky-500 focus:outline-none" />
      <ul {...getMenuProps()}
        className={`absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-900 text-sm shadow-xl ${isOpen && results.length ? "" : "hidden"}`}>
        {isOpen && results.map((entity, index) => (
          <li key={entity.code} {...getItemProps({ item: entity, index })}
            className={`cursor-pointer px-4 py-2 ${highlightedIndex === index ? "bg-sky-900/60" : ""}`}>
            {optionLabel(entity, query)}
          </li>
        ))}
      </ul>
      {showEmpty && (
        <p role="status" className="absolute z-20 mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm text-neutral-400">
          {`No country matches “${query.trim()}”`}
        </p>
      )}
    </div>
  );
}
