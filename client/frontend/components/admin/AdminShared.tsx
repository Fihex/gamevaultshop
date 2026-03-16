import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Category } from '../../types';
import {
    ChevronLeft, ChevronRight, X, CheckSquare, Square,
    Filter, Search, ChevronDown, Check,
    Trash2, Layers, ChevronUp, RotateCcw,
    ListFilter
} from 'lucide-react';
import { useLanguage } from '../../config/language';

// --- HELPER: BREAKPOINT HOOK FOR MASONRY ---
const useColumnCount = () => {
    const [cols, setCols] = useState(1);

    useEffect(() => {
        const handleResize = () => {
            const w = window.innerWidth;
            if (w >= 1280) setCols(4);      // xl
            else if (w >= 1024) setCols(3); // lg
            else if (w >= 768) setCols(2);  // md
            else setCols(1);                // sm
        };

        handleResize(); // Init
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return cols;
};

// --- 1. REUSABLE MODERN SEARCH INPUT ---
export const ModernSearchInput = ({
    value,
    onChange,
    placeholder,
    autoFocus = false,
    className = "",
    small = false
}: {
    value: string,
    onChange: (val: string) => void,
    placeholder: string,
    autoFocus?: boolean,
    className?: string,
    small?: boolean
}) => {
    return (
        <div className={`relative group w-full ${className}`}>
            <div className={`relative flex items-center bg-vault-950 border border-vault-700 rounded-lg overflow-hidden focus-within:border-vault-accent/50 focus-within:ring-1 focus-within:ring-vault-accent/50 transition-all shadow-sm ${small ? 'h-9' : 'h-11'}`}>
                <div className={`pl-3 pr-2 text-gray-500 group-focus-within:text-vault-accent transition-colors`}>
                    <Search size={small ? 14 : 18} />
                </div>
                <input
                    type="text"
                    className={`w-full bg-transparent border-none text-white focus:outline-none placeholder-gray-600 font-medium ${small ? 'text-xs' : 'text-sm'}`}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    autoFocus={autoFocus}
                    spellCheck={false}
                />
                {value && (
                    <button
                        onClick={() => onChange('')}
                        className="p-2 mr-1 text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={small ? 12 : 14} />
                    </button>
                )}
            </div>
        </div>
    );
};

// --- 2. TOP TOOLBAR ---
export const TopToolbar = React.memo(({
  search, setSearch, placeholder,
  totalElements, size, setSize,
  start, end,
  extraFilter,
  setPage
}: {
  search: string, setSearch: (s: string) => void, placeholder: string,
  totalElements: number, size: number, setSize: (s: number) => void,
  start: number, end: number,
  extraFilter?: React.ReactNode,
  setPage?: (n: number) => void
}) => {
    const { t } = useLanguage();
    const [localSearch, setLocalSearch] = useState(search);

    useEffect(() => { setLocalSearch(search); }, [search]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (localSearch !== search) {
                setSearch(localSearch);
                if (setPage) setPage(0);
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [localSearch, setSearch, search, setPage]);

    return (
      <div className="flex flex-col gap-4 mb-6 bg-vault-900/50 p-4 sm:p-5 rounded-2xl border border-vault-800 shadow-xl">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            {/* Main Search */}
            <div className="w-full md:w-96 md:max-w-md">
                <ModernSearchInput
                    value={localSearch}
                    onChange={setLocalSearch}
                    placeholder={placeholder}
                />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
                 {/* Filters injected here */}
                 {extraFilter}

                 {/* Redesigned Row Count Select */}
                 <div className="relative group min-w-[140px]">
                    {/* Visual Layer */}
                    <div className="flex items-center justify-between bg-vault-950 px-4 py-2.5 rounded-xl border border-vault-700 group-hover:border-vault-500 transition-colors shadow-sm h-[46px] pointer-events-none w-full">
                        <div className="flex items-center gap-3">
                            <ListFilter size={16} className="text-gray-400 group-hover:text-vault-accent transition-colors" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-none mb-0.5">{t('shared_rows') || "Show"}</span>
                                <span className="text-sm text-white font-bold leading-none">{size}</span>
                            </div>
                        </div>
                        <ChevronDown className="text-gray-600 group-hover:text-white transition-colors ml-2" size={14} />
                    </div>

                    {/* Interactive Overlay */}
                    <select
                        value={size}
                        onChange={(e) => {
                            setSize(Number(e.target.value));
                            if (setPage) setPage(0);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 text-white bg-vault-900"
                    >
                        <option value={5} className="bg-vault-900 text-white py-2">5</option>
                        <option value={10} className="bg-vault-900 text-white py-2">10</option>
                        <option value={20} className="bg-vault-900 text-white py-2">20</option>
                        <option value={50} className="bg-vault-900 text-white py-2">50</option>
                    </select>
                 </div>
            </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 pl-1">
           <div className="w-2 h-2 rounded-full bg-vault-accent/50 animate-pulse"></div>
           {t('shared_found')} <span className="text-white font-bold tabular-nums">{totalElements}</span> {t('shared_records')}
        </div>
      </div>
    );
});

// --- 3. BOTTOM PAGINATION ---
export const BottomPagination = React.memo(({
  page, totalPages, setPage
}: {
  page: number, totalPages: number, setPage: (p: number) => void
}) => {
    const { t } = useLanguage();
    const [jumpPage, setJumpPage] = useState('');

    const handleJump = (e: React.FormEvent) => {
        e.preventDefault();
        const p = parseInt(jumpPage);
        if (!isNaN(p) && p >= 1 && p <= totalPages) {
            setPage(p - 1);
            setJumpPage('');
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 0; i < totalPages; i++) pages.push(i);
        } else {
            pages.push(0);
            if (page > 2) pages.push(-1);
            let low = Math.max(1, page - 1);
            let high = Math.min(totalPages - 2, page + 1);
            for (let i = low; i <= high; i++) pages.push(i);
            if (page < totalPages - 3) pages.push(-1);
            pages.push(totalPages - 1);
        }
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 border-t border-vault-800 pt-6">
            <div className="flex items-center gap-3 order-2 sm:order-1 bg-vault-900/50 p-1.5 rounded-lg border border-vault-800">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-2">{t('shared_go_page')}</span>
                <form onSubmit={handleJump} className="flex items-center m-0 p-0">
                    <input
                    className="w-12 bg-vault-950 border border-vault-700 rounded px-2 py-1 text-sm text-center text-white focus:border-vault-accent outline-none m-0 h-8 font-mono"
                    value={jumpPage}
                    onChange={e => setJumpPage(e.target.value)}
                    placeholder="#"
                    />
                </form>
            </div>

            <div className="flex items-center gap-1.5 order-1 sm:order-2 bg-vault-900/50 p-1.5 rounded-xl border border-vault-800">
                <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="w-9 h-9 rounded-lg hover:bg-vault-800 disabled:opacity-30 disabled:hover:bg-transparent transition text-gray-400 hover:text-white flex items-center justify-center flex-shrink-0"
                >
                    <ChevronLeft size={18} />
                </button>

                <div className="flex items-center justify-center gap-1 px-2 hidden sm:flex">
                    {getPageNumbers().map((p, idx) => (
                        p === -1 ? (
                            <span key={`sep-${idx}`} className="text-gray-600 px-1 w-8 text-center text-sm">...</span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition tabular-nums ${page === p ? 'bg-vault-accent text-white shadow-lg shadow-vault-accent/20 scale-105' : 'text-gray-400 hover:bg-vault-800 hover:text-white'}`}
                            >
                                {p + 1}
                            </button>
                        )
                    ))}
                </div>
                <div className="sm:hidden text-xs font-bold text-gray-400 px-2">
                    {page + 1} / {totalPages}
                </div>

                <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className="w-9 h-9 rounded-lg hover:bg-vault-800 disabled:opacity-30 disabled:hover:bg-transparent transition text-gray-400 hover:text-white flex items-center justify-center flex-shrink-0"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
});

// --- 4. SIMPLE MULTI SELECT (For Modal Forms) ---
export const MultiSelect = React.memo(({
    options, selectedIds, onChange, placeholder, sortAlphabetically
}: {
    options: Category[],
    selectedIds: number[],
    onChange: (ids: number[]) => void,
    placeholder: string,
    sortAlphabetically?: boolean
}) => {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const toggle = (id: number) => {
        if (selectedIds.includes(id)) onChange(selectedIds.filter(sid => sid !== id));
        else onChange([...selectedIds, id]);
    };

    const filteredOptions = options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

    if (sortAlphabetically) {
        filteredOptions.sort((a, b) => a.name.localeCompare(b.name));
    } else {
        filteredOptions.sort((a, b) => a.id - b.id);
    }

    return (
        <div className="relative">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-vault-900 border border-vault-700 rounded-xl p-3 text-sm cursor-pointer min-h-[50px] flex items-center justify-between hover:border-vault-600 transition shadow-sm"
            >
                {selectedIds.length > 0 ? (
                     <div className="flex flex-wrap gap-2">
                         {selectedIds.map(id => {
                             const cat = options.find(c => c.id === id);
                             if(!cat) return null;
                             return (
                                 <span key={id} className="bg-vault-800 text-white px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 border border-vault-700 shadow-sm">
                                     {cat.name}
                                     <button onClick={(e) => { e.stopPropagation(); toggle(id); }} className="hover:text-red-400 transition-colors p-0.5 rounded-full hover:bg-vault-700">
                                         <X size={10} />
                                     </button>
                                 </span>
                             )
                         })}
                     </div>
                ) : (
                    <span className="text-gray-500 italic pl-1">{placeholder}</span>
                )}
                <ChevronDown size={16} className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}/>
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute z-50 w-full mt-2 bg-vault-900 border border-vault-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-3 border-b border-vault-800 bg-vault-950">
                             <ModernSearchInput value={search} onChange={setSearch} placeholder={t('shared_filter_options') || "Filter options..."} autoFocus />
                        </div>
                        <div className="max-h-56 overflow-y-auto custom-scrollbar p-1">
                             {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                                 <div
                                    key={opt.id}
                                    onClick={() => toggle(opt.id)}
                                    className={`px-3 py-2.5 m-1 rounded-lg cursor-pointer flex items-center gap-3 text-sm transition-colors ${selectedIds.includes(opt.id) ? 'bg-vault-accent/10 text-white font-medium' : 'text-gray-400 hover:bg-vault-800 hover:text-white'}`}
                                 >
                                     <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedIds.includes(opt.id) ? 'bg-vault-accent border-vault-accent' : 'border-gray-600'}`}>
                                         {selectedIds.includes(opt.id) && <Check size={10} className="text-black stroke-[4px]" />}
                                     </div>
                                     <span>{opt.name}</span>
                                 </div>
                             )) : (
                                 <div className="p-4 text-center text-gray-500 text-xs italic">{t('shared_no_matches')}</div>
                             )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
});

// --- 5. ACCORDION FILTER GROUP (Infinite Scroll) ---
const FilterAccordionGroup = ({
    type,
    categories,
    selectedIds,
    onToggleItem,
    onToggleAll,
    sortConfig
}: {
    type: string;
    categories: Category[];
    selectedIds: number[];
    onToggleItem: (id: number) => void;
    onToggleAll: (type: string, ids: number[], unselectAll?: boolean) => void;
    sortConfig: Record<string, boolean>;
}) => {
    const { t } = useLanguage();
    const allGroupIds = useMemo(() => categories.map(c => c.id), [categories]);
    const selectedCount = selectedIds.filter(id => allGroupIds.includes(id)).length;
    const isAllSelected = selectedCount === categories.length && categories.length > 0;

    const [isOpen, setIsOpen] = useState(selectedCount > 0);
    const [search, setSearch] = useState('');
    const [displayLimit, setDisplayLimit] = useState(50);

    const listRef = useRef<HTMLDivElement>(null);

    let visibleCats = categories;
    if (search) {
        visibleCats = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    }

    if (sortConfig[type]) {
        visibleCats.sort((a, b) => a.name.localeCompare(b.name));
    } else {
        visibleCats.sort((a, b) => a.id - b.id);
    }

    useEffect(() => {
        setDisplayLimit(50);
    }, [search, isOpen]);

    const handleScroll = () => {
        if (listRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = listRef.current;
            if (scrollTop + clientHeight >= scrollHeight - 20) {
                setDisplayLimit(prev => Math.min(prev + 50, visibleCats.length));
            }
        }
    };

    const renderedCats = visibleCats.slice(0, displayLimit);

    return (
        <div className="bg-vault-900 border border-vault-800 rounded-lg overflow-hidden flex flex-col mb-3 shadow-md hover:shadow-lg hover:border-vault-700 w-full relative">
            {/* Header / Trigger */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`h-14 px-4 flex items-center justify-between cursor-pointer select-none transition-colors ${isOpen ? 'bg-vault-900' : 'hover:bg-vault-800'}`}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-bold text-white truncate">{type}</span>
                    {selectedCount > 0 && (
                        <span className="bg-vault-accent text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-fadeIn shrink-0">
                            {selectedCount}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                     {selectedCount > 0 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleAll(type, allGroupIds, true); }}
                            className="text-[10px] font-bold text-gray-400 hover:text-red-400 uppercase tracking-wider flex items-center gap-1 transition-colors hover:bg-red-500/10 px-2 py-1 rounded animate-fadeIn"
                        >
                            <RotateCcw size={10} /> {t('shared_clear_group') || "Clear"}
                        </button>
                     )}
                     {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
            </div>

            {/* Expandable Body */}
            {isOpen && (
                <div className="px-4 pb-4 border-t border-vault-800 bg-vault-950/30 animate-slideDown">
                    <div className="py-3">
                        <ModernSearchInput
                            value={search}
                            onChange={setSearch}
                            placeholder={t('shared_find') || "Find..."}
                            small
                        />
                    </div>

                    <div className="mb-2">
                         <button
                            onClick={() => onToggleAll(type, allGroupIds, false)}
                            className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                         >
                            {isAllSelected ? (t('shared_unselect_all') || "Unselect all") : (t('shared_select_all') || "Select all")}
                         </button>
                    </div>

                    {/* Scrollable List */}
                    <div
                        ref={listRef}
                        onScroll={handleScroll}
                        className="max-h-[300px] overflow-y-auto custom-scrollbar pr-1 space-y-2 scrollbar-gutter-stable"
                        style={{ scrollbarGutter: 'stable' }}
                    >
                        {renderedCats.map(c => {
                            const isSelected = selectedIds.includes(c.id);
                            return (
                                <div
                                    key={c.id}
                                    onClick={() => onToggleItem(c.id)}
                                    className="flex items-start gap-3 cursor-pointer group w-full"
                                >
                                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-vault-accent border-vault-accent' : 'border-gray-600 group-hover:border-gray-500 bg-vault-950'}`}>
                                        {isSelected && <Check size={14} className="text-black stroke-[3px]" />}
                                    </div>
                                    <span className={`text-sm leading-tight break-words whitespace-normal ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>
                                        {c.name}
                                    </span>
                                </div>
                            );
                        })}

                        {visibleCats.length === 0 && (
                            <p className="text-xs text-gray-500 italic py-2">{t('shared_no_matches')}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


// --- 6. FULL SCREEN FILTER MODAL (RESPONSIVE HYBRID ACTIONS) ---
export const MultiSelectFilter = React.memo(({
    categories, selected, onChange, sortConfig = {}
}: {
    categories: Category[],
    selected: number[],
    onChange: (ids: number[]) => void,
    sortConfig?: Record<string, boolean>
}) => {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [tempSelected, setTempSelected] = useState<number[]>(selected);
    const numCols = useColumnCount();

    useEffect(() => {
        if (isOpen) {
            setTempSelected(selected);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    const handleApply = () => {
        onChange(tempSelected);
        setIsOpen(false);
    };

    const toggleItem = (id: number) => {
        if (tempSelected.includes(id)) setTempSelected(prev => prev.filter(s => s !== id));
        else setTempSelected(prev => [...prev, id]);
    };

    const toggleAllInGroup = (type: string, allGroupIds: number[], forceUnselect?: boolean) => {
        if (forceUnselect) {
             setTempSelected(prev => prev.filter(id => !allGroupIds.includes(id)));
             return;
        }

        const currentInGroup = tempSelected.filter(id => allGroupIds.includes(id));
        const allSelected = currentInGroup.length === allGroupIds.length;

        if (allSelected) {
            setTempSelected(prev => prev.filter(id => !allGroupIds.includes(id)));
        } else {
            const newIds = [...tempSelected];
            allGroupIds.forEach(id => {
                if (!newIds.includes(id)) newIds.push(id);
            });
            setTempSelected(newIds);
        }
    };

    const types = useMemo(() => Array.from(new Set(categories.map(c => c.type))).sort(), [categories]);

    // Distribute types into columns
    const columnData = useMemo(() => {
        const cols: string[][] = Array.from({ length: numCols }, () => []);
        types.forEach((type, index) => {
            cols[index % numCols].push(type);
        });
        return cols;
    }, [types, numCols]);

    return (
        <>
            {/* TRIGGER BUTTON */}
            <button
                onClick={() => setIsOpen(true)}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold transition shadow-sm h-[46px] hover:shadow-md ${selected.length > 0 ? 'bg-vault-accent text-white border-vault-accent hover:bg-vault-accentHover' : 'bg-vault-950 text-gray-300 border-vault-700 hover:border-gray-500 hover:text-white'}`}
            >
                <div className="relative">
                    <Filter size={16} />
                    {selected.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-white text-vault-900 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                            {selected.length}
                        </span>
                    )}
                </div>
                <span>{t('shared_filter_label')}</span>
            </button>

            {/* FULL SCREEN MODAL */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] bg-vault-950 flex flex-col overflow-hidden animate-fadeIn">

                    {/* 1. Header (Responsive) */}
                    <div className="px-4 sm:px-8 md:px-12 py-4 sm:py-6 border-b border-vault-800 bg-vault-950 flex flex-col lg:flex-row gap-4 justify-between items-center shrink-0">
                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight w-full lg:w-auto text-left">
                            {t('shared_filter_modal_title') || "All filters"}
                        </h2>

                        {/* DESKTOP ACTIONS (Hidden on Mobile) */}
                        <div className="hidden lg:flex items-center gap-4">
                            {tempSelected.length > 0 && (
                                <button
                                    onClick={() => setTempSelected([])}
                                    className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white bg-vault-900 hover:bg-vault-800 rounded-lg transition"
                                >
                                    {t('shared_clear') || "Clear"}
                                </button>
                            )}
                            <button
                                onClick={handleApply}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-900/20 transition"
                            >
                                {t('shared_apply_filters') || "Apply filters"}
                            </button>
                            <button onClick={() => setIsOpen(false)} className="ml-2 text-gray-500 hover:text-white p-2">
                                <X size={24} />
                            </button>
                        </div>

                        {/* MOBILE CLOSE (Visible only on Mobile) */}
                        <div className="lg:hidden w-full flex justify-end -mt-10">
                             <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white p-2 bg-vault-800 rounded-full border border-vault-700">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* 2. Content Area - FIXES APPLIED HERE */}
                    {/* CHANGED: overflow-y-auto -> overflow-y-scroll (Fixes desktop layout shift) */}
                    <div className="flex-1 overflow-y-scroll overscroll-contain custom-scrollbar p-4 sm:p-8 md:p-12 lg:p-16 bg-vault-950">
                        {/* CHANGED: pb-20 -> pb-96 (Fixes mobile keyboard hiding results) */}
                        <div className="flex flex-col sm:flex-row gap-3 items-start pb-96">
                            {columnData.map((colTypes, colIdx) => (
                                <div key={colIdx} className="flex-1 flex flex-col gap-3 w-full">
                                    {colTypes.map(type => (
                                        <FilterAccordionGroup
                                            key={type}
                                            type={type}
                                            categories={categories.filter(c => c.type === type)}
                                            selectedIds={tempSelected}
                                            onToggleItem={toggleItem}
                                            onToggleAll={toggleAllInGroup}
                                            sortConfig={sortConfig}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. Footer (Visible ONLY on Mobile) */}
                    <div className="lg:hidden px-4 py-4 border-t border-vault-800 bg-vault-950 flex gap-3 shrink-0">
                        {tempSelected.length > 0 && (
                            <button
                                onClick={() => setTempSelected([])}
                                className="px-4 py-3 text-sm font-bold text-gray-400 hover:text-white bg-vault-900 hover:bg-vault-800 rounded-xl transition border border-vault-800"
                            >
                                {t('shared_clear') || "Clear"}
                            </button>
                        )}
                        <button
                            onClick={handleApply}
                            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 transition"
                        >
                            {t('shared_apply_filters') || "Apply filters"}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
});

export const StatCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: string | number, icon: any, colorClass: string }) => (
    <div className="bg-vault-900 border border-vault-700 p-4 rounded-xl flex items-center justify-between">
        <div>
            <p className="text-gray-500 text-xs font-bold uppercase">{title}</p>
            <p className="text-2xl font-black text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10`}>
            <Icon className={colorClass.replace('bg-', 'text-')} size={24} />
        </div>
    </div>
);
