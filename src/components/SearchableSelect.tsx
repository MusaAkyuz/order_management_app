"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  value: string | number;
  label: string;
  description?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value?: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
  noResultsAction?: {
    label: string;
    value: string | number;
    description?: string;
  };
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Seçim yapın veya yazın",
  label,
  error,
  className = "",
  disabled = false,
  noResultsAction,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Seçili değeri display value olarak ayarla
  useEffect(() => {
    if (value) {
      const selectedOption = options.find((opt) => opt.value === value);
      if (selectedOption) {
        setDisplayValue(selectedOption.label);
        setSearchTerm(selectedOption.label);
      }
    } else {
      setDisplayValue("");
      setSearchTerm("");
    }
  }, [value, options]);

  // Arama terimi ile filtrelenmiş seçenekler
  const filteredOptions = options.filter(
    (option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (option.description &&
        option.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // Eğer geçerli bir seçim yoksa, display value'yu temizle
        if (!value) {
          setDisplayValue("");
          setSearchTerm("");
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setSearchTerm(inputValue);
    setDisplayValue(inputValue);
    setIsOpen(true);

    // Eğer input boşsa, seçimi temizle
    if (!inputValue) {
      onChange("");
    }
  };

  const handleOptionSelect = (option: Option) => {
    setDisplayValue(option.label);
    setSearchTerm(option.label);
    setIsOpen(false);
    onChange(option.value);
    inputRef.current?.blur();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions.length === 1) {
        handleOptionSelect(filteredOptions[0]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-800 mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-2 py-1 text-sm text-gray-800 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition placeholder:text-gray-600 ${
            error ? "border-red-300 focus:ring-red-500" : "border-gray-300"
          } ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"} ${
            className.includes("text-xs") ? "text-xs" : ""
          }`}
        />

        {/* Dropdown Arrow */}
        <div
          className="absolute inset-y-0 right-0 flex items-center px-2 cursor-pointer"
          onClick={() => {
            if (!disabled) {
              setIsOpen(!isOpen);
              inputRef.current?.focus();
            }
          }}
        >
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div>
              <div className="px-3 py-2 text-sm text-gray-500">
                Sonuç bulunamadı
              </div>
              {noResultsAction && (
                <div
                  onClick={() => handleOptionSelect(noResultsAction)}
                  className="px-3 py-2 cursor-pointer hover:bg-blue-50 border-t border-gray-200 text-blue-600"
                >
                  <div className="text-sm font-medium">
                    {noResultsAction.label}
                  </div>
                  {noResultsAction.description && (
                    <div className="text-xs text-gray-500 mt-1">
                      {noResultsAction.description}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              {filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleOptionSelect(option)}
                  className={`px-3 py-2 cursor-pointer hover:bg-blue-50 border-b border-gray-100 ${
                    value === option.value
                      ? "bg-blue-100 text-blue-900"
                      : "text-gray-900"
                  }`}
                >
                  <div className="text-sm font-medium">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-gray-500 mt-1">
                      {option.description}
                    </div>
                  )}
                </div>
              ))}
              {noResultsAction && (
                <div
                  onClick={() => handleOptionSelect(noResultsAction)}
                  className="px-3 py-2 cursor-pointer hover:bg-blue-50 border-t border-gray-200 text-blue-600"
                >
                  <div className="text-sm font-medium">
                    {noResultsAction.label}
                  </div>
                  {noResultsAction.description && (
                    <div className="text-xs text-gray-500 mt-1">
                      {noResultsAction.description}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
