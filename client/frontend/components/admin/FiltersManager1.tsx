
import React, { useState, useEffect, useMemo } from 'react';
import { Category } from '../../types';
import { BackendService } from '../../services/backendService';
import { 
    Power, ToggleRight, ToggleLeft, GripVertical, Check, X, Edit, 
    Eye, EyeOff, Trash2, Plus, Search, Settings, List, Tag, Layout,
    ArrowDownAZ, Hash, Loader, AlertCircle
} from 'lucide-react';

export const FiltersManager = ({ onSettingsChange }: { onSettingsChange?: () => void }) => {
  const [activeTab, setActiveTab] = useState<'CATEGORIES' | 'SETTINGS'>('CATEGORIES');
  
  return (
      <div className="animate-fadeIn">
          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-4 mb-6 border-b border-vault-800 pb-1">
              <button 
                onClick={() => setActiveTab('CATEGORIES')}
                className={`pb-3 px-2 text-sm font-bold border-b-2 transition flex items-center gap-2 ${activeTab === 'CATEGORIES' ? 'border-vault-accent text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
              >
                  <List size={16}/> Category Taxonomy
              </button>
              <button 
                onClick={() => setActiveTab('SETTINGS')}
                className={`pb-3 px-2 text-sm font-bold border-b-2 transition flex items-center gap-2 ${activeTab === 'SETTINGS' ? 'border-vault-accent text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
              >
                  <Settings size={16}/> Store Configuration
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
    const [sysConfig, setSysConfig] = useState({ enableRegistration: true, enableGuestCheckout: true });
    const [mainGroup, setMainGroup] = useState<string>('');
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        const load = async () => {
            const conf = await BackendService.getSystemConfig();
            const mg = await BackendService.getMainCategoryGroup();
            const cats = await BackendService.getCategories();
            setSysConfig(conf);
            setMainGroup(mg);
            setCategories(cats);
        };
        load();
    }, []);

    const toggleSysConfig = async (key: 'ENABLE_REGISTRATION' | 'ENABLE_GUEST_CHECKOUT') => {
        const newVal = key === 'ENABLE_REGISTRATION' ? !sysConfig.enableRegistration : !sysConfig.enableGuestCheckout;
        await BackendService.saveSystemConfig(key, newVal);
        setSysConfig(prev => ({ ...prev, [key === 'ENABLE_REGISTRATION' ? 'enableRegistration' : 'enableGuestCheckout']: newVal }));
        if(onSettingsChange) onSettingsChange();
    };

    // Derive unique types for the dropdown
    const uniqueTypes = Array.from(new Set(categories.map(c => c.type)));

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            <div className="bg-vault-900 border border-vault-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-vault-secondary/10 p-2 rounded-lg text-vault-secondary">
                        <Power size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-white">Access Control</h4>
                        <p className="text-xs text-gray-400">Manage user access and checkout flows</p>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-vault-950 p-4 rounded-lg border border-vault-800">
                        <div>
                            <p className="font-bold text-sm text-gray-200">User Registration</p>
                            <p className="text-xs text-gray-500">Allow new users to sign up</p>
                        </div>
                        <button onClick={() => toggleSysConfig('ENABLE_REGISTRATION')} className={`${sysConfig.enableRegistration ? 'text-green-400' : 'text-gray-600'} transition-colors`}>
                              {sysConfig.enableRegistration ? <ToggleRight size={32} fill="currentColor" className="opacity-20"/> : <ToggleLeft size={32}/>}
                        </button>
                    </div>

                    <div className="flex items-center justify-between bg-vault-950 p-4 rounded-lg border border-vault-800">
                        <div>
                            <p className="font-bold text-sm text-gray-200">Guest Checkout</p>
                            <p className="text-xs text-gray-500">Allow purchasing without an account</p>
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
                        <h4 className="font-bold text-white">Store Display</h4>
                        <p className="text-xs text-gray-400">Customize appearance and badges</p>
                    </div>
                </div>
                <div className="bg-vault-950 p-4 rounded-lg border border-vault-800">
                    <p className="font-bold text-sm text-gray-200 mb-2">Primary Badge Group</p>
                    <p className="text-xs text-gray-500 mb-3">Which category type should appear as the main badge on product cards?</p>
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
                        <option value="">-- None --</option>
                        {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
}

// --- SUB-COMPONENT: Category Taxonomy ---
const CategoryTaxonomyManager = ({ onSettingsChange }: { onSettingsChange?: () => void }) => {
    const [cats, setCats] = useState<Category[]>([]);
    const [groupOrder, setGroupOrder] = useState<string[]>([]);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(false);
    
    // Editing states
    const [editingType, setEditingType] = useState<{original: string, current: string} | null>(null);
    const [newType, setNewType] = useState('');
    const [newCatName, setNewCatName] = useState('');
    const [draggedGroup, setDraggedGroup] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const load = async () => {
        try {
            const data = await BackendService.getCategories();
            const order = await BackendService.getCategoryGroupOrder();
            const config = await BackendService.getCategorySortConfig();
            
            // Merge order logic
            const uniqueTypes = Array.from(new Set((data || []).map(c => c.type))) as string[];
            const mergedOrder = [...order];
            uniqueTypes.forEach(t => { if (!mergedOrder.includes(t)) mergedOrder.push(t); });
            
            setCats(data || []);
            setGroupOrder(mergedOrder);
            setSortConfig(config || {});
            
            // Default select first if none selected
            if (!selectedType && mergedOrder.length > 0) setSelectedType(mergedOrder[0]);
        } catch (e) {
            console.error("Failed to load categories", e);
        }
    };

    useEffect(() => { load(); }, []);

    // Clear error after 3s
    useEffect(() => {
        if(errorMsg) {
            const timer = setTimeout(() => setErrorMsg(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [errorMsg]);

    // --- COMPUTED ---
    const filteredGroups = useMemo(() => {
        if (!searchQuery) return groupOrder;
        return groupOrder.filter(type => {
            const typeMatch = type.toLowerCase().includes(searchQuery.toLowerCase());
            const hasItemMatch = cats.some(c => c.type === type && c.name.toLowerCase().includes(searchQuery.toLowerCase()));
            return typeMatch || hasItemMatch;
        });
    }, [groupOrder, cats, searchQuery]);

    const isAlphaSort = selectedType ? (sortConfig[selectedType] === true) : false;

    const currentGroupItems = useMemo(() => {
        if (!selectedType) return [];
        
        const items = cats.filter(c => c.type === selectedType);
        const sortedItems = [...items]; // Shallow copy for sorting

        if (isAlphaSort) {
            sortedItems.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true }));
        } else {
            sortedItems.sort((a, b) => a.id - b.id);
        }
        return sortedItems;
    }, [cats, selectedType, sortConfig, isAlphaSort]);


    // --- HANDLERS ---
    const handleSortChange = async (mode: 'DEFAULT' | 'AZ') => {
        if (!selectedType || isLoading) return;
        
        const newConfig = { ...sortConfig, [selectedType]: mode === 'AZ' };
        // Optimistic update
        setSortConfig(newConfig);
        
        try {
            await BackendService.saveCategorySortConfig(newConfig);
            // Confirm with a reload to ensure server state is synced
            await load();
            if (onSettingsChange) onSettingsChange();
        } catch (e) {
            console.error("Failed to save sort config", e);
            setErrorMsg("Failed to save sort preference");
            // Revert on failure
            load(); 
        }
    };

    const addType = async (e?: React.FormEvent) => {
        if(e) e.preventDefault();
        if (!newType.trim() || isLoading) return;
        const typeToAdd = String(newType).trim().toUpperCase();
        
        // Strict case-insensitive duplicate check
        if (groupOrder.some(g => g.toUpperCase() === typeToAdd)) {
            setErrorMsg("Group already exists!");
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
            setErrorMsg("Failed to create group.");
        } finally {
            setIsLoading(false);
        }
    };

    const deleteType = async (type: string) => {
        if (isLoading) return;
        const toDelete = cats.filter(c => c.type === type);
        const count = toDelete.length;
        
        if (window.confirm(`Delete group "${type}" and ALL ${count} categories inside it? This cannot be undone.`)) {
            setIsLoading(true);
            try {
                // Bulk delete helper: Use Promise.all to ensure all complete before reload
                await Promise.all(toDelete.map(c => BackendService.deleteCategory(c.id)));
                
                const newOrder = groupOrder.filter(g => g !== type);
                setGroupOrder(newOrder);
                await BackendService.saveCategoryGroupOrder(newOrder);
                
                if (onSettingsChange) onSettingsChange();
                await load();
                setSelectedType(newOrder.length > 0 ? newOrder[0] : null);
            } catch(e) {
                setErrorMsg("Failed to delete group. Please try again.");
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
                setErrorMsg("Group name already exists!");
                return;
            }
            
            setIsLoading(true);
            try {
                await BackendService.renameCategoryType(editingType.original, newName);
                if (onSettingsChange) onSettingsChange();
                await load();
                setSelectedType(newName);
            } catch(e) {
                setErrorMsg("Failed to rename group.");
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
        // Optimistic update
        setCats(prev => prev.map(c => c.id === cat.id ? { ...c, isVisible: !c.isVisible } : c));
        
        // Background save
        try {
            await BackendService.saveCategory({ ...cat, isVisible: !cat.isVisible });
        } catch {
            // Revert on fail
            setCats(prev => prev.map(c => c.id === cat.id ? { ...c, isVisible: cat.isVisible } : c));
            setErrorMsg("Failed to update visibility.");
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
            await load();
        } finally {
            setIsLoading(false);
        }
    };

    const deleteCat = async (id: number) => {
        if (isLoading) return;
        if (window.confirm("Permanently delete this item?")) {
            setIsLoading(true);
            try {
                await BackendService.deleteCategory(id);
                await load();
            } catch(e) {
                setErrorMsg("Failed to delete category.");
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
        if (currentGroupItems.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
            setErrorMsg("Item already exists in this group.");
            return;
        }

        setIsLoading(true);
        try {
            await BackendService.saveCategory({ name: cleanName, type: selectedType, isVisible: true });
            setNewCatName('');
            await load();
        } catch(e) {
            setErrorMsg("Failed to add item.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-240px)] min-h-[500px] gap-6 relative">
            {isLoading && (
                <div className="absolute inset-0 bg-black/50 z-50 rounded-xl flex items-center justify-center backdrop-blur-sm animate-fadeIn">
                    <div className="bg-vault-900 p-4 rounded-xl shadow-2xl flex items-center gap-3 border border-vault-700">
                        <Loader className="animate-spin text-vault-accent" size={24}/>
                        <span className="font-bold text-white">Processing...</span>
                    </div>
                </div>
            )}
            
            {errorMsg && (
                 <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-900/90 text-white px-4 py-2 rounded-lg border border-red-500 shadow-xl z-50 flex items-center gap-2 animate-bounce-short pointer-events-none">
                    <AlertCircle size={16}/> {errorMsg}
                 </div>
            )}

            {/* LEFT SIDEBAR: GROUPS */}
            <div className="w-full md:w-80 flex flex-col bg-vault-900 border border-vault-700 rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
                <div className="p-4 bg-vault-950 border-b border-vault-800">
                     <div className="relative mb-3">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                        <input 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Filter groups..."
                            className="w-full bg-vault-800 border border-vault-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-vault-accent outline-none"
                        />
                     </div>
                     <form onSubmit={addType} className="flex gap-2">
                          <input 
                            value={newType}
                            onChange={e => setNewType(e.target.value)}
                            placeholder="NEW GROUP..."
                            className="flex-1 bg-vault-800 border border-vault-700 rounded px-2 py-1.5 text-xs text-white focus:border-vault-accent outline-none uppercase"
                          />
                          <button type="submit" disabled={!newType.trim()} className="bg-vault-secondary text-vault-900 px-2 rounded hover:bg-emerald-400 disabled:opacity-30 transition">
                              <Plus size={16}/>
                          </button>
                     </form>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {filteredGroups.map(type => {
                        const isSelected = selectedType === type;
                        const isEditing = editingType?.original === type;
                        const groupItems = cats.filter(c => c.type === type);
                        const count = groupItems.length;
                        const isGroupVisible = groupItems.some(c => c.isVisible);
                        
                        return (
                            <div 
                                key={type}
                                draggable={!isEditing && !searchQuery && !isLoading}
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
                                            {!searchQuery && <GripVertical size={12} className="text-gray-600 cursor-move opacity-0 group-hover:opacity-100 transition flex-shrink-0"/>}
                                            <span className={`font-bold text-sm truncate uppercase ${isSelected ? 'text-white' : 'text-gray-400'} ${!isGroupVisible ? 'line-through decoration-gray-600' : ''}`}>{type}</span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-[10px] bg-vault-950 text-gray-500 px-1.5 rounded border border-vault-800">{count}</span>
                                            {isSelected && !isLoading && (
                                                <div className="flex items-center gap-1 animate-fadeIn">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); toggleGroupVisibility(type); }} 
                                                        className={`p-1.5 rounded-md transition ${!isGroupVisible ? 'text-gray-500 hover:text-white hover:bg-vault-700' : 'text-vault-secondary hover:bg-vault-700'}`}
                                                        title={isGroupVisible ? "Hide Group" : "Show Group"}
                                                    >
                                                        {isGroupVisible ? <Eye size={14}/> : <EyeOff size={14}/>}
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setEditingType({original: type, current: type}) }} 
                                                        className="p-1.5 text-gray-400 hover:text-white hover:bg-vault-700 rounded-md transition"
                                                        title="Rename Group"
                                                    >
                                                        <Edit size={14}/>
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); deleteType(type) }} 
                                                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-md transition"
                                                        title="Delete Group"
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
                    {filteredGroups.length === 0 && <div className="text-center text-gray-500 text-xs py-4">No matches found</div>}
                </div>
            </div>

            {/* MAIN CONTENT: ITEMS */}
            <div className="flex-1 bg-vault-900 border border-vault-700 rounded-xl overflow-hidden flex flex-col shadow-lg">
                {selectedType ? (
                    <>
                        <div className="p-6 border-b border-vault-800 bg-vault-950 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                    {selectedType} 
                                    <span className="text-xs bg-vault-accent text-white px-2 py-1 rounded-full font-bold align-middle tracking-normal normal-case">
                                        {currentGroupItems.length} items
                                    </span>
                                </h2>
                                
                                <div className="flex items-center bg-vault-800 rounded-lg p-1 border border-vault-700 mt-2 shadow-sm w-fit">
                                    <button 
                                        onClick={() => handleSortChange('DEFAULT')}
                                        disabled={isLoading}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition uppercase tracking-wider ${!isAlphaSort ? 'bg-vault-600 text-white shadow-sm' : 'text-gray-500 hover:text-white hover:bg-vault-700/50'}`}
                                    >
                                        <Hash size={12}/> Default
                                    </button>
                                    <div className="w-px h-4 bg-vault-700 mx-1"></div>
                                    <button 
                                        onClick={() => handleSortChange('AZ')}
                                        disabled={isLoading}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition uppercase tracking-wider ${isAlphaSort ? 'bg-vault-600 text-white shadow-sm' : 'text-gray-500 hover:text-white hover:bg-vault-700/50'}`}
                                    >
                                        <ArrowDownAZ size={12}/> A-Z Sort
                                    </button>
                                </div>
                            </div>
                            
                            <form onSubmit={addItem} className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                <input 
                                    value={newCatName}
                                    onChange={e => setNewCatName(e.target.value)}
                                    placeholder={`Add new ${selectedType.toLowerCase()}...`}
                                    className="flex-1 sm:w-64 bg-vault-800 border border-vault-700 rounded-lg px-4 py-2 text-sm text-white focus:border-vault-accent outline-none"
                                />
                                <button type="submit" disabled={!newCatName.trim()} className="bg-vault-accent text-white px-4 py-2 rounded-lg font-bold hover:bg-vault-accentHover disabled:opacity-50 transition shadow-lg shadow-vault-accent/20">
                                    Add
                                </button>
                            </form>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            {/* Key prop ensures list is re-created when sort changes, forcing visual update */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" key={`${selectedType}-${isAlphaSort ? 'AZ' : 'DEF'}`}>
                                {currentGroupItems.map(item => {
                                    const isMatch = searchQuery && item.name.toLowerCase().includes(searchQuery.toLowerCase());
                                    
                                    return (
                                        <div key={item.id} className={`p-3 rounded-lg border transition-all group flex items-center justify-between ${isMatch ? 'bg-vault-800 border-vault-secondary ring-1 ring-vault-secondary' : 'bg-vault-950 border-vault-800 hover:border-vault-600 hover:bg-vault-800/50'}`}>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Tag size={14} className={`flex-shrink-0 ${item.isVisible ? 'text-vault-secondary' : 'text-gray-600'}`}/>
                                                <span className={`font-medium text-sm truncate select-none ${item.isVisible ? 'text-gray-200' : 'text-gray-500 line-through'}`}>{item.name}</span>
                                            </div>
                                            {!isLoading && (
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => toggleCatVisible(item)} className={`p-1.5 rounded hover:bg-vault-800 transition ${item.isVisible ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-green-400'}`} title="Toggle Visibility">
                                                        {item.isVisible ? <Eye size={14}/> : <EyeOff size={14}/>}
                                                    </button>
                                                    <button onClick={() => deleteCat(item.id)} className="p-1.5 rounded hover:bg-red-900/20 text-gray-500 hover:text-red-400 transition" title="Delete">
                                                        <Trash2 size={14}/>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                            {currentGroupItems.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                                    <List size={64} className="mb-4 stroke-1"/>
                                    <p>This group is empty.</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                         <Layout size={64} className="mb-4 stroke-1 opacity-20"/>
                         <p>Select a group from the sidebar to manage items.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
