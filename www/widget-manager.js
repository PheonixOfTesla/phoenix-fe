/* ============================================
   PHOENIX WIDGET MANAGER - CONSCIOUS
   Dynamic widget system for dashboard
   Priority-based layout, organic animations, consciousness integration

   FEATURES:
   - Priority-based positioning (most important = most prominent)
   - CSS classes instead of inline styles (faster rendering)
   - Parallel widget creation (instant display)
   - Widget pooling (reuse instead of destroy/create)
   - Organic animations (breathe, flow, pulse)
   - Consciousness integration (orchestration-driven)
   ============================================ */

class WidgetManager {
    constructor() {
        this.activeWidgets = new Map();
        this.widgetPool = new Map(); // Pooled widgets for reuse
        this.widgetActions = new Map(); // Store widget actions for custom widgets
        this.widgetContainer = null;
        this.currentOrchestration = null;
        this.init();
    }

    init() {
        // Create widget container if it doesn't exist
        this.createWidgetContainer();
        console.log('Widget Manager initialized (optimized)');
    }

    /* ============================================
       CREATE WIDGET CONTAINER
       ============================================ */
    createWidgetContainer() {
        // Check if container already exists
        let container = document.getElementById('phoenix-widget-container');

        if (!container) {
            container = document.createElement('div');
            container.id = 'phoenix-widget-container';
            document.body.appendChild(container);
        }

        this.widgetContainer = container;
    }

    /* ============================================
       DISPLAY WIDGETS FROM ORCHESTRATION (CONSCIOUS)
       ============================================ */
    async displayFromOrchestration(orchestration) {
        if (!orchestration || !orchestration.layout) return;

        console.log('[WidgetManager] Displaying from orchestration:', orchestration);

        this.currentOrchestration = orchestration;

        // Hide widgets marked for hiding
        if (orchestration.layout.hidden) {
            orchestration.layout.hidden.forEach(widgetId => {
                this.removeWidget(widgetId);
            });
        }

        // Display widgets with priorities
        if (orchestration.layout.widgets) {
            const widgetPromises = orchestration.layout.widgets.map(widgetConfig =>
                this.createWidgetWithPriority(widgetConfig)
            );

            await Promise.all(widgetPromises);
        }

        // Apply dimming to low-priority widgets
        if (orchestration.layout.dimmed) {
            orchestration.layout.dimmed.forEach(widgetId => {
                const widget = this.activeWidgets.get(widgetId);
                if (widget) {
                    widget.style.opacity = '0.5';
                }
            });
        }

        console.log('[WidgetManager] Orchestration complete');
    }

    /* ============================================
       CREATE WIDGET WITH PRIORITY (CONSCIOUS)
       ============================================ */
    async createWidgetWithPriority(widgetConfig) {
        const { id, position, size, urgency, priority } = widgetConfig;

        // Try to get widget from pool first
        let widget = this.getFromPool(id);

        if (!widget) {
            // Create new widget if none in pool
            widget = document.createElement('div');
            widget.id = `widget-${id}`;
            widget.className = 'phoenix-widget';
            widget.dataset.widgetType = id;
        }

        // Update widget content with close button
        const content = this.renderWidgetContent(id, widgetConfig.data || {});
        widget.innerHTML = `
            <button class="widget-close-btn" onclick="window.widgetManager.removeWidget('${id}')" aria-label="Close widget">×</button>
            ${content}
        `;

        // Apply priority-based classes
        widget.dataset.priority = priority;
        widget.dataset.urgency = urgency;
        widget.classList.add(`widget-${size}`);
        widget.classList.add(`widget-${position}`);
        widget.classList.add(`urgency-${urgency}`);

        // Add widget to container if not already there
        if (!widget.parentElement) {
            this.widgetContainer.appendChild(widget);
        }

        // Store in active widgets
        this.activeWidgets.set(id, widget);

        // Bind actions for custom widgets
        this.bindWidgetActions(id, widget);

        // Use organic motion for entrance
        if (window.organicMotion) {
            window.organicMotion.enterWidget(widget, priority === 0 ? 'high' : priority < 3 ? 'medium' : 'low');

            // Apply urgency indicator
            if (urgency) {
                window.organicMotion.indicateUrgency(widget, urgency);
            }

            // Start breathing animation
            window.organicMotion.breathe(widget, { type: 'glow', intensity: 0.5 });
        } else {
            // Fallback: Animate in using requestAnimationFrame
            requestAnimationFrame(() => {
                widget.classList.add('show');
                widget.classList.remove('hide', 'pooled');
            });
        }

        // Log interaction with consciousness client
        if (window.consciousnessClient) {
            window.consciousnessClient.logInteraction(id, 'viewed', {
                displayedWidgets: Array.from(this.activeWidgets.keys()),
                layoutType: this.currentOrchestration?.layout?.layoutType
            });
        }
    }

