
import React from 'react';
import { InventoryManager } from './admin/InventoryManager';
import { UsersManager } from './admin/UsersManager';
import { FiltersManager } from './admin/FiltersManager';
import { OrdersManager } from './admin/OrdersManager';
import { AuditManager } from './admin/AuditManager';

export const AdminDashboard = ({ activeTab, onSettingsChange }: { activeTab: 'INVENTORY' | 'USERS' | 'FILTERS' | 'ORDERS' | 'AUDIT', onSettingsChange?: () => void }) => {
    return (
        <div className="max-w-7xl mx-auto">
            {activeTab === 'INVENTORY' && <InventoryManager />}
            {activeTab === 'USERS' && <UsersManager />}
            {activeTab === 'FILTERS' && <FiltersManager onSettingsChange={onSettingsChange} />}
            {activeTab === 'AUDIT' && <AuditManager />}
            {activeTab === 'ORDERS' && <OrdersManager />}
        </div>
    );
};
