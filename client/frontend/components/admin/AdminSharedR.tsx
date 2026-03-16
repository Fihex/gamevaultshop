
import React, { useState, useEffect, useRef } from 'react';
import { Category } from '../../types';
import { ChevronLeft, ChevronRight, X, CheckSquare, Square, Filter, ChevronDown, Search } from 'lucide-react';
import { useLanguage } from '../../config/language';

// Optimized Toolbar with internal debounce to prevent API spamming
export const TopToolbar = React.memo(({
  search, setSearch, placeholder,
  totalElements, size, setSize,
  start, end,
  extraFilter
}: {
  search: string, setSearch: (s: string) => void, placeholder: string,
  totalElements: number, size: number, setSize: (s: number) => void,
  start: number, end: number,
  extraFilter?: React.ReactNode
}) => {
    const { t } = useLanguage();
    const [localSearch, setLocalSearch] = useState(search);

    // Sync local state if prop changes externally (e.g. clear filters)
    useEffect(() => {
        setLocalSearch(search);
    }, [search]);

    // Debounce updates to parent
    useEffect(() => {
        const handler = setTimeout(() => {
            if (localSearch !== search) {
                setSearch(localSearch);
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [localSearch, setSearch, search]);

    return (
      <div className="flex flex-col gap-4 mb-6 bg-vault-900/50 p-4 rounded-xl border border-vault-700/50">
        <div className="flex flex-wrap gap-4 justify-between items-end md:items-center">
            <div className="flex-1 w-full md:w-auto relative min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={localSearch}
                    onChange={e => setLocalSearch(e.target.value)}
                    className="w-full bg-vault-800 border border-vault-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-vault-accent focus:ring-1 focus:ring-vault-accent transition-all"
                />
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
                 {extraFilter}
                 <div className="flex items-center gap-2 bg-vault-800 px-3 py-2.5 rounded-lg border border-vault-700">
                    <span className="text-xs text-gray-400 whitespace-nowrap">{t('shared_rows')}</span>
                    <select
                        value={size}
                        onChange={(e) => setSize(Number(e.target.value))}
                        className="bg-vault-800 text-sm text-white font-bold focus:outline-none cursor-pointer"
                    >
                        <option value={5} className="bg-vault-800 text-white">5</option>
                        <option value={10} className="bg-vault-800 text-white">10</option>
                        <option value={20} className="bg-vault-800 text-white">20</option>
                        <option value={50} className="bg-vault-800 text-white">50</option>
                    </select>
                 </div>
            </div>
        </div>
        <div className="text-xs text-gray-400 font-medium">
           {t('shared_found')} <span className="text-white font-bold tabular-nums">{totalElements}</span> {t('shared_records')}
        </div>
      </div>
    );
});

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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 border-t border-vault-700 pt-6">
            <div className="flex items-center gap-2 order-2 sm:order-1">
                <span className="text-xs text-gray-400">{t('shared_go_page')}</span>
                <form onSubmit={handleJump} className="flex items-center m-0 p-0">
                    <input
                    className="w-12 bg-vault-900 border border-vault-700 rounded px-2 py-1 text-sm text-center text-white focus:border-vault-accent outline-none m-0 h-8"
                    value={jumpPage}
                    onChange={e => setJumpPage(e.target.value)}
                    placeholder="#"
                    />
                </form>
            </div>

            <div className="flex items-center gap-1 order-1 sm:order-2">
                <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="w-8 h-8 rounded hover:bg-vault-700 disabled:opacity-30 transition text-gray-400 hover:text-white flex items-center justify-center flex-shrink-0"
                >
                    <ChevronLeft size={16} />
                </button>

                {/* Fixed width container to prevent jitter */}
                <div className="flex items-center justify-center gap-1 px-2 w-[280px]">
                    {getPageNumbers().map((p, idx) => (
                        p === -1 ? (
                            <span key={`sep-${idx}`} className="text-gray-600 px-1 w-8 text-center">...</span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition tabular-nums ${page === p ? 'bg-vault-accent text-white shadow-lg shadow-vault-accent/20 ring-2 ring-vault-accent/50' : 'bg-vault-900 text-gray-400 hover:bg-vault-800 hover:text-white'}`}
                            >
                                {p + 1}
                            </button>
                        )
                    ))}
                </div>

                <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className="w-8 h-8 rounded hover:bg-vault-700 disabled:opacity-30 transition text-gray-400 hover:text-white flex items-center justify-center flex-shrink-0"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
});

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
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

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
        <div className="relative" ref={wrapperRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-vault-800 border border-vault-700 rounded-lg p-3 text-sm cursor-pointer min-h-[46px] flex items-center justify-between hover:border-vault-600 transition h-auto"
            >
                {selectedIds.length > 0 ? (
                     <div className="flex flex-wrap gap-1">
                         {selectedIds.map(id => {
                             const cat = options.find(c => c.id === id);
                             if(!cat) return null;
                             return (
                                 <span key={id} className="bg-vault-950 text-white px-2 py-0.5 rounded text-xs flex items-center gap-1 border border-vault-700 force-wrap">
                                     {cat.name} <X size={10} onClick={(e) => { e.stopPropagation(); toggle(id); }} className="hover:text-red-400 cursor-pointer flex-shrink-0"/>
                                 </span>
                             )
                         })}
                     </div>
                ) : (
                    <span className="text-gray-500">{placeholder}</span>
                )}
                <ChevronDown size={16} className="text-gray-500 flex-shrink-0 ml-2"/>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-vault-900 border border-vault-700 rounded-lg shadow-xl overflow-hidden">
                     <div className="p-2 border-b border-vault-800">
                         <input
                            autoFocus
                            className="w-full bg-vault-800 border border-vault-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-vault-accent"
                            placeholder={t('shared_search_ph')}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                         />
                     </div>
                     <div className="max-h-40 overflow-y-auto custom-scrollbar">
                         {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                             <div
                                key={opt.id}
                                onClick={() => toggle(opt.id)}
                                className="px-3 py-2 hover:bg-vault-800 cursor-pointer flex items-center gap-2 text-sm text-gray-300 hover:text-white force-wrap"
                             >
                                 {selectedIds.includes(opt.id) ? <CheckSquare size={14} className="text-vault-accent min-w-[14px]"/> : <Square size={14} className="min-w-[14px]"/>}
                                 <span className="force-wrap">{opt.name}</span>
                             </div>
                         )) : (
                             <div className="p-3 text-center text-gray-500 text-xs italic">{t('shared_no_matches')}</div>
                         )}
                     </div>
                </div>
            )}
        </div>
    );
});

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
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const toggle = (id: number) => {
        if (selected.includes(id)) onChange(selected.filter(s => s !== id));
        else onChange([...selected, id]);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-bold transition whitespace-nowrap ${selected.length > 0 ? 'bg-vault-accent text-white border-vault-accent' : 'bg-vault-800 text-gray-300 border-vault-700 hover:border-gray-500'}`}
            >
                <Filter size={14} />
                <span className="max-w-[80px] truncate block">
                    {selected.length > 0 ? `${selected.length} ${t('shared_selected')}` : t('shared_filter_label')}
                </span>
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}/>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-64 bg-vault-800 border border-vault-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
                    <div className="p-3 border-b border-vault-700 flex justify-between items-center bg-vault-900/50">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('shared_cat_filters')}</span>
                        {selected.length > 0 && (
                            <button onClick={() => onChange([])} className="text-xs text-red-400 hover:text-white">{t('shared_clear')}</button>
                        )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2">
                        {Array.from(new Set(categories.map(c => c.type))).sort().map(type => {
                             const groupCats = categories.filter(c => c.type === type);
                             // Sort items based on configuration
                             if (sortConfig[type]) {
                                 groupCats.sort((a, b) => a.name.localeCompare(b.name));
                             } else {
                                 groupCats.sort((a, b) => a.id - b.id);
                             }

                             if (groupCats.length === 0) return null;
                             return (
                                 <div key={type} className="mb-3 last:mb-0">
                                     <div className="px-2 text-[10px] font-bold text-vault-secondary mb-1">{type}</div>
                                     {groupCats.map(c => (
                                         <div
                                            key={c.id}
                                            onClick={() => toggle(c.id)}
                                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-vault-700 rounded cursor-pointer"
                                         >
                                             {selected.includes(c.id)
                                                ? <CheckSquare size={14} className="text-vault-accent min-w-[14px]"/>
                                                : <Square size={14} className="text-gray-600 min-w-[14px]"/>
                                             }
                                             <span className={`text-sm force-wrap ${selected.includes(c.id) ? 'text-white' : 'text-gray-400'}`}>{c.name}</span>
                                         </div>
                                     ))}
                                 </div>
                             );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
});

// Simple Stat Card for Admin Dashboard
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
