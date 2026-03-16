import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { FilterState, Category } from '../../types';
import {
    X, Filter, RotateCcw, ArrowUp, Minus, Plus, Check, Layers,
    Loader2, ChevronsUpDown
} from 'lucide-react';
import { useLanguage } from '../../config/language';
import { cn } from '../../lib/utils';

// --- Shadcn UI Imports ---
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// --- HOOK: Use Media Query ---
function useMediaQuery(query: string) {
    const [value, setValue] = React.useState(false);

    React.useEffect(() => {
        function onChange(event: MediaQueryListEvent) {
            setValue(event.matches);
        }
        const result = matchMedia(query);
        result.addEventListener("change", onChange);
        setValue(result.matches);
        return () => result.removeEventListener("change", onChange);
    }, [query]);

    return value;
}

// --- HOOK: useDebounce ---
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

// --- 1. Debounced Input (FIXED: Only auto-scrolls if enabled) ---
const DebouncedInput = React.memo(({
    value,
    onChange,
    placeholder,
    className,
    enableAutoScroll = false, // New Prop
    ...props
}: {
    value: number | undefined,
    onChange: (val: number | undefined) => void,
    placeholder: string,
    className?: string,
    enableAutoScroll?: boolean
} & React.InputHTMLAttributes<HTMLInputElement>) => {
    const [localValue, setLocalValue] = useState<string>(value !== undefined ? String(value) : '');

    useEffect(() => {
        setLocalValue(value !== undefined ? String(value) : '');
    }, [value]);

    useEffect(() => {
        const handler = setTimeout(() => {
            const num = localValue === '' ? undefined : parseFloat(localValue);
            if (num !== value) {
                if (num !== undefined && isNaN(num)) return;
                onChange(num);
            }
        }, 300);
        return () => clearTimeout(handler);
    }, [localValue, onChange, value]);

    // Handle Focus: Scroll into view ONLY on mobile (when enableAutoScroll is true)
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        if (enableAutoScroll) {
            setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    };

    return (
        <div className="relative w-full min-w-0">
            <Input
                {...props}
                type="number"
                placeholder={placeholder}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onFocus={handleFocus}
                onWheel={(e) => e.currentTarget.blur()}
                className={cn(
                    "bg-vault-900 border-vault-800 text-white placeholder:text-gray-700 h-8 text-xs w-full px-2 transition-colors duration-200",
                    "hover:border-white/10 focus:border-white/20 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/20",
                    "[appearance:textfield]",
                    "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0",
                    "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0",
                    className
                )}
            />
        </div>
    );
});

// --- 2. Simple Category List (<= 14 Items) ---
const SimpleCategoryList = React.memo(({
    items,
    selectedIds,
    onToggle,
    t
}: {
    items: Category[];
    selectedIds: number[];
    onToggle: (id: number) => void;
    t: (key: string) => string;
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const LIMIT = 6;
    const shouldTruncate = items.length > LIMIT;
    const displayItems = shouldTruncate && !isExpanded ? items.slice(0, LIMIT) : items;

    return (
        <div className="space-y-3 w-full pt-1 relative z-0">
            <div className="grid gap-1.5 w-full">
                {displayItems.map((c) => {
                    const isSelected = selectedIds.includes(c.id);
                    return (
                        <div
                            key={c.id}
                            onClick={() => onToggle(c.id)}
                            className={cn(
                                "flex items-center space-x-2 rounded-md p-2 transition-all duration-200 cursor-pointer group w-full overflow-hidden relative",
                                isSelected ? "bg-vault-800" : "hover:bg-vault-900"
                            )}
                        >
                            <Checkbox
                                id={`cat-${c.id}`}
                                checked={isSelected}
                                className="border-vault-600 data-[state=checked]:bg-vault-accent data-[state=checked]:border-vault-accent data-[state=checked]:text-white shrink-0 pointer-events-none"
                            />
                            <span
                                className={cn(
                                    "text-sm font-medium leading-tight flex-1 py-1 whitespace-normal min-w-0 pointer-events-none select-none",
                                    isSelected ? "text-white" : "text-gray-400 group-hover:text-gray-300"
                                )}
                            >
                                {c.name}
                            </span>
                        </div>
                    );
                })}
            </div>

            {shouldTruncate && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-7 w-full justify-between text-[10px] uppercase tracking-wide text-gray-500 hover:text-white hover:bg-vault-800"
                >
                    {isExpanded ? t('sidebar.show_less') : `${t('sidebar.show_more')} (${items.length - LIMIT})`}
                    {isExpanded ? <Minus size={12} /> : <Plus size={12} />}
                </Button>
            )}
        </div>
    );
});

