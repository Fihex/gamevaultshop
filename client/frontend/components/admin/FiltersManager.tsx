import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Category } from '../../types';
import { BackendService } from '../../services/backendService';
import {
    Power, ToggleRight, ToggleLeft, GripVertical, Check, X, Edit,
    Eye, EyeOff, Trash2, Plus, Search, Settings, List, Tag, Layout,
    ArrowDownAZ, Hash, Loader, AlertCircle, ArrowLeft
} from 'lucide-react';
import { useLanguage } from '../../config/language';

export const FiltersManager = ({ onSettingsChange }: { onSettingsChange?: () => void }) => {
  const [activeTab, setActiveTab] = useState<'CATEGORIES' | 'SETTINGS'>('CATEGORIES');
  const { t } = useLanguage();

  return (
      <div className="animate-fadeIn">
          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-4 mb-6 border-b border-vault-800 pb-1">
              <button
                onClick={() => setActiveTab('CATEGORIES')}
                className={`pb-3 px-2 text-sm font-bold border-b-2 transition flex items-center gap-2 ${activeTab === 'CATEGORIES' ? 'border-vault-accent text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
              >
                  <List size={16}/> {t('filters_tab_tax')}
              </button>
              <button
                onClick={() => setActiveTab('SETTINGS')}
                className={`pb-3 px-2 text-sm font-bold border-b-2 transition flex items-center gap-2 ${activeTab === 'SETTINGS' ? 'border-vault-accent text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
              >
                  <Settings size={16}/> {t('filters_tab_config')}
              </button>
          </div>

          {activeTab === 'CATEGORIES' ? (
              <CategoryTaxonomyManager onSettingsChange={onSettingsChange} />
          ) : (
              <SystemConfigPanel onSettingsChange={onSettingsChange} />
          )}
      </div>
  );
};

// --- SUB-COMPONENT: System Configuration ---
const SystemConfigPanel = ({ onSettingsChange }: { onSettingsChange?: () => void }) => {
    const { t } = useLanguage();
    const [sysConfig, setSysConfig] = useState({ enableRegistration: true, enableGuestCheckout: true });
    const [mainGroup, setMainGroup] = useState<string>('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                setIsLoading(true);
                const [conf, mg, cats] = await Promise.all([
                    BackendService.getSystemConfig(),
                    BackendService.getMainCategoryGroup(),
                    BackendService.getCategories()
                ]);

                if (active) {
                    setSysConfig(conf);
                    setMainGroup(mg);
                    setCategories(cats);
                }
            } catch (e) {
                console.error("Failed to load system config", e);
            } finally {
                if (active) setIsLoading(false);
            }
        };
        load();
        return () => { active = false; };
    }, []);

    const toggleSysConfig = async (key: 'ENABLE_REGISTRATION' | 'ENABLE_GUEST_CHECKOUT') => {
        const newVal = key === 'ENABLE_REGISTRATION' ? !sysConfig.enableRegistration : !sysConfig.enableGuestCheckout;
        setSysConfig(prev => ({ ...prev, [key === 'ENABLE_REGISTRATION' ? 'enableRegistration' : 'enableGuestCheckout']: newVal }));

        try {
            await BackendService.saveSystemConfig(key, newVal);
            if(onSettingsChange) onSettingsChange();
        } catch (e) {
            console.error(e);
            setSysConfig(prev => ({ ...prev, [key === 'ENABLE_REGISTRATION' ? 'enableRegistration' : 'enableGuestCheckout']: !newVal }));
        }
    };

    const uniqueTypes = Array.from(new Set(categories.map(c => c.type)));

    return (
        <div className="relative min-h-[300px]">
            {isLoading && (
                <div className="absolute inset-0 z-20 bg-vault-900/50 backdrop-blur-sm flex items-center justify-center rounded-xl">
                    <Loader className="animate-spin text-vault-accent" size={48} />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                <div className="bg-vault-900 border border-vault-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-vault-secondary/10 p-2 rounded-lg text-vault-secondary">
                            <Power size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-white">{t('filters_access_title')}</h4>
                            <p className="text-xs text-gray-400">{t('filters_access_desc')}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-vault-950 p-4 rounded-lg border border-vault-800">
                            <div>
                                <p className="font-bold text-sm text-gray-200">{t('filters_reg_title')}</p>
                                <p className="text-xs text-gray-500">{t('filters_reg_desc')}</p>
                            </div>
                            <button onClick={() => toggleSysConfig('ENABLE_REGISTRATION')} className={`${sysConfig.enableRegistration ? 'text-green-400' : 'text-gray-600'} transition-colors`}>
                                  {sysConfig.enableRegistration ? <ToggleRight size={32} fill="currentColor" className="opacity-20"/> : <ToggleLeft size={32}/>}
                            </button>
                        </div>

                        <div className="flex items-center justify-between bg-vault-950 p-4 rounded-lg border border-vault-800">
                            <div>
                                <p className="font-bold text-sm text-gray-200">{t('filters_guest_title')}</p>
                                <p className="text-xs text-gray-500">{t('filters_guest_desc')}</p>
                            </div>
                            <button onClick={() => toggleSysConfig('ENABLE_GUEST_CHECKOUT')} className={`${sysConfig.enableGuestCheckout ? 'text-green-400' : 'text-gray-600'} transition-colors`}>
                                  {sysConfig.enableGuestCheckout ? <ToggleRight size={32} fill="currentColor" className="opacity-20"/> : <ToggleLeft size={32}/>}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-vault-900 border border-vault-700 rounded-xl p-6">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="bg-vault-accent/10 p-2 rounded-lg text-vault-accent">
                            <Layout size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-white">{t('filters_display_title')}</h4>
                            <p className="text-xs text-gray-400">{t('filters_display_desc')}</p>
                        </div>
                    </div>
                    <div className="bg-vault-950 p-4 rounded-lg border border-vault-800">
                        <p className="font-bold text-sm text-gray-200 mb-2">{t('filters_badge_title')}</p>
                        <p className="text-xs text-gray-500 mb-3">{t('filters_badge_desc')}?</p>
                        <select
                            className="w-full bg-vault-800 border border-vault-700 rounded px-3 py-2 text-white text-sm focus:border-vault-accent outline-none"
                            value={mainGroup}
                            onChange={async (e) => {
                                const val = e.target.value;
                                setMainGroup(val);
                                await BackendService.setMainCategoryGroup(val);
                                if (onSettingsChange) onSettingsChange();
                            }}
                        >
                            <option value="">{t('filters_opt_none')}</option>
                            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- SUB-COMPONENT: Category Taxonomy ---
const CategoryTaxonomyManager = ({ onSettingsChange }: { onSettingsChange?: () => void }) => {
    const { t } = useLanguage();
    const [cats, setCats] = useState<Category[]>([]);
    const [groupOrder, setGroupOrder] = useState<string[]>([]);
    const [selectedType, setSelectedType] = useState<string | null>(null);

    // Search States
    const [localSearchInput, setLocalSearchInput] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    const [sortConfig, setSortConfig] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Editing states
    const [editingType, setEditingType] = useState<{original: string, current: string} | null>(null);
    const [newType, setNewType] = useState('');
    const [newCatName, setNewCatName] = useState('');
    const [draggedGroup, setDraggedGroup] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Lazy Loading State: Groups
    const BATCH_SIZE_GROUPS = 20;
    const [visibleGroupsCount, setVisibleGroupsCount] = useState(BATCH_SIZE_GROUPS);
    const groupsListRef = useRef<HTMLDivElement>(null);

    // Lazy Loading State: Items
    const BATCH_SIZE_ITEMS = 50;
    const [visibleItemsCount, setVisibleItemsCount] = useState(BATCH_SIZE_ITEMS);
    const itemsGridRef = useRef<HTMLDivElement>(null);

    const load = async (keepSelection = false) => {
        try {
            const [data, order, config] = await Promise.all([
                BackendService.getCategories(),
                BackendService.getCategoryGroupOrder(),
                BackendService.getCategorySortConfig()
            ]);

            const uniqueTypes = Array.from(new Set((data || []).map(c => c.type))) as string[];
            const mergedOrder = [...order];
            uniqueTypes.forEach(t => { if (!mergedOrder.includes(t)) mergedOrder.push(t); });

            setCats(data || []);
            setGroupOrder(mergedOrder);
            setSortConfig(config || {});

            if (!keepSelection && !selectedType && mergedOrder.length > 0) setSelectedType(mergedOrder[0]);
        } catch (e) {
            console.error("Failed to load categories", e);
        }
    };

    useEffect(() => {
        let active = true;
        const init = async () => {
            if(active) setIsLoading(true);
            await load();
            if(active) setIsLoading(false);
        };
        init();
        return () => { active = false; };
    }, []);

    // Debounce Effect
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(localSearchInput);
        }, 500);

        return () => clearTimeout(handler);
    }, [localSearchInput]);

    // Reset visible count when search or list changes
    useEffect(() => {
        setVisibleGroupsCount(BATCH_SIZE_GROUPS);
        if (groupsListRef.current) groupsListRef.current.scrollTop = 0;
    }, [debouncedSearchQuery, groupOrder]);

    // Reset visible items when type changes or search changes
    useEffect(() => {
        setVisibleItemsCount(BATCH_SIZE_ITEMS);
        if (itemsGridRef.current) itemsGridRef.current.scrollTop = 0;
    }, [selectedType, debouncedSearchQuery]);

    useEffect(() => {
        if(errorMsg) {
            const timer = setTimeout(() => setErrorMsg(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [errorMsg]);

    // --- COMPUTED GROUPS ---
    const filteredGroups = useMemo(() => {
        if (!debouncedSearchQuery) return groupOrder;
        return groupOrder.filter(type => {
            const typeMatch = type.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
            const hasItemMatch = cats.some(c => c.type === type && c.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));
            return typeMatch || hasItemMatch;
        });
    }, [groupOrder, cats, debouncedSearchQuery]);

    const visibleGroups = useMemo(() => {
        return filteredGroups.slice(0, visibleGroupsCount);
    }, [filteredGroups, visibleGroupsCount]);

    const isAlphaSort = selectedType ? (sortConfig[selectedType] === true) : false;

    // --- COMPUTED ITEMS ---
    const allSortedItems = useMemo(() => {
        if (!selectedType) return [];

        let items = cats.filter(c => c.type === selectedType);

        if (debouncedSearchQuery) {
            items = items.filter(c => c.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));
        }

        const sortedItems = [...items];

        if (isAlphaSort) {
            sortedItems.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true }));
        } else {
            sortedItems.sort((a, b) => a.id - b.id);
        }
        return sortedItems;
    }, [cats, selectedType, sortConfig, isAlphaSort, debouncedSearchQuery]);

    const visibleItems = useMemo(() => {
        return allSortedItems.slice(0, visibleItemsCount);
    }, [allSortedItems, visibleItemsCount]);


    // --- HANDLERS ---
    const handleGroupsScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            if (visibleGroupsCount < filteredGroups.length) {
                setVisibleGroupsCount(prev => Math.min(prev + BATCH_SIZE_GROUPS, filteredGroups.length));
            }
        }
    };

    const handleItemsScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 100) {
            if (visibleItemsCount < allSortedItems.length) {
                setVisibleItemsCount(prev => Math.min(prev + BATCH_SIZE_ITEMS, allSortedItems.length));
            }
        }
    };

    const handleSortChange = async (mode: 'DEFAULT' | 'AZ') => {
        if (!selectedType || isLoading) return;
        const newConfig = { ...sortConfig, [selectedType]: mode === 'AZ' };
        setSortConfig(newConfig);
        try {
            await BackendService.saveCategorySortConfig(newConfig);
            await load(true);
            if (onSettingsChange) onSettingsChange();
        } catch (e) {
            setErrorMsg("Failed to save sort preference");
            load(true);
        }
    };

    const addType = async (e?: React.FormEvent) => {
        if(e) e.preventDefault();
        if (!newType.trim() || isLoading) return;
        const typeToAdd = String(newType).trim().toUpperCase();

        if (groupOrder.some(g => g.toUpperCase() === typeToAdd)) {
            setErrorMsg(t('filters_alert_exists'));
            return;
        }

        setIsLoading(true);
        try {
            const newOrder = [...groupOrder, typeToAdd];
            setGroupOrder(newOrder);
            await BackendService.saveCategoryGroupOrder(newOrder);
            setSelectedType(typeToAdd);
            setNewType('');
        } catch(e) {
            setErrorMsg(t('filters_alert_create_fail'));
        } finally {
            setIsLoading(false);
        }
    };

    const deleteType = async (type: string) => {
        if (isLoading) return;
        const toDelete = cats.filter(c => c.type === type);
        const count = toDelete.length;

        if (window.confirm(t('filters_confirm_delete_group').replace('{type}', type).replace('{count}', count.toString()))) {
            setIsLoading(true);
            try {
                await Promise.all(toDelete.map(c => BackendService.deleteCategory(c.id)));
                const newOrder = groupOrder.filter(g => g !== type);
                setGroupOrder(newOrder);
                await BackendService.saveCategoryGroupOrder(newOrder);
                if (onSettingsChange) onSettingsChange();
                await load();
                setSelectedType(newOrder.length > 0 ? newOrder[0] : null);
            } catch(e) {
                setErrorMsg(t('filters_alert_delete_fail'));
            } finally {
                setIsLoading(false);
            }
        }
    };

    const renameType = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingType || isLoading) return;
        const newName = editingType.current.trim().toUpperCase();
        if (!newName) return setEditingType(null);

        if (newName !== editingType.original) {
            if (groupOrder.some(g => g === newName)) {
                setErrorMsg(t('filters_alert_name_exists'));
                return;
            }
            setIsLoading(true);
            try {
                await BackendService.renameCategoryType(editingType.original, newName);
                if (onSettingsChange) onSettingsChange();
                await load(true);
                setSelectedType(newName);
            } catch(e) {
                setErrorMsg(t('filters_alert_rename_fail'));
            } finally {
                setIsLoading(false);
            }
        }
        setEditingType(null);
    };

    const handleGroupDrop = async (e: React.DragEvent, targetType: string) => {
        e.preventDefault();
        if (!draggedGroup || draggedGroup === targetType || isLoading) return;
        setIsLoading(true);
        try {
            const newOrder = [...groupOrder];
            const fromIdx = newOrder.indexOf(draggedGroup);
            const toIdx = newOrder.indexOf(targetType);
            newOrder.splice(fromIdx, 1);
            newOrder.splice(toIdx, 0, draggedGroup);
            setGroupOrder(newOrder);
            await BackendService.saveCategoryGroupOrder(newOrder);
        } finally {
            setIsLoading(false);
            setDraggedGroup(null);
        }
    };

    const toggleCatVisible = async (cat: Category) => {
        if (isLoading) return;
        setCats(prev => prev.map(c => c.id === cat.id ? { ...c, isVisible: !c.isVisible } : c));
        try {
            await BackendService.saveCategory({ ...cat, isVisible: !cat.isVisible });
        } catch {
            setCats(prev => prev.map(c => c.id === cat.id ? { ...c, isVisible: cat.isVisible } : c));
            setErrorMsg(t('filters_alert_vis_fail'));
        }
    };

    const toggleGroupVisibility = async (type: string) => {
        if (isLoading) return;
        const groupItems = cats.filter(c => c.type === type);
        const currentlyVisible = groupItems.some(c => c.isVisible);
        const newVisibility = !currentlyVisible;
        setIsLoading(true);
        try {
            const promises = groupItems.map(c => {
                if (c.isVisible !== newVisibility) {
                    return BackendService.saveCategory({ ...c, isVisible: newVisibility });
                }
                return Promise.resolve();
            });
            await Promise.all(promises);
            await load(true);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteCat = async (id: number) => {
        if (isLoading) return;
        if (window.confirm(t('filters_confirm_delete_item'))) {
            setIsLoading(true);
            try {
                await BackendService.deleteCategory(id);
                await load(true);
            } catch(e) {
                setErrorMsg(t('filters_alert_delete_item_fail'));
            } finally {
                setIsLoading(false);
            }
        }
    };

    const addItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!newCatName.trim() || !selectedType || isLoading) return;

        const cleanName = newCatName.trim();
        // Check duplicate in current group
        if (cats.some(c => c.type === selectedType && c.name.toLowerCase() === cleanName.toLowerCase())) {
            setErrorMsg(t('filters_alert_item_exists'));
            return;
        }

        setIsLoading(true);
        try {
            await BackendService.saveCategory({ name: cleanName, type: selectedType, isVisible: true });
            setNewCatName('');
            await load(true);
        } catch(e) {
            setErrorMsg(t('filters_alert_add_item_fail'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-240px)] min-h-[500px] gap-6 relative">
            {isLoading && (
                <div className="absolute inset-0 z-20 bg-vault-900/50 backdrop-blur-sm flex items-center justify-center rounded-xl">
                    <Loader className="animate-spin text-vault-accent" size={48} />
                </div>
            )}

            {errorMsg && (
                 <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-900/90 text-white px-4 py-2 rounded-lg border border-red-500 shadow-xl z-50 flex items-center gap-2 animate-bounce-short pointer-events-none">
                    <AlertCircle size={16}/> {errorMsg}
                 </div>
            )}

            {/* LEFT SIDEBAR: GROUPS */}
            {/* Mobile Logic: Hidden if a type is selected, Visible if not (md:flex always visible) */}
            <div className={`w-full md:w-80 flex flex-col bg-vault-900 border border-vault-700 rounded-xl overflow-hidden flex-shrink-0 shadow-lg ${selectedType ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 bg-vault-950 border-b border-vault-800">
                     {/* ENHANCED SEARCH INPUT */}
                     <div className="relative mb-4 group">
                        <div className="absolute inset-0 bg-vault-accent/5 rounded-xl blur-sm group-focus-within:bg-vault-accent/20 transition-all duration-500"></div>
                        <div className="relative flex items-center bg-vault-900 border border-vault-700 rounded-xl group-focus-within:border-vault-accent group-focus-within:ring-1 group-focus-within:ring-vault-accent/50 transition-all shadow-inner">
                            <Search size={16} className="ml-3 text-gray-500 group-focus-within:text-vault-accent transition-colors"/>
                            <input
                                value={localSearchInput}
                                onChange={e => setLocalSearchInput(e.target.value)}
                                placeholder={t('filters_search_groups')}
                                className="w-full bg-transparent border-none text-sm text-white px-3 py-3 focus:ring-0 outline-none placeholder-gray-600"
                            />
                            {localSearchInput && (
                                <button
                                    onClick={() => { setLocalSearchInput(''); setDebouncedSearchQuery(''); }}
                                    className="mr-2 p-1 text-gray-500 hover:text-white rounded-full hover:bg-vault-800 transition"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                     </div>

                     <form onSubmit={addType} className="flex gap-2">
                          <input
                            value={newType}
                            onChange={e => setNewType(e.target.value)}
                            placeholder={t('filters_ph_new_group')}
                            className="flex-1 bg-vault-800 border border-vault-700 rounded px-2 py-1.5 text-xs text-white focus:border-vault-accent outline-none uppercase"
                          />
                          <button type="submit" disabled={!newType.trim()} className="bg-vault-secondary text-vault-900 px-2 rounded hover:bg-emerald-400 disabled:opacity-30 transition">
                              <Plus size={16}/>
                          </button>
                     </form>
                </div>

                {/* Lazy Loading Groups List */}
                <div
                    ref={groupsListRef}
                    onScroll={handleGroupsScroll}
                    className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar"
                >
                    {visibleGroups.map(type => {
                        const isSelected = selectedType === type;
                        const isEditing = editingType?.original === type;
                        const groupItems = cats.filter(c => c.type === type);
                        const count = groupItems.length;
                        const isGroupVisible = groupItems.some(c => c.isVisible);

                        return (
                            <div
                                key={type}
                                draggable={!isEditing && !localSearchInput && !isLoading}
                                onDragStart={() => setDraggedGroup(type)}
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => handleGroupDrop(e, type)}
                                onClick={() => !isEditing && !isLoading && setSelectedType(type)}
                                className={`group relative p-3 rounded-lg cursor-pointer border transition-all ${isSelected ? 'bg-vault-800 border-vault-accent' : 'bg-transparent border-transparent hover:bg-vault-800/50 hover:border-vault-700'}`}
                            >
                                {isEditing ? (
                                    <form onSubmit={renameType} className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                        <input
                                            autoFocus
                                            value={editingType.current}
                                            onChange={e => setEditingType({...editingType, current: e.target.value})}
                                            className="w-full bg-vault-950 border border-vault-accent rounded px-1 py-0.5 text-sm text-white outline-none uppercase"
                                            onBlur={() => setEditingType(null)}
                                        />
                                        <button type="button" onMouseDown={renameType} className="text-green-400"><Check size={14}/></button>
                                    </form>
                                ) : (
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                                            {!localSearchInput && <GripVertical size={12} className="text-gray-600 cursor-move opacity-0 group-hover:opacity-100 transition flex-shrink-0"/>}
                                            {/* Removed 'truncate', added 'whitespace-normal break-words' */}
                                            <span className={`font-bold text-sm whitespace-normal break-words uppercase ${isSelected ? 'text-white' : 'text-gray-400'} ${!isGroupVisible ? 'line-through decoration-gray-600' : ''}`}>{type}</span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-[10px] bg-vault-950 text-gray-500 px-1.5 rounded border border-vault-800">{count}</span>
                                            {isSelected && !isLoading && (
                                                <div className="flex items-center gap-1 animate-fadeIn">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleGroupVisibility(type); }}
                                                        className={`p-1.5 rounded-md transition ${!isGroupVisible ? 'text-gray-500 hover:text-white hover:bg-vault-700' : 'text-vault-secondary hover:bg-vault-700'}`}
                                                        title={isGroupVisible ? t('filters_tooltip_hide') : t('filters_tooltip_show')}
                                                    >
                                                        {isGroupVisible ? <Eye size={14}/> : <EyeOff size={14}/>}
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setEditingType({original: type, current: type}) }}
                                                        className="p-1.5 text-gray-400 hover:text-white hover:bg-vault-700 rounded-md transition"
                                                        title={t('filters_tooltip_rename')}
                                                    >
                                                        <Edit size={14}/>
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteType(type) }}
                                                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-md transition"
                                                        title={t('filters_tooltip_delete')}
                                                    >
                                                        <Trash2 size={14}/>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                    {filteredGroups.length === 0 && <div className="text-center text-gray-500 text-xs py-4">{t('filters_no_matches')}</div>}
                    {visibleGroupsCount < filteredGroups.length && (
                        <div className="py-2 text-center">
                            <Loader size={16} className="animate-spin text-vault-accent mx-auto"/>
                        </div>
                    )}
                </div>
            </div>

            {/* MAIN CONTENT: ITEMS */}
            {/* Mobile Logic: Visible only if type selected. Desktop: Always visible (md:flex) */}
            <div className={`flex-1 bg-vault-900 border border-vault-700 rounded-xl overflow-hidden flex-col shadow-lg ${selectedType ? 'flex' : 'hidden md:flex'}`}>
                {selectedType ? (
                    <>
                        <div className="p-6 border-b border-vault-800 bg-vault-950 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                    {/* Mobile Back Button */}
                                    <button
                                        onClick={() => setSelectedType(null)}
                                        className="md:hidden mr-1 text-gray-400 hover:text-white transition-colors"
                                    >
                                        <ArrowLeft size={24}/>
                                    </button>

                                    {selectedType}
                                    <span className="text-xs bg-vault-accent text-white px-2 py-1 rounded-full font-bold align-middle tracking-normal normal-case">
                                        {allSortedItems.length} items
                                    </span>
                                </h2>

                                <div className="flex items-center bg-vault-800 rounded-lg p-1 border border-vault-700 mt-2 shadow-sm w-fit">
                                    <button
                                        onClick={() => handleSortChange('DEFAULT')}
                                        disabled={isLoading}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition uppercase tracking-wider ${!isAlphaSort ? 'bg-vault-600 text-white shadow-sm' : 'text-gray-500 hover:text-white hover:bg-vault-700/50'}`}
                                    >
                                        <Hash size={12}/> {t('filters_sort_default')}
                                    </button>
                                    <div className="w-px h-4 bg-vault-700 mx-1"></div>
                                    <button
                                        onClick={() => handleSortChange('AZ')}
                                        disabled={isLoading}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition uppercase tracking-wider ${isAlphaSort ? 'bg-vault-600 text-white shadow-sm' : 'text-gray-500 hover:text-white hover:bg-vault-700/50'}`}
                                    >
                                        <ArrowDownAZ size={12}/> {t('filters_sort_az')}
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={addItem} className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                <input
                                    value={newCatName}
                                    onChange={e => setNewCatName(e.target.value)}
                                    placeholder={t('filters_ph_add_item').replace('{type}', selectedType.toLowerCase())}
                                    className="flex-1 sm:w-64 bg-vault-800 border border-vault-700 rounded-lg px-4 py-2 text-sm text-white focus:border-vault-accent outline-none"
                                />
                                <button type="submit" disabled={!newCatName.trim()} className="bg-vault-accent text-white px-4 py-2 rounded-lg font-bold hover:bg-vault-accentHover disabled:opacity-50 transition shadow-lg shadow-vault-accent/20">
                                    {t('filters_item_add')}
                                </button>
                            </form>
                        </div>

                        {/* Lazy Loading Items Grid */}
                        <div
                            ref={itemsGridRef}
                            onScroll={handleItemsScroll}
                            className="flex-1 overflow-y-auto p-6 custom-scrollbar"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" key={`${selectedType}-${isAlphaSort ? 'AZ' : 'DEF'}`}>
                                {visibleItems.map(item => {
                                    const isMatch = debouncedSearchQuery && item.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

                                    return (
                                        <div key={item.id} className={`p-3 rounded-lg border transition-all group flex items-center justify-between ${isMatch ? 'bg-vault-800 border-vault-secondary ring-1 ring-vault-secondary' : 'bg-vault-950 border-vault-800 hover:border-vault-600 hover:bg-vault-800/50'}`}>
                                            {/* Key changes: flex-1 on parent, REMOVED truncate, ADDED break-all and whitespace-normal */}
                                            <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                                                <Tag
                                                    size={14}
                                                    className={`flex-shrink-0 ${item.isVisible ? 'text-vault-secondary' : 'text-gray-600'}`}
                                                />
                                                {/* Changed 'break-all' to 'break-words' to fix word splitting */}
                                                <span className={`font-medium text-sm break-words whitespace-normal select-none leading-5 ${item.isVisible ? 'text-gray-200' : 'text-gray-500 line-through'}`}>
                                                    {item.name}
                                                </span>
                                            </div>
                                            {!isLoading && (
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => toggleCatVisible(item)} className={`p-1.5 rounded hover:bg-vault-800 transition ${item.isVisible ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-green-400'}`} title={t('filters_tooltip_item_vis')}>
                                                        {item.isVisible ? <Eye size={14}/> : <EyeOff size={14}/>}
                                                    </button>
                                                    <button onClick={() => deleteCat(item.id)} className="p-1.5 rounded hover:bg-red-900/20 text-gray-500 hover:text-red-400 transition" title={t('filters_tooltip_item_del')}>
                                                        <Trash2 size={14}/>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {allSortedItems.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                                    <List size={64} className="mb-4 stroke-1"/>
                                    <p>{t('filters_empty_group')}</p>
                                </div>
                            )}

                            {visibleItemsCount < allSortedItems.length && (
                                <div className="py-6 text-center w-full">
                                    <Loader size={24} className="animate-spin text-vault-accent mx-auto"/>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                         <Layout size={64} className="mb-4 stroke-1 opacity-20"/>
                         <p>{t('filters_select_group')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
