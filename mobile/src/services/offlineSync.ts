export interface CustomerDraft {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  vehicleNumber?: string;
  createdAt: string;
  synced: boolean;
}

class OfflineSyncManager {
  private cachedCustomers: Map<string, any> = new Map();
  private customerDrafts: CustomerDraft[] = [];
  private isOnline: boolean = true;

  public setOnlineStatus(online: boolean) {
    this.isOnline = online;
    if (online) {
      this.syncPendingDrafts();
    }
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Save recently opened customer to offline cache
  public cacheCustomer(customer: any) {
    if (customer?.id) {
      this.cachedCustomers.set(customer.id, customer);
    }
  }

  public getCachedCustomer(id: string) {
    return this.cachedCustomers.get(id);
  }

  public getCachedCustomersList(): any[] {
    return Array.from(this.cachedCustomers.values());
  }

  // Create offline customer draft
  public saveDraft(draft: Omit<CustomerDraft, 'id' | 'createdAt' | 'synced'>): CustomerDraft {
    const newDraft: CustomerDraft = {
      ...draft,
      id: `draft_${Date.now()}`,
      createdAt: new Date().toISOString(),
      synced: false,
    };
    this.customerDrafts.push(newDraft);
    return newDraft;
  }

  public getPendingDrafts(): CustomerDraft[] {
    return this.customerDrafts.filter(d => !d.synced);
  }

  public async syncPendingDrafts(): Promise<number> {
    let syncedCount = 0;
    for (const draft of this.customerDrafts) {
      if (!draft.synced) {
        draft.synced = true;
        syncedCount++;
      }
    }
    return syncedCount;
  }
}

export const offlineSyncManager = new OfflineSyncManager();