// --- 3. Combobox Inner Content ---
const ComboboxListContent = ({
    items,
    selectedIds,
    onToggle,
    t,
    label,
    isMobile
}: any) => {
    const [inputValue, setInputValue] = useState('');
    const searchTerm = useDebounce(inputValue, 300);

    const BATCH_SIZE = 50;
    const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);

    const filteredItems = useMemo(() => {
        if (!searchTerm) return items;
        return items.filter((c: Category) => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [items, searchTerm]);

    useEffect(() => { setVisibleCount(BATCH_SIZE); }, [searchTerm]);

    const visibleItems = filteredItems.slice(0, visibleCount);
    const hasMore = visibleCount < filteredItems.length;

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 50) {
            if (hasMore) {
                setVisibleCount(prev => Math.min(prev + BATCH_SIZE, filteredItems.length));
            }
        }
    }, [hasMore, filteredItems.length]);

    const groupSelectedCount = items.filter((i: Category) => selectedIds.includes(i.id)).length;

    return (
        <Command shouldFilter={false} className="bg-transparent overflow-hidden w-full h-full flex flex-col">

            {/* SEARCH INPUT */}
            <div className={cn(
                "w-full shrink-0 z-10 bg-vault-950 border-b border-vault-800",
                "p-0"
            )}>
                <CommandInput
                    placeholder={`${t('search')} ${label}...`}
                    value={inputValue}
                    onValueChange={setInputValue}
                    className={cn(
                        "text-white bg-transparent border-none w-full placeholder:text-gray-500 focus:ring-0",
                        isMobile
                            ? "h-12 text-base px-4 rounded-none"
                            : "h-9 text-xs px-2"
                    )}
                />
            </div>

            {/* LIST AREA */}
            <CommandList
                className={cn(
                    "flex-1 w-full overflow-y-auto custom-scrollbar",
                    !isMobile && "min-h-[100px]",
                    isMobile ? "max-h-[unset] p-2" : "p-1"
                )}
                onScroll={handleScroll}
            >
                {filteredItems.length === 0 && (
                     <CommandEmpty className="py-6 text-center text-sm text-gray-500">
                        {t('no_results') || 'No results found.'}
                    </CommandEmpty>
                )}

                <CommandGroup>
                    {visibleItems.map((c: Category) => {
                        const isSelected = selectedIds.includes(c.id);
                        return (
                            <CommandItem
                                key={c.id}
                                value={c.name}
                                onSelect={() => onToggle(c.id)}
                                className={cn(
                                    "cursor-pointer rounded-sm mb-1 transition-colors duration-150 w-full flex items-center gap-3",
                                    isMobile ? "py-3 px-3" : "py-2 px-2",
                                    isSelected ? "bg-vault-accent/10" : "hover:bg-vault-900",
                                    "aria-selected:bg-vault-800"
                                )}
                            >
                                <Checkbox
                                    checked={isSelected}
                                    className={cn(
                                        "border-vault-600 data-[state=checked]:bg-vault-accent data-[state=checked]:border-vault-accent data-[state=checked]:text-white shrink-0 pointer-events-none",
                                        isMobile ? "h-5 w-5 rounded-md" : "h-4 w-4 rounded-sm"
                                    )}
                                />
                                <span className={cn(
                                    "whitespace-normal font-medium flex-1",
                                    isMobile ? "text-base text-white" : "text-xs",
                                    isSelected ? "text-white" : "text-gray-400"
                                )}>
                                    {c.name}
                                </span>
                            </CommandItem>
                        );
                    })}
                </CommandGroup>

                {hasMore && (
                    <div className="flex justify-center py-6">
                        <Loader2 className={cn("animate-spin text-vault-accent", isMobile ? "h-8 w-8" : "h-5 w-5")} />
                    </div>
                )}
            </CommandList>

            {/* Desktop Footer Only */}
            {!isMobile && (
                <div className="border-t border-vault-800 bg-vault-900/80 p-2 text-[10px] text-gray-500 flex justify-between font-mono shrink-0">
                    <span>{t("selected")}: {groupSelectedCount}</span>
                    <span>{visibleItems.length}/{filteredItems.length}</span>
                </div>
            )}
        </Command>
    );
};

