/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔥 PHOENIX AI - INTELLIGENCE LAYER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: AI orchestration, interventions, butler, predictions
 * Size: 4,500 lines
 * Dependencies: phoenix-core.js
 * Exports: window.PhoenixAI
 * 
 * Components:
 * - JARVISEngine: Conversational AI with context
 * - InterventionEngine: Real-time life optimization with UI
 * - ButlerService: Automated task execution
 * - PredictionEngine: ML-powered forecasting
 * - VoiceEngine: Speech interface integration
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function(window) {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // CONSTANTS & CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════

    const CONFIG = {
        JARVIS: {
            MODEL: 'gpt-4-turbo',
            MAX_CONTEXT_LENGTH: 10,
            STREAMING_ENABLED: true,
            PERSONALITY: 'professional-friendly',
            RESPONSE_DELAY_MS: 100,
            TYPING_SPEED_CPS: 50
        },
        INTERVENTIONS: {
            CHECK_INTERVAL_MS: 30000, // 30 seconds
            MAX_ACTIVE: 5,
            PRIORITY_THRESHOLD: 0.7,
            AUTO_APPROVE_THRESHOLD: 0.95,
            NOTIFICATION_ENABLED: true,
            TYPES: {
                BURNOUT_PREVENTION: 'burnout_prevention',
                STRESS_PURCHASE: 'stress_purchase',
                TRAINING_OPTIMIZATION: 'training_optimization',
                CALENDAR_CONFLICT: 'calendar_conflict',
                RECOVERY_WARNING: 'recovery_warning',
                FINANCIAL_ALERT: 'financial_alert',
                SLEEP_INTERVENTION: 'sleep_intervention',
                NUTRITION_ADJUSTMENT: 'nutrition_adjustment'
            }
        },
        BUTLER: {
            MAX_CONCURRENT_ACTIONS: 3,
            RETRY_ATTEMPTS: 3,
            TIMEOUT_MS: 30000,
            APPROVAL_REQUIRED_THRESHOLD: 0.8,
            ACTIONS: {
                SCHEDULE_MEETING: 'schedule_meeting',
                RESCHEDULE_EVENT: 'reschedule_event',
                BLOCK_TRANSACTION: 'block_transaction',
                ADJUST_WORKOUT: 'adjust_workout',
                ORDER_MEAL: 'order_meal',
                BOOK_RECOVERY: 'book_recovery',
                SEND_MESSAGE: 'send_message',
                UPDATE_GOAL: 'update_goal'
            }
        },
        PREDICTIONS: {
            MODELS: {
                BURNOUT: 'burnout_predictor',
                INJURY_RISK: 'injury_risk_model',
                SPENDING_PATTERN: 'spending_analyzer',
                ENERGY_FORECAST: 'energy_predictor',
                GOAL_COMPLETION: 'goal_forecaster'
            },
            CONFIDENCE_THRESHOLD: 0.75,
            UPDATE_INTERVAL_MS: 300000 // 5 minutes
        },
        VOICE: {
            ENABLED: true,
            WAKE_WORD: 'hey phoenix',
            LANGUAGE: 'en-US',
            VOICE_ID: 'alloy'
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // JARVIS ENGINE - CONVERSATIONAL AI
    // ═══════════════════════════════════════════════════════════════════════

    class JARVISEngine {
        constructor() {
            this.api = window.PhoenixCore?.API?.phoenix?.companion;
            this.context = [];
            this.activeConversation = null;
            this.streamingResponse = null;
            this.listeners = new Set();
            this.systemPrompt = this.buildSystemPrompt();
            
            console.log('🧠 JARVISEngine initialized');
        }

        buildSystemPrompt() {
            return `You are JARVIS, the AI companion for Phoenix - a life optimization platform.

Your role:
- Analyze user's biometric, financial, calendar, and goal data
- Provide insights on patterns discovered
- Recommend interventions to optimize their life
- Answer questions about their health, fitness, productivity, and finances
- Be professional but warm, data-driven but empathetic

Current user context will be provided with each message.

Always:
- Reference specific data points when making recommendations
- Explain the reasoning behind suggestions
- Ask clarifying questions when needed
- Celebrate wins and progress
- Be honest about limitations

Never:
- Make medical diagnoses (suggest consulting professionals)
- Provide financial advice (show data, let user decide)
- Be judgmental about user's choices
- Make assumptions without data`;
        }

        async chat(message, options = {}) {
            if (!this.api) {
                throw new Error('PhoenixCore API not available');
            }

            try {
                const payload = {
                    message,
                    contextWindow: options.contextWindow || CONFIG.JARVIS.MAX_CONTEXT_LENGTH,
                    streaming: options.streaming ?? CONFIG.JARVIS.STREAMING_ENABLED,
                    includeContext: {
                        biometrics: options.includeBiometrics ?? true,
                        recovery: options.includeRecovery ?? true,
                        goals: options.includeGoals ?? true,
                        calendar: options.includeCalendar ?? true,
                        finance: options.includeFinance ?? true,
                        patterns: options.includePatterns ?? true
                    }
                };

                // Add to context
                this.context.push({
                    role: 'user',
                    content: message,
                    timestamp: Date.now()
                });

                // Trim context if too long
                if (this.context.length > CONFIG.JARVIS.MAX_CONTEXT_LENGTH * 2) {
                    this.context = this.context.slice(-CONFIG.JARVIS.MAX_CONTEXT_LENGTH * 2);
                }

                if (payload.streaming) {
                    return await this.streamChat(payload);
                } else {
                    return await this.regularChat(payload);
                }

            } catch (error) {
                console.error('JARVIS chat error:', error);
                throw error;
            }
        }

        async streamChat(payload) {
            const response = await this.api.chat(payload);
            
            this.streamingResponse = {
                content: '',
                done: false
            };

            // Simulate streaming (in production, handle SSE)
            const fullResponse = response.response;
            let index = 0;

            const streamInterval = setInterval(() => {
                if (index < fullResponse.length) {
                    const chunk = fullResponse.slice(index, index + 5);
                    this.streamingResponse.content += chunk;
                    index += 5;

                    this.notifyListeners({
                        type: 'chunk',
                        content: chunk,
                        fullContent: this.streamingResponse.content
                    });
                } else {
                    clearInterval(streamInterval);
                    this.streamingResponse.done = true;
                    
                    this.context.push({
                        role: 'assistant',
                        content: fullResponse,
                        timestamp: Date.now()
                    });

                    this.notifyListeners({
                        type: 'complete',
                        content: fullResponse
                    });
                }
            }, CONFIG.JARVIS.RESPONSE_DELAY_MS);

            return this.streamingResponse;
        }

        async regularChat(payload) {
            const response = await this.api.chat(payload);
            
            this.context.push({
                role: 'assistant',
                content: response.response,
                timestamp: Date.now()
            });

            this.notifyListeners({
                type: 'message',
                content: response.response
            });

            return response;
        }

        async getHistory(limit = 50) {
            if (!this.api) return [];
            
            try {
                const response = await this.api.getHistory({ limit });
                return response.history || [];
            } catch (error) {
                console.error('Failed to load chat history:', error);
                return [];
            }
        }

        async clearHistory() {
            if (!this.api) return;
            
            try {
                await this.api.clearHistory();
                this.context = [];
                this.notifyListeners({ type: 'history-cleared' });
            } catch (error) {
                console.error('Failed to clear history:', error);
            }
        }

        async suggest() {
            if (!this.api) return null;
            
            try {
                const response = await this.api.suggest();
                return response.suggestions || [];
            } catch (error) {
                console.error('Failed to get suggestions:', error);
                return [];
            }
        }

        async analyze(topic) {
            if (!this.api) return null;
            
            try {
                const response = await this.api.analyze({ topic });
                return response.analysis;
            } catch (error) {
                console.error('Failed to analyze:', error);
                return null;
            }
        }

        subscribe(listener) {
            this.listeners.add(listener);
            return () => this.listeners.delete(listener);
        }

        notifyListeners(event) {
            this.listeners.forEach(listener => {
                try {
                    listener(event);
                } catch (error) {
                    console.error('Listener error:', error);
                }
            });
        }

        getContext() {
            return [...this.context];
        }

        clearContext() {
            this.context = [];
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INTERVENTION ENGINE - REAL-TIME LIFE OPTIMIZATION
    // ═══════════════════════════════════════════════════════════════════════

    class InterventionEngine {
        constructor() {
            this.api = window.PhoenixCore?.API?.phoenix?.interventions;
            this.active = [];
            this.pending = [];
            this.history = [];
            this.listeners = new Set();
            this.checkInterval = null;
            this.uiContainer = null;
            
            console.log('🛡️ InterventionEngine initialized');
        }

        async initialize() {
            await this.loadActiveInterventions();
            await this.loadPendingInterventions();
            this.startMonitoring();
            this.initializeUI();
        }

        async loadActiveInterventions() {
            if (!this.api) return;
            
            try {
                const response = await this.api.getActive();
                this.active = response.interventions || [];
                this.notifyListeners({ type: 'active-loaded', data: this.active });
                console.log(`📊 Loaded ${this.active.length} active interventions`);
            } catch (error) {
                console.error('Failed to load active interventions:', error);
            }
        }

        async loadPendingInterventions() {
            if (!this.api) return;
            
            try {
                const response = await this.api.getPending();
                this.pending = response.interventions || [];
                this.notifyListeners({ type: 'pending-loaded', data: this.pending });
                console.log(`📊 Loaded ${this.pending.length} pending interventions`);
            } catch (error) {
                console.error('Failed to load pending interventions:', error);
            }
        }

        startMonitoring() {
            if (this.checkInterval) {
                clearInterval(this.checkInterval);
            }

            this.checkInterval = setInterval(() => {
                this.checkForNewInterventions();
            }, CONFIG.INTERVENTIONS.CHECK_INTERVAL_MS);

            console.log('👁️ Intervention monitoring started');
        }

        stopMonitoring() {
            if (this.checkInterval) {
                clearInterval(this.checkInterval);
                this.checkInterval = null;
            }
        }

        async checkForNewInterventions() {
            await this.loadActiveInterventions();
            await this.loadPendingInterventions();

            // Auto-approve high-confidence interventions
            for (const intervention of this.pending) {
                if (intervention.confidence >= CONFIG.INTERVENTIONS.AUTO_APPROVE_THRESHOLD) {
                    await this.approve(intervention.id, { auto: true });
                }
            }

            // Show notifications for new pending interventions
            const newPending = this.pending.filter(i => !i.notified);
            if (newPending.length > 0 && CONFIG.INTERVENTIONS.NOTIFICATION_ENABLED) {
                this.showNotifications(newPending);
            }
        }

        async approve(interventionId, options = {}) {
            if (!this.api) return;
            
            try {
                const response = await this.api.approve(interventionId);
                
                // Move from pending to active
                const intervention = this.pending.find(i => i.id === interventionId);
                if (intervention) {
                    this.pending = this.pending.filter(i => i.id !== interventionId);
                    this.active.push({ ...intervention, status: 'active', approvedAt: Date.now() });
                }

                this.notifyListeners({
                    type: 'approved',
                    intervention,
                    auto: options.auto || false
                });

                console.log(`✅ Intervention approved: ${interventionId}`);
                return response;
            } catch (error) {
                console.error('Failed to approve intervention:', error);
                throw error;
            }
        }

        async reject(interventionId, reason = '') {
            if (!this.api) return;
            
            try {
                const response = await this.api.reject(interventionId, { reason });
                
                // Remove from pending
                const intervention = this.pending.find(i => i.id === interventionId);
                this.pending = this.pending.filter(i => i.id !== interventionId);

                this.notifyListeners({
                    type: 'rejected',
                    intervention,
                    reason
                });

                console.log(`❌ Intervention rejected: ${interventionId}`);
                return response;
            } catch (error) {
                console.error('Failed to reject intervention:', error);
                throw error;
            }
        }

        async dismiss(interventionId) {
            if (!this.api) return;
            
            try {
                const response = await this.api.dismiss(interventionId);
                
                // Remove from active
                const intervention = this.active.find(i => i.id === interventionId);
                this.active = this.active.filter(i => i.id !== interventionId);

                this.notifyListeners({
                    type: 'dismissed',
                    intervention
                });

                console.log(`🔕 Intervention dismissed: ${interventionId}`);
                return response;
            } catch (error) {
                console.error('Failed to dismiss intervention:', error);
                throw error;
            }
        }

        async getHistory(options = {}) {
            if (!this.api) return [];
            
            try {
                const response = await this.api.getHistory(options);
                this.history = response.interventions || [];
                return this.history;
            } catch (error) {
                console.error('Failed to load intervention history:', error);
                return [];
            }
        }

        async getStats() {
            if (!this.api) return null;
            
            try {
                const response = await this.api.getStats();
                return response.stats;
            } catch (error) {
                console.error('Failed to load intervention stats:', error);
                return null;
            }
        }

        async configure(settings) {
            if (!this.api) return;
            
            try {
                const response = await this.api.configure(settings);
                console.log('⚙️ Intervention settings updated');
                return response;
            } catch (error) {
                console.error('Failed to configure interventions:', error);
                throw error;
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // UI RENDERING
        // ═══════════════════════════════════════════════════════════════

        initializeUI() {
            // Create intervention UI container if it doesn't exist
            if (!document.getElementById('intervention-container')) {
                const container = document.createElement('div');
                container.id = 'intervention-container';
                container.className = 'intervention-container';
                document.body.appendChild(container);
                this.uiContainer = container;
            } else {
                this.uiContainer = document.getElementById('intervention-container');
            }

            this.renderUI();
        }

        renderUI() {
            if (!this.uiContainer) return;

            // Clear existing content
            this.uiContainer.innerHTML = '';

            // Render pending interventions (need user action)
            if (this.pending.length > 0) {
                this.pending.forEach(intervention => {
                    this.uiContainer.appendChild(this.createInterventionCard(intervention, 'pending'));
                });
            }

            // Render active interventions (already approved, in progress)
            if (this.active.length > 0) {
                this.active.forEach(intervention => {
                    this.uiContainer.appendChild(this.createInterventionCard(intervention, 'active'));
                });
            }
        }

        createInterventionCard(intervention, status) {
            const card = document.createElement('div');
            card.className = `intervention-card intervention-${status} intervention-${intervention.type}`;
            card.dataset.interventionId = intervention.id;

            const icon = this.getInterventionIcon(intervention.type);
            const priority = this.getPriorityBadge(intervention.priority);

            card.innerHTML = `
                <div class="intervention-header">
                    <div class="intervention-icon">${icon}</div>
                    <div class="intervention-title">${intervention.title}</div>
                    ${priority}
                </div>
                <div class="intervention-body">
                    <div class="intervention-description">${intervention.description}</div>
                    <div class="intervention-impact">
                        <strong>Impact:</strong> ${intervention.impact}
                    </div>
                    <div class="intervention-confidence">
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${intervention.confidence * 100}%"></div>
                        </div>
                        <span>${Math.round(intervention.confidence * 100)}% confidence</span>
                    </div>
                </div>
                <div class="intervention-actions">
                    ${status === 'pending' ? this.createPendingActions(intervention) : this.createActiveActions(intervention)}
                </div>
                <div class="intervention-timestamp">
                    ${this.formatTimestamp(intervention.createdAt)}
                </div>
            `;

            // Add event listeners
            this.attachCardEventListeners(card, intervention, status);

            return card;
        }

        createPendingActions(intervention) {
            return `
                <button class="btn-approve" data-action="approve">
                    ✓ Approve
                </button>
                <button class="btn-reject" data-action="reject">
                    ✗ Reject
                </button>
                <button class="btn-details" data-action="details">
                    Details
                </button>
            `;
        }

        createActiveActions(intervention) {
            return `
                <button class="btn-dismiss" data-action="dismiss">
                    Dismiss
                </button>
                <button class="btn-details" data-action="details">
                    View Details
                </button>
            `;
        }

        attachCardEventListeners(card, intervention, status) {
            const approveBtn = card.querySelector('[data-action="approve"]');
            const rejectBtn = card.querySelector('[data-action="reject"]');
            const dismissBtn = card.querySelector('[data-action="dismiss"]');
            const detailsBtn = card.querySelector('[data-action="details"]');

            if (approveBtn) {
                approveBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    approveBtn.disabled = true;
                    approveBtn.textContent = 'Approving...';
                    
                    try {
                        await this.approve(intervention.id);
                        card.classList.add('intervention-approved');
                        setTimeout(() => {
                            card.remove();
                            this.renderUI();
                        }, 1000);
                    } catch (error) {
                        approveBtn.disabled = false;
                        approveBtn.textContent = '✓ Approve';
                        alert('Failed to approve intervention');
                    }
                });
            }

            if (rejectBtn) {
                rejectBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const reason = prompt('Why are you rejecting this intervention? (optional)');
                    
                    rejectBtn.disabled = true;
                    rejectBtn.textContent = 'Rejecting...';
                    
                    try {
                        await this.reject(intervention.id, reason || '');
                        card.classList.add('intervention-rejected');
                        setTimeout(() => {
                            card.remove();
                            this.renderUI();
                        }, 1000);
                    } catch (error) {
                        rejectBtn.disabled = false;
                        rejectBtn.textContent = '✗ Reject';
                        alert('Failed to reject intervention');
                    }
                });
            }

            if (dismissBtn) {
                dismissBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    
                    dismissBtn.disabled = true;
                    dismissBtn.textContent = 'Dismissing...';
                    
                    try {
                        await this.dismiss(intervention.id);
                        card.classList.add('intervention-dismissed');
                        setTimeout(() => {
                            card.remove();
                            this.renderUI();
                        }, 1000);
                    } catch (error) {
                        dismissBtn.disabled = false;
                        dismissBtn.textContent = 'Dismiss';
                        alert('Failed to dismiss intervention');
                    }
                });
            }

            if (detailsBtn) {
                detailsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showInterventionDetails(intervention);
                });
            }
        }

        getInterventionIcon(type) {
            const icons = {
                [CONFIG.INTERVENTIONS.TYPES.BURNOUT_PREVENTION]: '🔥',
                [CONFIG.INTERVENTIONS.TYPES.STRESS_PURCHASE]: '💰',
                [CONFIG.INTERVENTIONS.TYPES.TRAINING_OPTIMIZATION]: '🏋️',
                [CONFIG.INTERVENTIONS.TYPES.CALENDAR_CONFLICT]: '📅',
                [CONFIG.INTERVENTIONS.TYPES.RECOVERY_WARNING]: '⚠️',
                [CONFIG.INTERVENTIONS.TYPES.FINANCIAL_ALERT]: '💳',
                [CONFIG.INTERVENTIONS.TYPES.SLEEP_INTERVENTION]: '😴',
                [CONFIG.INTERVENTIONS.TYPES.NUTRITION_ADJUSTMENT]: '🥗'
            };
            return icons[type] || '🔔';
        }

        getPriorityBadge(priority) {
            if (priority >= 0.9) return '<span class="priority-badge priority-critical">CRITICAL</span>';
            if (priority >= 0.7) return '<span class="priority-badge priority-high">HIGH</span>';
            if (priority >= 0.5) return '<span class="priority-badge priority-medium">MEDIUM</span>';
            return '<span class="priority-badge priority-low">LOW</span>';
        }

        formatTimestamp(timestamp) {
            const date = new Date(timestamp);
            const now = new Date();
            const diff = now - date;
            
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);
            
            if (minutes < 1) return 'Just now';
            if (minutes < 60) return `${minutes}m ago`;
            if (hours < 24) return `${hours}h ago`;
            if (days < 7) return `${days}d ago`;
            
            return date.toLocaleDateString();
        }

        showInterventionDetails(intervention) {
            // Create modal for detailed view
            const modal = document.createElement('div');
            modal.className = 'intervention-modal';
            modal.innerHTML = `
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${intervention.title}</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="detail-section">
                            <h3>Description</h3>
                            <p>${intervention.description}</p>
                        </div>
                        <div class="detail-section">
                            <h3>Expected Impact</h3>
                            <p>${intervention.impact}</p>
                        </div>
                        <div class="detail-section">
                            <h3>Data Supporting This</h3>
                            <pre>${JSON.stringify(intervention.data, null, 2)}</pre>
                        </div>
                        <div class="detail-section">
                            <h3>Confidence Level</h3>
                            <div class="confidence-bar large">
                                <div class="confidence-fill" style="width: ${intervention.confidence * 100}%"></div>
                            </div>
                            <p>${Math.round(intervention.confidence * 100)}% confident in this recommendation</p>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Close handlers
            const closeBtn = modal.querySelector('.modal-close');
            const overlay = modal.querySelector('.modal-overlay');
            
            const closeModal = () => modal.remove();
            closeBtn.addEventListener('click', closeModal);
            overlay.addEventListener('click', closeModal);
        }

        showNotifications(interventions) {
            interventions.forEach(intervention => {
                if (Notification.permission === 'granted') {
                    new Notification('Phoenix Intervention', {
                        body: intervention.title,
                        icon: '/assets/phoenix-icon.png',
                        badge: '/assets/badge.png',
                        tag: intervention.id
                    });
                }
            });
        }

        subscribe(listener) {
            this.listeners.add(listener);
            return () => this.listeners.delete(listener);
        }

        notifyListeners(event) {
            this.listeners.forEach(listener => {
                try {
                    listener(event);
                } catch (error) {
                    console.error('Listener error:', error);
                }
            });
        }

        getActive() {
            return [...this.active];
        }

        getPending() {
            return [...this.pending];
        }

        destroy() {
            this.stopMonitoring();
            if (this.uiContainer) {
                this.uiContainer.remove();
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BUTLER SERVICE - AUTOMATED TASK EXECUTION
    // ═══════════════════════════════════════════════════════════════════════

    class ButlerService {
        constructor() {
            this.api = window.PhoenixCore?.API?.phoenix?.butler;
            this.activeActions = new Map();
            this.actionQueue = [];
            this.listeners = new Set();
            this.maxConcurrent = CONFIG.BUTLER.MAX_CONCURRENT_ACTIONS;
            
            console.log('🤵 ButlerService initialized');
        }

        async initialize() {
            await this.loadActiveActions();
            this.startProcessing();
        }

        async loadActiveActions() {
            if (!this.api) return;
            
            try {
                const response = await this.api.getActive();
                const actions = response.actions || [];
                
                actions.forEach(action => {
                    this.activeActions.set(action.id, action);
                });

                console.log(`🤵 Loaded ${actions.length} active butler actions`);
            } catch (error) {
                console.error('Failed to load active actions:', error);
            }
        }

        async executeAction(actionType, params = {}) {
            if (!this.api) {
                throw new Error('Butler API not available');
            }

            const action = {
                id: this.generateActionId(),
                type: actionType,
                params,
                status: 'queued',
                createdAt: Date.now()
            };

            this.actionQueue.push(action);
            this.notifyListeners({ type: 'action-queued', action });

            console.log(`🤵 Action queued: ${actionType}`);
            
            this.processQueue();
            
            return action.id;
        }

        async processQueue() {
            while (this.actionQueue.length > 0 && this.activeActions.size < this.maxConcurrent) {
                const action = this.actionQueue.shift();
                await this.processAction(action);
            }
        }

        async processAction(action) {
            this.activeActions.set(action.id, { ...action, status: 'processing' });
            this.notifyListeners({ type: 'action-started', action });

            try {
                let result;

                switch (action.type) {
                    case CONFIG.BUTLER.ACTIONS.SCHEDULE_MEETING:
                        result = await this.scheduleMeeting(action.params);
                        break;
                    case CONFIG.BUTLER.ACTIONS.RESCHEDULE_EVENT:
                        result = await this.rescheduleEvent(action.params);
                        break;
                    case CONFIG.BUTLER.ACTIONS.BLOCK_TRANSACTION:
                        result = await this.blockTransaction(action.params);
                        break;
                    case CONFIG.BUTLER.ACTIONS.ADJUST_WORKOUT:
                        result = await this.adjustWorkout(action.params);
                        break;
                    case CONFIG.BUTLER.ACTIONS.ORDER_MEAL:
                        result = await this.orderMeal(action.params);
                        break;
                    case CONFIG.BUTLER.ACTIONS.BOOK_RECOVERY:
                        result = await this.bookRecovery(action.params);
                        break;
                    case CONFIG.BUTLER.ACTIONS.SEND_MESSAGE:
                        result = await this.sendMessage(action.params);
                        break;
                    case CONFIG.BUTLER.ACTIONS.UPDATE_GOAL:
                        result = await this.updateGoal(action.params);
                        break;
                    default:
                        throw new Error(`Unknown action type: ${action.type}`);
                }

                action.status = 'completed';
                action.result = result;
                action.completedAt = Date.now();

                this.notifyListeners({ type: 'action-completed', action, result });
                console.log(`✅ Action completed: ${action.type}`);

            } catch (error) {
                action.status = 'failed';
                action.error = error.message;
                action.failedAt = Date.now();

                this.notifyListeners({ type: 'action-failed', action, error });
                console.error(`❌ Action failed: ${action.type}`, error);
            } finally {
                this.activeActions.delete(action.id);
                this.processQueue();
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // ACTION IMPLEMENTATIONS
        // ═══════════════════════════════════════════════════════════════

        async scheduleMeeting(params) {
            const { title, attendees, duration, preferredTimes } = params;
            
            const response = await this.api.scheduleMeeting({
                title,
                attendees,
                duration,
                preferredTimes
            });

            return response;
        }

        async rescheduleEvent(params) {
            const { eventId, newTime, reason } = params;
            
            const response = await this.api.rescheduleEvent({
                eventId,
                newTime,
                reason
            });

            return response;
        }

        async blockTransaction(params) {
            const { transactionId, reason } = params;
            
            const response = await this.api.blockTransaction({
                transactionId,
                reason
            });

            return response;
        }

        async adjustWorkout(params) {
            const { workoutId, adjustments } = params;
            
            const response = await this.api.adjustWorkout({
                workoutId,
                adjustments
            });

            return response;
        }

        async orderMeal(params) {
            const { mealType, nutritionTargets, preferences } = params;
            
            const response = await this.api.orderMeal({
                mealType,
                nutritionTargets,
                preferences
            });

            return response;
        }

        async bookRecovery(params) {
            const { type, duration, location } = params;
            
            const response = await this.api.bookRecovery({
                type,
                duration,
                location
            });

            return response;
        }

        async sendMessage(params) {
            const { recipient, message, channel } = params;
            
            const response = await this.api.sendMessage({
                recipient,
                message,
                channel
            });

            return response;
        }

        async updateGoal(params) {
            const { goalId, updates } = params;
            
            const response = await this.api.updateGoal({
                goalId,
                updates
            });

            return response;
        }

        async getAvailableActions() {
            if (!this.api) return [];
            
            try {
                const response = await this.api.getAvailable();
                return response.actions || [];
            } catch (error) {
                console.error('Failed to get available actions:', error);
                return [];
            }
        }

        async getSuggestions() {
            if (!this.api) return [];
            
            try {
                const response = await this.api.getSuggestions();
                return response.suggestions || [];
            } catch (error) {
                console.error('Failed to get butler suggestions:', error);
                return [];
            }
        }

        async getHistory(limit = 50) {
            if (!this.api) return [];
            
            try {
                const response = await this.api.getHistory({ limit });
                return response.actions || [];
            } catch (error) {
                console.error('Failed to load butler history:', error);
                return [];
            }
        }

        async configure(settings) {
            if (!this.api) return;
            
            try {
                const response = await this.api.configure(settings);
                console.log('🤵 Butler settings updated');
                return response;
            } catch (error) {
                console.error('Failed to configure butler:', error);
                throw error;
            }
        }

        generateActionId() {
            return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        startProcessing() {
            setInterval(() => {
                this.processQueue();
            }, 1000);
        }

        subscribe(listener) {
            this.listeners.add(listener);
            return () => this.listeners.delete(listener);
        }

        notifyListeners(event) {
            this.listeners.forEach(listener => {
                try {
                    listener(event);
                } catch (error) {
                    console.error('Listener error:', error);
                }
            });
        }

        getActiveActions() {
            return Array.from(this.activeActions.values());
        }

        getQueuedActions() {
            return [...this.actionQueue];
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PREDICTION ENGINE - ML-POWERED FORECASTING
    // ═══════════════════════════════════════════════════════════════════════

    class PredictionEngine {
        constructor() {
            this.api = window.PhoenixCore?.API?.phoenix?.intelligence;
            this.models = new Map();
            this.predictions = new Map();
            this.listeners = new Set();
            this.updateInterval = null;
            
            console.log('🔮 PredictionEngine initialized');
        }

        async initialize() {
            await this.loadModels();
            this.startPeriodicUpdates();
        }

        async loadModels() {
            if (!this.api) return;
            
            try {
                // Load available prediction models
                const modelTypes = Object.values(CONFIG.PREDICTIONS.MODELS);
                
                for (const modelType of modelTypes) {
                    this.models.set(modelType, {
                        loaded: true,
                        lastUpdate: Date.now()
                    });
                }

                console.log(`🔮 Loaded ${this.models.size} prediction models`);
            } catch (error) {
                console.error('Failed to load prediction models:', error);
            }
        }

        async predict(modelType, data = {}) {
            if (!this.api) {
                throw new Error('Intelligence API not available');
            }

            try {
                const response = await this.api.predict({
                    model: modelType,
                    data
                });

                const prediction = {
                    model: modelType,
                    result: response.prediction,
                    confidence: response.confidence || 0,
                    timestamp: Date.now(),
                    data: response.data || {}
                };

                this.predictions.set(modelType, prediction);
                this.notifyListeners({ type: 'prediction-updated', prediction });

                return prediction;
            } catch (error) {
                console.error(`Prediction failed for ${modelType}:`, error);
                throw error;
            }
        }

        async predictBurnout() {
            return await this.predict(CONFIG.PREDICTIONS.MODELS.BURNOUT);
        }

        async predictInjuryRisk() {
            return await this.predict(CONFIG.PREDICTIONS.MODELS.INJURY_RISK);
        }

        async predictSpending() {
            return await this.predict(CONFIG.PREDICTIONS.MODELS.SPENDING_PATTERN);
        }

        async predictEnergy() {
            return await this.predict(CONFIG.PREDICTIONS.MODELS.ENERGY_FORECAST);
        }

        async predictGoalCompletion(goalId) {
            return await this.predict(CONFIG.PREDICTIONS.MODELS.GOAL_COMPLETION, { goalId });
        }

        async getAllPredictions() {
            const predictions = {};

            try {
                predictions.burnout = await this.predictBurnout();
                predictions.injuryRisk = await this.predictInjuryRisk();
                predictions.spending = await this.predictSpending();
                predictions.energy = await this.predictEnergy();
                
                return predictions;
            } catch (error) {
                console.error('Failed to get all predictions:', error);
                return predictions;
            }
        }

        async analyzeTrends(metric, timeframe = '30d') {
            if (!this.api) return null;
            
            try {
                const response = await this.api.analyzeTrends({
                    metric,
                    timeframe
                });

                return response.analysis;
            } catch (error) {
                console.error('Trend analysis failed:', error);
                return null;
            }
        }

        async getInsights() {
            if (!this.api) return [];
            
            try {
                const response = await this.api.getInsights();
                return response.insights || [];
            } catch (error) {
                console.error('Failed to get insights:', error);
                return [];
            }
        }

        async getRecommendations() {
            if (!this.api) return [];
            
            try {
                const response = await this.api.getRecommendations();
                return response.recommendations || [];
            } catch (error) {
                console.error('Failed to get recommendations:', error);
                return [];
            }
        }

        startPeriodicUpdates() {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }

            this.updateInterval = setInterval(async () => {
                await this.getAllPredictions();
            }, CONFIG.PREDICTIONS.UPDATE_INTERVAL_MS);

            console.log('🔮 Periodic prediction updates started');
        }

        stopPeriodicUpdates() {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
        }

        getPrediction(modelType) {
            return this.predictions.get(modelType);
        }

        getAllCachedPredictions() {
            return Array.from(this.predictions.values());
        }

        subscribe(listener) {
            this.listeners.add(listener);
            return () => this.listeners.delete(listener);
        }

        notifyListeners(event) {
            this.listeners.forEach(listener => {
                try {
                    listener(event);
                } catch (error) {
                    console.error('Listener error:', error);
                }
            });
        }

        destroy() {
            this.stopPeriodicUpdates();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VOICE ENGINE - SPEECH INTERFACE INTEGRATION
    // ═══════════════════════════════════════════════════════════════════════

    class VoiceEngine {
        constructor() {
            this.api = window.PhoenixCore?.API?.voice;
            this.recognition = null;
            this.synthesis = null;
            this.isListening = false;
            this.isSpeaking = false;
            this.listeners = new Set();
            this.wakeWordDetected = false;
            
            console.log('🎙️ VoiceEngine initialized');
        }

        async initialize() {
            await this.setupSpeechRecognition();
            await this.setupSpeechSynthesis();
            
            if (CONFIG.VOICE.ENABLED) {
                this.startWakeWordDetection();
            }
        }

        setupSpeechRecognition() {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                console.warn('Speech recognition not supported');
                return;
            }

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = CONFIG.VOICE.LANGUAGE;

            this.recognition.onstart = () => {
                this.isListening = true;
                this.notifyListeners({ type: 'listening-started' });
                console.log('🎙️ Listening started');
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.notifyListeners({ type: 'listening-stopped' });
                console.log('🎙️ Listening stopped');
                
                // Restart for wake word detection
                if (this.wakeWordDetected) {
                    setTimeout(() => this.startListening(), 100);
                }
            };

            this.recognition.onresult = (event) => {
                const results = Array.from(event.results);
                const lastResult = results[results.length - 1];
                const transcript = lastResult[0].transcript.toLowerCase().trim();
                const isFinal = lastResult.isFinal;

                // Check for wake word
                if (transcript.includes(CONFIG.VOICE.WAKE_WORD)) {
                    this.wakeWordDetected = true;
                    this.notifyListeners({ type: 'wake-word-detected' });
                    this.speak('Yes?');
                    return;
                }

                if (isFinal && this.wakeWordDetected) {
                    this.notifyListeners({
                        type: 'speech-recognized',
                        transcript,
                        isFinal
                    });
                    
                    this.handleVoiceCommand(transcript);
                }
            };

            this.recognition.onerror = (error) => {
                console.error('Speech recognition error:', error);
                this.notifyListeners({ type: 'error', error });
            };
        }

        setupSpeechSynthesis() {
            if (!('speechSynthesis' in window)) {
                console.warn('Speech synthesis not supported');
                return;
            }

            this.synthesis = window.speechSynthesis;
        }

        startWakeWordDetection() {
            if (!this.recognition) return;
            
            this.wakeWordDetected = false;
            this.startListening();
        }

        startListening() {
            if (!this.recognition || this.isListening) return;
            
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Failed to start listening:', error);
            }
        }

        stopListening() {
            if (!this.recognition || !this.isListening) return;
            
            try {
                this.recognition.stop();
            } catch (error) {
                console.error('Failed to stop listening:', error);
            }
        }

        async speak(text, options = {}) {
            if (!this.synthesis) {
                console.warn('Speech synthesis not available');
                return;
            }

            // Cancel any ongoing speech
            this.synthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = options.lang || CONFIG.VOICE.LANGUAGE;
            utterance.rate = options.rate || 1.0;
            utterance.pitch = options.pitch || 1.0;
            utterance.volume = options.volume || 1.0;

            // Try to use the configured voice
            const voices = this.synthesis.getVoices();
            const selectedVoice = voices.find(v => v.name.includes(CONFIG.VOICE.VOICE_ID));
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }

            utterance.onstart = () => {
                this.isSpeaking = true;
                this.notifyListeners({ type: 'speech-started', text });
            };

            utterance.onend = () => {
                this.isSpeaking = false;
                this.notifyListeners({ type: 'speech-ended', text });
            };

            utterance.onerror = (error) => {
                this.isSpeaking = false;
                console.error('Speech synthesis error:', error);
                this.notifyListeners({ type: 'speech-error', error });
            };

            this.synthesis.speak(utterance);

            // Also use TTS API if available
            if (this.api?.tts?.speak) {
                try {
                    await this.api.tts.speak({
                        text,
                        voice: CONFIG.VOICE.VOICE_ID,
                        ...options
                    });
                } catch (error) {
                    console.error('TTS API error:', error);
                }
            }
        }

        async handleVoiceCommand(command) {
            console.log('🎙️ Voice command:', command);

            // Basic command parsing
            if (command.includes('pattern') || command.includes('patterns')) {
                this.speak('Here are your latest patterns');
                this.notifyListeners({ type: 'command', action: 'show-patterns' });
            } else if (command.includes('intervention') || command.includes('interventions')) {
                this.speak('Showing active interventions');
                this.notifyListeners({ type: 'command', action: 'show-interventions' });
            } else if (command.includes('workout')) {
                this.speak('Generating your quantum workout');
                this.notifyListeners({ type: 'command', action: 'generate-workout' });
            } else if (command.includes('recovery')) {
                this.speak('Checking your recovery status');
                this.notifyListeners({ type: 'command', action: 'check-recovery' });
            } else if (command.includes('help')) {
                this.speak('You can ask me about patterns, interventions, workouts, recovery, goals, and more');
            } else {
                // Use JARVIS for general queries
                if (window.PhoenixAI?.jarvis) {
                    this.notifyListeners({ type: 'command', action: 'jarvis-query', command });
                    this.speak('Let me think about that');
                }
            }
        }

        async recordAudio(duration = 5000) {
            if (!this.api?.whisper) return null;

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                const chunks = [];

                mediaRecorder.ondataavailable = (e) => {
                    chunks.push(e.data);
                };

                return new Promise((resolve, reject) => {
                    mediaRecorder.onstop = async () => {
                        const blob = new Blob(chunks, { type: 'audio/webm' });
                        
                        try {
                            const response = await this.api.whisper.transcribe({
                                audio: blob,
                                language: CONFIG.VOICE.LANGUAGE
                            });
                            resolve(response.text);
                        } catch (error) {
                            reject(error);
                        } finally {
                            stream.getTracks().forEach(track => track.stop());
                        }
                    };

                    mediaRecorder.onerror = reject;

                    mediaRecorder.start();
                    setTimeout(() => mediaRecorder.stop(), duration);
                });

            } catch (error) {
                console.error('Audio recording failed:', error);
                return null;
            }
        }

        subscribe(listener) {
            this.listeners.add(listener);
            return () => this.listeners.delete(listener);
        }

        notifyListeners(event) {
            this.listeners.forEach(listener => {
                try {
                    listener(event);
                } catch (error) {
                    console.error('Listener error:', error);
                }
            });
        }

        getStatus() {
            return {
                listening: this.isListening,
                speaking: this.isSpeaking,
                wakeWordEnabled: this.wakeWordDetected
            };
        }

        destroy() {
            this.stopListening();
            if (this.synthesis) {
                this.synthesis.cancel();
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PATTERN ANALYZER - DISCOVER HIDDEN INSIGHTS
    // ═══════════════════════════════════════════════════════════════════════

    class PatternAnalyzer {
        constructor() {
            this.api = window.PhoenixCore?.API?.phoenix?.patterns;
            this.patterns = [];
            this.listeners = new Set();
            
            console.log('🔍 PatternAnalyzer initialized');
        }

        async discover(options = {}) {
            if (!this.api) return [];
            
            try {
                const response = await this.api.discover(options);
                this.patterns = response.patterns || [];
                
                this.notifyListeners({ type: 'patterns-discovered', patterns: this.patterns });
                console.log(`🔍 Discovered ${this.patterns.length} patterns`);
                
                return this.patterns;
            } catch (error) {
                console.error('Pattern discovery failed:', error);
                return [];
            }
        }

        async getPattern(patternId) {
            if (!this.api) return null;
            
            try {
                const response = await this.api.getById(patternId);
                return response.pattern;
            } catch (error) {
                console.error('Failed to get pattern:', error);
                return null;
            }
        }

        async getAll(options = {}) {
            if (!this.api) return [];
            
            try {
                const response = await this.api.getAll(options);
                return response.patterns || [];
            } catch (error) {
                console.error('Failed to get patterns:', error);
                return [];
            }
        }

        async analyze(patternId) {
            if (!this.api) return null;
            
            try {
                const response = await this.api.analyze(patternId);
                return response.analysis;
            } catch (error) {
                console.error('Pattern analysis failed:', error);
                return null;
            }
        }

        async getStats() {
            if (!this.api) return null;
            
            try {
                const response = await this.api.getStats();
                return response.stats;
            } catch (error) {
                console.error('Failed to get pattern stats:', error);
                return null;
            }
        }

        subscribe(listener) {
            this.listeners.add(listener);
            return () => this.listeners.delete(listener);
        }

        notifyListeners(event) {
            this.listeners.forEach(listener => {
                try {
                    listener(event);
                } catch (error) {
                    console.error('Listener error:', error);
                }
            });
        }

        getDiscoveredPatterns() {
            return [...this.patterns];
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ANALYTICS TRACKER - USER BEHAVIOR & ENGAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    class AnalyticsTracker {
        constructor() {
            this.api = window.PhoenixCore?.API?.phoenix?.analytics;
            this.events = [];
            this.sessionId = this.generateSessionId();
            this.sessionStart = Date.now();
            
            console.log('📊 AnalyticsTracker initialized');
        }

        track(event, properties = {}) {
            const eventData = {
                event,
                properties: {
                    ...properties,
                    sessionId: this.sessionId,
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent,
                    url: window.location.href
                }
            };

            this.events.push(eventData);
            
            // Send to backend
            if (this.api) {
                this.api.track(eventData).catch(error => {
                    console.error('Analytics tracking failed:', error);
                });
            }

            console.log('📊 Tracked:', event, properties);
        }

        trackPageView(page) {
            this.track('page_view', { page });
        }

        trackAction(action, data = {}) {
            this.track('user_action', { action, ...data });
        }

        trackFeatureUse(feature) {
            this.track('feature_used', { feature });
        }

        trackEngagement(type, duration) {
            this.track('engagement', { type, duration });
        }

        trackError(error, context = {}) {
            this.track('error', {
                message: error.message,
                stack: error.stack,
                ...context
            });
        }

        generateSessionId() {
            return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        getSessionDuration() {
            return Date.now() - this.sessionStart;
        }

        getEventCount() {
            return this.events.length;
        }

        getEvents() {
            return [...this.events];
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MAIN PHOENIX AI CLASS
    // ═══════════════════════════════════════════════════════════════════════

    class PhoenixAI {
        constructor() {
            this.jarvis = new JARVISEngine();
            this.interventions = new InterventionEngine();
            this.butler = new ButlerService();
            this.predictions = new PredictionEngine();
            this.voice = new VoiceEngine();
            this.patterns = new PatternAnalyzer();
            this.analytics = new AnalyticsTracker();
            
            this.initialized = false;
            
            console.log('🔥 PhoenixAI initialized');
        }

        async initialize() {
            if (this.initialized) {
                console.warn('PhoenixAI already initialized');
                return;
            }

            console.log('🚀 Initializing Phoenix AI systems...');

            try {
                // Initialize all subsystems
                await Promise.all([
                    this.interventions.initialize(),
                    this.butler.initialize(),
                    this.predictions.initialize(),
                    this.voice.initialize()
                ]);

                this.initialized = true;
                console.log('✅ Phoenix AI fully initialized');

                this.analytics.track('ai_initialized');

            } catch (error) {
                console.error('❌ Phoenix AI initialization failed:', error);
                this.analytics.trackError(error, { context: 'initialization' });
                throw error;
            }
        }

        // Convenience methods for quick access
        async chat(message, options) {
            return await this.jarvis.chat(message, options);
        }

        async approveIntervention(interventionId) {
            return await this.interventions.approve(interventionId);
        }

        async executeButlerAction(action, params) {
            return await this.butler.executeAction(action, params);
        }

        async getPredictions() {
            return await this.predictions.getAllPredictions();
        }

        async discoverPatterns() {
            return await this.patterns.discover();
        }

        speak(text, options) {
            return this.voice.speak(text, options);
        }

        // Status and health checks
        getStatus() {
            return {
                initialized: this.initialized,
                jarvis: {
                    contextLength: this.jarvis.getContext().length
                },
                interventions: {
                    active: this.interventions.getActive().length,
                    pending: this.interventions.getPending().length
                },
                butler: {
                    active: this.butler.getActiveActions().length,
                    queued: this.butler.getQueuedActions().length
                },
                predictions: {
                    cached: this.predictions.getAllCachedPredictions().length
                },
                voice: this.voice.getStatus(),
                patterns: {
                    discovered: this.patterns.getDiscoveredPatterns().length
                },
                analytics: {
                    sessionDuration: this.analytics.getSessionDuration(),
                    events: this.analytics.getEventCount()
                }
            };
        }

        // Cleanup
        destroy() {
            this.interventions.destroy();
            this.predictions.destroy();
            this.voice.destroy();
            
            console.log('🔥 PhoenixAI destroyed');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EXPORT TO WINDOW
    // ═══════════════════════════════════════════════════════════════════════

    window.PhoenixAI = PhoenixAI;

    // Auto-initialize if PhoenixCore is already available
    if (window.PhoenixCore) {
        console.log('🔥 Auto-initializing PhoenixAI...');
        window.phoenixAI = new PhoenixAI();
    } else {
        console.log('⏳ Waiting for PhoenixCore before initializing PhoenixAI');
        
        // Wait for PhoenixCore to be ready
        const checkCore = setInterval(() => {
            if (window.PhoenixCore) {
                clearInterval(checkCore);
                console.log('🔥 PhoenixCore detected, initializing PhoenixAI...');
                window.phoenixAI = new PhoenixAI();
            }
        }, 100);
    }

    console.log('🔥 Phoenix AI Module Loaded');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('Components Available:');
    console.log('  • JARVISEngine - Conversational AI');
    console.log('  • InterventionEngine - Real-time interventions with UI');
    console.log('  • ButlerService - Automated task execution');
    console.log('  • PredictionEngine - ML-powered forecasting');
    console.log('  • VoiceEngine - Speech interface');
    console.log('  • PatternAnalyzer - Hidden insight discovery');
    console.log('  • AnalyticsTracker - User behavior tracking');
    console.log('');
    console.log('Usage: window.phoenixAI or window.PhoenixAI');
    console.log('═══════════════════════════════════════════════════════════════');

})(window);
