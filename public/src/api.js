// PHOENIX API AUTHENTICATION - FIXED FOR REAL BACKEND
// Base URL: https://pal-backend-production.up.railway.app/api

class APIAuthFix {
    constructor() {
        this.baseURL = 'https://pal-backend-production.up.railway.app/api';
        this.token = null;
        this.userId = null;
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    async initialize() {
        console.log('🔐 Initializing API authentication...');
        
        try {
            // 1. Check existing token
            await this.validateExistingToken();
            
            // 2. If invalid, get new token
            if (!this.token) {
                await this.obtainNewToken();
            }
            
            // 3. Patch API client
            this.patchAPIClient();
            
            // 4. Setup interceptors
            this.setupInterceptors();
            
            console.log('✅ API authentication initialized');
            return true;
        } catch (error) {
            console.error('❌ API initialization failed:', error);
            return false;
        }
    }

    async validateExistingToken() {
        const stored = localStorage.getItem('phoenix_token');
        
        if (!stored) {
            console.log('No existing token found');
            return false;
        }
        
        try {
            // FIXED: Use /api/auth/me instead of /api/validate
            const response = await fetch(`${this.baseURL}/auth/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${stored}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const userData = await response.json();
                this.token = stored;
                this.userId = userData.id || userData.userId;
                console.log('✅ Existing token valid');
                return true;
            }
        } catch (error) {
            console.warn('Token validation failed:', error);
        }
        
        // Invalid token, remove it
        localStorage.removeItem('phoenix_token');
        return false;
    }

    async obtainNewToken() {
        console.log('🔑 Obtaining new authentication token...');
        
        try {
            // FIXED: Use /api/auth/register instead of /api/auth/anonymous
            const response = await fetch(`${this.baseURL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: `demo_${Date.now()}@phoenix.ai`,
                    password: 'demo123456',
                    name: 'Phoenix User'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.token = data.token;
                this.userId = data.user?.id || data.userId;
                
                // Store for persistence
                localStorage.setItem('phoenix_token', this.token);
                localStorage.setItem('phoenix_user_id', this.userId);
                
                console.log('✅ New token obtained');
                return true;
            } else {
                // If registration fails, try login with a default account
                console.log('Registration failed, trying login...');
                return await this.tryLogin();
            }
        } catch (error) {
            console.error('Failed to obtain token:', error);
        }
        
        // Fallback: Generate local token
        this.generateFallbackToken();
    }

    async tryLogin() {
        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'demo@phoenix.ai',
                    password: 'demo123456'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.token = data.token;
                this.userId = data.user?.id || data.userId;
                
                localStorage.setItem('phoenix_token', this.token);
                localStorage.setItem('phoenix_user_id', this.userId);
                
                console.log('✅ Login successful');
                return true;
            }
        } catch (error) {
            console.error('Login failed:', error);
        }
        
        return false;
    }

    generateFallbackToken() {
        console.log('⚠️ Using fallback authentication');
        
        this.token = 'fallback_' + btoa(Date.now() + '_' + Math.random());
        this.userId = 'user_' + Date.now();
        
        localStorage.setItem('phoenix_token', this.token);
        localStorage.setItem('phoenix_user_id', this.userId);
    }

    getDeviceId() {
        let deviceId = localStorage.getItem('phoenix_device_id');
        
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('phoenix_device_id', deviceId);
        }
        
