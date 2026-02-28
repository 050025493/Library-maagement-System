// src/components/FilterSidebar.tsx
import { Filter, Check, MapPin, User, Book, Layers, Grid3X3, X, Tag } from 'lucide-react';
import type { Facets, FilterState } from '../types/book';
import { ITEM_TYPE_LABELS } from '../types/book';

// ─── FilterGroup sub-component ────────────────────────────────────────────────
interface FilterGroupProps {
  title: string;
  options: (string | number)[];
  selected: (string | number)[];
  onChange: (val: string | number) => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'list' | 'grid';
  labelFn?: (opt: string | number) => string;
}

const FilterGroup = ({
  title,
  options,
  selected,
  onChange,
  icon: Icon,
  variant = 'list',
  labelFn,
}: FilterGroupProps) => {
  if (!options || options.length === 0) return null;
  const isGrid = variant === 'grid';

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-blue-600" />}
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">{title}</h3>
      </div>

      {isGrid ? (
        <div className="flex flex-wrap justify-center gap-2">
          {options.map((opt) => {
            const isSel = selected.includes(opt);
            const label = labelFn ? labelFn(opt) : String(opt);
            return (
              <button
                key={String(opt)}
                onClick={() => onChange(opt)}
                className={`min-w-[2.75rem] h-9 px-2 text-xs font-medium rounded border transition-all flex items-center justify-center flex-shrink-0 ${
                  isSel
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {options.map((opt) => {
            const isSel = selected.includes(opt);
            const label = labelFn ? labelFn(opt) : String(opt);
            return (
              <label
                key={String(opt)}
                className={`flex items-center gap-3 cursor-pointer group text-sm transition-all ${
                  isSel ? 'text-blue-700 font-medium' : 'text-gray-600'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${
                    isSel
                      ? 'bg-blue-600 border-blue-600 scale-110'
                      : 'bg-white border-gray-300 group-hover:border-blue-400'
                  }`}
                >
                  {isSel && <Check className="w-3 h-3 text-white" />}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={isSel}
                  onChange={() => onChange(opt)}
                />
                <span className="truncate leading-snug">{label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Main FilterSidebar ───────────────────────────────────────────────────────
interface Props {
  facets: Facets;
  selectedFilters: FilterState;
  onFilterChange: (category: keyof FilterState, value: unknown) => void;
  onClearFilters: () => void;
}

export default function FilterSidebar({
  facets,
  selectedFilters,
  onFilterChange,
  onClearFilters,
}: Props) {
  const activeCount = [
    selectedFilters.availableOnly ? 1 : 0,
    selectedFilters.subjects.length,
    selectedFilters.itemTypes.length,
    selectedFilters.authors.length,
    selectedFilters.publishers.length,
    selectedFilters.floors.length,
    selectedFilters.racks.length,
    selectedFilters.cols.length,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <h2 className="font-bold text-gray-900">Filters</h2>
          {activeCount > 0 && (
            <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </div>
        <button
          onClick={onClearFilters}
          className="group flex items-center gap-1 px-2 py-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all text-xs font-medium"
        >
          <X className="w-3 h-3 group-hover:rotate-90 transition-transform" />
          <span>Clear</span>
        </button>
      </div>

      {/* Availability */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Status</h3>
        <label className="flex items-center gap-3 cursor-pointer text-sm text-gray-700 group">
          <div
            className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${
              selectedFilters.availableOnly
                ? 'bg-green-600 border-green-600'
                : 'bg-white border-gray-300 group-hover:border-green-500'
            }`}
          >
            {selectedFilters.availableOnly && <Check className="w-3 h-3 text-white" />}
          </div>
          <input
            type="checkbox"
            className="hidden"
            checked={selectedFilters.availableOnly}
            onChange={() => onFilterChange('availableOnly', !selectedFilters.availableOnly)}
          />
          <span className={selectedFilters.availableOnly ? 'text-green-700 font-medium' : ''}>
            Available Books Only
          </span>
        </label>
      </div>

      {/* Location */}
      <div className="mb-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-blue-600" />
          <h2 className="font-bold text-gray-800 text-sm">Location</h2>
        </div>
        <FilterGroup
          title="Floor"
          options={facets.floors}
          selected={selectedFilters.floors}
          onChange={(v) => onFilterChange('floors', v)}
          icon={Layers}
          variant="list"
        />
        <FilterGroup
          title="Rack Number"
          options={facets.racks}
          selected={selectedFilters.racks}
          onChange={(v) => onFilterChange('racks', v)}
          variant="grid"
          icon={Grid3X3}
        />
        <FilterGroup
          title="Column"
          options={facets.cols}
          selected={selectedFilters.cols}
          onChange={(v) => onFilterChange('cols', v)}
          variant="grid"
        />
      </div>

      {/* Material / Type */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-4 h-4 text-blue-600" />
          <h2 className="font-bold text-gray-800 text-sm">Material Type</h2>
        </div>
        <FilterGroup
          title="Type"
          options={facets.itemTypes}
          selected={selectedFilters.itemTypes}
          onChange={(v) => onFilterChange('itemTypes', v)}
          variant="grid"
          labelFn={(opt) => ITEM_TYPE_LABELS[String(opt)] ?? String(opt)}
        />
      </div>

      {/* Subject */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Book className="w-4 h-4 text-blue-600" />
          <h2 className="font-bold text-gray-800 text-sm">Subject</h2>
        </div>
        <FilterGroup
          title="Subject"
          options={facets.subjects}
          selected={selectedFilters.subjects}
          onChange={(v) => onFilterChange('subjects', v)}
        />
      </div>

      {/* Details */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-blue-600" />
          <h2 className="font-bold text-gray-800 text-sm">Details</h2>
        </div>
        <FilterGroup
          title="Authors"
          options={facets.authors}
          selected={selectedFilters.authors}
          onChange={(v) => onFilterChange('authors', v)}
          icon={User}
        />
        <FilterGroup
          title="Publishers"
          options={facets.publishers}
          selected={selectedFilters.publishers}
          onChange={(v) => onFilterChange('publishers', v)}
        />
      </div>
    </div>
  );
}