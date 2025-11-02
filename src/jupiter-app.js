/**
 * ============================================================================
 * JUPITER FINANCE - Smart Money Management with Plaid Integration
 * ============================================================================
 *
 * Integrates with Phoenix backend Jupiter endpoints:
 * - /api/jupiter/plaid/link-token - Get Plaid Link token
 * - /api/jupiter/accounts/list - Connected bank accounts
 * - /api/jupiter/transactions/recent - Recent transactions
 * - /api/jupiter/spending/breakdown - Spending by category
 * - /api/jupiter/budget/status - Budget tracking
 * - /api/jupiter/networth/current - Net worth calculation
 */

class JupiterApp {
    constructor() {
        this.apiBaseUrl = window.PhoenixConfig.API_BASE_URL;
        this.refreshInterval = 300000; // Refresh every 5 minutes
        this.categoryColors = {
            'food': '#FF6B6B',
            'shopping': '#FFD93D',
            'transport': '#6BCF7F',
            'entertainment': '#A78BFA',
            'bills': '#60A5FA',
            'health': '#F472B6',
            'other': '#9CA3AF'
        };
    }

    /**
     * Initialize the app
     */
    async init() {
        console.log('💰 Initializing Jupiter Finance...');

        // Get auth token
        this.authToken = localStorage.getItem('authToken');

        if (!this.authToken) {
            this.showLoginRequired();
            return;
        }

        try {
            // Load all dashboard data
            await this.loadDashboardData();

            // Set up auto-refresh
            setInterval(() => this.loadDashboardData(), this.refreshInterval);

            console.log('✅ Jupiter initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Jupiter:', error);
            this.showError(error);
        }
    }

    /**
     * Load all dashboard data
     */
    async loadDashboardData() {
        try {
            // Show loading
            document.getElementById('loading').style.display = 'flex';
            document.getElementById('dashboard').style.display = 'none';
            document.getElementById('emptyState').style.display = 'none';

            // Fetch data in parallel
            const [netWorth, accounts, transactions, spending, budgets] = await Promise.allSettled([
                this.fetchNetWorth(),
                this.fetchAccounts(),
                this.fetchTransactions(),
                this.fetchSpending(),
                this.fetchBudgets()
            ]);

            // Check if we have any data
            const hasData = accounts.status === 'fulfilled' && accounts.value?.length > 0;

            if (!hasData) {
                // Show empty state
                document.getElementById('loading').style.display = 'none';
                document.getElementById('emptyState').style.display = 'block';
                return;
            }

            // Render all data
            if (netWorth.status === 'fulfilled') {
                this.renderNetWorth(netWorth.value);
            }

            if (accounts.status === 'fulfilled') {
                this.renderAccounts(accounts.value);
            }

            if (transactions.status === 'fulfilled') {
                this.renderTransactions(transactions.value);
            }

            if (spending.status === 'fulfilled') {
                this.renderSpending(spending.value);
            }

            if (budgets.status === 'fulfilled') {
                this.renderBudgets(budgets.value);
            }

            // Show dashboard
            document.getElementById('loading').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';

        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showError(error);
        }
    }

