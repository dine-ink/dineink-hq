import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

const foodTypes = ["Veg", "Non Veg", "Both"];

export default function TypeSelect({ value, onChange }: any) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <ListboxButton className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-left text-sm flex justify-between items-center">
          <span>{value}</span>
          <ChevronUpDownIcon className="h-4 w-4 text-gray-500" />
        </ListboxButton>

        <ListboxOptions className="absolute z-10 mt-1 w-full rounded-xl bg-white shadow-lg border">
          {foodTypes.map((type) => (
            <ListboxOption
              key={type}
              value={type}
              className="cursor-pointer px-3 py-2 hover:bg-red-50 flex justify-between"
            >
              {({ selected }) => (
                <>
                  <span>{type}</span>
                  {selected && <CheckIcon className="h-4 w-4 text-red-500" />}
                </>
              )}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}