// --- 4. Responsive Combobox Container ---
const MultiSelectCombobox = React.memo(({
    items,
    selectedIds,
    onToggle,
    t,
    label
}: {
    items: Category[];
    selectedIds: number[];
    onToggle: (id: number) => void;
    t: (key: string) => string;
    label: string;
}) => {
    const [open, setOpen] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const groupSelectedCount = items.filter(i => selectedIds.includes(i.id)).length;

    // Trigger Button
    const TriggerButton = (
        <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className={cn(
                "w-full justify-between bg-vault-900/50 hover:bg-vault-900 hover:text-white text-xs h-9 transition-colors",
                "border border-vault-accent/30 hover:border-vault-accent/60",
                groupSelectedCount > 0 ? "text-white bg-vault-accent/5" : "text-gray-400"
            )}
        >
            {groupSelectedCount > 0
                ? `${groupSelectedCount} ${t('selected') || 'selected'}`
                : `${t('select')} ${label}...`
            }
            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
    );

    // --- DESKTOP: Popover ---
    if (isDesktop) {
        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    {TriggerButton}
                </PopoverTrigger>
                <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0 border border-vault-accent bg-vault-950 text-white shadow-2xl z-[200]"
                    align="start"
                    sideOffset={4}
                >
                   <div className="max-h-[350px] flex flex-col">
                        <ComboboxListContent
                            items={items}
                            selectedIds={selectedIds}
                            onToggle={onToggle}
                            t={t}
                            label={label}
                            isMobile={false}
                        />
                   </div>
                </PopoverContent>
            </Popover>
        );
    }

    // --- MOBILE: Full Screen Sheet ---
    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {TriggerButton}
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[100dvh] w-full p-0 bg-vault-950 border-none z-[200] flex flex-col [&>button]:hidden">

                {/* Header */}
                <SheetHeader className="px-4 h-14 border-b border-vault-800 flex flex-row items-center justify-between bg-vault-950 shrink-0">
                    <SheetTitle className="text-white text-lg font-bold">
                        {t('select')} {label}
                    </SheetTitle>
                    <SheetClose asChild>
                         <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-400 hover:text-white hover:bg-vault-900 rounded-full">
                             <X className="h-6 w-6" />
                             <span className="sr-only">Close</span>
                         </Button>
                    </SheetClose>
                </SheetHeader>

                {/* Main Content */}
                <div className="flex-1 overflow-hidden bg-vault-950 flex flex-col">
                     <ComboboxListContent
                            items={items}
                            selectedIds={selectedIds}
                            onToggle={onToggle}
                            t={t}
                            label={label}
                            isMobile={true}
                        />
                </div>

                {/* Bottom Bar */}
                <div className="p-3 border-t border-vault-800 bg-vault-900 flex justify-between items-center text-sm text-gray-400 shrink-0">
                     <span className="font-mono">{groupSelectedCount} {t('selected')}</span>
                     <Button size="default" className="w-1/3 bg-vault-accent hover:bg-vault-accent/90 text-white font-bold h-10" onClick={() => setOpen(false)}>
                        {t('apply_filters') || 'Apply'}
                     </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
});

