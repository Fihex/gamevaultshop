import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Game, Category, FilterState, PageResult } from '../../types';
import { BackendService } from '../../services/backendService';
import { resolveImageUrl } from '../../constants';
import { TopToolbar, BottomPagination, MultiSelectFilter } from './AdminShared';
import {
    Plus, Edit, Trash2, Save, X, FileText, DollarSign, Package, List,
    ArrowLeft, ArrowRight, ImageIcon, Loader, Columns, ChevronDown,
    CheckSquare, Square, Archive, RotateCcw, Box, UploadCloud,
    Link as LinkIcon, HardDrive, Globe, Search, Check, Tag, Filter,
    XCircle, Image as ImageIconSmall, Hash, Loader2
} from 'lucide-react';
import { useLanguage } from '../../config/language';
import { cn } from '../../lib/utils';

// --- Shadcn UI Imports ---
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// --- HOOK: Use Media Query ---
function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, [matches, query]);
    return matches;
}

// --- HOOK: Use Debounce ---
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

/**
 * Component: DesktopListContent
 */
const DesktopListContent = ({
    items,
    selectedIds,
    onToggle,
    label
}: {
    items: Category[];
    selectedIds: number[];
    onToggle: (id: number) => void;
    label: string;
}) => {
    const { t } = useLanguage();
    const [inputValue, setInputValue] = useState('');
    const searchTerm = useDebounce(inputValue, 300);
    const [displayLimit, setDisplayLimit] = useState(50);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredItems = useMemo(() => {
        if (!searchTerm) return items;
        return items.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [items, searchTerm]);

    const visibleItems = filteredItems.slice(0, displayLimit);

    useEffect(() => { setDisplayLimit(50); }, [searchTerm]);

    // Auto-focus input when opened
    useEffect(() => {
        if (inputRef.current) {
            // Small timeout to allow popover animation to start
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, []);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 100) {
            if (displayLimit < filteredItems.length) {
                setDisplayLimit(prev => prev + 50);
            }
        }
    };

    return (
        <div className="w-full h-full bg-vault-950 flex flex-col overflow-hidden rounded-md">
            {/* Search Header - FLUSH DESIGN */}
            <div className="flex items-center border-b border-vault-800 px-3 py-2.5 bg-vault-950 sticky top-0 z-10">
                <Search className="mr-2 h-4 w-4 shrink-0 text-gray-500 opacity-70" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={`${t('search_placeholder')} ${label}...`}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className={cn(
                        "flex h-6 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-gray-500 text-white",
                        "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                    autoComplete="off"
                />
            </div>

            {/* List Content */}
            <div
                className="flex-1 overflow-y-auto custom-scrollbar p-1 max-h-[300px]"
                onScroll={handleScroll}
            >
                {visibleItems.length === 0 && (
                    <div className="py-8 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
                        <Filter size={16} className="opacity-30" />
                        <span>{t('no_results')}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-0.5">
                    {visibleItems.map(cat => {
                        const isSelected = selectedIds.includes(cat.id);
                        return (
                            <div
                                key={cat.id}
                                onClick={() => onToggle(cat.id)}
                                className={cn(
                                    "flex items-start justify-between px-3 py-2 rounded-md cursor-pointer transition-all text-xs group min-h-[32px] h-auto select-none",
                                    isSelected
                                        ? "bg-vault-800 text-white font-medium"
                                        : "text-gray-400 hover:bg-vault-900 hover:text-gray-200"
                                )}
                            >
                                <span className="whitespace-normal break-words leading-relaxed pr-2">{cat.name}</span>
                                {isSelected && <Check size={14} className="text-vault-accent shrink-0 mt-0.5" />}
                            </div>
                        );
                    })}
                </div>
                {visibleItems.length < filteredItems.length && (
                    <div className="py-2 flex justify-center text-vault-secondary">
                        <Loader2 size={14} className="animate-spin" />
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Component: MobileListContent
 */
const MobileListContent = ({
    items,
    selectedIds,
    onToggle,
    label
}: {
    items: Category[];
    selectedIds: number[];
    onToggle: (id: number) => void;
    label: string;
}) => {
    const { t } = useLanguage();
    const [inputValue, setInputValue] = useState('');
    const searchTerm = useDebounce(inputValue, 300);
    const [displayLimit, setDisplayLimit] = useState(50);

    const filteredItems = useMemo(() => {
        if (!searchTerm) return items;
        return items.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [items, searchTerm]);

    const visibleItems = filteredItems.slice(0, displayLimit);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 100) {
            if (displayLimit < filteredItems.length) {
                setDisplayLimit(prev => prev + 50);
            }
        }
    };

    useEffect(() => { setDisplayLimit(50); }, [searchTerm]);

    return (
        <div className="flex flex-col h-full bg-vault-950">
            {/* Mobile Search Input - NATIVE STYLE */}
            <div className="px-4 py-3 bg-vault-950 border-b border-vault-800 sticky top-0 z-20">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-gray-500" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-4 py-2.5 rounded-xl bg-vault-900 border border-transparent text-white placeholder-gray-500 focus:outline-none focus:bg-vault-800 focus:ring-1 focus:ring-vault-700 transition-all text-base"
                        placeholder={`${t('search_placeholder')} ${label}...`}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            {/* Main List */}
            <div
                className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-4"
                onScroll={handleScroll}
            >
                {visibleItems.length === 0 ? (
                    <div className="py-10 text-center text-gray-500 flex flex-col items-center gap-3">
                        <Filter size={32} className="opacity-20" />
                        <span className="text-sm font-medium">{t('no_results')}</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-1">
                        {visibleItems.map(cat => {
                            const isSelected = selectedIds.includes(cat.id);
                            return (
                                <div
                                    key={cat.id}
                                    onClick={() => onToggle(cat.id)}
                                    className={cn(
                                        "flex items-start justify-between px-5 py-4 rounded-xl cursor-pointer transition-all active:scale-[0.98] min-h-[50px] h-auto",
                                        isSelected
                                            ? "bg-vault-800 shadow-sm"
                                            : "hover:bg-vault-900"
                                    )}
                                >
                                    <span className={cn("text-base whitespace-normal break-words leading-snug", isSelected ? "text-white font-semibold" : "text-gray-300 font-medium")}>
                                        {cat.name}
                                    </span>
                                    {isSelected && (
                                        <div className="bg-vault-accent text-white p-1 rounded-full shadow-lg shadow-vault-accent/20 shrink-0 mt-0.5 ml-3">
                                            <Check size={14} strokeWidth={4} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
                {visibleItems.length < filteredItems.length && (
                    <div className="py-4 flex justify-center text-vault-secondary">
                        <Loader2 size={24} className="animate-spin" />
                    </div>
                )}
            </div>
        </div>
    );
};

// ... [The rest of the file (CategoryInput, InventoryManager) is preserved below for context]

/**
 * Component: CategoryInput
 */
const CategoryInput = ({
    label,
    options,
    selectedIds,
    onChange,
    placeholder
}: {
    label: string;
    options: Category[];
    selectedIds: number[];
    onChange: (ids: number[]) => void;
    placeholder: string;
}) => {
    const { t } = useLanguage();
    const [open, setOpen] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const selectedCategories = useMemo(() => {
        return options.filter(opt => selectedIds.includes(opt.id));
    }, [options, selectedIds]);

    const toggleSelection = (id: number) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(i => i !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    const removeCategory = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (window.confirm(t('confirm_remove_category'))) {
             onChange(selectedIds.filter(i => i !== id));
        }
    };

    const clearAll = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (window.confirm(t('confirm_remove_all'))) {
             onChange([]);
        }
    };

    const TriggerArea = (
        <div
            className={cn(
                "w-full min-h-[50px] bg-vault-950 border transition-all rounded-xl p-2 cursor-pointer flex flex-wrap gap-2 items-center shadow-inner group/container",
                open ? "border-vault-accent ring-1 ring-vault-accent/50" : "border-vault-800 hover:border-vault-700"
            )}
        >
            {selectedCategories.length > 0 ? (
                selectedCategories.map(cat => (
                    <Badge
                        key={cat.id}
                        variant="secondary"
                        className="bg-vault-800 hover:bg-vault-700 text-gray-200 border-vault-700 px-2.5 py-1 h-auto min-h-[28px] text-xs flex items-center gap-1.5 transition-colors select-none whitespace-normal break-words text-left max-w-full"
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpen(true);
                        }}
                    >
                        <span>{cat.name}</span>
                        <div
                            role="button"
                            onClick={(e) => removeCategory(e, cat.id)}
                            className="ml-0.5 rounded-full p-0.5 hover:bg-red-500/20 hover:text-red-400 text-gray-500 transition-colors shrink-0"
                        >
                            <X size={10} strokeWidth={3} />
                        </div>
                    </Badge>
                ))
            ) : (
                <span className="text-sm text-gray-600 italic px-2 select-none">{placeholder}</span>
            )}

            <div className="ml-auto text-gray-600 pr-2 flex items-center gap-2">
                {isDesktop && selectedIds.length > 0 && (
                    <div
                        role="button"
                        onClick={clearAll}
                        className="p-1 hover:text-red-400 transition-colors"
                        title={t('clear_all')}
                    >
                        <XCircle size={14} />
                    </div>
                )}
                <ChevronDown size={14} className={cn("transition-transform duration-300", open && "rotate-180 text-vault-accent")} />
            </div>
        </div>
    );

    if (isDesktop) {
        return (
            <div className="space-y-2">
                 <div className="flex justify-between items-end">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                        {label}
                    </label>
                </div>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <div role="button" tabIndex={0} className="outline-none">
                            {TriggerArea}
                        </div>
                    </PopoverTrigger>
                    {/* z-[200] to sit above modal */}
                    <PopoverContent
                        className="w-[300px] p-0 border border-vault-800 bg-vault-950 text-white shadow-2xl z-[200]"
                        align="start"
                    >
                        <DesktopListContent
                            items={options}
                            selectedIds={selectedIds}
                            onToggle={toggleSelection}
                            label={label}
                        />
                         <div className="p-2 bg-vault-950 border-t border-vault-800/50 text-[10px] text-gray-500 text-right">
                             {selectedIds.length} {t('selected_count')}
                         </div>
                    </PopoverContent>
                </Popover>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                    {label}
                </label>
            </div>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <div role="button" tabIndex={0} className="outline-none">
                        {TriggerArea}
                    </div>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[100dvh] w-full p-0 bg-vault-950 border-none z-[200] flex flex-col outline-none [&>button]:hidden">
                    <SheetHeader className="px-6 h-16 border-b border-vault-800 bg-vault-950 flex flex-row items-center justify-between shrink-0 space-y-0">
                        <SheetTitle className="text-white text-xl font-bold flex items-center gap-2">
                            <Tag size={20} className="text-vault-accent"/>
                            {t('select')} {label}
                        </SheetTitle>
                        <SheetClose asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-400 hover:text-white hover:bg-vault-900 rounded-full">
                                <X className="h-6 w-6" />
                            </Button>
                        </SheetClose>
                    </SheetHeader>

                    <div className="flex-1 overflow-hidden bg-vault-950 flex flex-col">
                         <MobileListContent
                            items={options}
                            selectedIds={selectedIds}
                            onToggle={toggleSelection}
                            label={label}
                        />
                    </div>

                    <div className="p-4 border-t border-vault-800 bg-vault-900 flex justify-between items-center shrink-0 safe-area-bottom gap-4">
                         <Button
                            variant="outline"
                            className="flex-1 border-vault-700 bg-transparent text-gray-400 hover:text-white hover:bg-vault-800 h-12 rounded-xl text-sm font-medium"
                            onClick={() => clearAll()}
                            disabled={selectedIds.length === 0}
                        >
                            {t('clear_all')}
                         </Button>
                         <Button
                            size="default"
                            className="flex-[2] bg-vault-accent hover:bg-vault-accent/90 text-white font-bold h-12 rounded-xl text-base shadow-lg shadow-vault-accent/20"
                            onClick={() => setOpen(false)}
                        >
                            {t('apply_btn')} ({selectedIds.length})
                         </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export const InventoryManager = () => {
    const { t } = useLanguage();
    const [mode, setMode] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
    const isArchiveView = mode === 'ARCHIVED';

    const [data, setData] = useState<PageResult<Game>>({ content: [], totalElements: 0, totalPages: 0, last: true });
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [search, setSearch] = useState('');
    const [catFilters, setCatFilters] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [minStock, setMinStock] = useState<number | undefined>(undefined);
    const [maxStock, setMaxStock] = useState<number | undefined>(undefined);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGame, setEditingGame] = useState<Partial<Game>>({});
    const [pendingFiles, setPendingFiles] = useState<Map<string, File>>(new Map());

    const [categories, setCategories] = useState<Category[]>([]);
    const [sortConfig, setSortConfig] = useState<Record<string, boolean>>({});
    const [draggedImgIdx, setDraggedImgIdx] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [imageInputMode, setImageInputMode] = useState<'UPLOAD' | 'URL'>('UPLOAD');

    const [availableColumns, setAvailableColumns] = useState<string[]>(['ID', 'Product Name', 'Price', 'Stock', 'Actions']);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(['ID', 'Product Name', 'Price', 'Stock', 'Actions']);
    const [isColMenuOpen, setIsColMenuOpen] = useState(false);
    const colMenuRef = useRef<HTMLDivElement>(null);

    const PLACEHOLDER_IMG = 'https://placehold.co/100x100/1e293b/475569?text=No+Image';

    const getColumnLabel = (col: string) => {
            switch (col) {
                case 'ID': return t('inv_col_id');
                case 'Product Name': return t('inv_col_name');
                case 'Price': return t('inv_col_price');
                case 'Stock': return t('inv_col_stock');
                case 'Actions': return t('inv_col_actions');
                default: return col;
            }
        };

    useEffect(() => {
        const saved = localStorage.getItem('gamevault_inventory_columns');
        if (saved) { try { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) setVisibleColumns(parsed); } catch(e) {} }
    }, []);

    useEffect(() => {
        if (visibleColumns.length > 0) localStorage.setItem('gamevault_inventory_columns', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    useEffect(() => {
        let active = true;
        const fetchGames = async () => {
            setIsLoading(true);
            const filterObj: FilterState = { search, categories: catFilters, minStock, maxStock, archived: isArchiveView };
            try {
                const res = await BackendService.getGames(page, size, filterObj);
                if (active) setData(res);
            } finally { if (active) setIsLoading(false); }
        };
        fetchGames();
        return () => { active = false; };
    }, [page, size, search, catFilters, minStock, maxStock, isArchiveView]);

    const fetchGamesManual = async () => {
        setIsLoading(true);
        const filterObj: FilterState = { search, categories: catFilters, minStock, maxStock, archived: isArchiveView };
        const res = await BackendService.getGames(page, size, filterObj);
        setData(res);
        setIsLoading(false);
    };

    const fetchCats = async () => {
        const data = await BackendService.getCategories();
        setCategories(data);
        const config = await BackendService.getCategorySortConfig();
        setSortConfig(config);
        const types = Array.from(new Set(data.map(c => c.type)));
        const baseCols = ['ID', 'Product Name'];
        const endCols = ['Price', 'Stock', 'Actions'];
        const newAvailable = [...baseCols, ...types, ...endCols] as string[];
        setAvailableColumns(newAvailable);
        const saved = localStorage.getItem('gamevault_inventory_columns');
        let savedCols: string[] | null = null;
        if (saved) { try { savedCols = JSON.parse(saved); } catch(e) {} }
        if (savedCols) setVisibleColumns(savedCols.filter(c => newAvailable.includes(c)));
        else setVisibleColumns([...baseCols, ...types, ...endCols]);
    };

    useEffect(() => { fetchCats(); }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (colMenuRef.current && !colMenuRef.current.contains(event.target as Node)) setIsColMenuOpen(false);
        };
        if (isColMenuOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isColMenuOpen]);

    const toggleColumn = (col: string) => {
        setVisibleColumns(prev => {
            if (prev.includes(col)) return prev.filter(c => c !== col);
            const newSet = new Set([...prev, col]);
            return availableColumns.filter(c => newSet.has(c));
        });
    };

    const handleSave = async () => {
      if (!editingGame.title || editingGame.price === undefined) { alert(t('inv_alert_required')); return; }
      setIsSaving(true);
      try {
          const currentImages = editingGame.images || [];
          const resolvedImagePromises = currentImages.map(async (imgUrl) => {
              if (pendingFiles.has(imgUrl)) {
                  const file = pendingFiles.get(imgUrl);
                  if (file) {
                      try {
                          const uploadedUrl = await BackendService.uploadImage(file);
                          URL.revokeObjectURL(imgUrl);
                          return uploadedUrl;
                      } catch (err) { throw new Error(`Failed to upload ${file.name}`); }
                  }
              }
              return imgUrl;
          });
          const finalImages = await Promise.all(resolvedImagePromises);
          const validImages = finalImages.filter(url => url !== null && url !== undefined) as string[];
          const gameToSave = { ...editingGame, images: validImages };
          const result = await BackendService.saveGame(gameToSave);
          if (result) { setIsModalOpen(false); setPendingFiles(new Map()); fetchGamesManual(); } else { alert(t('inv_alert_save_fail')); }
      } catch (error) { alert(t('inv_alert_save_fail')); } finally { setIsSaving(false); }
    };

    const toggleArchiveStatus = async (game: Game) => {
      const confirmMsg = isArchiveView ? t('inv_confirm_restore') : t('inv_confirm_archive');
        if (window.confirm(confirmMsg)) {
            await BackendService.saveGame({ ...game, isArchived: !isArchiveView });
            fetchGamesManual();
        }
    };

    const processFiles = async (files: File[]) => {
        const newUrls: string[] = [];
        const newPending = new Map(pendingFiles);
        for (const file of files) {
            const previewUrl = URL.createObjectURL(file);
            newUrls.push(previewUrl);
            newPending.set(previewUrl, file);
        }
        setPendingFiles(newPending);
        setEditingGame(prev => ({ ...prev, images: [...(prev.images || []), ...newUrls] }));
    };

    const handleImageDrop = async (e: React.DragEvent) => { e.preventDefault(); if (!e.dataTransfer) return; const files = Array.from(e.dataTransfer.files) as File[]; if (files.length > 0) await processFiles(files); };
    const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files.length > 0) { const files = Array.from(e.target.files) as File[]; await processFiles(files); } };
    const handleUrlTextChange = (text: string) => { const lines = text.split('\n'); setEditingGame(prev => ({ ...prev, images: lines })); };
    const handleUrlTextBlur = () => { setEditingGame(prev => ({ ...prev, images: prev.images?.map(s => s.trim()).filter(s => s) || [] })); };
    const handleImgDragStart = (e: React.DragEvent, idx: number) => setDraggedImgIdx(idx);
    const handleImgDragOver = (e: React.DragEvent) => e.preventDefault();
    const handleImgDrop = (e: React.DragEvent, targetIdx: number) => { e.preventDefault(); if (draggedImgIdx === null || draggedImgIdx === targetIdx) return; const newImages = [...(editingGame.images || [])]; const [draggedItem] = newImages.splice(draggedImgIdx, 1); newImages.splice(targetIdx, 0, draggedItem); setEditingGame(prev => ({ ...prev, images: newImages })); setDraggedImgIdx(null); };
    const moveImage = (idx: number, direction: 'LEFT' | 'RIGHT') => { const newImages = [...(editingGame.images || [])]; const targetIdx = direction === 'LEFT' ? idx - 1 : idx + 1; if (targetIdx < 0 || targetIdx >= newImages.length) return; [newImages[idx], newImages[targetIdx]] = [newImages[targetIdx], newImages[idx]]; setEditingGame(prev => ({ ...prev, images: newImages })); };
    const updateCategorySelection = (newIds: number[], type: string) => { setEditingGame(prev => { const others = prev.categories?.filter(c => c.type !== type) || []; const newCats = categories.filter(c => newIds.includes(c.id)); return { ...prev, categories: [...others, ...newCats] }; }); };
    const isLocalFile = (url: string) => { return (url && url.includes("/api/images/")) || (url && url.startsWith('blob:')); };
    const openAddModal = () => { setEditingGame({ images: [], categories: [], quantity: 0, isArchived: false }); setPendingFiles(new Map()); setIsModalOpen(true); };
    const openEditModal = (game: Game) => { setEditingGame(game); setPendingFiles(new Map()); setIsModalOpen(true); };
    const closeModal = () => { pendingFiles.forEach((_, url) => URL.revokeObjectURL(url)); setPendingFiles(new Map()); setIsModalOpen(false); };
    const categoryTypes: string[] = Array.from(new Set(categories.map(c => c.type)));
    categoryTypes.sort();

    // Helper to get sorted options based on backend config
    const getSortedOptions = (type: string) => {
        let options = categories.filter(c => c.type === type);
        // Apply sorting based on backend config for this type
        if (sortConfig[type]) {
            options = [...options].sort((a, b) => a.name.localeCompare(b.name));
        } else {
            // Default ID sort if alphabetically is false/undefined
            options = [...options].sort((a, b) => a.id - b.id);
        }
        return options;
    };

    return (
        <div>
            {/* Same TopToolbar and Table... */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><Box className="text-vault-secondary"/> {t('inv_title')}</h3>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-start sm:justify-end">
                    <div className="bg-vault-800 p-1 rounded-lg border border-vault-700 flex items-center">
                        <button onClick={() => { setMode('ACTIVE'); setPage(0); }} className={`px-3 py-1.5 rounded-md text-sm font-bold transition flex items-center gap-2 ${!isArchiveView ? 'bg-vault-900 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}><Package size={14}/> {t('inv_mode_active')}</button>
                        <button onClick={() => { setMode('ARCHIVED'); setPage(0); }} className={`px-3 py-1.5 rounded-md text-sm font-bold transition flex items-center gap-2 ${isArchiveView ? 'bg-vault-900 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}><Archive size={14}/> {t('inv_mode_archived')}</button>
                    </div>
                    {!isArchiveView && (<button onClick={openAddModal} className="flex items-center gap-2 bg-vault-secondary hover:bg-emerald-600 px-4 py-2.5 rounded-lg font-bold text-vault-900 transition shadow-lg shadow-vault-secondary/10 whitespace-nowrap"><Plus size={18} /> {t('inv_btn_add')}</button>)}
                </div>
            </div>

            <TopToolbar search={search} setSearch={setSearch} setPage={setPage} placeholder={isArchiveView ? t('inv_search_archived') : t('inv_search_active')} size={size} setSize={setSize} totalElements={data.totalElements} start={page * size + 1} end={Math.min(data.totalElements, (page + 1) * size)} extraFilter={
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 bg-vault-800 px-2 py-2.5 rounded-lg border border-vault-700 h-[42px] whitespace-nowrap">
                        <span className="text-[10px] font-bold text-gray-500 uppercase mr-1 hidden sm:inline">{t('inv_label_stock')}</span>
                        <Package size={14} className="text-gray-500 sm:hidden mr-1" />
                        <input type="number" placeholder={t('inv_stock_min')} className="w-12 bg-vault-900 border border-vault-600 rounded px-1 py-0.5 text-xs text-white focus:border-vault-accent focus:outline-none" value={minStock ?? ''} onChange={e => { setMinStock(e.target.value ? parseInt(e.target.value) : undefined); setPage(0); }} />
                        <span className="text-gray-500">-</span>
                        <input type="number" placeholder={t('inv_stock_max')} className="w-12 bg-vault-900 border border-vault-600 rounded px-1 py-0.5 text-xs text-white focus:border-vault-accent focus:outline-none" value={maxStock ?? ''} onChange={e => { setMaxStock(e.target.value ? parseInt(e.target.value) : undefined); setPage(0); }} />
                    </div>
                    <MultiSelectFilter categories={categories} selected={catFilters} onChange={(ids) => { setCatFilters(ids); setPage(0); }} sortConfig={sortConfig} />
                    <div className="relative" ref={colMenuRef}>
                        <button onClick={() => setIsColMenuOpen(!isColMenuOpen)} className="flex items-center gap-2 bg-vault-800 px-3 py-2.5 rounded-lg border border-vault-700 hover:bg-vault-700 transition text-sm font-bold text-gray-300 whitespace-nowrap"><Columns size={14} /> {t('inv_toggle_cols')} <ChevronDown size={12} /></button>
                        {isColMenuOpen && (
                            <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-48 bg-vault-800 border border-vault-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
                                <div className="p-3 border-b border-vault-700 bg-vault-900/50"><span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('inv_toggle_cols')}</span></div>
                                <div className="p-2 max-h-[300px] overflow-y-auto custom-scrollbar">{availableColumns.map(col => (<div key={col} onClick={() => toggleColumn(col)} className="flex items-center gap-2 px-2 py-1.5 hover:bg-vault-700 rounded cursor-pointer">{visibleColumns.includes(col) ? <CheckSquare size={14} className="text-vault-accent min-w-[14px]"/> : <Square size={14} className="text-gray-600 min-w-[14px]"/>} <span className={`text-sm ${visibleColumns.includes(col) ? 'text-white' : 'text-gray-400'}`}>{getColumnLabel(col)}</span></div>))}</div>
                            </div>
                        )}
                    </div>
                </div>
            } />

            <div className={`rounded-xl border border-vault-700 bg-vault-900 overflow-hidden relative min-h-[400px]`}>
                {isLoading && (<div className="absolute inset-0 z-20 bg-vault-900/50 backdrop-blur-sm flex items-center justify-center"><Loader className="animate-spin text-vault-accent" size={48} /></div>)}
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-sm text-gray-300 min-w-[800px]">
                    <thead className="bg-vault-950 uppercase text-xs font-bold tracking-wider text-gray-400">
                        <tr>
                            {visibleColumns.includes('ID') && <th className="px-6 py-4 whitespace-nowrap">{t('inv_col_id')}</th>}
                            {visibleColumns.includes('Product Name') && <th className="px-6 py-4 whitespace-nowrap">{t('inv_col_name')}</th>}
                            {availableColumns.map(col => { if (['ID', 'Product Name', 'Price', 'Stock', 'Actions'].includes(col)) return null; if (!visibleColumns.includes(col)) return null; return <th key={col} className="px-6 py-4 whitespace-nowrap">{col}</th>; })}
                            {visibleColumns.includes('Price') && <th className="px-6 py-4 whitespace-nowrap">{t('inv_col_price')}</th>}
                            {visibleColumns.includes('Stock') && <th className="px-6 py-4 whitespace-nowrap">{t('inv_col_stock')}</th>}
                            {visibleColumns.includes('Actions') && <th className="px-6 py-4 text-right whitespace-nowrap">{t('inv_col_actions')}</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-vault-800">
                        {(data?.content || []).map(game => {
                            const imageUrl = resolveImageUrl(game.images?.[0]);
                            return (
                        <tr key={game.id} className="hover:bg-vault-800 transition-colors">
                            {visibleColumns.includes('ID') && (<td className="px-6 py-4 font-mono text-gray-500 whitespace-nowrap">#{game.id}</td>)}
                            {visibleColumns.includes('Product Name') && (<td className="px-6 py-4 font-medium text-white min-w-[200px] max-w-[300px] whitespace-normal text-xs sm:text-sm"><div className="flex items-center gap-3"><div className="relative group/mini"><img src={imageUrl} referrerPolicy="no-referrer" className={`w-10 h-10 rounded object-cover aspect-[3/4] bg-vault-800 flex-shrink-0 ${isArchiveView ? 'grayscale' : ''}`} alt="" onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }} /></div><span className="force-wrap">{game.title}</span></div></td>)}
                            {availableColumns.map(col => {
                                if (['ID', 'Product Name', 'Price', 'Stock', 'Actions'].includes(col)) return null;
                                if (!visibleColumns.includes(col)) return null;

                                const cats = game.categories.filter(c => c.type === col);
                                return (
                                    // 1. Changed max-w-[200px] to min-w-[140px] to prevent crushing
                                    <td key={`${game.id}-${col}`} className="px-6 py-4 min-w-[140px] whitespace-normal">
                                        {cats.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {cats.map(c => (
                                                    <span
                                                        key={c.id}
                                                        // 2. Added whitespace-nowrap so individual tags don't break internally
                                                        className="px-2 py-1 rounded bg-vault-900 border border-vault-700 text-[10px] sm:text-xs text-gray-300 font-medium whitespace-nowrap"
                                                    >
                                                        {c.name}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-600 text-xs italic">-</span>
                                        )}
                                    </td>
                                );
                            })}
                            {visibleColumns.includes('Price') && (<td className="px-6 py-4 font-mono text-vault-secondary whitespace-nowrap">{t('currencySign')} {game.price} {t('currency')}</td>)}
                            {visibleColumns.includes('Stock') && (
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        game.quantity === 0
                                            ? 'bg-red-900/30 text-red-400'
                                            : game.quantity <= 10
                                                ? 'bg-yellow-900/30 text-yellow-400'
                                                : 'bg-green-900/30 text-green-400'
                                    }`}>
                                        {game.quantity}
                                    </span>
                                </td>
                            )}
                            {visibleColumns.includes('Actions') && (<td className="px-6 py-4 text-right whitespace-nowrap"><div className="flex justify-end gap-2">{isArchiveView ? (<><button onClick={() => openEditModal(game)} className="p-2 text-blue-400 hover:bg-blue-900/20 rounded transition" title="Edit"><Edit size={16} /></button><button onClick={() => toggleArchiveStatus(game)} className="p-2 text-green-400 hover:bg-green-900/20 rounded transition" title={t('inv_btn_restore')}><RotateCcw size={16} /></button></>) : (<><button onClick={() => openEditModal(game)} className="p-2 text-blue-400 hover:bg-blue-900/20 rounded transition" title="Edit"><Edit size={16} /></button><button onClick={() => toggleArchiveStatus(game)} className="p-2 text-orange-400 hover:bg-orange-900/20 rounded transition" title={t('inv_btn_archive')}><Archive size={16} /></button></>)}<button onClick={async () => { if(window.confirm(t('inv_confirm_delete'))) { await BackendService.deleteGame(game.id); fetchGamesManual(); }}} className="p-2 text-red-400 hover:bg-red-900/20 rounded transition" title="Delete"><Trash2 size={16} /></button></div></td>)}
                        </tr>
                        )})}
                    </tbody>
                    </table>
                    {(!data?.content || data.content.length === 0) && (<div className="p-8 text-center text-gray-500 italic">No items found</div>)}
                </div>
            </div>
            <BottomPagination page={page} totalPages={data.totalPages} setPage={setPage} />

            {/* --- MODAL START --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[60] sm:p-4 p-0 animate-fadeIn">
                    <div className="bg-vault-900 w-full max-w-5xl border border-vault-800 shadow-2xl sm:rounded-2xl rounded-none relative h-full sm:h-[90vh] flex flex-col overflow-hidden">

                        {/* Header */}
                        <div className="px-6 sm:px-8 py-4 sm:py-5 border-b border-vault-800 bg-vault-950 flex justify-between items-center flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl border border-white/5 ${editingGame.id ? 'bg-blue-500/10 text-blue-400' : 'bg-vault-secondary/10 text-vault-secondary'}`}>
                                    {editingGame.id ? <Edit size={20}/> : <Plus size={20}/>}
                                </div>
                                <div>
                                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">{editingGame.id ? t('inv_modal_edit') : t('inv_modal_add')}</h3>
                                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                                        {editingGame.id ? `${t('inv_ref_prefix')} #${editingGame.id}` : t('inv_new_item_helper')}
                                    </p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="text-gray-500 hover:text-white transition bg-vault-800 p-2 sm:p-2.5 rounded-full hover:bg-vault-700 border border-transparent hover:border-vault-600"><X size={20}/></button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8">
                            <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10">
                                {/* Essentials */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider ml-1">{t('inv_label_title')}</label>
                                        <input className="w-full bg-vault-950 border border-vault-700 text-white text-xl font-bold p-4 rounded-xl focus:border-vault-accent focus:ring-1 focus:ring-vault-accent/50 focus:outline-none transition-all placeholder-gray-600 shadow-sm" placeholder={t('inv_ph_title')} value={editingGame.title || ''} onChange={e => setEditingGame({...editingGame, title: e.target.value})} />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-2 ml-1">
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><FileText size={12}/> {t('inv_label_desc')}</label>
                                            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${(editingGame.description?.length || 0) >= 2000 ? 'bg-red-900/30 text-red-400' : 'bg-vault-800 text-gray-500'}`}>{editingGame.description?.length || 0}/2000</span>
                                        </div>
                                        <textarea className="w-full bg-vault-950 text-gray-300 p-4 rounded-xl h-40 focus:ring-1 focus:ring-vault-accent/50 focus:outline-none resize-none placeholder-gray-600 border border-vault-700 focus:border-vault-accent force-wrap leading-relaxed shadow-sm text-sm" placeholder={t('inv_ph_desc')} maxLength={2000} value={editingGame.description || ''} onChange={e => setEditingGame({...editingGame, description: e.target.value})} />
                                    </div>
                                </div>

                                {/* Pricing & Inventory */}
                                <div className="bg-vault-800/30 p-4 sm:p-6 rounded-2xl border border-vault-700/50">
                                    <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider mb-6 pb-2 border-b border-vault-700/50">Pricing & Inventory</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2.5 tracking-wider ml-1">{t('inv_label_price')}</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><DollarSign size={16} className="text-gray-500 group-focus-within:text-vault-accent transition-colors"/></div>
                                                <input className="w-full bg-vault-950 text-white font-mono text-lg py-3 pl-10 pr-4 rounded-xl focus:ring-1 focus:ring-vault-accent/50 focus:outline-none placeholder-gray-600 border border-vault-700 focus:border-vault-accent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-sm" placeholder="0.00" type="number" step="0.01" value={editingGame.price || ''} onChange={e => setEditingGame({...editingGame, price: parseFloat(e.target.value)})} onWheel={(e) => e.currentTarget.blur()} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2.5 tracking-wider ml-1">{t('inv_label_qty')}</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Hash size={16} className="text-gray-500 group-focus-within:text-vault-accent transition-colors"/></div>
                                                <input className="w-full bg-vault-950 text-white font-mono text-lg py-3 pl-10 pr-4 rounded-xl focus:ring-1 focus:ring-vault-accent/50 focus:outline-none placeholder-gray-600 border border-vault-700 focus:border-vault-accent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-sm" placeholder="0" type="number" value={editingGame.quantity === undefined ? '' : editingGame.quantity} onChange={e => { const val = e.target.value; setEditingGame({...editingGame, quantity: val === '' ? undefined : parseInt(val)}) }} onWheel={(e) => e.currentTarget.blur()} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Classification with Sorted Options */}
                                <div className="bg-vault-800/30 p-4 sm:p-6 rounded-2xl border border-vault-700/50">
                                    <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider mb-6 pb-2 border-b border-vault-700/50"><List size={16} className="text-vault-secondary"/> {t('inv_cat_header')}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                        {categoryTypes.map(type => (
                                            <CategoryInput
                                                key={type}
                                                label={type}
                                                placeholder={`${t('select')} ${type}...`}
                                                options={getSortedOptions(type)} // Applied sort here
                                                selectedIds={editingGame.categories?.filter(c => c.type === type).map(c => c.id) || []}
                                                onChange={(ids) => updateCategorySelection(ids, type)}
                                            />
                                        ))}
                                        {categoryTypes.length === 0 && (<div className="col-span-2 text-center text-gray-500 italic text-sm py-4">{t('inv_cat_no_groups')}</div>)}
                                    </div>
                                </div>

                                {/* Media */}
                                <div className="bg-vault-800/30 p-4 sm:p-6 rounded-2xl border border-vault-700/50">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-2 border-b border-vault-700/50">
                                        <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider"><ImageIconSmall size={16} className="text-vault-secondary"/> {t('inv_img_header')}</h4>
                                        <div className="flex bg-vault-950 p-1 rounded-lg border border-vault-800">
                                            <button onClick={() => setImageInputMode('UPLOAD')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-2 ${imageInputMode === 'UPLOAD' ? 'bg-vault-800 text-white shadow-sm border border-vault-700' : 'text-gray-500 hover:text-white border border-transparent'}`}><UploadCloud size={14}/> {t('inv_img_upload')}</button>
                                            <button onClick={() => setImageInputMode('URL')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-2 ${imageInputMode === 'URL' ? 'bg-vault-800 text-white shadow-sm border border-vault-700' : 'text-gray-500 hover:text-white border border-transparent'}`}><LinkIcon size={14}/> {t('inv_img_url')}</button>
                                        </div>
                                    </div>
                                    {imageInputMode === 'UPLOAD' ? (
                                        <div className={`w-full p-8 bg-vault-950/50 rounded-xl border-2 border-dashed hover:border-vault-accent transition-all flex flex-col items-center justify-center gap-4 relative min-h-[180px] border-vault-700 group cursor-pointer`} onDragOver={e => e.preventDefault()} onDrop={handleImageDrop} onClick={() => document.getElementById('img-upload')?.click()}>
                                            <input type="file" id="img-upload" multiple className="hidden" onChange={handleFileInput}/>
                                            <div className="p-4 bg-vault-900 rounded-full group-hover:bg-vault-800 transition shadow-lg border border-vault-800 group-hover:scale-110 duration-300"><ImageIcon size={32} className="text-gray-400 group-hover:text-vault-accent transition-colors"/></div>
                                            <div className="text-center"><p className="font-bold text-gray-300 group-hover:text-white transition-colors">{t('inv_img_drag')}</p><p className="text-xs text-gray-500 mt-1">{t('inv_img_note_upload')}</p></div>
                                        </div>
                                    ) : (
                                        <div className="bg-vault-950 p-1 rounded-xl border border-vault-700"><textarea className="w-full bg-vault-950 rounded-lg p-4 text-sm text-white focus:outline-none font-mono custom-scrollbar border-none resize-none" placeholder="https://example.com/image.jpg" rows={5} value={editingGame.images?.join('\n') || ''} onChange={(e) => handleUrlTextChange(e.target.value)} onBlur={handleUrlTextBlur} /></div>
                                    )}
                                    {(editingGame.images && editingGame.images.length > 0) && (
                                        <div className="mt-6 pt-6 border-t border-vault-700/50">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-3 tracking-wider">{t('inv_img_current')}</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                                                {editingGame.images.map((img, idx) => {
                                                    const resolved = img.startsWith('blob:') ? img : resolveImageUrl(img);
                                                    return (
                                                    <div key={idx} draggable onDragStart={(e) => handleImgDragStart(e, idx)} onDragOver={handleImgDragOver} onDrop={(e) => handleImgDrop(e, idx)} className={`relative aspect-[3/4] rounded-lg group/img shadow-md border cursor-move transition-all overflow-hidden bg-vault-900 ${draggedImgIdx === idx ? 'opacity-50 border-vault-accent scale-95' : 'border-vault-700 hover:border-vault-500'}`}>
                                                        <img src={resolved} referrerPolicy="no-referrer" className="w-full h-full object-cover pointer-events-none" alt="" onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }} />
                                                        <div className="absolute top-1 left-1 z-20">{isLocalFile(img) ? (<div className="bg-black/70 p-1 rounded text-vault-secondary backdrop-blur-sm shadow-sm"><HardDrive size={10}/></div>) : (<div className="bg-black/70 p-1 rounded text-blue-400 backdrop-blur-sm shadow-sm"><Globe size={10}/></div>)}</div>
                                                        {/* BIGGER ARROWS HERE */}
                                                        <div className="absolute bottom-0 inset-x-0 bg-black/70 flex justify-center gap-4 p-1.5 opacity-100 md:opacity-0 md:group-hover/img:opacity-100 transition-opacity z-20">
                                                            <button onClick={(e) => {e.stopPropagation(); moveImage(idx, 'LEFT')}} disabled={idx===0} className="text-white hover:text-vault-accent disabled:opacity-30 p-1 hover:bg-white/10 rounded"><ArrowLeft size={20}/></button>
                                                            <button onClick={(e) => {e.stopPropagation(); moveImage(idx, 'RIGHT')}} disabled={idx === (editingGame.images?.length || 0) - 1} className="text-white hover:text-vault-accent disabled:opacity-30 p-1 hover:bg-white/10 rounded"><ArrowRight size={20}/></button>
                                                        </div>
                                                        <button onClick={() => { if (img.startsWith('blob:')) URL.revokeObjectURL(img); setEditingGame(prev => ({...prev, images: prev.images?.filter((_, i) => i !== idx)})); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-100 md:opacity-0 md:group-hover/img:opacity-100 transition hover:bg-red-600 z-30"><X size={12}/></button>
                                                    </div>
                                                )})}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 sm:p-6 border-t border-vault-800 bg-vault-950 flex justify-end gap-3 sm:gap-4 flex-shrink-0">
                            <button onClick={closeModal} className="px-6 py-2.5 text-gray-400 hover:text-white transition font-bold text-sm bg-vault-800 hover:bg-vault-700 rounded-xl border border-vault-700 hover:border-vault-600">{t('inv_btn_cancel')}</button>
                            <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-8 py-2.5 bg-vault-accent text-white font-bold rounded-xl hover:bg-vault-accentHover transition shadow-lg shadow-vault-accent/20 text-sm transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSaving ? <Loader className="animate-spin" size={18} /> : <Save size={18}/>}
                                {isSaving ? t('inv_btn_saving') : t('inv_btn_save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