    /**
     * Fetch net worth
     */
    async fetchNetWorth() {
        const response = await fetch(`${this.apiBaseUrl}/jupiter/networth/current`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`NetWorth API failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Fetch connected accounts
     */
    async fetchAccounts() {
        const response = await fetch(`${this.apiBaseUrl}/jupiter/accounts/list`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Accounts API failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Fetch recent transactions
     */
    async fetchTransactions() {
        const response = await fetch(`${this.apiBaseUrl}/jupiter/transactions/recent?limit=20`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Transactions API failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Fetch spending breakdown
     */
    async fetchSpending() {
        const response = await fetch(`${this.apiBaseUrl}/jupiter/spending/breakdown?period=month`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Spending API failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Fetch budgets
     */
    async fetchBudgets() {
        const response = await fetch(`${this.apiBaseUrl}/jupiter/budget/status`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Budget API failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Render net worth
     */
    renderNetWorth(data) {
        const netWorth = data.net_worth || data.netWorth || 0;
        const change = data.change || data.monthly_change || 0;
        const income = data.monthly_income || data.income || 0;
        const spent = data.monthly_spending || data.spending || 0;
        const savingsRate = income > 0 ? ((income - spent) / income * 100) : 0;

        // Update net worth display
        document.getElementById('netWorthValue').textContent = this.formatCurrency(netWorth);

        // Update change indicator
        const changeEl = document.getElementById('netWorthChange');
        const isPositive = change >= 0;
        changeEl.className = `networth-change ${isPositive ? 'positive' : 'negative'}`;
        changeEl.querySelector('.networth-change-icon').textContent = isPositive ? '↑' : '↓';
        document.getElementById('netWorthChangeText').textContent =
            `${isPositive ? '+' : ''}${this.formatCurrency(change)} this month`;

        // Update quick stats
        document.getElementById('totalIncome').textContent = this.formatCurrency(income);
        document.getElementById('totalSpent').textContent = this.formatCurrency(spent);
        document.getElementById('savingsRate').textContent = `${Math.round(savingsRate)}%`;
    }

    /**
     * Render connected accounts
     */
    renderAccounts(data) {
        const accounts = data.accounts || data.items || data || [];
        const container = document.getElementById('accountsList');

        // Update count
        document.getElementById('accountsCount').textContent = `${accounts.length} account${accounts.length !== 1 ? 's' : ''}`;

        if (!accounts.length) {
            container.innerHTML = `
                <div class="connect-bank-card" onclick="window.jupiterApp.connectBank()">
                    <div class="connect-bank-icon">🏦</div>
                    <div class="connect-bank-text">Connect Your First Account</div>
                </div>
            `;
            return;
        }

        const html = accounts.map(account => {
            const name = account.name || account.account_name || 'Unknown Account';
            const type = account.type || account.account_type || 'checking';
            const balance = account.balance || account.current_balance || 0;
            const mask = account.mask || account.account_mask || '****';

            const icon = this.getAccountIcon(type);

            return `
                <div class="account-item">
                    <div class="account-info">
                        <div class="account-icon">${icon}</div>
                        <div class="account-details">
                            <h4>${name}</h4>
                            <p>••• ${mask}</p>
                        </div>
                    </div>
                    <div class="account-balance">${this.formatCurrency(balance)}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    /**
     * Render recent transactions
     */
    renderTransactions(data) {
        const transactions = data.transactions || data.items || data || [];
        const container = document.getElementById('transactionsList');

        // Update count
        const thisWeek = transactions.filter(t => {
            const date = new Date(t.date || t.transaction_date);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return date >= weekAgo;
        }).length;

        document.getElementById('transactionCount').textContent = `${thisWeek} this week`;

        if (!transactions.length) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.4);">
                    No transactions yet
                </div>
            `;
            return;
        }

        const html = transactions.slice(0, 10).map(txn => {
            const name = txn.name || txn.merchant_name || 'Unknown Transaction';
            const amount = txn.amount || 0;
            const category = txn.category || txn.primary_category || 'other';
            const date = txn.date ? new Date(txn.date).toLocaleDateString() : 'Unknown date';
            const isIncome = amount < 0; // Plaid returns negative for income

            const icon = this.getCategoryIcon(category);
            const amountClass = isIncome ? 'income' : 'expense';
            const formattedAmount = isIncome ? `+${this.formatCurrency(Math.abs(amount))}` : `-${this.formatCurrency(amount)}`;

            return `
                <div class="transaction-item">
                    <div class="transaction-icon">${icon}</div>
                    <div class="transaction-details">
                        <div class="transaction-name">${name}</div>
                        <div class="transaction-meta">${category} • ${date}</div>
                    </div>
                    <div class="transaction-amount ${amountClass}">${formattedAmount}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    /**
     * Render spending breakdown
     */
    renderSpending(data) {
        const categories = data.categories || data.breakdown || data || [];
        const container = document.getElementById('spendingChart');

        if (!categories.length) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.4);">
                    No spending data yet
                </div>
            `;
            return;
        }

        // Calculate total and update header
        const total = categories.reduce((sum, cat) => sum + (cat.amount || 0), 0);
        document.getElementById('spendingTotal').textContent = `${this.formatCurrency(total)} total`;

        // Render category bars
        const html = categories.map(cat => {
            const name = cat.category || cat.name || 'Other';
            const amount = cat.amount || 0;
            const percentage = total > 0 ? (amount / total * 100) : 0;
            const color = this.categoryColors[name.toLowerCase()] || this.categoryColors.other;

            return `
                <div class="spending-category">
                    <div class="category-color" style="background: ${color};"></div>
                    <div style="flex: 1;">
                        <div class="category-info">
                            <span class="category-name">${name}</span>
                            <span class="category-amount">${this.formatCurrency(amount)}</span>
                        </div>
                        <div class="category-bar">
                            <div class="category-bar-fill" style="width: ${percentage}%; background: ${color};"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    /**
     * Render budgets
     */
    renderBudgets(data) {
        const budgets = data.budgets || data.items || data || [];
        const container = document.getElementById('budgetList');

        if (!budgets.length) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.4);">
                    No budgets set. Create one to track spending.
                </div>
            `;
            document.getElementById('budgetStatus').textContent = 'Not set';
            return;
        }

        // Calculate overall status
        const overBudget = budgets.filter(b => {
            const spent = b.spent || b.current_spending || 0;
            const limit = b.limit || b.budget_limit || 0;
            return spent > limit;
        }).length;

        document.getElementById('budgetStatus').textContent =
            overBudget > 0 ? `${overBudget} over budget` : 'On track';

        // Calculate total remaining
        const totalRemaining = budgets.reduce((sum, b) => {
            const spent = b.spent || 0;
            const limit = b.limit || 0;
            return sum + Math.max(0, limit - spent);
        }, 0);
        document.getElementById('budgetRemaining').textContent = this.formatCurrency(totalRemaining);

        const html = budgets.map(budget => {
            const category = budget.category || budget.name || 'Uncategorized';
            const spent = budget.spent || budget.current_spending || 0;
            const limit = budget.limit || budget.budget_limit || 1;
            const remaining = limit - spent;
            const percentage = Math.min(100, (spent / limit) * 100);
            const isOver = spent > limit;

            return `
                <div class="budget-item">
                    <div class="budget-header">
                        <div class="budget-category">${category}</div>
                        <div class="budget-amounts">${this.formatCurrency(spent)} / ${this.formatCurrency(limit)}</div>
                    </div>
                    <div class="budget-bar">
                        <div class="budget-bar-fill ${isOver ? 'over-budget' : ''}" style="width: ${percentage}%"></div>
                    </div>
                    <div class="budget-remaining ${remaining >= 0 ? 'positive' : 'negative'}">
                        ${remaining >= 0 ? `${this.formatCurrency(remaining)} remaining` : `${this.formatCurrency(Math.abs(remaining))} over`}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    /**
     * Connect bank account via Plaid
     */
    async connectBank() {
        try {
            console.log('Connecting bank via Plaid...');

            // Get Plaid Link token
            const response = await fetch(`${this.apiBaseUrl}/jupiter/plaid/link-token`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get Plaid Link token');
            }

            const data = await response.json();
            const linkToken = data.link_token || data.linkToken;

            if (!linkToken) {
                throw new Error('No link token received');
            }

            // Open Plaid Link (requires Plaid SDK to be loaded)
            if (window.Plaid) {
                const handler = window.Plaid.create({
                    token: linkToken,
                    onSuccess: (public_token, metadata) => {
                        this.exchangePlaidToken(public_token, metadata);
                    },
                    onExit: (err, metadata) => {
                        if (err) {
                            console.error('Plaid Link error:', err);
                        }
                    }
                });
                handler.open();
            } else {
                // Fallback if Plaid SDK not loaded
                alert('🏦 Plaid integration coming soon! For now, this is a demo.');
                console.log('Plaid Link token received:', linkToken);
            }

        } catch (error) {
            console.error('Bank connection error:', error);
            alert('Bank connection coming soon! Backend integration pending.');
        }
    }

    /**
     * Exchange Plaid public token for access token
     */
    async exchangePlaidToken(publicToken, metadata) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/jupiter/plaid/exchange-token`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    public_token: publicToken,
                    metadata: metadata
                })
            });

            if (response.ok) {
                alert('✅ Bank connected successfully!');
                await this.loadDashboardData(); // Refresh
            } else {
                throw new Error('Token exchange failed');
            }
        } catch (error) {
            console.error('Token exchange error:', error);
            alert('Failed to connect bank. Please try again.');
        }
    }

    /**
     * Add manual transaction
     */
    addTransaction() {
        alert('Manual transaction entry coming soon!');
        // TODO: Implement transaction entry modal
    }

    /**
     * Set budget
     */
    setBudget() {
        alert('Budget creation coming soon!');
        // TODO: Implement budget creation modal
    }

    /**
     * View AI insights
     */
    viewInsights() {
        alert('AI financial insights coming soon!');
        // TODO: Implement insights modal
    }

    /**
     * Helper: Format currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Helper: Get account icon
     */
    getAccountIcon(type) {
        const icons = {
            'checking': '💳',
            'savings': '💰',
            'credit': '💳',
            'investment': '📈',
            'loan': '🏠'
        };
        return icons[type.toLowerCase()] || '🏦';
    }

    /**
     * Helper: Get category icon
     */
    getCategoryIcon(category) {
        const icons = {
            'food': '🍔',
            'shopping': '🛍️',
            'transport': '🚗',
            'entertainment': '🎬',
            'bills': '📱',
            'health': '⚕️',
            'travel': '✈️',
            'income': '💵',
            'other': '📝'
        };
        return icons[category.toLowerCase()] || '📝';
    }

    /**
     * Show login required message
     */
    showLoginRequired() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('dashboard').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔒</div>
                <div class="empty-state-text">Please log in to view your finances</div>
                <button class="connect-button" onclick="window.location.href='index.html'">
                    Go to Login
                </button>
            </div>
        `;
        document.getElementById('dashboard').style.display = 'block';
    }

    /**
     * Show error message
     */
    showError(error) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('dashboard').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-text">Error loading financial data: ${error.message}</div>
                <button class="connect-button" onclick="window.location.reload()">
                    Retry
                </button>
            </div>
        `;
        document.getElementById('dashboard').style.display = 'block';
    }
}

// Initialize app when page loads
window.jupiterApp = new JupiterApp();
document.addEventListener('DOMContentLoaded', () => {
    window.jupiterApp.init();
});
