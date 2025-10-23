// wearables.js - Phoenix Wearable Connection Manager
// Handles Fitbit & Polar OAuth, device detection, and real-time syncing

class WearableConnector {
    constructor() {
        this.API = null;
        this.connected = {
            fitbit: false,
            polar: false
        };
        this.authWindow = null;
        this.syncStatus = 'idle';
    }

    async init() {
        console.log('⌚ Initializing Wearable Connector...');
        
        // Wait for API
        await this.waitForAPI();
        
        // Check existing connections
        await this.checkConnections();
        
        // Setup OAuth callback listener
        this.setupOAuthListener();
        
        console.log('✅ Wearable Connector ready');
    }

    async waitForAPI() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (window.API) {
                    clearInterval(checkInterval);
                    this.API = window.API;
                    resolve();
                }
            }, 100);
        });
    }

    // ========================================
    // 🔗 CONNECTION STATUS
    // ========================================

    async checkConnections() {
        try {
            const response = await this.API.getConnectedWearables();
            
            if (response && response.providers) {
                this.connected.fitbit = response.providers.includes('fitbit');
                this.connected.polar = response.providers.includes('polar');
                
                console.log('⌚ Connected devices:', {
                    fitbit: this.connected.fitbit,
                    polar: this.connected.polar
                });
            }
            
            return this.connected;
        } catch (error) {
            console.error('Failed to check connections:', error);
            return this.connected;
        }
    }

    // ========================================
    // 🎨 CONNECTION MODAL
    // ========================================

    openModal() {
        const modal = document.createElement('div');
        modal.id = 'wearable-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(10px);
            animation: fadeIn 0.3s;
        `;

        modal.innerHTML = `
            <div style="
                background: rgba(0, 10, 20, 0.98);
                border: 2px solid rgba(0, 255, 255, 0.5);
                padding: 50px;
                max-width: 700px;
                width: 90%;
                box-shadow: 0 0 60px rgba(0, 255, 255, 0.4);
                animation: slideInUp 0.5s;
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    border-bottom: 1px solid rgba(0, 255, 255, 0.3);
                    padding-bottom: 20px;
                ">
                    <h2 style="
                        color: #00ffff;
                        font-size: 28px;
                        margin: 0;
                        text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
                        letter-spacing: 3px;
                    ">⌚ CONNECT WEARABLE</h2>
                    <button id="close-wearable-modal" style="
                        background: transparent;
                        border: 1px solid rgba(255, 68, 68, 0.5);
                        color: #ff4444;
                        width: 45px;
                        height: 45px;
                        border-radius: 50%;
                        cursor: pointer;
                        font-size: 24px;
                        transition: all 0.3s;
                    ">✕</button>
                </div>

                <p style="
                    color: rgba(0, 255, 255, 0.7);
                    font-size: 14px;
                    margin-bottom: 40px;
                    line-height: 1.6;
                ">
                    Connect your wearable device to unlock real-time health tracking, AI-powered recovery insights, and predictive analytics. Phoenix supports:
                </p>

                <div style="display: grid; gap: 25px; margin-bottom: 30px;">
                    <!-- FITBIT -->
                    <div class="wearable-card" data-provider="fitbit" style="
                        padding: 25px;
                        background: rgba(0, 255, 255, 0.05);
                        border: 2px solid rgba(0, 255, 255, 0.3);
                        cursor: pointer;
                        transition: all 0.3s;
                        position: relative;
                    ">
                        <div style="display: flex; align-items: center; gap: 20px;">
                            <div style="
                                width: 70px;
                                height: 70px;
                                background: rgba(0, 184, 169, 0.1);
                                border: 2px solid rgba(0, 184, 169, 0.5);
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 32px;
                            ">🏃</div>
                            <div style="flex: 1;">
                                <h3 style="
                                    color: #00ffff;
                                    font-size: 20px;
                                    margin: 0 0 10px 0;
                                ">Fitbit</h3>
                                <p style="
                                    color: rgba(0, 255, 255, 0.6);
                                    font-size: 13px;
                                    margin: 0;
                                    line-height: 1.4;
                                ">Heart rate, sleep tracking, activity monitoring, recovery scores</p>
                            </div>
                            <div id="fitbit-status" style="
                                padding: 8px 15px;
                                background: rgba(0, 255, 255, 0.1);
                                border: 1px solid rgba(0, 255, 255, 0.3);
                                border-radius: 4px;
                                font-size: 11px;
                                color: rgba(0, 255, 255, 0.7);
                                letter-spacing: 1px;
                            ">NOT CONNECTED</div>
                        </div>
                    </div>

                    <!-- POLAR -->
                    <div class="wearable-card" data-provider="polar" style="
                        padding: 25px;
                        background: rgba(0, 255, 255, 0.05);
                        border: 2px solid rgba(0, 255, 255, 0.3);
                        cursor: pointer;
                        transition: all 0.3s;
                        position: relative;
                    ">
                        <div style="display: flex; align-items: center; gap: 20px;">
                            <div style="
                                width: 70px;
                                height: 70px;
                                background: rgba(232, 0, 18, 0.1);
                                border: 2px solid rgba(232, 0, 18, 0.5);
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 32px;
                            ">❤️</div>
                            <div style="flex: 1;">
                                <h3 style="
                                    color: #00ffff;
                                    font-size: 20px;
                                    margin: 0 0 10px 0;
                                ">Polar</h3>
                                <p style="
                                    color: rgba(0, 255, 255, 0.6);
                                    font-size: 13px;
                                    margin: 0;
                                    line-height: 1.4;
                                ">Advanced HRV, training load, orthostatic test, sleep plus stages</p>
                            </div>
                            <div id="polar-status" style="
                                padding: 8px 15px;
                                background: rgba(0, 255, 255, 0.1);
                                border: 1px solid rgba(0, 255, 255, 0.3);
                                border-radius: 4px;
                                font-size: 11px;
                                color: rgba(0, 255, 255, 0.7);
                                letter-spacing: 1px;
                            ">NOT CONNECTED</div>
                        </div>
                    </div>
                </div>

                <div id="connection-status" style="
                    padding: 15px;
                    background: rgba(0, 255, 255, 0.05);
                    border: 1px solid rgba(0, 255, 255, 0.2);
                    font-size: 12px;
                    color: rgba(0, 255, 255, 0.6);
                    text-align: center;
                    display: none;
                ">
                    <div id="status-message"></div>
                </div>

                <div style="
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid rgba(0, 255, 255, 0.2);
                    font-size: 11px;
                    color: rgba(0, 255, 255, 0.5);
                    text-align: center;
                ">
                    🔒 Your data is encrypted and never shared. OAuth 2.0 secured.
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup event listeners
        this.setupModalHandlers(modal);

        // Update connection status
        this.updateModalStatus();
    }

    setupModalHandlers(modal) {
        // Close button
        document.getElementById('close-wearable-modal').addEventListener('click', () => {
            modal.remove();
        });

        // Fitbit card
        const fitbitCard = modal.querySelector('[data-provider="fitbit"]');
        fitbitCard.addEventListener('click', () => {
            if (!this.connected.fitbit) {
                this.connectFitbit();
            } else {
                this.disconnectProvider('fitbit');
            }
        });

        fitbitCard.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(0, 255, 255, 0.1)';
            this.style.borderColor = 'rgba(0, 255, 255, 0.6)';
            this.style.transform = 'translateX(5px)';
        });

        fitbitCard.addEventListener('mouseleave', function() {
            this.style.background = 'rgba(0, 255, 255, 0.05)';
            this.style.borderColor = 'rgba(0, 255, 255, 0.3)';
            this.style.transform = 'translateX(0)';
        });

        // Polar card
        const polarCard = modal.querySelector('[data-provider="polar"]');
        polarCard.addEventListener('click', () => {
            if (!this.connected.polar) {
                this.connectPolar();
            } else {
                this.disconnectProvider('polar');
            }
        });

        polarCard.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(0, 255, 255, 0.1)';
            this.style.borderColor = 'rgba(0, 255, 255, 0.6)';
            this.style.transform = 'translateX(5px)';
        });

        polarCard.addEventListener('mouseleave', function() {
            this.style.background = 'rgba(0, 255, 255, 0.05)';
            this.style.borderColor = 'rgba(0, 255, 255, 0.3)';
            this.style.transform = 'translateX(0)';
        });
    }

    updateModalStatus() {
        // Update Fitbit status
        const fitbitStatus = document.getElementById('fitbit-status');
        if (fitbitStatus) {
            if (this.connected.fitbit) {
                fitbitStatus.textContent = '✅ CONNECTED';
                fitbitStatus.style.background = 'rgba(0, 255, 136, 0.1)';
                fitbitStatus.style.borderColor = 'rgba(0, 255, 136, 0.5)';
                fitbitStatus.style.color = 'rgba(0, 255, 136, 0.9)';
            } else {
                fitbitStatus.textContent = 'NOT CONNECTED';
                fitbitStatus.style.background = 'rgba(0, 255, 255, 0.1)';
                fitbitStatus.style.borderColor = 'rgba(0, 255, 255, 0.3)';
                fitbitStatus.style.color = 'rgba(0, 255, 255, 0.7)';
            }
        }

        // Update Polar status
        const polarStatus = document.getElementById('polar-status');
        if (polarStatus) {
            if (this.connected.polar) {
                polarStatus.textContent = '✅ CONNECTED';
                polarStatus.style.background = 'rgba(0, 255, 136, 0.1)';
                polarStatus.style.borderColor = 'rgba(0, 255, 136, 0.5)';
                polarStatus.style.color = 'rgba(0, 255, 136, 0.9)';
            } else {
                polarStatus.textContent = 'NOT CONNECTED';
                polarStatus.style.background = 'rgba(0, 255, 255, 0.1)';
                polarStatus.style.borderColor = 'rgba(0, 255, 255, 0.3)';
                polarStatus.style.color = 'rgba(0, 255, 255, 0.7)';
            }
        }
    }

    showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('connection-status');
        const statusMessage = document.getElementById('status-message');
        
        if (statusDiv && statusMessage) {
            statusDiv.style.display = 'block';
            statusMessage.textContent = message;
            
            if (type === 'success') {
                statusDiv.style.borderColor = 'rgba(0, 255, 136, 0.5)';
                statusDiv.style.background = 'rgba(0, 255, 136, 0.05)';
                statusMessage.style.color = 'rgba(0, 255, 136, 0.9)';
            } else if (type === 'error') {
                statusDiv.style.borderColor = 'rgba(255, 68, 68, 0.5)';
                statusDiv.style.background = 'rgba(255, 68, 68, 0.05)';
                statusMessage.style.color = 'rgba(255, 68, 68, 0.9)';
            } else {
                statusDiv.style.borderColor = 'rgba(0, 255, 255, 0.3)';
                statusDiv.style.background = 'rgba(0, 255, 255, 0.05)';
                statusMessage.style.color = 'rgba(0, 255, 255, 0.7)';
            }
        }
    }

    // ========================================
    // 🔗 FITBIT CONNECTION
    // ========================================

    async connectFitbit() {
        console.log('🏃 Connecting Fitbit...');
        this.showStatus('Connecting to Fitbit...', 'info');

        try {
            // Get OAuth URL from backend
            const response = await this.API.startWearableAuth('fitbit');
            
            if (response.success && response.authUrl) {
                // Open OAuth window
                this.authWindow = window.open(
                    response.authUrl,
                    'Fitbit Authorization',
                    'width=600,height=700,scrollbars=yes'
                );

                // Check if window opened
                if (!this.authWindow) {
                    throw new Error('Pop-up blocked. Please allow pop-ups and try again.');
                }

                this.showStatus('⏳ Waiting for Fitbit authorization...', 'info');
            } else {
                throw new Error(response.message || 'Failed to get authorization URL');
            }
        } catch (error) {
            console.error('Fitbit connection error:', error);
            this.showStatus('❌ ' + error.message, 'error');
        }
    }

    // ========================================
    // 🔗 POLAR CONNECTION
    // ========================================

    async connectPolar() {
        console.log('❤️ Connecting Polar...');
        this.showStatus('Connecting to Polar...', 'info');

        try {
            // Get OAuth URL from backend
            const response = await this.API.startWearableAuth('polar');
            
            if (response.success && response.authUrl) {
                // Open OAuth window
                this.authWindow = window.open(
                    response.authUrl,
                    'Polar Authorization',
                    'width=600,height=700,scrollbars=yes'
                );

                // Check if window opened
                if (!this.authWindow) {
                    throw new Error('Pop-up blocked. Please allow pop-ups and try again.');
                }

                this.showStatus('⏳ Waiting for Polar authorization...', 'info');
            } else {
                throw new Error(response.message || 'Failed to get authorization URL');
            }
        } catch (error) {
            console.error('Polar connection error:', error);
            this.showStatus('❌ ' + error.message, 'error');
        }
    }

    // ========================================
    // 🔓 DISCONNECT
    // ========================================

    async disconnectProvider(provider) {
        const confirmed = confirm(`Disconnect ${provider}?\n\nYour data will no longer sync.`);
        
        if (!confirmed) return;

        try {
            this.showStatus(`Disconnecting ${provider}...`, 'info');

            const response = await this.API.disconnectWearable(provider);

            if (response.success) {
                this.connected[provider] = false;
                this.showStatus(`✅ ${provider} disconnected`, 'success');
                this.updateModalStatus();

                // Notify orchestrator
                if (window.orchestrator) {
                    window.orchestrator.checkWearableConnections();
                }
            } else {
                throw new Error(response.message || 'Disconnect failed');
            }
        } catch (error) {
            console.error('Disconnect error:', error);
            this.showStatus('❌ ' + error.message, 'error');
        }
    }

    // ========================================
    // 🎯 OAUTH CALLBACK LISTENER
    // ========================================

    setupOAuthListener() {
        window.addEventListener('message', (event) => {
            // Security: Check origin
            const allowedOrigins = [
                window.location.origin,
                'https://pal-backend-production.up.railway.app'
            ];
            
            if (!allowedOrigins.includes(event.origin)) {
                return;
            }

            const data = event.data;

            if (data.type === 'wearable-auth-success') {
                console.log('✅ Wearable auth successful:', data.provider);
                
                this.connected[data.provider] = true;
                this.showStatus(`✅ ${data.provider} connected successfully!`, 'success');
                this.updateModalStatus();

                // Close auth window
                if (this.authWindow && !this.authWindow.closed) {
                    this.authWindow.close();
                }

                // Trigger immediate sync
                this.syncProvider(data.provider);

                // Notify orchestrator
                if (window.orchestrator) {
                    window.orchestrator.checkWearableConnections();
                    window.orchestrator.syncAllData();
                }

                // Voice announcement
                if (window.voiceInterface) {
                    window.voiceInterface.speak(
                        `${data.provider} connected successfully. Syncing your health data now.`,
                        'normal'
                    );
                }
            } else if (data.type === 'wearable-auth-error') {
                console.error('❌ Wearable auth failed:', data.error);
                
                this.showStatus(`❌ ${data.provider} connection failed: ${data.error}`, 'error');

                // Close auth window
                if (this.authWindow && !this.authWindow.closed) {
                    this.authWindow.close();
                }
            }
        });

        console.log('👂 OAuth callback listener active');
    }

    // ========================================
    // 🔄 SYNC PROVIDER
    // ========================================

    async syncProvider(provider) {
        try {
            console.log(`🔄 Syncing ${provider}...`);
            this.syncStatus = 'syncing';

            const response = await this.API.syncWearables(provider);

            if (response.success) {
                console.log(`✅ ${provider} synced:`, response.data);
                this.syncStatus = 'complete';

                // Update reactor if available
                if (window.reactorCore) {
                    window.reactorCore.activateBeam(0); // Mercury beam
                }
            } else {
                throw new Error(response.message || 'Sync failed');
            }
        } catch (error) {
            console.error('Sync error:', error);
            this.syncStatus = 'error';
        }
    }

    // ========================================
    // 🧹 CLEANUP
    // ========================================

    destroy() {
        if (this.authWindow && !this.authWindow.closed) {
            this.authWindow.close();
        }
    }
}

// ========================================
// 🚀 INITIALIZE AND EXPOSE GLOBALLY
// ========================================

const wearableConnector = new WearableConnector();
window.wearableConnector = wearableConnector;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => wearableConnector.init());
} else {
    wearableConnector.init();
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideInUp {
        from {
            transform: translateY(50px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

console.log('✅ Wearable Connector loaded');

export default wearableConnector;