    /* ============================================
       DISPLAY WIDGETS (PARALLEL) - Legacy support
       ============================================ */
    async displayWidgets(widgetIds, widgetData = {}) {
        console.log('Displaying widgets (parallel):', widgetIds);

        // OPTIMIZATION: Create all widgets in parallel
        const widgetPromises = widgetIds.map(widgetId =>
            this.createWidget(widgetId, widgetData[widgetId])
        );

        await Promise.all(widgetPromises);
    }

    /* ============================================
       CREATE WIDGET (WITH POOLING)
       ============================================ */
    async createWidget(widgetId, data) {
        // Try to get widget from pool first
        let widget = this.getFromPool(widgetId);

        if (!widget) {
            // Create new widget if none in pool
            widget = document.createElement('div');
            widget.id = `widget-${widgetId}`;
            widget.className = 'phoenix-widget';
            widget.dataset.widgetType = widgetId;
        }

        // Update widget content with close button
        const content = this.renderWidgetContent(widgetId, data);
        widget.innerHTML = `
            <button class="widget-close-btn" onclick="window.widgetManager.removeWidget('${widgetId}')" aria-label="Close widget">×</button>
            ${content}
        `;

        // Add widget to container if not already there
        if (!widget.parentElement) {
            this.widgetContainer.appendChild(widget);
        }

        // Store in active widgets
        this.activeWidgets.set(widgetId, widget);

        // Animate in using requestAnimationFrame for smooth animation
        requestAnimationFrame(() => {
            widget.classList.add('show');
            widget.classList.remove('hide', 'pooled');
        });
    }

    /* ============================================
       WIDGET POOL MANAGEMENT
       ============================================ */
    getFromPool(widgetId) {
        // Check if we have a pooled widget of this type
        const pooled = this.widgetPool.get(widgetId);
        if (pooled) {
            this.widgetPool.delete(widgetId);
            return pooled;
        }
        return null;
    }

    returnToPool(widgetId, widget) {
        // Store widget in pool for reuse
        widget.classList.add('pooled');
        widget.classList.remove('show', 'hide');
        this.widgetPool.set(widgetId, widget);
    }

    /* ============================================
       CUSTOM WIDGET ACTIONS
       ============================================ */
    storeWidgetActions(widgetId, actions) {
        this.widgetActions.set(widgetId, actions);
        console.log(`[WidgetManager] Stored actions for ${widgetId}:`, actions);
    }