// --- 5. Filter Content ---
const FilterContent = React.memo(({
    groupOrder, filters, setFilters, categories, toggleCategory, sortConfig, clearFilters, hasActiveFilters, isMobile
}: {
    groupOrder: string[], filters: FilterState, setFilters: React.Dispatch<React.SetStateAction<FilterState>>,
    categories: Category[], toggleCategory: (id: number) => void, sortConfig: Record<string, boolean>,
    clearFilters: () => void, hasActiveFilters: boolean, isMobile: boolean
}) => {
    const { t } = useLanguage();

    const [openSections, setOpenSections] = useState<string[]>(() => {
        try {
            const saved = sessionStorage.getItem('gamevault_sidebar_sections');
            return saved ? JSON.parse(saved) : ['availability', 'price', 'stock'];
        } catch {
            return ['availability', 'price', 'stock'];
        }
    });

    useEffect(() => {
        sessionStorage.setItem('gamevault_sidebar_sections', JSON.stringify(openSections));
    }, [openSections]);

    useEffect(() => {
        if (groupOrder.length > 0) {
            setOpenSections(prev => {
                const combined = new Set([...prev, ...groupOrder]);
                return Array.from(combined);
            });
        }
    }, [groupOrder]);

    const getTypeColor = (t: string) => {
        switch(t) {
            case 'PUBLISHER': return 'text-vault-accent border-vault-accent/20 bg-vault-accent/10';
            case 'GENRE': return 'text-vault-secondary border-vault-secondary/20 bg-vault-secondary/10';
            case 'PLATFORM': return 'text-blue-400 border-blue-400/20 bg-blue-400/10';
            default: return 'text-gray-400 border-gray-700';
        }
    };

    return (
        <div className={cn("flex flex-col gap-4 p-4 w-full animate-fadeIn", isMobile && "pb-32")}>
            {/* Clear Filters Button */}
            <div className="w-full">
                <Button
                    variant="outline"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className={cn(
                        "w-full justify-center gap-2 font-bold border-dashed h-8 text-[10px] uppercase tracking-wide transition-all",
                        hasActiveFilters
                            ? "border-red-500/30 text-red-400 bg-red-950/10 hover:bg-red-950/30 hover:text-red-200 hover:border-red-500/50"
                            : "border-vault-800 text-gray-600 bg-vault-900/50"
                    )}
                >
                    <RotateCcw size={12} /> {t('clear_all_filters')}
                </Button>
            </div>

            <Accordion
                type="multiple"
                value={openSections}
                onValueChange={setOpenSections}
                className="w-full space-y-6"
            >
                {/* Dynamic Categories */}
                {groupOrder.map(type => {
                    const groupItems = categories.filter(c => c.type === type && c.isVisible);

                    groupItems.sort((a, b) =>
                        sortConfig[type] ? a.name.localeCompare(b.name) : a.id - b.id
                    );

                    if (groupItems.length === 0) return null;

                    const selectedCount = groupItems.filter(i => filters.categories.includes(i.id)).length;
                    const isLargeGroup = groupItems.length > 14;

                    return (
                        <AccordionItem value={type} key={type} className="border-vault-800">
                            <AccordionTrigger className="hover:no-underline py-2">
                                <div className="flex items-center justify-between w-full pr-2">
                                    <Badge variant="outline" className={cn("text-[10px] uppercase tracking-widest font-extrabold h-5", getTypeColor(type))}>
                                        {type}
                                    </Badge>
                                    {selectedCount > 0 && !isLargeGroup && (
                                        <span className="text-[10px] text-gray-500 font-medium">{selectedCount}</span>
                                    )}
                                </div>
                            </AccordionTrigger>

                            <AccordionContent className={isLargeGroup ? "pt-1 pb-2 overflow-visible" : ""}>
                                {isLargeGroup ? (
                                    <MultiSelectCombobox
                                        items={groupItems}
                                        selectedIds={filters.categories}
                                        onToggle={toggleCategory}
                                        t={t}
                                        label={type}
                                    />
                                ) : (
                                    <SimpleCategoryList
                                        items={groupItems}
                                        selectedIds={filters.categories}
                                        onToggle={toggleCategory}
                                        t={t}
                                    />
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}

                {/* Static Sections */}
                <AccordionItem value="availability" className="border-vault-800">
                    <AccordionTrigger className="hover:no-underline py-2">
                            <span className="text-xs font-extrabold uppercase tracking-widest text-purple-400 flex items-center gap-2">
                             <Layers size={14} /> {t('availability')}
                            </span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                        <RadioGroup
                            value={filters.availability || 'ALL'}
                            onValueChange={(val) => setFilters(prev => ({ ...prev, availability: val as any }))}
                            className="grid gap-2"
                        >
                            {['ALL', 'IN_STOCK', 'OUT_OF_STOCK'].map((opt) => {
                                const isSelected = filters.availability === opt || (!filters.availability && opt === 'ALL');
                                return (
                                    <Label
                                        key={opt}
                                        htmlFor={`opt-${opt}`}
                                        className={cn(
                                            "relative flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-all duration-200 w-full group",
                                            isSelected
                                                ? "bg-vault-accent/10 border-vault-accent text-white shadow-[0_0_15px_-3px_rgba(139,92,246,0.2)]"
                                                : "bg-vault-900 border-vault-800 text-gray-400 hover:border-vault-700 hover:bg-vault-800 hover:text-gray-300"
                                        )}
                                    >
                                        <RadioGroupItem value={opt} id={`opt-${opt}`} className="sr-only" />
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full transition-colors",
                                                isSelected ? "bg-vault-accent" : "bg-vault-700 group-hover:bg-vault-600"
                                            )}/>
                                            <span className="font-bold text-xs uppercase tracking-wide">
                                                {t(`availability_${opt}` as any)}
                                            </span>
                                        </div>
                                        {isSelected && (
                                            <Check size={16} className="text-vault-accent animate-fadeIn" strokeWidth={3} />
                                        )}
                                    </Label>
                                );
                            })}
                        </RadioGroup>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="price" className="border-vault-800">
                        <AccordionTrigger className="hover:no-underline py-2">
                            <span className="text-xs font-extrabold uppercase tracking-widest text-green-400 flex items-center gap-2">
                            {t('price_range')}
                            </span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 w-full">
                            <div className="grid w-full gap-2 min-w-0">
                                <Label htmlFor="min-price" className="text-[10px] text-gray-500 uppercase font-bold truncate">{t('min')}</Label>
                                <DebouncedInput
                                    id="min-price"
                                    placeholder="0"
                                    min="0"
                                    value={filters.minPrice}
                                    onChange={(val) => setFilters(prev => ({...prev, minPrice: val}))}
                                    enableAutoScroll={isMobile}
                                />
                            </div>
                            <span className="text-gray-600 font-bold pt-6">-</span>
                            <div className="grid w-full gap-2 min-w-0">
                                <Label htmlFor="max-price" className="text-[10px] text-gray-500 uppercase font-bold truncate">{t('max')}</Label>
                                <DebouncedInput
                                    id="max-price"
                                    placeholder="Max"
                                    min="0"
                                    value={filters.maxPrice}
                                    onChange={(val) => setFilters(prev => ({...prev, maxPrice: val}))}
                                    enableAutoScroll={isMobile}
                                />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="stock" className="border-none">
                        <AccordionTrigger className="hover:no-underline py-2">
                            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-400 flex items-center gap-2">
                            {t('stock_quantity')}
                            </span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 w-full">
                            <div className="grid w-full gap-2 min-w-0">
                                <Label htmlFor="min-stock" className="text-[10px] text-gray-500 uppercase font-bold truncate">{t('min')}</Label>
                                <DebouncedInput
                                    id="min-stock"
                                    placeholder="0"
                                    min="0"
                                    value={filters.minStock}
                                    onChange={(val) => setFilters(prev => ({...prev, minStock: val}))}
                                    enableAutoScroll={isMobile}
                                />
                            </div>
                            <span className="text-gray-600 font-bold pt-6">-</span>
                            <div className="grid w-full gap-2 min-w-0">
                                <Label htmlFor="max-stock" className="text-[10px] text-gray-500 uppercase font-bold truncate">{t('max')}</Label>
                                <DebouncedInput
                                    id="max-stock"
                                    placeholder="Max"
                                    min="0"
                                    value={filters.maxStock}
                                    onChange={(val) => setFilters(prev => ({...prev, maxStock: val}))}
                                    enableAutoScroll={isMobile}
                                />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
});

// --- 6. Main Component ---
export const Sidebar = React.memo(({
    isSidebarOpen, setIsSidebarOpen, groupOrder, filters, setFilters, categories, toggleCategory, sortConfig
}: {
    isSidebarOpen: boolean, setIsSidebarOpen: (v: boolean) => void,
    groupOrder: string[], filters: FilterState, setFilters: React.Dispatch<React.SetStateAction<FilterState>>,
    categories: Category[], toggleCategory: (id: number) => void,
    sortConfig: Record<string, boolean>
}) => {
    const { t } = useLanguage();
    const desktopScrollRef = useRef<HTMLDivElement>(null);
    const mobileScrollRef = useRef<HTMLDivElement>(null);
    const [renderMobileContent, setRenderMobileContent] = useState(false);

    useEffect(() => {
        if (isSidebarOpen) {
            const timer = setTimeout(() => setRenderMobileContent(true), 150);
            return () => clearTimeout(timer);
        } else {
            setRenderMobileContent(false);
        }
    }, [isSidebarOpen]);

    const hasActiveFilters = filters.categories.length > 0 ||
                             filters.minPrice !== undefined || filters.maxPrice !== undefined ||
                             filters.minStock !== undefined || filters.maxStock !== undefined ||
                             (filters.availability && filters.availability !== 'ALL');

    const clearFilters = useCallback(() => {
        setFilters(prev => ({
            ...prev,
            categories: [],
            minPrice: undefined,
            maxPrice: undefined,
            minStock: undefined,
            maxStock: undefined,
            availability: undefined
        }));
    }, [setFilters]);

    const scrollToTop = () => {
        const mobileViewport = mobileScrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
        if (mobileViewport && mobileViewport.scrollTop > 50) {
             mobileViewport.scrollTo({ top: 0, behavior: 'smooth' });
             return;
        }
        const desktopViewport = desktopScrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
        if (desktopViewport && desktopViewport.scrollTop > 50) {
            desktopViewport.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetContent side="left" className="w-[85vw] sm:w-[320px] p-0 border-r-vault-800 bg-vault-950 text-white z-[150] flex flex-col gap-0 [&>button]:hidden">
                    <SheetHeader className="h-16 px-4 flex flex-row items-center justify-between border-b border-vault-800 bg-vault-950 shrink-0 space-y-0">
                        <SheetTitle className="flex items-center gap-2 text-white font-black text-lg tracking-tight">
                            <Filter size={20} className="text-vault-accent" /> {t('filters')}
                        </SheetTitle>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={scrollToTop}
                                className="text-gray-400 hover:text-white hover:bg-vault-800 h-8 w-8"
                            >
                                <ArrowUp size={20} />
                            </Button>
                            <SheetClose asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-gray-400 hover:text-white hover:bg-vault-800 h-8 w-8"
                                >
                                    <X size={20} />
                                </Button>
                            </SheetClose>
                        </div>
                    </SheetHeader>
                    <ScrollArea ref={mobileScrollRef} className="h-[calc(100vh-4rem)] w-full overflow-x-hidden">
                        {renderMobileContent ? (
                            <FilterContent
                                groupOrder={groupOrder} filters={filters} setFilters={setFilters}
                                categories={categories} toggleCategory={toggleCategory} sortConfig={sortConfig}
                                clearFilters={clearFilters} hasActiveFilters={hasActiveFilters}
                                isMobile={true}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                <Loader2 className="animate-spin text-vault-accent" size={32} />
                                <span className="text-xs text-gray-500 uppercase font-bold tracking-widest">{t('state_loading')}...</span>
                            </div>
                        )}
                    </ScrollArea>
                </SheetContent>
            </Sheet>

            <aside className="hidden lg:flex flex-col w-72 sticky top-16 h-[calc(100vh-4rem)] border-r border-vault-800 bg-vault-950 z-30 shrink-0">
                <div className="h-16 px-4 flex items-center justify-between border-b border-vault-800 bg-vault-950 shrink-0">
                    <div className="flex items-center gap-2 text-white font-black text-lg tracking-tight">
                        <Filter size={20} className="text-vault-accent" /> {t('filters')}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={scrollToTop}
                        title={t('scroll_top')}
                        className="text-gray-400 hover:text-white hover:bg-vault-800 h-8 w-8"
                    >
                        <ArrowUp size={18} />
                    </Button>
                </div>
                <ScrollArea ref={desktopScrollRef} className="h-[calc(100vh-8rem)] w-full overflow-x-hidden">
                    <FilterContent
                        groupOrder={groupOrder} filters={filters} setFilters={setFilters}
                        categories={categories} toggleCategory={toggleCategory} sortConfig={sortConfig}
                        clearFilters={clearFilters} hasActiveFilters={hasActiveFilters}
                        isMobile={false}
                    />
                </ScrollArea>
            </aside>
        </>
    );
});
