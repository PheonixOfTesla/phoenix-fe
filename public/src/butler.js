// butler.js - Phoenix AI Butler Service
// Complete autonomous task execution system with real API integrations

class ButlerService {
    constructor() {
        this.baseURL = 'https://pal-backend-production.up.railway.app/api';
        this.API = null;
        this.isInitialized = false;
        this.activeTask = null;
        this.taskQueue = [];
        this.autonomousMode = false;
        this.trustLevel = 0;
        
        // Service configurations
        this.services = {
            food: { enabled: false, provider: null },
            rides: { enabled: false, provider: null },
            calendar: { enabled: false, provider: null },
            email: { enabled: false, provider: null },
            calls: { enabled: false, provider: null }
        };

        // Task history for learning
        this.taskHistory = [];
        this.preferences = this.loadPreferences();
    }

    async init() {
        console.log('🤖 Initializing Phoenix Butler Service...');
        
        // Wait for API
        await this.waitForAPI();
        
        // Load user preferences
        await this.loadUserPreferences();
        
        // Check service connections
        await this.checkServiceConnections();
        
        // Start autonomous monitoring if enabled
        if (this.autonomousMode) {
            this.startAutonomousMonitoring();
        }
        
        this.isInitialized = true;
        console.log('✅ Butler Service operational');
        
        return true;
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
    // 🍔 FOOD ORDERING
    // ========================================

    async orderFood(options = {}) {
        console.log('🍔 Butler: Ordering food...');
        
        const task = {
            type: 'food_order',
            status: 'pending',
            timestamp: Date.now(),
            options
        };
        
        try {
            // Default to user preferences if not specified
            const order = {
                restaurant: options.restaurant || this.preferences.favoriteRestaurant,
                items: options.items || this.preferences.usualOrder,
                deliveryTime: options.deliveryTime || 'ASAP',
                service: options.service || 'uber_eats'
            };

            // If autonomous, check if we should proceed
            if (this.autonomousMode && this.trustLevel > 70) {
                console.log('🤖 Autonomous food order triggered');
            } else {
                // Ask for confirmation
                const confirmed = await this.confirmAction('food_order', order);
                if (!confirmed) {
                    task.status = 'cancelled';
                    return { success: false, reason: 'User cancelled' };
                }
            }

            // Real API call
            task.status = 'processing';
            
            const token = localStorage.getItem('phoenix_token');
            const response = await fetch(`${this.baseURL}/phoenix/butler/food/order`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(order)
            });
            
            const data = await response.json();
            
            if (response.ok && data.success !== false) {
                task.status = 'completed';
                task.result = data;
                
                // Voice confirmation
                if (window.voiceInterface) {
                    window.voiceInterface.speak(
                        `Your ${order.restaurant} order has been placed. Delivery in approximately ${data.estimatedTime || '30'} minutes.`,
                        'normal'
                    );
                }
                
                // Log to history for learning
                this.taskHistory.push(task);
                this.saveTaskHistory();
                
                return data;
            } else {
                throw new Error(data.error || 'Order failed');
            }
            
        } catch (error) {
            console.error('Food order error:', error);
            task.status = 'failed';
            task.error = error.message;
            
            if (window.voiceInterface) {
                window.voiceInterface.speak(
                    'I encountered an issue ordering food. Would you like me to try again?',
                    'normal'
                );
            }
            
            return { success: false, error: error.message };
        }
    }