    bindWidgetActions(widgetId, widgetElement) {
        const actions = this.widgetActions.get(widgetId);
        if (!actions) return; // No custom actions to bind

        // Find all buttons with data-action attribute
        const actionButtons = widgetElement.querySelectorAll('[data-action]');

        actionButtons.forEach(button => {
            const actionName = button.getAttribute('data-action');
            const endpoint = actions[actionName];

            if (!endpoint) {
                console.warn(`[WidgetManager] No endpoint found for action: ${actionName}`);
                return;
            }

            // Bind click handler
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.executeWidgetAction(widgetId, actionName, endpoint, button);
            });
        });

        console.log(`[WidgetManager] Bound ${actionButtons.length} actions for widget ${widgetId}`);
    }

    async executeWidgetAction(widgetId, actionName, endpoint, buttonElement) {
        console.log(`[WidgetManager] Executing action: ${actionName} for widget ${widgetId}`);

        // Show loading state
        const originalText = buttonElement.textContent;
        buttonElement.disabled = true;
        buttonElement.textContent = 'Loading...';

        try {
            // Call the API endpoint
            const token = localStorage.getItem('phoenixToken');
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    widgetId,
                    actionName,
                    timestamp: new Date().toISOString()
                })
            });

            const result = await response.json();

            if (result.success) {
                console.log(`[WidgetManager] Action ${actionName} succeeded:`, result);

                // Update widget with new data if provided
                if (result.data) {
                    this.updateWidgetData(widgetId, result.data);
                }

                // Show success feedback
                buttonElement.textContent = '✓';
                setTimeout(() => {
                    buttonElement.textContent = originalText;
                    buttonElement.disabled = false;
                }, 1500);
            } else {
                throw new Error(result.message || 'Action failed');
            }

        } catch (error) {
            console.error(`[WidgetManager] Action ${actionName} failed:`, error);

            // Show error feedback
            buttonElement.textContent = '✗ Error';
            setTimeout(() => {
                buttonElement.textContent = originalText;
                buttonElement.disabled = false;
            }, 2000);
        }
    }

    updateWidgetData(widgetId, newData) {
        const widget = this.activeWidgets.get(widgetId);
        if (!widget) return;

        // Find elements to update by ID or class
        Object.keys(newData).forEach(key => {
            const element = widget.querySelector(`#${key}`) ||
                           widget.querySelector(`.${key}`);

            if (element) {
                element.textContent = newData[key];
            }
        });
    }

    /* ============================================
       RENDER WIDGET CONTENT (CSS CLASSES)
       ============================================ */
    renderWidgetContent(widgetId, data) {
        // DYNAMIC WIDGET: If AI generated custom HTML, use it
        if (data && data.html) {
            console.log(`[WidgetManager] Rendering custom AI-generated widget: ${widgetId}`);

            // Store actions and tracking fields for later binding
            if (data.actions) {
                this.storeWidgetActions(widgetId, data.actions);
            }

            return data.html; // Return AI-generated HTML directly
        }

        // STANDARD TEMPLATES: Use hardcoded templates for known widgets
        const templates = {
            'health-recovery': () => this.renderHealthRecovery(data),
            'health-hrv': () => this.renderHealthHRV(data),
            'health-sleep': () => this.renderHealthSleep(data),
            'health-metrics': () => this.renderHealthMetrics(data),
            'finance-overview': () => this.renderFinanceOverview(data),
            'finance-spending': () => this.renderFinanceSpending(data),
            'calendar-today': () => this.renderCalendarToday(data),
            'goals-progress': () => this.renderGoalsProgress(data),
            'workout-plan': () => this.renderWorkoutPlan(data),
            'nutrition-stats': () => this.renderNutritionStats(data)
        };

        const template = templates[widgetId];
        return template ? template() : this.renderDefault(widgetId, data);
    }

    /* ============================================
       WIDGET TEMPLATES (CSS CLASSES)
       ============================================ */
    renderHealthRecovery(data) {
        const score = data?.recoveryScore || 0;
        const scoreClass = score >= 80 ? 'recovery-excellent' : score >= 60 ? 'recovery-good' : 'recovery-poor';

        return `
            <div class="widget-health">
                <h3 class="widget-header">Recovery Score</h3>
                <div class="widget-value ${scoreClass}">${score}%</div>
                <div class="widget-status">${data?.status || 'Good recovery status'}</div>
            </div>
        `;
    }

    renderHealthHRV(data) {
        return `
            <div class="widget-health">
                <h3 class="widget-header">Heart Rate Variability</h3>
                <div class="widget-value medium">${data?.hrv || '0'} ms</div>
                <div class="widget-status">${data?.trend || 'Normal range'}</div>
            </div>
        `;
    }

    renderHealthSleep(data) {
        return `
            <div class="widget-health">
                <h3 class="widget-header">Sleep Quality</h3>
                <div class="widget-value medium">${data?.hours || '0'}h ${data?.minutes || '0'}m</div>
                <div class="widget-status">${data?.quality || 'Good sleep quality'}</div>
            </div>
        `;
    }

    renderHealthMetrics(data) {
        const metricsHTML = data?.metrics?.map(metric => `
            <div class="widget-list-item">
                <span>${metric.name}</span>
                <span class="widget-value small">${metric.value}</span>
            </div>
        `).join('') || '<div class="widget-status">No metrics available</div>';

        return `
            <div class="widget-health">
                <h3 class="widget-header">Health Metrics</h3>
                <div class="widget-list">${metricsHTML}</div>
            </div>
        `;
    }

    renderFinanceOverview(data) {
        return `
            <div class="widget-finance">
                <h3 class="widget-header">Finance Overview</h3>
                <div class="widget-value medium">$${data?.balance || '0'}</div>
                <div class="widget-status">${data?.status || 'Current balance'}</div>
            </div>
        `;
    }

    renderFinanceSpending(data) {
        return `
            <div class="widget-finance">
                <h3 class="widget-header">Spending This Month</h3>
                <div class="widget-value medium">$${data?.spending || '0'}</div>
                <div class="widget-status">${data?.budget ? `$${data.budget} budget` : 'No budget set'}</div>
            </div>
        `;
    }

    renderCalendarToday(data) {
        const eventsHTML = data?.events?.map(event => `
            <div class="calendar-event">
                <div class="calendar-event-title">${event.title}</div>
                <div class="calendar-event-time">${event.time}</div>
            </div>
        `).join('') || '<div class="widget-status">No events today</div>';

        return `
            <div class="widget-calendar">
                <h3 class="widget-header">Today's Schedule</h3>
                <div class="widget-list">${eventsHTML}</div>
            </div>
        `;
    }

    renderGoalsProgress(data) {
        const goalsHTML = data?.goals?.map(goal => `
            <div>
                <div class="widget-status" style="margin-bottom: 6px;">${goal.name}</div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${goal.progress}%;"></div>
                </div>
                <div class="widget-status" style="margin-top: 4px;">${goal.progress}% complete</div>
            </div>
        `).join('') || '<div class="widget-status">No active goals</div>';

        return `
            <div class="widget-goals">
                <h3 class="widget-header">Goals Progress</h3>
                <div class="widget-list">${goalsHTML}</div>
            </div>
        `;
    }

    renderWorkoutPlan(data) {
        return `
            <div class="widget-health">
                <h3 class="widget-header">Today's Workout</h3>
                <div class="widget-value small">${data?.workout || 'Rest Day'}</div>
                <div class="widget-status">${data?.duration || 'No workout planned'}</div>
            </div>
        `;
    }

    renderNutritionStats(data) {
        return `
            <div class="widget-health">
                <h3 class="widget-header">Nutrition Today</h3>
                <div class="metrics-grid">
                    <div class="metric-item">
                        <div class="metric-value">${data?.calories || '0'}</div>
                        <div class="metric-label">Calories</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value">${data?.protein || '0'}g</div>
                        <div class="metric-label">Protein</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value">${data?.carbs || '0'}g</div>
                        <div class="metric-label">Carbs</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderDefault(widgetId, data) {
        return `
            <div class="widget-health">
                <h3 class="widget-header">${widgetId.replace(/-/g, ' ')}</h3>
                <div class="widget-status">${data ? JSON.stringify(data, null, 2) : 'Loading...'}</div>
            </div>
        `;
    }

    /* ============================================
       HIDE WIDGETS (PARALLEL)
       ============================================ */
    async hideWidgets(widgetIds) {
        // OPTIMIZATION: Hide all in parallel
        widgetIds.forEach(widgetId => this.removeWidget(widgetId));
    }

    /* ============================================
       REMOVE WIDGET (WITH POOLING)
       ============================================ */
    removeWidget(widgetId) {
        const widget = this.activeWidgets.get(widgetId);
        if (!widget) return;

        // Animate out
        widget.classList.add('hide');
        widget.classList.remove('show');

        // Return to pool after animation
        setTimeout(() => {
            this.returnToPool(widgetId, widget);
            this.activeWidgets.delete(widgetId);
        }, 300);
    }

    /* ============================================
       CLEAR ALL WIDGETS
       ============================================ */
    clearAll() {
        this.activeWidgets.forEach((widget, widgetId) => {
            this.removeWidget(widgetId);
        });
    }
}

// Initialize widget manager
let widgetManager;

document.addEventListener('DOMContentLoaded', () => {
    widgetManager = new WidgetManager();
    window.widgetManager = widgetManager;
    console.log('Widget Manager ready (optimized)');
});
