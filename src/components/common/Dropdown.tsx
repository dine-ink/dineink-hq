import { Listbox } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

type Option = {
  label: string;
  value: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  width?: string;
};

export default function Dropdown({
  value,
  onChange,
  options,
  width = "w-44",
}: Props) {
  const selected = options.find((o) => o.value === value);

  return (
    <Listbox value={value} onChange={onChange}>
      <div className={`relative ${width}`}>
        
        {/* BUTTON */}
        <Listbox.Button className="inline-flex w-full items-center justify-between rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50">
          <span>{selected?.label}</span>
          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        </Listbox.Button>

        {/* OPTIONS */}
        <Listbox.Options className="absolute z-20 mt-2 w-full rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
          {options.map((option) => (
            <Listbox.Option
              key={option.value}
              value={option.value}
              className={({ active }) =>
                `cursor-pointer px-4 py-2 text-sm ${
                  active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                }`
              }
            >
              {option.label}
            </Listbox.Option>
          ))}
        </Listbox.Options>

      </div>
    </Listbox>
  );
}