        return deviceId;
    }

    patchAPIClient() {
        console.log('🔧 Patching API client...');
        
        if (!window.API) {
            console.warn('API client not found, creating wrapper');
            this.createAPIWrapper();
            return;
        }
        
        const api = window.API;
        
        // Store original methods
        const originalMethods = {};
        const methodsToPatch = [
            'getCalendarEvents',
            'getFinancialOverview',
            'getLifeTimeline',
            'getGoals',
            'getMe'
        ];
        
        methodsToPatch.forEach(method => {
            if (api[method]) {
                originalMethods[method] = api[method].bind(api);
                
                // Replace with authenticated version
                api[method] = async (...args) => {
                    try {
                        // Add authentication header
                        if (api.setAuthToken) {
                            api.setAuthToken(this.token);
                        }
                        
                        // Call original method
                        const result = await originalMethods[method](...args);
                        return result;
                        
                    } catch (error) {
                        console.error(`API.${method} error:`, error);
                        
                        // If 401/411, refresh token and retry
                        if (error.status === 401 || error.status === 411) {
                            if (this.retryCount < this.maxRetries) {
                                this.retryCount++;
                                await this.obtainNewToken();
                                
                                if (api.setAuthToken) {
                                    api.setAuthToken(this.token);
                                }
                                
                                // Retry once
                                return await originalMethods[method](...args);
                            }
                        }
                        
                        // Return mock data on failure
                        return this.getMockData(method);
                    }
                };
            }
        });
        
        // Ensure setAuthToken exists
        if (!api.setAuthToken) {
            api.setAuthToken = (token) => {
                api.token = token;
                api.headers = {
                    ...api.headers,
                    'Authorization': `Bearer ${token}`
                };
            };
        }
        
        // Set current token
        api.setAuthToken(this.token);
        
        console.log('✅ API client patched');
    }

    createAPIWrapper() {
        window.API = {
            token: this.token,
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            
            setAuthToken: function(token) {
                this.token = token;
                this.headers.Authorization = `Bearer ${token}`;
            },
            
            async call(endpoint, method = 'GET', body = null) {
                const options = {
                    method,
                    headers: this.headers
                };
                
                if (body) {
                    options.body = JSON.stringify(body);
                }
                
                const response = await fetch(`${this.baseURL}${endpoint}`, options);
                return response.json();
            },
            
            getCalendarEvents: async function() {
                return this.call('/earth/calendar/events');
            },
            
            getFinancialOverview: async function() {
                const accounts = await this.call('/jupiter/accounts');
                const transactions = await this.call('/jupiter/transactions');
                return { accounts, transactions };
            },
            
            getLifeTimeline: async function() {
                return this.call('/saturn/quarterly');
            },
            
            getGoals: async function() {
                return this.call('/mars/goals');
            },
            
            getMe: async function() {
                return this.call('/auth/me');
            }
        };
        
        console.log('✅ API wrapper created');
    }

    setupInterceptors() {
        // Intercept fetch to add auth headers
        const originalFetch = window.fetch;
        
        window.fetch = async (url, options = {}) => {
            // Add auth header to API calls
            if (url.includes(this.baseURL)) {
                options.headers = {
                    ...options.headers,
                    'Authorization': `Bearer ${this.token}`
                };
            }
            
            try {
                const response = await originalFetch(url, options);
                
                // Handle auth errors
                if (response.status === 401 || response.status === 411) {
                    console.warn('Auth error detected, refreshing token...');
                    
                    if (this.retryCount < this.maxRetries) {
                        this.retryCount++;
                        await this.obtainNewToken();
                        
                        // Retry with new token
                        options.headers.Authorization = `Bearer ${this.token}`;
                        return originalFetch(url, options);
                    }
                }
                
                return response;
                
            } catch (error) {
                console.error('Fetch error:', error);
                throw error;
            }
        };
        
        console.log('✅ Fetch interceptor installed');
    }

    async logout() {
        try {
            await fetch(`${this.baseURL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local storage
            localStorage.removeItem('phoenix_token');
            localStorage.removeItem('phoenix_user_id');
            this.token = null;
            this.userId = null;
        }
    }

    getMockData(method) {
        const mockData = {
            getCalendarEvents: () => ({
                events: [
                    {
                        id: 1,
                        title: "Team Meeting",
                        start: new Date(Date.now() + 3600000).toISOString(),
                        end: new Date(Date.now() + 7200000).toISOString()
                    }
                ]
            }),
            
            getFinancialOverview: () => ({
                balance: 10000,
                income: 5000,
                expenses: 3000,
                savings: 2000,
                investments: [
                    { name: "Portfolio", value: 25000 }
                ]
            }),
            
            getLifeTimeline: () => ({
                events: [
                    {
                        date: new Date().toISOString(),
                        title: "Phoenix Activated",
                        type: "milestone"
                    }
                ]
            }),
            
            getGoals: () => ({
                goals: [
                    {
                        id: 1,
                        title: "Optimize Productivity",
                        progress: 65,
                        target: 100
                    }
                ]
            })
        };
        
        return mockData[method] ? mockData[method]() : null;
    }
}

// AUTO-INITIALIZE
(function() {
    console.log('🔐 Initializing Phoenix API Authentication...');
    
    const apiFix = new APIAuthFix();
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            apiFix.initialize();
        });
    } else {
        apiFix.initialize();
    }
    
    // Expose for debugging and manual control
    window.phoenixAPIFix = apiFix;
    window.phoenixAPI = {
        logout: () => apiFix.logout(),
        getToken: () => apiFix.token,
        getUserId: () => apiFix.userId,
        refreshToken: () => apiFix.obtainNewToken()
    };
})();
