// js/app.js
import { store } from './store/dataStore.js';
import { LineComponent } from './components/Line.js';

class WorkshopDashboard {
    constructor() {
        this.lineComponents = new Map();
        this.refreshInterval = null;
        this.refreshRate = 1000; // 1 second
        this.isRunning = false;
    }

    async init() {
        console.log('🚀 Initializing Workshop Digital Twin Dashboard...');
        
        // Subscribe to store updates
        store.subscribe('dashboard', this.render.bind(this));
        
        // Initialize UI
        this.initUI();
        
        // Start real-time data updates
        await this.startRealTimeUpdates();
        
        // Setup event listeners
        this.setupEventListeners();
        
        this.isRunning = true;
        console.log('✅ Dashboard initialized successfully');
        this.showToast('System Online', 'success');
    }

    initUI() {
        const container = document.getElementById('dashboardContainer');
        if (container) {
            container.innerHTML = '';
        }
        this.updateLastUpdated();
    }

    generateMockData() {
        // Generate realistic mock data for 6 lines
        const lines = {};
        const lineNames = ['LINE-1', 'LINE-2', 'LINE-3', 'LINE-4', 'LINE-5', 'LINE-6'];
        
        lineNames.forEach((lineName, idx) => {
            const rooms = {};
            
            // 2 rooms per line
            for (let r = 1; r <= 2; r++) {
                const roomNumber = r + (idx * 2);
                const roomKey = `ROOM-${roomNumber}`;
                const workstations = {};
                
                // 5 Propella and 5 Subpropella per room
                for (let i = 1; i <= 5; i++) {
                    workstations[`PROPELLA-${i}`] = Math.floor(Math.random() * 400) + 100;
                    workstations[`SUBPROPELLA-${i}`] = Math.floor(Math.random() * 300) + 50;
                }
                
                rooms[roomKey] = workstations;
            }
            
            lines[lineName] = rooms;
        });
        
        return lines;
    }

    async startRealTimeUpdates() {
        // Initial data load
        const mockData = this.generateMockData();
        store.setLinesData(mockData);
        store.setState({ loading: false, lastUpdated: new Date() });
        this.updateLastUpdated();

        // Start interval for real-time updates
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        this.refreshInterval = setInterval(() => {
            this.updateDataInRealTime();
        }, this.refreshRate);
    }

    updateDataInRealTime() {
        const lines = store.getLines();
        
        lines.forEach(line => {
            line.rooms.forEach(room => {
                room.workstations.forEach(ws => {
                    // Simulate real-time value changes
                    const change = (Math.random() - 0.5) * 20; // -10 to +10
                    let newValue = ws.value + change;
                    newValue = Math.max(0, Math.min(1000, newValue)); // Clamp between 0-1000
                    
                    // Update store
                    store.updateWorkstationValue(line.name, room.number, ws.name, newValue);
                });
            });
        });
        
        this.updateLastUpdated();
    }

    render(state) {
        const { lines, loading } = state;
        const container = document.getElementById('dashboardContainer');
        
        if (!container) return;

        // Show loading state
        if (loading && lines.length === 0) {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading workshop data...</p>
                </div>
            `;
            return;
        }

        // Update or create line components
        lines.forEach(lineData => {
            if (this.lineComponents.has(lineData.name)) {
                // Update existing component
                const component = this.lineComponents.get(lineData.name);
                component.update(lineData);
            } else {
                // Create new component
                const lineComponent = new LineComponent(lineData, container);
                this.lineComponents.set(lineData.name, lineComponent);
            }
        });

        // Remove components for lines that no longer exist
        const currentLineNames = new Set(lines.map(l => l.name));
        for (const [name, component] of this.lineComponents) {
            if (!currentLineNames.has(name)) {
                component.destroy();
                this.lineComponents.delete(name);
            }
        }
    }

    updateLastUpdated() {
        const elem = document.getElementById('lastUpdated');
        if (elem) {
            elem.textContent = `Last updated: ${this.formatTime(new Date())}`;
        }
    }

    formatTime(date) {
        if (!date) return '--:--:--';
        const d = new Date(date);
        return d.toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        toast.innerHTML = `
            <span>${icon}</span>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showError(message) {
        const container = document.getElementById('dashboardContainer');
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = message;
            errorDiv.style.cssText = `
                background: #ef4444;
                color: white;
                padding: 1rem;
                border-radius: 0.5rem;
                margin-bottom: 1rem;
                text-align: center;
            `;
            container.prepend(errorDiv);
            
            setTimeout(() => {
                errorDiv.remove();
            }, 5000);
        }
    }

    setupEventListeners() {
        // Manual refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                this.showToast('Refreshing data...', 'info');
                await this.startRealTimeUpdates();
                this.showToast('Data refreshed successfully', 'success');
            });
        }
        
        // Network status listeners
        window.addEventListener('online', () => {
            this.showToast('Network restored', 'success');
            this.startRealTimeUpdates();
        });
        
        window.addEventListener('offline', () => {
            this.showToast('Network disconnected', 'error');
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = null;
            }
        });
        
        // Tab visibility - reduce updates when tab is inactive
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('Tab inactive - reducing update frequency');
                if (this.refreshInterval) {
                    clearInterval(this.refreshInterval);
                    this.refreshInterval = null;
                }
            } else {
                console.log('Tab active - resuming updates');
                if (!this.refreshInterval && this.isRunning) {
                    this.refreshInterval = setInterval(() => {
                        this.updateDataInRealTime();
                    }, this.refreshRate);
                }
            }
        });
        
        // Keyboard shortcut: Ctrl+R for manual refresh
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.showToast('Manual refresh triggered', 'info');
                this.startRealTimeUpdates();
            }
        });
    }

    // Public methods
    async refresh() {
        await this.startRealTimeUpdates();
    }
    
    stop() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        this.isRunning = false;
    }
    
    start() {
        if (!this.refreshInterval && !this.isRunning) {
            this.startRealTimeUpdates();
            this.isRunning = true;
        }
    }
}

// Add CSS animations for value updates
const style = document.createElement('style');
style.textContent = `
    .value-updated {
        animation: valueFlash 0.4s ease-in-out;
    }
    
    @keyframes valueFlash {
        0% {
            background: rgba(37, 99, 235, 0);
        }
        50% {
            background: rgba(37, 99, 235, 0.3);
        }
        100% {
            background: rgba(37, 99, 235, 0);
        }
    }
    
    .line-card {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .line-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    }
    
    .workstation-card {
        transition: all 0.2s ease;
        cursor: pointer;
    }
    
    .workstation-card:active {
        transform: scale(0.98);
    }
    
    .toast {
        animation: slideInRight 0.3s ease-out;
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .error-message {
        animation: slideDown 0.3s ease-out;
    }
    
    @keyframes slideDown {
        from {
            transform: translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new WorkshopDashboard();
    window.dashboard.init();
});

// Export for debugging (optional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WorkshopDashboard };
}