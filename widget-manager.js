/* ============================================
   PHOENIX WIDGET MANAGER
   Dynamic widget system for dashboard
   Show/hide/replace widgets based on voice commands
   ============================================ */

class WidgetManager {
    constructor() {
        this.activeWidgets = new Map();
        this.widgetContainer = null;
        this.init();
    }

    init() {
        // Create widget container if it doesn't exist
        this.createWidgetContainer();
        console.log('Widget Manager initialized');
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
            container.style.cssText = `
                position: fixed;
                top: 120px;
                left: 50%;
                transform: translateX(-50%);
                width: 90%;
                max-width: 1400px;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 20px;
                z-index: 600;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }

        this.widgetContainer = container;
    }

    /* ============================================
       DISPLAY WIDGETS
       ============================================ */
    async displayWidgets(widgetIds, widgetData = {}) {
        console.log('Displaying widgets:', widgetIds, widgetData);

        for (const widgetId of widgetIds) {
            await this.createWidget(widgetId, widgetData[widgetId]);
        }
    }

    /* ============================================
       CREATE WIDGET
       ============================================ */
    async createWidget(widgetId, data) {
        // Remove existing widget if present
        if (this.activeWidgets.has(widgetId)) {
            this.removeWidget(widgetId);
        }

        const widget = document.createElement('div');
        widget.id = `widget-${widgetId}`;
        widget.className = 'phoenix-widget';
        widget.style.cssText = `
            background: rgba(0, 10, 20, 0.95);
            border: 2px solid rgba(0, 255, 255, 0.4);
            border-radius: 12px;
            padding: 20px;
            backdrop-filter: blur(15px);
            box-shadow: 0 0 30px rgba(0, 255, 255, 0.2);
            pointer-events: auto;
            animation: widgetFadeIn 0.3s ease-out;
            opacity: 0;
            transform: translateY(20px);
        `;

        // Render widget content based on type
        const content = await this.renderWidgetContent(widgetId, data);
        widget.innerHTML = content;

        this.widgetContainer.appendChild(widget);
        this.activeWidgets.set(widgetId, widget);

        // Animate in
        setTimeout(() => {
            widget.style.opacity = '1';
            widget.style.transform = 'translateY(0)';
        }, 10);
    }

    /* ============================================
       RENDER WIDGET CONTENT
       ============================================ */
    async renderWidgetContent(widgetId, data) {
        const widgetTemplates = {
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

        const template = widgetTemplates[widgetId];
        if (template) {
            return template();
        }

        // Default template
        return `
            <div style="color: #00ffff;">
                <h3 style="font-size: 18px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 2px;">
                    ${widgetId.replace(/-/g, ' ')}
                </h3>
                <div style="font-size: 14px; color: rgba(0, 255, 255, 0.7);">
                    ${data ? JSON.stringify(data, null, 2) : 'Loading...'}
                </div>
            </div>
        `;
    }

    /* ============================================
       WIDGET TEMPLATES
       ============================================ */
    renderHealthRecovery(data) {
        const score = data?.recoveryScore || 0;
        const color = score >= 80 ? '#00ff88' : score >= 60 ? '#00ffff' : '#ff6b35';

        return `
            <div style="color: #00ffff;">
                <h3 style="font-size: 16px; margin-bottom: 15px; opacity: 0.7; letter-spacing: 1px;">RECOVERY SCORE</h3>
                <div style="font-size: 48px; color: ${color}; font-weight: bold; margin-bottom: 10px;">${score}%</div>
                <div style="font-size: 12px; color: rgba(0, 255, 255, 0.6);">
                    ${data?.status || 'Good recovery status'}
                </div>
            </div>
        `;
    }

    renderHealthHRV(data) {
        return `
            <div style="color: #00ffff;">
                <h3 style="font-size: 16px; margin-bottom: 15px; opacity: 0.7; letter-spacing: 1px;">HEART RATE VARIABILITY</h3>
                <div style="font-size: 36px; color: #00ff88; font-weight: bold; margin-bottom: 10px;">
                    ${data?.hrv || '0'} ms
                </div>
                <div style="font-size: 12px; color: rgba(0, 255, 255, 0.6);">
                    ${data?.trend || 'Normal range'}
                </div>
            </div>
        `;
    }

    renderHealthSleep(data) {
        return `
            <div style="color: #00ffff;">
                <h3 style="font-size: 16px; margin-bottom: 15px; opacity: 0.7; letter-spacing: 1px;">SLEEP QUALITY</h3>
                <div style="font-size: 36px; color: #00ffff; font-weight: bold; margin-bottom: 10px;">
                    ${data?.hours || '0'}h ${data?.minutes || '0'}m
                </div>
                <div style="font-size: 12px; color: rgba(0, 255, 255, 0.6);">
                    ${data?.quality || 'Good sleep quality'}
                </div>
            </div>
        `;
    }

    renderHealthMetrics(data) {
        return `
            <div style="color: #00ffff;">
                <h3 style="font-size: 16px; margin-bottom: 15px; opacity: 0.7; letter-spacing: 1px;">HEALTH METRICS</h3>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${data?.metrics?.map(metric => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(0, 255, 255, 0.05); border-radius: 6px;">
                            <span style="font-size: 12px; opacity: 0.8;">${metric.name}</span>
                            <span style="font-size: 16px; font-weight: bold; color: #00ff88;">${metric.value}</span>
                        </div>
                    `).join('') || '<div style="opacity: 0.6;">No metrics available</div>'}
                </div>
            </div>
        `;
    }

    renderFinanceOverview(data) {
        return `
            <div style="color: #ffaa00;">
                <h3 style="font-size: 16px; margin-bottom: 15px; opacity: 0.7; letter-spacing: 1px;">FINANCE OVERVIEW</h3>
                <div style="font-size: 36px; color: #ffaa00; font-weight: bold; margin-bottom: 10px;">
                    $${data?.balance || '0'}
                </div>
                <div style="font-size: 12px; color: rgba(255, 170, 0, 0.6);">
                    ${data?.status || 'Current balance'}
                </div>
            </div>
        `;
    }

    renderFinanceSpending(data) {
        return `
            <div style="color: #ffaa00;">
                <h3 style="font-size: 16px; margin-bottom: 15px; opacity: 0.7; letter-spacing: 1px;">SPENDING THIS MONTH</h3>
                <div style="font-size: 36px; color: #ff6b35; font-weight: bold; margin-bottom: 10px;">
                    $${data?.spending || '0'}
                </div>
                <div style="font-size: 12px; color: rgba(255, 170, 0, 0.6);">
                    ${data?.budget ? `$${data.budget} budget` : 'No budget set'}
                </div>
            </div>
        `;
    }

    renderCalendarToday(data) {
        return `
            <div style="color: #00ff88;">
                <h3 style="font-size: 16px; margin-bottom: 15px; opacity: 0.7; letter-spacing: 1px;">TODAY'S SCHEDULE</h3>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${data?.events?.map(event => `
                        <div style="padding: 12px; background: rgba(0, 255, 136, 0.05); border-left: 3px solid #00ff88; border-radius: 4px;">
                            <div style="font-size: 14px; font-weight: bold; margin-bottom: 4px;">${event.title}</div>
                            <div style="font-size: 11px; opacity: 0.6;">${event.time}</div>
                        </div>
                    `).join('') || '<div style="opacity: 0.6;">No events today</div>'}
                </div>
            </div>
        `;
    }

    renderGoalsProgress(data) {
        return `
            <div style="color: #ff4444;">
                <h3 style="font-size: 16px; margin-bottom: 15px; opacity: 0.7; letter-spacing: 1px;">GOALS PROGRESS</h3>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${data?.goals?.map(goal => `
                        <div style="padding: 10px; background: rgba(255, 68, 68, 0.05); border-radius: 6px;">
                            <div style="font-size: 12px; margin-bottom: 6px;">${goal.name}</div>
                            <div style="width: 100%; height: 6px; background: rgba(255, 68, 68, 0.2); border-radius: 3px; overflow: hidden;">
                                <div style="width: ${goal.progress}%; height: 100%; background: #ff4444; transition: width 0.3s;"></div>
                            </div>
                            <div style="font-size: 10px; opacity: 0.6; margin-top: 4px;">${goal.progress}% complete</div>
                        </div>
                    `).join('') || '<div style="opacity: 0.6;">No active goals</div>'}
                </div>
            </div>
        `;
    }

    renderWorkoutPlan(data) {
        return `
            <div style="color: #00ffff;">
                <h3 style="font-size: 16px; margin-bottom: 15px; opacity: 0.7; letter-spacing: 1px;">TODAY'S WORKOUT</h3>
                <div style="font-size: 24px; color: #00ffff; font-weight: bold; margin-bottom: 10px;">
                    ${data?.workout || 'Rest Day'}
                </div>
                <div style="font-size: 12px; color: rgba(0, 255, 255, 0.6);">
                    ${data?.duration || 'No workout planned'}
                </div>
            </div>
        `;
    }

    renderNutritionStats(data) {
        return `
            <div style="color: #00ffff;">
                <h3 style="font-size: 16px; margin-bottom: 15px; opacity: 0.7; letter-spacing: 1px;">NUTRITION TODAY</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                    <div style="text-align: center;">
                        <div style="font-size: 24px; color: #00ff88; font-weight: bold;">${data?.calories || '0'}</div>
                        <div style="font-size: 10px; opacity: 0.6;">CALORIES</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; color: #00ffff; font-weight: bold;">${data?.protein || '0'}g</div>
                        <div style="font-size: 10px; opacity: 0.6;">PROTEIN</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; color: #ff6b35; font-weight: bold;">${data?.carbs || '0'}g</div>
                        <div style="font-size: 10px; opacity: 0.6;">CARBS</div>
                    </div>
                </div>
            </div>
        `;
    }

    /* ============================================
       HIDE WIDGETS
       ============================================ */
    async hideWidgets(widgetIds) {
        for (const widgetId of widgetIds) {
            this.removeWidget(widgetId);
        }
    }

    /* ============================================
       REMOVE WIDGET
       ============================================ */
    removeWidget(widgetId) {
        const widget = this.activeWidgets.get(widgetId);
        if (widget) {
            widget.style.opacity = '0';
            widget.style.transform = 'translateY(20px)';
            setTimeout(() => {
                widget.remove();
                this.activeWidgets.delete(widgetId);
            }, 300);
        }
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
    console.log('Widget Manager ready');
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes widgetFadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes highlight-pulse {
        0%, 100% {
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
        }
        50% {
            box-shadow: 0 0 30px rgba(0, 255, 255, 0.8), 0 0 60px rgba(0, 255, 255, 0.4);
        }
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
`;
document.head.appendChild(style);
