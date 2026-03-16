import React, { useState, useEffect, useRef } from 'react';
import { Game, Category, FilterState, PageResult } from '../../types';
import { BackendService } from '../../services/backendService';
import { resolveImageUrl } from '../../constants';
import { TopToolbar, BottomPagination, MultiSelect, MultiSelectFilter } from './AdminShared';
import { Plus, Edit, Trash2, Save, X, FileText, DollarSign, Package, List, ArrowLeft, ArrowRight, ImageIcon, Loader, Columns, ChevronDown, CheckSquare, Square, Archive, RotateCcw, Box, UploadCloud, Link as LinkIcon, HardDrive, Globe } from 'lucide-react';
import { useLanguage } from '../../config/language';

export const InventoryManager = () => {
    const { t } = useLanguage();
    // Internal State for Mode Switching
    const [mode, setMode] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
    const isArchiveView = mode === 'ARCHIVED';

    const [data, setData] = useState<PageResult<Game>>({ content: [], totalElements: 0, totalPages: 0, last: true });
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [search, setSearch] = useState('');
    const [catFilters, setCatFilters] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Stock filter state
    const [minStock, setMinStock] = useState<number | undefined>(undefined);
    const [maxStock, setMaxStock] = useState<number | undefined>(undefined);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGame, setEditingGame] = useState<Partial<Game>>({});

    // New state to hold files waiting to be uploaded upon Save
    const [pendingFiles, setPendingFiles] = useState<Map<string, File>>(new Map());

    const [categories, setCategories] = useState<Category[]>([]);
    const [sortConfig, setSortConfig] = useState<Record<string, boolean>>({});
    const [draggedImgIdx, setDraggedImgIdx] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Image Input Mode State
    const [imageInputMode, setImageInputMode] = useState<'UPLOAD' | 'URL'>('UPLOAD');

    // Column Visibility State
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
    // Load saved column preferences
    useEffect(() => {
        const saved = localStorage.getItem('gamevault_inventory_columns');
        if (saved) {
             try {
                 const parsed = JSON.parse(saved);
                 if (Array.isArray(parsed)) setVisibleColumns(parsed);
             } catch(e) {}
        }
    }, []);

    // Save columns on change
    useEffect(() => {
        if (visibleColumns.length > 0) {
            localStorage.setItem('gamevault_inventory_columns', JSON.stringify(visibleColumns));
        }
    }, [visibleColumns]);

    // Data Fetching with Race Condition Prevention
    useEffect(() => {
        let active = true;
        const fetchGames = async () => {
            setIsLoading(true);
            const filterObj: FilterState = {
                search,
                categories: catFilters,
                minStock,
                maxStock,
                archived: isArchiveView // Filter by mode
            };
            try {
                const res = await BackendService.getGames(page, size, filterObj);
                if (active) {
                    setData(res);
                }
            } finally {
                if (active) setIsLoading(false);
            }
        };
        fetchGames();
        return () => { active = false; };
    }, [page, size, search, catFilters, minStock, maxStock, isArchiveView]);

    const fetchGamesManual = async () => {
        setIsLoading(true);
        const filterObj: FilterState = {
            search,
            categories: catFilters,
            minStock,
            maxStock,
            archived: isArchiveView
        };
        const res = await BackendService.getGames(page, size, filterObj);
        setData(res);
        setIsLoading(false);
    };

    const fetchCats = async () => {
        const data = await BackendService.getCategories();
        setCategories(data);

        const config = await BackendService.getCategorySortConfig();
        setSortConfig(config);

        // Setup dynamic columns
        const types = Array.from(new Set(data.map(c => c.type)));
        const baseCols = ['ID', 'Product Name'];
        const endCols = ['Price', 'Stock', 'Actions'];

        // Add default types to visible columns if they aren't already
        const newAvailable = [...baseCols, ...types, ...endCols] as string[];
        setAvailableColumns(newAvailable);

        // Check local storage validity against new available columns
        const saved = localStorage.getItem('gamevault_inventory_columns');
        let savedCols: string[] | null = null;
        if (saved) {
             try { savedCols = JSON.parse(saved); } catch(e) {}
        }

        if (savedCols) {
             // Filter to ensure only valid available columns are kept
             setVisibleColumns(savedCols.filter(c => newAvailable.includes(c)));
        } else {
             // Default logic - show all types found
             setVisibleColumns([...baseCols, ...types, ...endCols]);
        }
    };

    useEffect(() => { fetchCats(); }, []);

    // Click outside handler for Column Menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (colMenuRef.current && !colMenuRef.current.contains(event.target as Node)) {
                setIsColMenuOpen(false);
            }
        };
        if (isColMenuOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isColMenuOpen]);

    const toggleColumn = (col: string) => {
        setVisibleColumns(prev => {
            if (prev.includes(col)) return prev.filter(c => c !== col);
            // Maintain order based on availableColumns
            const newSet = new Set([...prev, col]);
            return availableColumns.filter(c => newSet.has(c));
        });
    };

    const handleSave = async () => {
      if (!editingGame.title || editingGame.price === undefined) {
          alert(t('inv_alert_required'));
          return;
      }
      setIsSaving(true);
      try {
          // Create a copy of the current images list
          const currentImages = editingGame.images || [];
          // Map over images:
          // - If it's a pending file (blob), upload it.
          // - If it's already a URL, keep it.
          // Promise.all runs these in parallel.
          const resolvedImagePromises = currentImages.map(async (imgUrl) => {
              if (pendingFiles.has(imgUrl)) {
                  const file = pendingFiles.get(imgUrl);
                  if (file) {
                      try {
                          const uploadedUrl = await BackendService.uploadImage(file);
                          // Revoke local preview URL to free memory
                          URL.revokeObjectURL(imgUrl);
                          return uploadedUrl; // Return the new server URL
                      } catch (err) {
                          console.error("Failed to upload image:", file.name, err);
                          // If upload fails, throw error to stop the whole save process
                          // or return null to skip this image.
                          throw new Error(`Failed to upload ${file.name}`);
                      }
                  }
              }
              // It's already a server URL, just return it
              return imgUrl;
          });
          // Wait for ALL uploads to finish
          const finalImages = await Promise.all(resolvedImagePromises);
          // Filter out any potential nulls if you added error catching above
          const validImages = finalImages.filter(url => url !== null && url !== undefined) as string[];
          const gameToSave = {
              ...editingGame,
              images: validImages
          };
          const result = await BackendService.saveGame(gameToSave);
          if (result) {
              setIsModalOpen(false);
              setPendingFiles(new Map());
              fetchGamesManual();
          } else {
              alert(t('inv_alert_save_fail'));
          }
      } catch (error) {
          console.error("Save failed", error);
          alert(t('inv_alert_save_fail'));
      } finally {
          setIsSaving(false);
      }
    };

    const toggleArchiveStatus = async (game: Game) => {
      const confirmMsg = isArchiveView ? t('inv_confirm_restore') : t('inv_confirm_archive');
        if (window.confirm(confirmMsg)) {
            await BackendService.saveGame({ ...game, isArchived: !isArchiveView });
            fetchGamesManual();
        }
    };

    // Prepare files for upload but don't upload yet
    const processFiles = async (files: File[]) => {
        const newUrls: string[] = [];
        const newPending = new Map(pendingFiles);

        for (const file of files) {
            // Create a local preview URL
            const previewUrl = URL.createObjectURL(file);
            newUrls.push(previewUrl);
            newPending.set(previewUrl, file);
        }

        setPendingFiles(newPending);
        setEditingGame(prev => ({
            ...prev,
            images: [...(prev.images || []), ...newUrls]
        }));
    };

    const handleImageDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        if (!e.dataTransfer) return;
        const files = Array.from(e.dataTransfer.files) as File[];
        if (files.length > 0) {
            await processFiles(files);
        }
    };

    const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files) as File[];
            await processFiles(files);
        }
    };

    const handleUrlTextChange = (text: string) => {
        // Allow typing newlines freely
        const lines = text.split('\n');
        setEditingGame(prev => ({
            ...prev,
            images: lines
        }));
    };

    const handleUrlTextBlur = () => {
        // Clean up empty lines on blur
        setEditingGame(prev => ({
            ...prev,
            images: prev.images?.map(s => s.trim()).filter(s => s) || []
        }));
    };

    const handleImgDragStart = (e: React.DragEvent, idx: number) => setDraggedImgIdx(idx);
    const handleImgDragOver = (e: React.DragEvent) => e.preventDefault();
    const handleImgDrop = (e: React.DragEvent, targetIdx: number) => {
        e.preventDefault();
        if (draggedImgIdx === null || draggedImgIdx === targetIdx) return;
        const newImages = [...(editingGame.images || [])];
        const [draggedItem] = newImages.splice(draggedImgIdx, 1);
        newImages.splice(targetIdx, 0, draggedItem);
        setEditingGame(prev => ({ ...prev, images: newImages }));
        setDraggedImgIdx(null);
    };

    const moveImage = (idx: number, direction: 'LEFT' | 'RIGHT') => {
        const newImages = [...(editingGame.images || [])];
        const targetIdx = direction === 'LEFT' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= newImages.length) return;
        [newImages[idx], newImages[targetIdx]] = [newImages[targetIdx], newImages[idx]];
        setEditingGame(prev => ({ ...prev, images: newImages }));
    };

    const updateCategorySelection = (newIds: number[], type: string) => {
        setEditingGame(prev => {
            const others = prev.categories?.filter(c => c.type !== type) || [];
            const newCats = categories.filter(c => newIds.includes(c.id));
            return { ...prev, categories: [...others, ...newCats] };
        });
    };

    const isLocalFile = (url: string) => {
        // Check if URL contains "api/images" indicating it's hosted by us OR is a blob (pending upload)
        return (url && url.includes("/api/images/")) || (url && url.startsWith('blob:'));
    };

    const openAddModal = () => {
        setEditingGame({ images: [], categories: [], quantity: 0, isArchived: false });
        setPendingFiles(new Map());
        setIsModalOpen(true);
    };

    const openEditModal = (game: Game) => {
        setEditingGame(game);
        setPendingFiles(new Map());
        setIsModalOpen(true);
    };

    const closeModal = () => {
        // Cleanup object URLs to avoid memory leaks
        pendingFiles.forEach((_, url) => URL.revokeObjectURL(url));
        setPendingFiles(new Map());
        setIsModalOpen(false);
    };

    const categoryTypes: string[] = Array.from(new Set(categories.map(c => c.type)));
    categoryTypes.sort();

    return (
        <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Box className="text-vault-secondary"/> {t('inv_title')}
            </h3>

            <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="bg-vault-800 p-1 rounded-lg border border-vault-700 flex items-center">
                    <button
                        onClick={() => { setMode('ACTIVE'); setPage(0); }}
                        className={`px-3 py-1.5 rounded-md text-sm font-bold transition flex items-center gap-2 ${!isArchiveView ? 'bg-vault-900 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Package size={14}/> {t('inv_mode_active')}
                    </button>
                    <button
                        onClick={() => { setMode('ARCHIVED'); setPage(0); }}
                        className={`px-3 py-1.5 rounded-md text-sm font-bold transition flex items-center gap-2 ${isArchiveView ? 'bg-vault-900 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Archive size={14}/> {t('inv_mode_archived')}
                    </button>
                </div>

                {!isArchiveView && (
                    <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-vault-secondary hover:bg-emerald-600 px-4 py-2.5 rounded-lg font-bold text-vault-900 transition shadow-lg shadow-vault-secondary/10 whitespace-nowrap"
                    >
                    <Plus size={18} /> {t('inv_btn_add')}
                    </button>
                )}
            </div>
        </div>

        <TopToolbar
            search={search} setSearch={setSearch} placeholder={isArchiveView ? t('inv_search_archived') : t('inv_search_active')}
            size={size} setSize={setSize} totalElements={data.totalElements}
            start={page * size + 1} end={Math.min(data.totalElements, (page + 1) * size)}
            extraFilter={
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Stock Range Filter */}
                    <div className="flex items-center gap-1 bg-vault-800 px-2 py-2.5 rounded-lg border border-vault-700 h-[42px]">
                        <span className="text-[10px] font-bold text-gray-500 uppercase mr-1 hidden sm:inline">{t('inv_label_stock')}</span>
                        <Package size={14} className="text-gray-500 sm:hidden mr-1" />
                        <input
                            type="number"
                            placeholder={t('inv_stock_min')}
                            className="w-12 bg-vault-900 border border-vault-600 rounded px-1 py-0.5 text-xs text-white focus:border-vault-accent focus:outline-none"
                            value={minStock ?? ''}
                            onChange={e => setMinStock(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                        <span className="text-gray-500">-</span>
                        <input
                            type="number"
                            placeholder={t('inv_stock_max')}
                            className="w-12 bg-vault-900 border border-vault-600 rounded px-1 py-0.5 text-xs text-white focus:border-vault-accent focus:outline-none"
                            value={maxStock ?? ''}
                            onChange={e => setMaxStock(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                    </div>

                    <MultiSelectFilter
                        categories={categories}
                        selected={catFilters}
                        onChange={setCatFilters}
                        sortConfig={sortConfig}
                    />

                    {/* Dynamic Column Toggle */}
                    <div className="relative" ref={colMenuRef}>
                        <button
                            onClick={() => setIsColMenuOpen(!isColMenuOpen)}
                            className="flex items-center gap-2 bg-vault-800 px-3 py-2.5 rounded-lg border border-vault-700 hover:bg-vault-700 transition text-sm font-bold text-gray-300"
                        >
                            <Columns size={14} /> {t('inv_toggle_cols')} <ChevronDown size={12} />
                        </button>
                        {isColMenuOpen && (
                            <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-48 bg-vault-800 border border-vault-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
                                <div className="p-3 border-b border-vault-700 bg-vault-900/50">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('inv_toggle_cols')}</span>
                                </div>
                                <div className="p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {availableColumns.map(col => (
                                        <div
                                            key={col}
                                            onClick={() => toggleColumn(col)}
                                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-vault-700 rounded cursor-pointer"
                                        >
                                            {visibleColumns.includes(col)
                                                ? <CheckSquare size={14} className="text-vault-accent min-w-[14px]"/>
                                                : <Square size={14} className="text-gray-600 min-w-[14px]"/>
                                             }
                                             <span className={`text-sm ${visibleColumns.includes(col) ? 'text-white' : 'text-gray-400'}`}>{getColumnLabel(col)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            }
        />

        <div className={`rounded-xl border border-vault-700 bg-vault-900 overflow-hidden relative min-h-[400px]`}>
            {isLoading && (
                <div className="absolute inset-0 z-20 bg-vault-900/50 backdrop-blur-sm flex items-center justify-center">
                    <Loader className="animate-spin text-vault-accent" size={48} />
                </div>
            )}
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm text-gray-300 min-w-[800px]">
                <thead className="bg-vault-950 uppercase text-xs font-bold tracking-wider text-gray-400">
                    <tr>
                        {visibleColumns.includes('ID') && <th className="px-6 py-4 whitespace-nowrap">{t('inv_col_id')}</th>}
                        {visibleColumns.includes('Product Name') && <th className="px-6 py-4 whitespace-nowrap">{t('inv_col_name')}</th>}

                        {/* Dynamic Headers */}
                        {availableColumns.map(col => {
                            if (['ID', 'Product Name', 'Price', 'Stock', 'Actions'].includes(col)) return null;
                            if (!visibleColumns.includes(col)) return null;
                            return <th key={col} className="px-6 py-4 whitespace-nowrap">{col}</th>;
                        })}

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
                        {visibleColumns.includes('ID') && (
                            <td className="px-6 py-4 font-mono text-gray-500 whitespace-nowrap">#{game.id}</td>
                        )}
                        {visibleColumns.includes('Product Name') && (
                            <td className="px-6 py-4 font-medium text-white min-w-[200px] max-w-[300px]">
                                <div className="flex items-center gap-3">
                                    <div className="relative group/mini">
                                        <img
                                            src={imageUrl}
                                            referrerPolicy="no-referrer"
                                            className={`w-10 h-10 rounded object-cover aspect-[3/4] bg-vault-800 flex-shrink-0 ${isArchiveView ? 'grayscale' : ''}`}
                                            alt=""
                                            onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
                                        />
                                    </div>
                                    <span className="force-wrap">{game.title}</span>
                                </div>
                            </td>
                        )}

                        {/* Dynamic Cells */}
                        {availableColumns.map(col => {
                            if (['ID', 'Product Name', 'Price', 'Stock', 'Actions'].includes(col)) return null;
                            if (!visibleColumns.includes(col)) return null;

                            // Find categories matching this type
                            const cats = game.categories.filter(c => c.type === col);
                            return (
                                <td key={`${game.id}-${col}`} className="px-6 py-4 max-w-[200px]">
                                    {cats.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {cats.map(c => (
                                                <span key={c.id} className="px-2 py-1 rounded bg-vault-900 border border-vault-700 text-xs text-gray-300 font-medium force-wrap">
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

                        {visibleColumns.includes('Price') && (
                            <td className="px-6 py-4 font-mono text-vault-secondary whitespace-nowrap">{t('currencySign')} {game.price} {t('currency')}</td>
                        )}
                        {visibleColumns.includes('Stock') && (
                            <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${game.quantity > 10 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                {game.quantity}
                            </span>
                            </td>
                        )}
                        {visibleColumns.includes('Actions') && (
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex justify-end gap-2">
                                {isArchiveView ? (
                                    <>
                                        <button onClick={() => openEditModal(game)} className="p-2 text-blue-400 hover:bg-blue-900/20 rounded transition" title="Edit"><Edit size={16} /></button>
                                        <button
                                            onClick={() => toggleArchiveStatus(game)}
                                            className="p-2 text-green-400 hover:bg-green-900/20 rounded transition"
                                            title={t('inv_btn_restore')}
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => openEditModal(game)} className="p-2 text-blue-400 hover:bg-blue-900/20 rounded transition" title="Edit"><Edit size={16} /></button>
                                        <button
                                            onClick={() => toggleArchiveStatus(game)}
                                            className="p-2 text-orange-400 hover:bg-orange-900/20 rounded transition"
                                            title={t('inv_btn_archive')}
                                        >
                                            <Archive size={16} />
                                        </button>
                                    </>
                                )}
                                <button onClick={async () => { if(window.confirm(t('inv_confirm_delete'))) { await BackendService.deleteGame(game.id); fetchGamesManual(); }}} className="p-2 text-red-400 hover:bg-red-900/20 rounded transition" title="Delete"><Trash2 size={16} /></button>
                            </div>
                            </td>
                        )}
                    </tr>
                    )})}
                </tbody>
                </table>
                {(!data?.content || data.content.length === 0) && (
                        <div className="p-8 text-center text-gray-500 italic">No items found</div>
                )}
            </div>
        </div>

        <BottomPagination page={page} totalPages={data.totalPages} setPage={setPage} />

        {isModalOpen && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-fadeIn">
            <div className="bg-vault-800 p-8 rounded-3xl w-full max-w-4xl border border-vault-700 shadow-2xl relative h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
                <button onClick={closeModal} className="absolute top-6 right-6 text-gray-500 hover:text-white transition bg-vault-900 p-2 rounded-full"><X size={24}/></button>

                <div className="mb-8">
                    <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    {editingGame.id ? <Edit className="text-vault-accent"/> : <Plus className="text-vault-secondary"/>}
                    {editingGame.id ? t('inv_modal_edit') : t('inv_modal_add')}
                    </h3>
                </div>

                <div className="flex-1 space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-wider">{t('inv_label_title')}</label>
                        <input
                        className="w-full bg-transparent border-b-2 border-vault-700 text-white text-2xl font-bold py-2 focus:border-vault-accent focus:outline-none transition-all placeholder-gray-600"
                        placeholder={t('inv_ph_title')}
                        value={editingGame.title || ''}
                        onChange={e => setEditingGame({...editingGame, title: e.target.value})}
                        />
                    </div>

                    {/* Description Card */}
                    <div className="bg-vault-950 p-4 rounded-xl border border-vault-800">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2"><FileText size={12}/> {t('inv_label_desc')}</label>
                            <span className={`text-[10px] font-bold ${(editingGame.description?.length || 0) >= 2000 ? 'text-red-400' : 'text-gray-500'}`}>
                                {editingGame.description?.length || 0}/2000
                            </span>
                        </div>
                        <textarea
                            className="w-full bg-vault-900 text-gray-300 p-3 rounded-lg h-32 focus:ring-1 focus:ring-vault-accent focus:outline-none resize-none placeholder-gray-600 border border-transparent focus:border-vault-700 force-wrap"
                            placeholder={t('inv_ph_desc')}
                            maxLength={2000}
                            value={editingGame.description || ''}
                            onChange={e => setEditingGame({...editingGame, description: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Price Card */}
                        <div className="bg-vault-950 p-4 rounded-xl border border-vault-800">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-wider flex items-center gap-2"><DollarSign size={12}/> {t('inv_label_price')}</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <input
                                className="w-full bg-vault-900 text-white font-mono p-3 pl-8 rounded-lg focus:ring-1 focus:ring-vault-accent focus:outline-none placeholder-gray-600 border border-transparent focus:border-vault-700"
                                placeholder="0.00"
                                type="number"
                                value={editingGame.price || ''}
                                onChange={e => setEditingGame({...editingGame, price: parseFloat(e.target.value)})}
                                />
                            </div>
                        </div>
                        {/* Stock Card */}
                        <div className="bg-vault-950 p-4 rounded-xl border border-vault-800">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-wider flex items-center gap-2"><Package size={12}/> {t('inv_label_qty')}</label>
                            <input
                            className="w-full bg-vault-900 text-white font-mono p-3 rounded-lg focus:ring-1 focus:ring-vault-accent focus:outline-none placeholder-gray-600 border border-transparent focus:border-vault-700"
                            placeholder="0"
                            type="number"
                            value={editingGame.quantity === undefined ? '' : editingGame.quantity}
                            onChange={e => {
                                const val = e.target.value;
                                setEditingGame({...editingGame, quantity: val === '' ? undefined : parseInt(val)})
                            }}
                            />
                        </div>
                    </div>

                    {/* DYNAMIC CATEGORY SELECTORS */}
                    <div className="bg-vault-900/50 p-6 rounded-xl border border-vault-700/50">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider mb-4"><List size={16}/> {t('inv_cat_header')}</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {categoryTypes.map(type => (
                                <div key={type}>
                                    <label className="block text-xs font-bold text-gray-400 mb-2">{type}</label>
                                    <MultiSelect
                                        placeholder={t('inv_cat_ph_select').replace('{type}', type)}
                                        options={categories.filter(c => c.type === type)}
                                        selectedIds={editingGame.categories?.filter(c => c.type === type).map(c => c.id) || []}
                                        onChange={(ids) => updateCategorySelection(ids, type)}
                                        sortAlphabetically={!!sortConfig[type]}
                                    />
                                </div>
                            ))}
                            {categoryTypes.length === 0 && (
                                <div className="col-span-2 text-center text-gray-500 italic text-sm py-4">
                                  {t('inv_cat_no_groups')}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('inv_img_header')}</label>

                            {/* Toggle Switch */}
                            <div className="flex bg-vault-900 p-1 rounded-lg border border-vault-700">
                                <button
                                    onClick={() => setImageInputMode('UPLOAD')}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition flex items-center gap-1 ${imageInputMode === 'UPLOAD' ? 'bg-vault-800 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <UploadCloud size={12}/> {t('inv_img_upload')}
                                </button>
                                <button
                                    onClick={() => setImageInputMode('URL')}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition flex items-center gap-1 ${imageInputMode === 'URL' ? 'bg-vault-800 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <LinkIcon size={12}/> {t('inv_img_url')}
                                </button>
                            </div>
                        </div>

                        {/* Input Area */}
                        {imageInputMode === 'UPLOAD' ? (
                            <div
                                className={`w-full p-4 bg-vault-950 rounded-xl border-2 border-dashed hover:border-vault-accent transition flex flex-col items-center justify-center gap-4 relative min-h-[160px] border-vault-700`}
                                onDragOver={e => e.preventDefault()}
                                onDrop={handleImageDrop}
                            >
                                <input type="file" id="img-upload" multiple className="hidden" onChange={handleFileInput}/>
                                <div
                                    className="flex flex-col items-center text-gray-500 cursor-pointer"
                                    onClick={() => document.getElementById('img-upload')?.click()}
                                >
                                    <ImageIcon size={48} className="mb-2 opacity-50"/>
                                    <p className="font-bold">{t('inv_img_drag')}</p>
                                    <p className="text-xs">{t('inv_img_click')}</p>
                                    <p className="text-[10px] text-gray-500 mt-2">{t('inv_img_note_upload')}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-vault-950 p-4 rounded-xl border border-vault-700">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('inv_label_url_list')}</label>
                                <textarea
                                    className="w-full bg-vault-900 border border-vault-700 rounded-lg p-3 text-sm text-white focus:border-vault-accent outline-none font-mono custom-scrollbar"
                                    placeholder="https://example.com/image.jpg"
                                    rows={6}
                                    value={editingGame.images?.join('\n') || ''}
                                    onChange={(e) => handleUrlTextChange(e.target.value)}
                                    onBlur={handleUrlTextBlur}
                                />
                                <p className="text-[10px] text-gray-500 mt-2">
                                    {t('inv_img_note_url')}
                                </p>
                            </div>
                        )}

                        {/* Image Preview / Sorting - ALWAYS VISIBLE NOW */}
                        {(editingGame.images && editingGame.images.length > 0) && (
                            <div className="mt-6">
                                <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">{t('inv_img_current')}</p>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 w-full">
                                    {editingGame.images.map((img, idx) => {
                                        // If it's a blob, it works directly as src. If it's a relative API path, resolveImageUrl handles it.
                                        const resolved = img.startsWith('blob:') ? img : resolveImageUrl(img);
                                        return (
                                        <div
                                            key={idx}
                                            draggable
                                            title={img} // Native browser tooltip
                                            onDragStart={(e) => handleImgDragStart(e, idx)}
                                            onDragOver={handleImgDragOver}
                                            onDrop={(e) => handleImgDrop(e, idx)}
                                            className={`relative aspect-[3/4] rounded-lg group/img shadow-lg border cursor-move transition-transform overflow-hidden ${draggedImgIdx === idx ? 'scale-95 border-vault-accent ring-2 ring-vault-accent z-10' : 'border-vault-700'}`}
                                        >
                                            <img
                                                src={resolved}
                                                referrerPolicy="no-referrer"
                                                className="w-full h-full object-cover pointer-events-none rounded-lg"
                                                alt=""
                                                onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
                                            />

                                            {/* Storage Type Badge */}
                                            <div className="absolute top-1 left-1 z-20">
                                                {isLocalFile(img) ? (
                                                    <div className="bg-vault-900/90 p-1 rounded text-vault-secondary border border-vault-700" title={t('inv_badge_local')}>
                                                        <HardDrive size={10}/>
                                                    </div>
                                                ) : (
                                                    <div className="bg-vault-900/90 p-1 rounded text-blue-400 border border-vault-700" title={t('inv_badge_external')}>
                                                        <Globe size={10}/>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="absolute bottom-0 inset-x-0 bg-black/70 flex justify-center gap-4 p-1 opacity-100 md:opacity-0 md:group-hover/img:opacity-100 transition-opacity z-20 rounded-b-lg">
                                                <button onClick={(e) => {e.stopPropagation(); moveImage(idx, 'LEFT')}} disabled={idx===0} className="text-white hover:text-vault-accent disabled:opacity-30"><ArrowLeft size={14}/></button>
                                                <button onClick={(e) => {e.stopPropagation(); moveImage(idx, 'RIGHT')}} disabled={idx === (editingGame.images?.length || 0) - 1} className="text-white hover:text-vault-accent disabled:opacity-30"><ArrowRight size={14}/></button>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    // If we are removing a pending file, revoke its URL
                                                    if (img.startsWith('blob:')) URL.revokeObjectURL(img);
                                                    setEditingGame(prev => ({...prev, images: prev.images?.filter((_, i) => i !== idx)}));
                                                }}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-100 md:opacity-0 md:group-hover/img:opacity-100 transition hover:bg-red-600 z-30"
                                            >
                                                <X size={12}/>
                                            </button>
                                        </div>
                                    )})}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-vault-700">
                <button onClick={closeModal} className="px-6 py-3 text-gray-400 hover:text-white transition font-bold text-sm">{t('inv_btn_cancel')}</button>
                <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-8 py-3 bg-vault-accent text-white font-bold rounded-xl hover:bg-vault-accentHover transition shadow-xl shadow-vault-accent/20 text-sm transform active:scale-95 disabled:opacity-50">
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
