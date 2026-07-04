"use client";

import { useState } from "react";
import countryList from "react-select-country-list";
import { Check, ChevronsUpDown } from "lucide-react";
import {
    Control,
    Controller,
    FieldError,
    FieldValues,
    Path,
} from "react-hook-form";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

interface CountrySelectProps<
    TFieldValues extends FieldValues = FieldValues
> {
    name: Path<TFieldValues>;
    label: string;
    control: Control<TFieldValues>;
    error?: FieldError;
    required?: boolean;
}

interface CountrySelectComponentProps {
    value?: string;
    onChange: (value: string) => void;
}

const CountrySelect = ({
                           value,
                           onChange,
                       }: CountrySelectComponentProps) => {
    const [open, setOpen] = useState(false);

    const countries = countryList().getData();

    const getFlagUrl = (countryCode: string) => {
        return `https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`;
    };

    const selectedCountry = countries.find(
        (country) => country.value === value
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="country-select-trigger"
                >
                    {selectedCountry ? (
                        <span className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getFlagUrl(selectedCountry.value)} alt={selectedCountry.value} className="w-5 h-3.5 rounded-sm object-cover" />
              <span>{selectedCountry.label}</span>
            </span>
                    ) : (
                        <span className="text-muted-foreground">
              Select your country...
            </span>
                    )}

                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent align="start"
                            className="w-full justify-between p-0">
                <Command>
                    <CommandInput placeholder="Search countries..." />

                    <CommandEmpty>No country found.</CommandEmpty>

                    <CommandList className="max-h-72">
                        <CommandGroup>
                            {countries.map((country) => (
                                <CommandItem
                                    key={country.value}
                                    value={`${country.label} ${country.value}`}
                                    onSelect={() => {
                                        onChange(country.value);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === country.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />

                                    <span className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getFlagUrl(country.value)} alt={country.value} className="w-5 h-3.5 rounded-sm object-cover" />
                    <span>{country.label}</span>
                  </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export function CountrySelectField<
    TFieldValues extends FieldValues = FieldValues
>({
      name,
      label,
      control,
      error,
      required = false,
  }: CountrySelectProps<TFieldValues>) {
    return (
        <div className="space-y-2">
            <Label htmlFor={name}>
                {label}
                {required && <span className="ml-1 text-red-500">*</span>}
            </Label>

            <Controller
                name={name}
                control={control}
                rules={{
                    required: required
                        ? `Please select ${label.toLowerCase()}`
                        : false,
                }}
                render={({ field }) => (
                    <CountrySelect
                        value={field.value ?? ""}
                        onChange={field.onChange}
                    />
                )}
            />

            {error && (
                <p className="text-sm text-red-500">
                    {error.message}
                </p>
            )}

            <p className="text-xs text-muted-foreground">
                Helps us show market data and news relevant to you.
            </p>
        </div>
    );
}