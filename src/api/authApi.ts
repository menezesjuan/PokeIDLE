export interface AuthUser {
  id: number;
  username: string;
  trainer_name: string;
  avatar: string;
  coins: number;
  created_at?: string;
}

export interface MarketListing {
  id: number;
  seller_id: number;
  seller_name: string;
  item_type: 'pokemon' | 'item';
  item_id: string;
  item_name: string;
  item_data: any | null;
  level: number;
  quantity: number;
  price: number;
  status: 'active' | 'sold' | 'cancelled';
  buyer_id?: number | null;
  buyer_name?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface TradeHistoryItem {
  id: number;
  listing_id: number;
  buyer_id: number;
  buyer_name: string;
  seller_id: number;
  seller_name: string;
  item_type: string;
  item_name: string;
  level: number;
  quantity: number;
  price: number;
  transacted_at: string;
}

class BackendClient {
  private currentUser: AuthUser | null = null;
  private token: string | null = null;
  private userKey = 'pokeidle_user_session';

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    try {
      const stored = localStorage.getItem(this.userKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.currentUser = parsed.user;
        this.token = parsed.token;
      }
    } catch (e) {
      console.warn('Failed to restore session:', e);
    }
  }

  public get user(): AuthUser | null {
    return this.currentUser;
  }

  public get isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  public saveSession(user: AuthUser, token: string): void {
    this.currentUser = user;
    this.token = token;
    try {
      localStorage.setItem(this.userKey, JSON.stringify({ user, token }));
    } catch {}
  }

  public logout(): void {
    this.currentUser = null;
    this.token = null;
    localStorage.removeItem(this.userKey);
  }

  // 1. Auth: Login
  public async login(username: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Falha no login.' };
      }
      this.saveSession(data.user, data.token);
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: 'Não foi possível conectar ao servidor SQLite.' };
    }
  }

  // 2. Auth: Register
  public async register(username: string, password: string, trainer_name?: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, trainer_name }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Falha no registro.' };
      }
      this.saveSession(data.user, data.token);
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: 'Erro ao registrar treinador no banco de dados.' };
    }
  }

  // 3. Save: Cloud Save
  public async saveCloud(saveData: any): Promise<boolean> {
    if (!this.currentUser) return false;
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: this.currentUser.id, saveData }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // 4. Save: Cloud Load
  public async loadCloud(): Promise<any | null> {
    if (!this.currentUser) return null;
    try {
      const res = await fetch(`/api/save/${this.currentUser.id}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.saveData;
    } catch {
      return null;
    }
  }

  // 5. Market: Get Listings
  public async getMarketListings(params: { type?: string; query?: string; sortBy?: string } = {}): Promise<MarketListing[]> {
    try {
      const q = new URLSearchParams();
      if (params.type) q.set('type', params.type);
      if (params.query) q.set('query', params.query);
      if (params.sortBy) q.set('sortBy', params.sortBy);

      const res = await fetch(`/api/market/listings?${q.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.listings || [];
    } catch {
      return [];
    }
  }

  // 6. Market: Create Listing
  public async createListing(listingData: {
    seller_id: number;
    seller_name: string;
    item_type: 'pokemon' | 'item';
    item_id: string;
    item_name: string;
    item_data?: any;
    level?: number;
    quantity?: number;
    price: number;
  }): Promise<{ success: boolean; listing?: MarketListing; error?: string }> {
    try {
      const res = await fetch('/api/market/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listingData),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Falha ao anunciar no mercado.' };
      return { success: true, listing: data.listing };
    } catch (err: any) {
      return { success: false, error: 'Falha na conexão com o mercado.' };
    }
  }

  // 7. Market: Buy Listing
  public async buyListing(listingId: number, buyerId: number): Promise<{ success: boolean; listing?: MarketListing; buyerCoins?: number; error?: string }> {
    try {
      const res = await fetch('/api/market/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId, buyer_id: buyerId }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Falha ao comprar anúncio.' };

      if (this.currentUser && data.buyerCoins !== undefined) {
        this.currentUser.coins = data.buyerCoins;
      }
      return { success: true, listing: data.listing, buyerCoins: data.buyerCoins };
    } catch {
      return { success: false, error: 'Falha de comunicação com o servidor.' };
    }
  }

  // 8. Market: Cancel Listing
  public async cancelListing(listingId: number, sellerId: number): Promise<{ success: boolean; returnedItem?: any; error?: string }> {
    try {
      const res = await fetch('/api/market/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId, seller_id: sellerId }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      return { success: true, returnedItem: data.returnedItem };
    } catch {
      return { success: false, error: 'Falha de comunicação.' };
    }
  }

  // 9. Market: My Listings
  public async getMyListings(userId: number): Promise<MarketListing[]> {
    try {
      const res = await fetch(`/api/market/my-listings/${userId}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.listings || [];
    } catch {
      return [];
    }
  }

  // 10. Market: Trade History
  public async getTradeHistory(): Promise<TradeHistoryItem[]> {
    try {
      const res = await fetch('/api/market/history');
      if (!res.ok) return [];
      const data = await res.json();
      return data.history || [];
    } catch {
      return [];
    }
  }
}

export const backendClient = new BackendClient();
