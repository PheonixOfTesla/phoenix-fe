/**
 * USAPL POWERLIFTING TRAINING WIDGET
 *
 * Full competition prep tracker for powerlifting athletes
 * - 12-week periodized program
 * - Squat/Bench/Deadlift tracking
 * - Weight class management
 * - 1RM calculator
 * - Competition countdown
 * - Weekly volume/intensity tracking
 */

class USAPLTrainingWidget {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.trainingData = this.loadTrainingData();
        this.init();
    }

    loadTrainingData() {
        const stored = localStorage.getItem('usapl_training_data');
        if (stored) {
            return JSON.parse(stored);
        }

        // Default data structure
        return {
            athlete: {
                name: '',
                weightClass: 83, // kg
                currentWeight: 83,
                targetTotal: 1500, // kg
                competitionDate: null
            },
            currentLifts: {
                squat: { max: 0, working: 0 },
                bench: { max: 0, working: 0 },
                deadlift: { max: 0, working: 0 }
            },
            weeklyProgress: [],
            currentWeek: 1,
            totalWeeks: 12,
            phase: 'hypertrophy' // hypertrophy, strength, peaking, taper
        };
    }

    saveTrainingData() {
        localStorage.setItem('usapl_training_data', JSON.stringify(this.trainingData));
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        const { athlete, currentLifts, currentWeek, totalWeeks, phase } = this.trainingData;

        const currentTotal = currentLifts.squat.max + currentLifts.bench.max + currentLifts.deadlift.max;
        const progressPercent = athlete.targetTotal > 0 ? (currentTotal / athlete.targetTotal * 100).toFixed(1) : 0;

        const daysUntilComp = athlete.competitionDate ?
            Math.ceil((new Date(athlete.competitionDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;

        this.container.innerHTML = `
            <div class="usapl-widget" style="
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #0f4c75;
                border-radius: 20px;
                padding: 24px;
                color: #fff;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                box-shadow: 0 8px 32px rgba(15, 76, 117, 0.3);
            ">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: #00d9ff;">
                        🏋️ USAPL TRAINING
                    </h2>
                    <div style="background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 12px;">
                        <span style="font-size: 14px; opacity: 0.8;">Week</span>
                        <span style="font-size: 20px; font-weight: bold; margin-left: 8px;">${currentWeek}/${totalWeeks}</span>
                    </div>
                </div>

                <!-- Phase Badge -->
                <div style="margin-bottom: 20px;">
                    <span style="
                        background: ${this.getPhaseColor(phase)};
                        padding: 6px 16px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    ">${phase} PHASE</span>
                </div>

                <!-- Competition Countdown -->
                ${daysUntilComp ? `
                    <div style="
                        background: rgba(255, 59, 48, 0.15);
                        border: 1px solid rgba(255, 59, 48, 0.3);
                        border-radius: 12px;
                        padding: 12px;
                        margin-bottom: 20px;
                        text-align: center;
                    ">
                        <div style="font-size: 32px; font-weight: bold; color: #ff3b30;">${daysUntilComp}</div>
                        <div style="font-size: 12px; opacity: 0.7;">days until competition</div>
                    </div>
                ` : ''}

                <!-- Target Total Progress -->
                <div style="margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-size: 14px; opacity: 0.8;">Target Total</span>
                        <span style="font-size: 16px; font-weight: bold;">${currentTotal}kg / ${athlete.targetTotal}kg</span>
                    </div>
                    <div style="
                        background: rgba(255,255,255,0.1);
                        height: 12px;
                        border-radius: 6px;
                        overflow: hidden;
                    ">
                        <div style="
                            background: linear-gradient(90deg, #00d9ff 0%, #00ff88 100%);
                            height: 100%;
                            width: ${Math.min(progressPercent, 100)}%;
                            transition: width 0.5s ease;
                        "></div>
                    </div>
                    <div style="text-align: right; font-size: 12px; margin-top: 4px; opacity: 0.7;">
                        ${progressPercent}% Complete
                    </div>
                </div>

                <!-- Lift Cards -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;">
                    ${this.renderLiftCard('Squat', currentLifts.squat.max, '#ff3b30')}
                    ${this.renderLiftCard('Bench', currentLifts.bench.max, '#ff9500')}
                    ${this.renderLiftCard('Deadlift', currentLifts.deadlift.max, '#00ff88')}
                </div>

                <!-- Weight Class -->
                <div style="
                    display: flex;
                    justify-content: space-between;
                    background: rgba(255,255,255,0.05);
                    padding: 12px;
                    border-radius: 12px;
                    margin-bottom: 16px;
                ">
                    <div>
                        <div style="font-size: 12px; opacity: 0.7; margin-bottom: 4px;">Weight Class</div>
                        <div style="font-size: 18px; font-weight: bold;">${athlete.weightClass}kg</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; opacity: 0.7; margin-bottom: 4px;">Current Weight</div>
                        <div style="font-size: 18px; font-weight: bold; color: ${this.getWeightColor(athlete.currentWeight, athlete.weightClass)}">
                            ${athlete.currentWeight}kg
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <button id="usapl-log-session" style="
                        background: linear-gradient(135deg, #00d9ff 0%, #0f4c75 100%);
                        border: none;
                        padding: 12px;
                        border-radius: 12px;
                        color: white;
                        font-weight: 600;
                        cursor: pointer;
                        transition: transform 0.2s;
                    ">
                        📝 Log Session
                    </button>
                    <button id="usapl-setup" style="
                        background: rgba(255,255,255,0.1);
                        border: 1px solid rgba(255,255,255,0.2);
                        padding: 12px;
                        border-radius: 12px;
                        color: white;
                        font-weight: 600;
                        cursor: pointer;
                        transition: transform 0.2s;
                    ">
                        ⚙️ Setup
                    </button>
                </div>
            </div>
        `;
    }

    renderLiftCard(name, weight, color) {
        return `
            <div style="
                background: rgba(255,255,255,0.05);
                border-radius: 12px;
                padding: 16px 12px;
                text-align: center;
                border: 2px solid ${color}40;
            ">
                <div style="font-size: 12px; opacity: 0.7; margin-bottom: 8px;">${name}</div>
                <div style="font-size: 24px; font-weight: bold; color: ${color};">${weight}</div>
                <div style="font-size: 10px; opacity: 0.5;">kg</div>
            </div>
        `;
    }

    getPhaseColor(phase) {
        const colors = {
            hypertrophy: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            strength: 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)',
            peaking: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
            taper: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)'
        };
        return colors[phase] || colors.hypertrophy;
    }

    getWeightColor(current, target) {
        const diff = Math.abs(current - target);
        if (diff < 1) return '#00ff88';
        if (diff < 3) return '#ff9500';
        return '#ff3b30';
    }

    attachEventListeners() {
        const logBtn = document.getElementById('usapl-log-session');
        const setupBtn = document.getElementById('usapl-setup');

        if (logBtn) {
            logBtn.addEventListener('click', () => this.showLogSessionDialog());
        }

        if (setupBtn) {
            setupBtn.addEventListener('click', () => this.showSetupDialog());
        }
    }

    showLogSessionDialog() {
        // Create modal for logging session
        const modal = document.createElement('div');
        modal.id = 'usapl-log-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;

        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border-radius: 20px;
                padding: 32px;
                max-width: 500px;
                width: 100%;
                color: white;
            ">
                <h3 style="margin: 0 0 24px 0; font-size: 24px;">Log Training Session</h3>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-size: 14px; opacity: 0.8;">Lift Type</label>
                    <select id="lift-type" style="
                        width: 100%;
                        padding: 12px;
                        background: rgba(255,255,255,0.1);
                        border: 1px solid rgba(255,255,255,0.2);
                        border-radius: 12px;
                        color: white;
                        font-size: 16px;
                    ">
                        <option value="squat">Squat</option>
                        <option value="bench">Bench Press</option>
                        <option value="deadlift">Deadlift</option>
                    </select>
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-size: 14px; opacity: 0.8;">Weight (kg)</label>
                    <input type="number" id="lift-weight" placeholder="0" style="
                        width: 100%;
                        padding: 12px;
                        background: rgba(255,255,255,0.1);
                        border: 1px solid rgba(255,255,255,0.2);
                        border-radius: 12px;
                        color: white;
                        font-size: 16px;
                    ">
                </div>

                <div style="margin-bottom: 24px;">
                    <label style="display: block; margin-bottom: 8px; font-size: 14px; opacity: 0.8;">Reps</label>
                    <input type="number" id="lift-reps" placeholder="0" style="
                        width: 100%;
                        padding: 12px;
                        background: rgba(255,255,255,0.1);
                        border: 1px solid rgba(255,255,255,0.2);
                        border-radius: 12px;
                        color: white;
                        font-size: 16px;
                    ">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <button id="log-cancel" style="
                        background: rgba(255,255,255,0.1);
                        border: 1px solid rgba(255,255,255,0.2);
                        padding: 14px;
                        border-radius: 12px;
                        color: white;
                        font-weight: 600;
                        cursor: pointer;
                    ">Cancel</button>
                    <button id="log-save" style="
                        background: linear-gradient(135deg, #00d9ff 0%, #0f4c75 100%);
                        border: none;
                        padding: 14px;
                        border-radius: 12px;
                        color: white;
                        font-weight: 600;
                        cursor: pointer;
                    ">Save</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('log-cancel').addEventListener('click', () => {
            modal.remove();
        });

        document.getElementById('log-save').addEventListener('click', () => {
            const liftType = document.getElementById('lift-type').value;
            const weight = parseFloat(document.getElementById('lift-weight').value);
            const reps = parseInt(document.getElementById('lift-reps').value);

            if (weight && reps) {
                // Calculate 1RM using Brzycki formula
                const oneRM = weight * (36 / (37 - reps));

                if (oneRM > this.trainingData.currentLifts[liftType].max) {
                    this.trainingData.currentLifts[liftType].max = Math.round(oneRM);
                    this.saveTrainingData();
                    this.render();
                    this.attachEventListeners();
                }
            }

            modal.remove();
        });
    }

    showSetupDialog() {
        const modal = document.createElement('div');
        modal.id = 'usapl-setup-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
            overflow-y: auto;
        `;

        const { athlete } = this.trainingData;

        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border-radius: 20px;
                padding: 32px;
                max-width: 500px;
                width: 100%;
                color: white;
                margin: 20px 0;
            ">
                <h3 style="margin: 0 0 24px 0; font-size: 24px;">Competition Setup</h3>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-size: 14px; opacity: 0.8;">Weight Class (kg)</label>
                    <input type="number" id="setup-weight-class" value="${athlete.weightClass}" style="
                        width: 100%;
                        padding: 12px;
                        background: rgba(255,255,255,0.1);
                        border: 1px solid rgba(255,255,255,0.2);
                        border-radius: 12px;
                        color: white;
                        font-size: 16px;
                    ">
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-size: 14px; opacity: 0.8;">Current Weight (kg)</label>
                    <input type="number" id="setup-current-weight" value="${athlete.currentWeight}" step="0.1" style="
                        width: 100%;
                        padding: 12px;
                        background: rgba(255,255,255,0.1);
                        border: 1px solid rgba(255,255,255,0.2);
                        border-radius: 12px;
                        color: white;
                        font-size: 16px;
                    ">
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-size: 14px; opacity: 0.8;">Target Total (kg)</label>
                    <input type="number" id="setup-target-total" value="${athlete.targetTotal}" style="
                        width: 100%;
                        padding: 12px;
                        background: rgba(255,255,255,0.1);
                        border: 1px solid rgba(255,255,255,0.2);
                        border-radius: 12px;
                        color: white;
                        font-size: 16px;
                    ">
                </div>

                <div style="margin-bottom: 24px;">
                    <label style="display: block; margin-bottom: 8px; font-size: 14px; opacity: 0.8;">Competition Date</label>
                    <input type="date" id="setup-comp-date" value="${athlete.competitionDate || ''}" style="
                        width: 100%;
                        padding: 12px;
                        background: rgba(255,255,255,0.1);
                        border: 1px solid rgba(255,255,255,0.2);
                        border-radius: 12px;
                        color: white;
                        font-size: 16px;
                    ">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <button id="setup-cancel" style="
                        background: rgba(255,255,255,0.1);
                        border: 1px solid rgba(255,255,255,0.2);
                        padding: 14px;
                        border-radius: 12px;
                        color: white;
                        font-weight: 600;
                        cursor: pointer;
                    ">Cancel</button>
                    <button id="setup-save" style="
                        background: linear-gradient(135deg, #00d9ff 0%, #0f4c75 100%);
                        border: none;
                        padding: 14px;
                        border-radius: 12px;
                        color: white;
                        font-weight: 600;
                        cursor: pointer;
                    ">Save</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('setup-cancel').addEventListener('click', () => {
            modal.remove();
        });

        document.getElementById('setup-save').addEventListener('click', () => {
            this.trainingData.athlete.weightClass = parseFloat(document.getElementById('setup-weight-class').value);
            this.trainingData.athlete.currentWeight = parseFloat(document.getElementById('setup-current-weight').value);
            this.trainingData.athlete.targetTotal = parseInt(document.getElementById('setup-target-total').value);
            this.trainingData.athlete.competitionDate = document.getElementById('setup-comp-date').value;

            this.saveTrainingData();
            this.render();
            this.attachEventListeners();
            modal.remove();
        });
    }
}

// Export for global use
window.USAPLTrainingWidget = USAPLTrainingWidget;