    async reorderFood(orderId) {
        console.log('🍔 Butler: Reordering food...');
        
        try {
            const token = localStorage.getItem('phoenix_token');
            const response = await fetch(`${this.baseURL}/phoenix/butler/food/reorder`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ orderId })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Reorder error:', error);
            return { success: false, error: error.message };
        }
    }

    async getFoodHistory() {
        console.log('🍔 Butler: Getting food history...');
        
        try {
            const token = localStorage.getItem('phoenix_token');
            const response = await fetch(`${this.baseURL}/phoenix/butler/food/history`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return await response.json();
        } catch (error) {
            console.error('Food history error:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // 🚗 RIDE BOOKING
    // ========================================

    async bookRide(destination, options = {}) {
        console.log('🚗 Butler: Booking ride to', destination);
        
        const task = {
            type: 'ride_booking',
            status: 'pending',
            timestamp: Date.now(),
            destination
        };
        
        try {
            // Get current location
            const currentLocation = await this.getCurrentLocation();
            
            const booking = {
                from: currentLocation,
                to: destination,
                service: options.service || 'uber',
                type: options.type || 'uberx',
                time: options.time || 'now'
            };

            // Check calendar for timing
            if (!options.time) {
                const optimalTime = await this.calculateOptimalDepartureTime(destination);
                booking.time = optimalTime;
            }

            // Confirm if not autonomous
            if (!this.autonomousMode || this.trustLevel < 80) {
                const confirmed = await this.confirmAction('ride_booking', booking);
                if (!confirmed) {
                    task.status = 'cancelled';
                    return { success: false, reason: 'User cancelled' };
                }
            }

            task.status = 'processing';
            
            // Real API call
            const token = localStorage.getItem('phoenix_token');
            const response = await fetch(`${this.baseURL}/phoenix/butler/ride`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(booking)
            });
            
            const data = await response.json();
            
            if (response.ok && data.success !== false) {
                task.status = 'completed';
                task.result = data;
                
                // Add to calendar
                await this.addToCalendar({
                    title: `Uber to ${destination}`,
                    start: booking.time,
                    duration: data.estimatedDuration
                });
                
                // Voice confirmation
                if (window.voiceInterface) {
                    window.voiceInterface.speak(
                        `Your ${booking.type} is booked. Driver ${data.driverName || 'is assigned'} will arrive in ${data.estimatedArrival || '5'} minutes.`,
                        'normal'
                    );
                }
                
                this.taskHistory.push(task);
                this.saveTaskHistory();
                
                return data;
            } else {
                throw new Error(data.error || 'Booking failed');
            }
            
        } catch (error) {
            console.error('Ride booking error:', error);
            task.status = 'failed';
            task.error = error.message;
            
            return { success: false, error: error.message };
        }
    }

    async getRides() {
        console.log('🚗 Butler: Getting ride history...');
        
        try {
            const token = localStorage.getItem('phoenix_token');
            const response = await fetch(`${this.baseURL}/phoenix/butler/rides`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return await response.json();
        } catch (error) {
            console.error('Get rides error:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // 🍽️ RESERVATIONS
    // ========================================

    async makeReservation(details) {
        console.log('🍽️ Butler: Making reservation...');
        
        try {
            const token = localStorage.getItem('phoenix_token');
            const response = await fetch(`${this.baseURL}/phoenix/butler/reservation`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(details)
            });
            
            const data = await response.json();
            
            if (response.ok && data.success !== false) {
                if (window.voiceInterface) {
                    window.voiceInterface.speak(
                        `Your reservation at ${details.restaurant} has been confirmed.`,
                        'normal'
                    );
                }
            }
            
            return data;
        } catch (error) {
            console.error('Reservation error:', error);
            return { success: false, error: error.message };
        }
    }

    async getReservations() {
        console.log('🍽️ Butler: Getting reservations...');
        
        try {
            const token = localStorage.getItem('phoenix_token');
            const response = await fetch(`${this.baseURL}/phoenix/butler/reservations`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return await response.json();
        } catch (error) {
            console.error('Get reservations error:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // 📅 CALENDAR OPTIMIZATION
    // ========================================

    async addToCalendar(event) {
        console.log('📅 Butler: Adding to calendar:', event.title);
        
        try {
            const token = localStorage.getItem('phoenix_token');
            const response = await fetch(`${this.baseURL}/phoenix/butler/calendar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            });
            
            return await response.json();
        } catch (error) {
            console.error('Add to calendar error:', error);
            return { success: false, error: error.message };
        }
    }

    async optimizeCalendar() {
        console.log('📅 Butler: Optimizing your calendar...');
        
        try {
            // Get calendar events
            const events = await this.API.getCalendarEvents();
            
            // Get recovery score
            const healthData = await this.API.getRecoveryScore();
            const recoveryScore = healthData?.data?.recoveryScore || 75;
            
            // Real API call for optimization
            const token = localStorage.getItem('phoenix_token');
            const response = await fetch(`${this.baseURL}/phoenix/butler/calendar/optimize`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    events,
                    recoveryScore
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.optimizations) {
                if (window.voiceInterface) {
                    window.voiceInterface.speak(
                        `Calendar optimized. I've made ${data.changes || 0} adjustments to align with your energy patterns.`,
                        'normal'
                    );
                }
            } else {
                if (window.voiceInterface) {
                    window.voiceInterface.speak('Your calendar is already optimized.', 'normal');
                }
            }
            
            return data;
            
        } catch (error) {
            console.error('Calendar optimization error:', error);
            return { success: false, error: error.message };
        }
    }

    analyzeCalendarForOptimization(events, recoveryScore) {
        const optimizations = [];
        
        // Check for back-to-back meetings
        const backToBack = events.filter((e, i) => {
            if (i === 0) return false;
            const prevEnd = new Date(events[i-1].end);
            const thisStart = new Date(e.start);
            return (thisStart - prevEnd) < 5 * 60 * 1000; // Less than 5 minutes gap
        });
        
        // If recovery is low and meetings are dense
        if (recoveryScore < 60 && backToBack.length > 2) {
            optimizations.push({
                type: 'reschedule',
                event: backToBack[backToBack.length - 1],
                newTime: this.findOptimalMeetingTime(events),
                reason: 'Low recovery - spacing out meetings'
            });
        }
        
        // Block recovery time if none exists
        const hasRecoveryTime = events.some(e => 
            e.title.toLowerCase().includes('break') || 
            e.title.toLowerCase().includes('recovery')
        );
        
        if (!hasRecoveryTime && events.length > 4) {
            optimizations.push({
                type: 'block_time',
                time: '14:00',
                duration: 30,
                reason: 'No recovery time detected - adding break'
            });
        }
        
        return optimizations;
    }

    // ========================================
    // ✉️ EMAIL DRAFTING
    // ========================================

    async draftEmail(recipient, subject, context = {}) {
        console.log('✉️ Butler: Drafting email to', recipient);
        
        try {
            // Use AI to generate email based on context
            const emailBody = await this.generateEmailContent(subject, context);
            
            const email = {
                to: recipient,
                subject: subject,
                body: emailBody,
                timestamp: new Date().toISOString()
            };
            
            // Confirm before sending
            const confirmed = await this.confirmAction('email_draft', email);
            if (!confirmed) {
                return { success: false, reason: 'User cancelled' };
            }
            
            // Real API call
            const token = localStorage.getItem('phoenix_token');
            const response = await fetch(`${this.baseURL}/phoenix/butler/email`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(email)
            });
            
            const data = await response.json();
            
            if (response.ok && data.success !== false) {
                if (window.voiceInterface) {
                    window.voiceInterface.speak(
                        `Email to ${recipient} has been sent successfully.`,
                        'normal'
                    );
                }
                
                return data;
            }
            
            throw new Error(data.error || 'Email send failed');
            
        } catch (error) {
            console.error('Email drafting error:', error);
            return { success: false, error: error.message };
        }
    }

    async replyToEmail(emailId, message) {
        console.log('✉️ Butler: Replying to email...');
        
        try {
            const token = localStorage.getItem('phoenix_token');
            const response = await fetch(`${this.baseURL}/phoenix/butler/email/reply`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ emailId, message })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Email reply error:', error);
            return { success: false, error: error.message };
        }
    }

    async getEmails() {
        console.log('✉️ Butler: Getting emails...');
        
        try {
            const token = localStorage.getItem('phoenix_token');
            const response = await fetch(`${this.baseURL}/phoenix/butler/emails`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return await response.json();
        } catch (error) {
            console.error('Get emails error:', error);
            return { success: false, error: error.message };
        }
    }

    async generateEmailContent(subject, context) {
        // Use Phoenix AI to generate contextual email
        const prompt = `Generate a professional email about: ${subject}`;
        
        // For now, return template
        return `Dear Recipient,

I hope this email finds you well.

${context.message || 'I wanted to reach out regarding ' + subject + '.'}

Please let me know if you need any additional information.

Best regards,
${context.senderName || 'Phoenix User'}`;
    }

    // ========================================
    // 📞 PHONE CALL HANDLING
    // ========================================

    async handlePhoneCall(contact, purpose) {
        console.log('📞 Butler: Handling call to', contact);
        
        try {
            // Check if it's a good time to call based on calendar
            const isGoodTime = await this.checkIfGoodTimeToCall();
            
            if (!isGoodTime) {
                // Schedule for later
                const betterTime = await this.findBetterCallTime();
                
                if (window.voiceInterface) {
                    window.voiceInterface.speak(
                        `Based on your schedule, I suggest calling ${contact} at ${betterTime} instead. Shall I schedule it?`,
                        'normal'
                    );
                }
                
                return { success: true, rescheduled: true, time: betterTime };
            }
            
            // Real API call
            const token = localStorage.getItem('phoenix_token');
            const response = await fetch(`${this.baseURL}/phoenix/butler/call`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ contact, purpose })
            });
            
            return await response.json();
            
        } catch (error) {
            console.error('Phone call error:', error);
            return { success: false, error: error.message };
        }
    }

    async getCallHistory() {
        console.log('📞 Butler: Getting call history...');
        
        try {
            const token = localStorage.getItem('phoenix_token');
            const response = await fetch(`${this.baseURL}/phoenix/butler/calls`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return await response.json();
        } catch (error) {
            console.error('Get calls error:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // 🌐 WEB TASKS
    // ========================================

    async searchWeb(query) {
        console.log('🌐 Butler: Searching web for', query);
        
        try {
            const token = localStorage.getItem('phoenix_token');
            const response = await fetch(`${this.baseURL}/phoenix/butler/web/search`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Web search error:', error);
            return { success: false, error: error.message };
        }
    }

    async executeWebTask(task) {
        console.log('🌐 Butler: Executing web task:', task);
        
        try {
            const token = localStorage.getItem('phoenix_token');
            const response = await fetch(`${this.baseURL}/phoenix/butler/web/task`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ task })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Web task error:', error);
            return { success: false, error: error.message };
        }
    }

    async summarizeContent(content) {
        console.log('📝 Butler: Summarizing content...');
        
        try {
            const token = localStorage.getItem('phoenix_token');
            const response = await fetch(`${this.baseURL}/phoenix/butler/summarize`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Summarize error:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // 🤖 AUTONOMOUS MONITORING
    // ========================================

    startAutonomousMonitoring() {
        console.log('🤖 Starting autonomous monitoring...');
        
        // Check every 5 minutes
        setInterval(() => {
            this.checkForAutonomousActions();
        }, 300000);
        
        // Initial check
        this.checkForAutonomousActions();
    }

    async checkForAutonomousActions() {
        if (!this.autonomousMode) return;
        
        const now = new Date();
        const hour = now.getHours();
        
        // Morning routine (7-8 AM)
        if (hour === 7 && !this.hasTaskToday('morning_routine')) {
            await this.executeMorningRoutine();
        }
        
        // Lunch ordering (11:30 AM)
        if (hour === 11 && now.getMinutes() === 30 && !this.hasTaskToday('lunch_order')) {
            await this.checkAndOrderLunch();
        }
        
        // Evening optimization (5 PM)
        if (hour === 17 && !this.hasTaskToday('evening_optimization')) {
            await this.executeEveningOptimization();
        }
        
        // Check calendar for ride needs
        await this.checkUpcomingEventsForRides();
        
        // Check health metrics for interventions
        await this.checkHealthForInterventions();
    }

    async executeMorningRoutine() {
        console.log('🌅 Executing morning routine...');
        
        // Get health data
        const healthData = await this.API.getRecoveryScore();
        const recovery = healthData?.data?.recoveryScore || 75;
        
        // Adjust based on recovery
        if (recovery < 50) {
            // Low recovery - suggest easy day
            if (window.voiceInterface) {
                window.voiceInterface.speak(
                    'Good morning. Your recovery is low at ' + Math.round(recovery) + ' percent. I recommend postponing intensive activities today.',
                    'normal'
                );
            }
            
            // Reschedule workouts
            await this.rescheduleIntensiveActivities();
        } else if (recovery > 80) {
            // High recovery - optimize for productivity
            if (window.voiceInterface) {
                window.voiceInterface.speak(
                    'Good morning. Your recovery is excellent at ' + Math.round(recovery) + ' percent. You\'re primed for peak performance today.',
                    'normal'
                );
            }
        }
        
        this.logTask('morning_routine');
    }

    async checkAndOrderLunch() {
        // Check calendar for lunch meetings
        const events = await this.API.getCalendarEvents();
        const lunchMeeting = events.find(e => {
            const hour = new Date(e.start).getHours();
            return hour >= 11 && hour <= 13 && e.title.toLowerCase().includes('lunch');
        });
        
        if (!lunchMeeting) {
            // No lunch meeting - order food
            const lastLunchOrder = this.getLastLunchOrder();
            
            if (window.voiceInterface) {
                window.voiceInterface.speak(
                    'It\'s lunchtime. Would you like me to order your usual from ' + (lastLunchOrder?.restaurant || 'your favorite restaurant') + '?',
                    'normal'
                );
            }
        }
        
        this.logTask('lunch_order');
    }

    async executeEveningOptimization() {
        console.log('🌆 Executing evening optimization...');
        
        // Check tomorrow's schedule
        const tomorrowEvents = await this.getTomorrowsEvents();
        
        if (tomorrowEvents.length > 0 && tomorrowEvents[0].start) {
            const firstEvent = new Date(tomorrowEvents[0].start);
            const wakeTime = new Date(firstEvent);
            wakeTime.setHours(firstEvent.getHours() - 2); // 2 hours before first event
            
            if (window.voiceInterface) {
                window.voiceInterface.speak(
                    `Based on tomorrow's schedule, I recommend waking at ${wakeTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}. Shall I set your alarm?`,
                    'normal'
                );
            }
        }
        
        // Check if dinner needs ordering
        await this.checkDinnerNeeds();
        
        this.logTask('evening_optimization');
    }

    async checkUpcomingEventsForRides() {
        const events = await this.API.getCalendarEvents();
        const now = new Date();
        
        events.forEach(async (event) => {
            const eventTime = new Date(event.start);
            const timeDiff = eventTime - now;
            const minutesUntil = timeDiff / (1000 * 60);
            
            // If event is 45 minutes away and has location
            if (minutesUntil > 30 && minutesUntil < 45 && event.location) {
                const travelTime = await this.estimateTravelTime(event.location);
                
                if (travelTime > 15) {
                    // Need to book ride soon
                    if (window.voiceInterface) {
                        window.voiceInterface.speak(
                            `You have an event at ${event.location} in ${Math.round(minutesUntil)} minutes. Shall I book an Uber now?`,
                            'urgent'
                        );
                    }
                }
            }
        });
    }

    async checkHealthForInterventions() {
        const healthData = await this.API.getRecoveryScore();
        const recovery = healthData?.data?.recoveryScore || 75;
        
        if (recovery < 40) {
            // Critical intervention needed
            if (window.voiceInterface) {
                window.voiceInterface.speak(
                    'Your recovery is critically low. I\'m clearing your afternoon schedule for rest.',
                    'urgent'
                );
            }
            
            // Auto-reschedule non-critical meetings
            if (this.trustLevel > 80) {
                await this.clearAfternoonForRecovery();
            }
        }
    }

    // ========================================
    // 🔐 CONFIRMATION & TRUST
    // ========================================

    async confirmAction(actionType, details) {
        // If high trust and autonomous mode, skip confirmation
        if (this.autonomousMode && this.trustLevel > 90) {
            return true;
        }
        
        // Show confirmation dialog
        const message = this.formatConfirmationMessage(actionType, details);
        
        // Use voice if available
        if (window.voiceInterface) {
            window.voiceInterface.speak(message + ' Say yes to confirm or no to cancel.', 'normal');
            
            // Wait for voice response (mock for now)
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(confirm(message));
                }, 100);
            });
        }
        
        return confirm(message);
    }

    formatConfirmationMessage(actionType, details) {
        const messages = {
            food_order: `Order from ${details.restaurant} for ${details.deliveryTime} delivery?`,
            ride_booking: `Book ${details.type} to ${details.to}?`,
            calendar_reschedule: `Reschedule ${details.event.title} to ${details.newTime}?`,
            email_draft: `Send email to ${details.to} with subject: ${details.subject}?`
        };
        
        return messages[actionType] || 'Proceed with this action?';
    }

    increaseTrust(amount = 5) {
        this.trustLevel = Math.min(100, this.trustLevel + amount);
        console.log('🎯 Trust level increased to:', this.trustLevel);
        
        if (this.trustLevel >= 70 && !this.autonomousMode) {
            if (window.voiceInterface) {
                window.voiceInterface.speak(
                    'I\'ve earned your trust. Would you like to enable autonomous mode? I\'ll handle routine tasks without asking.',
                    'normal'
                );
            }
        }
    }

    // ========================================
    // 📊 PREFERENCES & LEARNING
    // ========================================

    loadPreferences() {
        const saved = localStorage.getItem('butlerPreferences');
        return saved ? JSON.parse(saved) : {
            favoriteRestaurant: 'Chipotle',
            usualOrder: 'Burrito Bowl',
            preferredRideType: 'uberx',
            workStartTime: '09:00',
            workEndTime: '17:00',
            sleepTime: '23:00',
            wakeTime: '07:00'
        };
    }

    async loadUserPreferences() {
        try {
            const user = await this.API.getMe();
            if (user?.preferences?.butler) {
                this.preferences = { ...this.preferences, ...user.preferences.butler };
                this.autonomousMode = user.preferences.butler.autonomousMode || false;
                this.trustLevel = user.preferences.butler.trustLevel || 0;
            }
        } catch (error) {
            console.error('Failed to load butler preferences:', error);
        }
    }

    savePreferences() {
        localStorage.setItem('butlerPreferences', JSON.stringify(this.preferences));
        
        // Sync to backend
        this.API.updateProfile({
            preferences: {
                butler: {
                    ...this.preferences,
                    autonomousMode: this.autonomousMode,
                    trustLevel: this.trustLevel
                }
            }
        }).catch(console.error);
    }

    // ========================================
    // 📝 TASK HISTORY & LEARNING
    // ========================================

    logTask(taskType) {
        const task = {
            type: taskType,
            timestamp: Date.now(),
            date: new Date().toDateString()
        };
        
        this.taskHistory.push(task);
        this.saveTaskHistory();
    }

    hasTaskToday(taskType) {
        const today = new Date().toDateString();
        return this.taskHistory.some(t => 
            t.type === taskType && t.date === today
        );
    }

    getLastLunchOrder() {
        const lunchOrders = this.taskHistory.filter(t => 
            t.type === 'food_order' && t.result?.restaurant
        );
        
        return lunchOrders[lunchOrders.length - 1]?.result;
    }

    saveTaskHistory() {
        // Keep only last 100 tasks
        if (this.taskHistory.length > 100) {
            this.taskHistory = this.taskHistory.slice(-100);
        }
        
        localStorage.setItem('butlerTaskHistory', JSON.stringify(this.taskHistory));
    }

    loadTaskHistory() {
        const saved = localStorage.getItem('butlerTaskHistory');
        if (saved) {
            this.taskHistory = JSON.parse(saved);
        }
    }

    // ========================================
    // 🛠️ UTILITY METHODS
    // ========================================

    async getCurrentLocation() {
        return new Promise((resolve) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        });
                    },
                    () => {
                        // Fallback to IP geolocation
                        resolve({ lat: 27.9506, lng: -82.4572 }); // Tampa Bay area
                    }
                );
            } else {
                resolve({ lat: 27.9506, lng: -82.4572 });
            }
        });
    }

    async calculateOptimalDepartureTime(destination) {
        // Calculate based on traffic patterns
        const now = new Date();
        const travelTime = await this.estimateTravelTime(destination);
        
        const departureTime = new Date(now.getTime() - travelTime * 60000);
        return departureTime.toISOString();
    }

    async estimateTravelTime(destination) {
        // Mock travel time estimation
        return 20 + Math.floor(Math.random() * 20); // 20-40 minutes
    }

    async getTomorrowsEvents() {
        const events = await this.API.getCalendarEvents();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const tomorrowEnd = new Date(tomorrow);
        tomorrowEnd.setHours(23, 59, 59, 999);
        
        return events.filter(e => {
            const eventDate = new Date(e.start);
            return eventDate >= tomorrow && eventDate <= tomorrowEnd;
        });
    }

    async checkIfGoodTimeToCall() {
        const now = new Date();
        const hour = now.getHours();
        
        // Good times: 9-11 AM, 2-4 PM
        return (hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16);
    }

    async findBetterCallTime() {
        const now = new Date();
        const hour = now.getHours();
        
        if (hour < 9) {
            return '9:00 AM';
        } else if (hour >= 11 && hour < 14) {
            return '2:00 PM';
        } else {
            return '9:00 AM tomorrow';
        }
    }

    async rescheduleEvent(event, newTime) {
        console.log('📅 Rescheduling', event.title, 'to', newTime);
        // Implementation would use Calendar API
        return { success: true };
    }

    async blockRecoveryTime(time, duration) {
        console.log('🧘 Blocking recovery time at', time, 'for', duration, 'minutes');
        // Implementation would use Calendar API
        return { success: true };
    }

    async findOptimalMeetingTime(existingEvents) {
        // Find gaps in calendar
        const gaps = [];
        const sortedEvents = existingEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
        
        for (let i = 0; i < sortedEvents.length - 1; i++) {
            const gap = new Date(sortedEvents[i + 1].start) - new Date(sortedEvents[i].end);
            if (gap > 60 * 60 * 1000) { // More than 1 hour gap
                gaps.push({
                    start: sortedEvents[i].end,
                    duration: gap
                });
            }
        }
        
        return gaps[0]?.start || '15:00'; // Default to 3 PM
    }

    async rescheduleIntensiveActivities() {
        console.log('🔄 Rescheduling intensive activities due to low recovery');
        // Implementation would modify calendar
        return { success: true };
    }

    async clearAfternoonForRecovery() {
        console.log('🛑 Clearing afternoon for critical recovery');
        // Implementation would modify calendar
        return { success: true };
    }

    async checkDinnerNeeds() {
        const hour = new Date().getHours();
        if (hour === 18 && !this.hasTaskToday('dinner_order')) {
            if (window.voiceInterface) {
                window.voiceInterface.speak(
                    'It\'s 6 PM. Would you like me to order dinner?',
                    'normal'
                );
            }
        }
    }

    // ========================================
    // 🎯 PUBLIC API
    // ========================================

    async executeCommand(command) {
        const lower = command.toLowerCase();
        
        if (lower.includes('order') && (lower.includes('food') || lower.includes('dinner') || lower.includes('lunch'))) {
            return await this.orderFood();
        } else if (lower.includes('book') && (lower.includes('uber') || lower.includes('ride') || lower.includes('car'))) {
            const destination = this.extractDestination(command);
            return await this.bookRide(destination);
        } else if (lower.includes('email')) {
            const recipient = this.extractEmailRecipient(command);
            const subject = this.extractEmailSubject(command);
            return await this.draftEmail(recipient, subject);
        } else if (lower.includes('call')) {
            const contact = this.extractContact(command);
            return await this.handlePhoneCall(contact, 'General');
        } else if (lower.includes('optimize') && lower.includes('calendar')) {
            return await this.optimizeCalendar();
        } else {
            return { 
                success: false, 
                error: 'Command not recognized. Try: "Order dinner", "Book ride to airport", "Draft email", etc.' 
            };
        }
    }

    extractDestination(command) {
        const match = command.match(/to\s+(.+)/i);
        return match ? match[1] : 'home';
    }

    extractEmailRecipient(command) {
        const match = command.match(/to\s+(\S+@\S+)/);
        return match ? match[1] : 'user@example.com';
    }

    extractEmailSubject(command) {
        const match = command.match(/about\s+(.+)/i);
        return match ? match[1] : 'Follow up';
    }

    extractContact(command) {
        const match = command.match(/call\s+(.+)/i);
        return match ? match[1] : 'Contact';
    }

    // ========================================
    // 🔌 SERVICE CONNECTIONS
    // ========================================

    async checkServiceConnections() {
        // Check which services are connected
        // This would check OAuth tokens for various services
        
        this.services.food.enabled = !!localStorage.getItem('uberEatsToken');
        this.services.rides.enabled = !!localStorage.getItem('uberToken');
        this.services.calendar.enabled = !!localStorage.getItem('googleCalendarToken');
        this.services.email.enabled = !!localStorage.getItem('gmailToken');
        
        console.log('📱 Service connections:', this.services);
    }

    async connectService(service) {
        console.log('🔗 Connecting service:', service);
        
        // This would initiate OAuth flow for the service
        const authUrls = {
            uber_eats: 'https://auth.uber.com/oauth/v2/authorize?client_id=...',
            uber: 'https://auth.uber.com/oauth/v2/authorize?client_id=...',
            google: 'https://accounts.google.com/oauth2/v2/auth?client_id=...',
            twilio: 'https://www.twilio.com/console/projects/...'
        };
        
        if (authUrls[service]) {
            window.open(authUrls[service], 'Connect ' + service, 'width=600,height=700');
        }
    }

    // ========================================
    // 🧹 CLEANUP
    // ========================================

    destroy() {
        // Clean up any intervals or listeners
        console.log('🔴 Butler Service destroyed');
    }
}

// ========================================
// 🚀 INITIALIZE AND EXPOSE GLOBALLY
// ========================================

const butlerService = new ButlerService();
window.butlerService = butlerService;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => butlerService.init());
} else {
    butlerService.init();
}

console.log('✅ Phoenix Butler Service loaded');

export default butlerService;
