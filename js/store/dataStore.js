// Centralized State Management with Observer Pattern
class DataStore {
    constructor() {
        this.state = {
            lines: [],
            loading: false,
            error: null,
            lastUpdated: null,
            stats: {
                totalWorkstations: 0,
                activeWorkstations: 0,
                avgValue: 0,
                maxValue: 0,
                minValue: 0
            }
        };
        this.listeners = new Map();
        this.history = []; // For trend analysis
        this.maxHistoryLength = 100;
    }

    // Subscribe to state changes
    subscribe(componentId, callback) {
        if (!this.listeners.has(componentId)) {
            this.listeners.set(componentId, callback);
        }
        return () => this.listeners.delete(componentId);
    }

    // Notify all subscribers
    _notify() {
        this.listeners.forEach(callback => {
            try {
                callback(this.state);
            } catch (error) {
                console.error('Listener error:', error);
            }
        });
    }

    // Update state
    setState(updates) {
        this.state = { ...this.state, ...updates };
        this._notify();
    }

    // Update workstation value with history
    updateWorkstationValue(lineName, roomNumber, workstationName, value) {
        // Save to history for trend analysis
        const key = `${lineName}|${roomNumber}|${workstationName}`;
        if (!this.history[key]) {
            this.history[key] = [];
        }
        
        this.history[key].push({
            value,
            timestamp: Date.now()
        });
        
        // Keep only last N entries
        if (this.history[key].length > this.maxHistoryLength) {
            this.history[key].shift();
        }

        // Update actual data
        const newLines = [...this.state.lines];
        const lineIndex = newLines.findIndex(l => l.name === lineName);
        
        if (lineIndex !== -1) {
            const roomIndex = newLines[lineIndex].rooms.findIndex(
                r => r.number === roomNumber
            );
            
            if (roomIndex !== -1) {
                const wsIndex = newLines[lineIndex].rooms[roomIndex].workstations.findIndex(
                    ws => ws.name === workstationName
                );
                
                if (wsIndex !== -1) {
                    const oldValue = newLines[lineIndex].rooms[roomIndex].workstations[wsIndex].value;
                    const trend = this._calculateTrend(key, value);
                    
                    newLines[lineIndex].rooms[roomIndex].workstations[wsIndex] = {
                        ...newLines[lineIndex].rooms[roomIndex].workstations[wsIndex],
                        value: value,
                        previousValue: oldValue,
                        trend: trend,
                        timestamp: new Date()
                    };
                    
                    // Recalculate room totals
                    newLines[lineIndex].rooms[roomIndex].totalValue = newLines[lineIndex].rooms[roomIndex].workstations.reduce(
                        (sum, ws) => sum + ws.value, 0
                    );
                    
                    // Recalculate line totals
                    newLines[lineIndex].totalDrop = newLines[lineIndex].rooms.reduce(
                        (sum, room) => sum + room.totalValue, 0
                    );
                    
                    this.setState({ lines: newLines });
                    this._updateStats();
                }
            }
        }
    }

    _calculateTrend(key, currentValue) {
        const history = this.history[key];
        if (!history || history.length < 2) return 'stable';
        
        const previousValue = history[history.length - 2].value;
        const change = ((currentValue - previousValue) / previousValue) * 100;
        
        if (change > 2) return 'up';
        if (change < -2) return 'down';
        return 'stable';
    }

    _updateStats() {
        const allValues = [];
        let activeCount = 0;
        
        this.state.lines.forEach(line => {
            line.rooms.forEach(room => {
                room.workstations.forEach(ws => {
                    allValues.push(ws.value);
                    if (ws.value > 0) activeCount++;
                });
            });
        });
        
        const totalWorkstations = allValues.length;
        const avgValue = allValues.reduce((a, b) => a + b, 0) / totalWorkstations;
        const maxValue = Math.max(...allValues);
        const minValue = Math.min(...allValues);
        
        this.setState({
            stats: {
                totalWorkstations,
                activeWorkstations: activeCount,
                avgValue: avgValue.toFixed(2),
                maxValue: maxValue.toFixed(2),
                minValue: minValue.toFixed(2)
            }
        });
    }

    // Bulk update from API
    setLinesData(data) {
        const transformedLines = this._transformAPIData(data);
        this.setState({ lines: transformedLines });
        this._updateStats();
    }

    _transformAPIData(apiData) {
        // Transform API response to UI structure
        // Expected format: { "Line1": { "Room1": { "Propella1": value, ... } } }
        const lines = [];
        
        for (const [lineName, rooms] of Object.entries(apiData)) {
            const line = {
                name: lineName,
                rooms: [],
                totalDrop: 0,
                expanded: true
            };
            
            for (const [roomNumber, workstations] of Object.entries(rooms)) {
                const room = {
                    number: roomNumber,
                    workstations: [],
                    totalValue: 0
                };
                
                for (const [wsName, value] of Object.entries(workstations)) {
                    const wsData = {
                        name: wsName,
                        value: value,
                        previousValue: value,
                        trend: 'stable',
                        timestamp: new Date()
                    };
                    room.workstations.push(wsData);
                    room.totalValue += value;
                }
                
                line.rooms.push(room);
                line.totalDrop += room.totalValue;
            }
            
            lines.push(line);
        }
        
        return lines;
    }

    // Getter methods
    getLines() {
        return this.state.lines;
    }

    getStats() {
        return this.state.stats;
    }

    isLoading() {
        return this.state.loading;
    }

    getError() {
        return this.state.error;
    }
}

export const store = new DataStore();