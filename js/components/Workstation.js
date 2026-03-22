// js/components/Workstation.js

export class WorkstationComponent {
    constructor(workstationData, container) {
        this.data = workstationData;
        this.container = container;
        this.element = null;
        this.previousValue = workstationData.value;
        this.render();
    }

    render() {
        if (!this.element) {
            this.element = this.createElement();
            this.container.appendChild(this.element);
        } else {
            this.updateElement();
        }
    }

    createElement() {
        const div = document.createElement('div');
        div.className = 'workstation-card';
        div.setAttribute('data-workstation', this.data.name);
        div.setAttribute('data-value', this.data.value);
        
        // Workstation name
        const nameSpan = document.createElement('div');
        nameSpan.className = 'workstation-name';
        nameSpan.title = this.data.name;
        nameSpan.textContent = this.data.name;
        
        // Value container
        const valueContainer = document.createElement('div');
        valueContainer.className = 'workstation-value-container';
        
        this.valueSpan = document.createElement('span');
        this.valueSpan.className = 'workstation-value';
        this.valueSpan.textContent = this.formatValue(this.data.value);
        
        const unitSpan = document.createElement('span');
        unitSpan.className = 'workstation-unit';
        unitSpan.textContent = 'mv';
        
        this.trendSpan = document.createElement('span');
        this.trendSpan.className = `trend-indicator ${this.data.trend}`;
        
        valueContainer.appendChild(this.valueSpan);
        valueContainer.appendChild(unitSpan);
        valueContainer.appendChild(this.trendSpan);
        
        // Timestamp
        this.timestampSpan = document.createElement('div');
        this.timestampSpan.className = 'workstation-timestamp';
        this.timestampSpan.textContent = this.formatTime(this.data.timestamp);
        
        div.appendChild(nameSpan);
        div.appendChild(valueContainer);
        div.appendChild(this.timestampSpan);
        
        // Add tooltip on hover
        div.setAttribute('data-tooltip', `Last updated: ${this.formatTime(this.data.timestamp)}`);
        
        return div;
    }

    updateElement() {
        const newValue = this.data.value;
        const oldValue = this.previousValue;
        
        // Animate value change
        if (newValue !== oldValue) {
            this.animateValueChange();
        }
        
        // Update value
        this.valueSpan.textContent = this.formatValue(newValue);
        
        // Update trend indicator
        this.trendSpan.className = `trend-indicator ${this.data.trend}`;
        
        // Update timestamp
        this.timestampSpan.textContent = this.formatTime(this.data.timestamp);
        
        // Update tooltip
        this.element.setAttribute('data-tooltip', `Last updated: ${this.formatTime(this.data.timestamp)}`);
        
        // Add color based on value
        this.updateValueColor(newValue);
        
        this.previousValue = newValue;
    }

    update(newData) {
        this.data = newData;
        this.updateElement();
    }

    animateValueChange() {
        this.element.classList.add('value-updated');
        setTimeout(() => {
            this.element.classList.remove('value-updated');
        }, 500);
        
        // Add ripple effect
        this.addRippleEffect();
    }

    addRippleEffect() {
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        this.element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    updateValueColor(value) {
        // Change color based on value range
        if (value < 100) {
            this.valueSpan.style.color = '#10b981'; // green - low
        } else if (value < 300) {
            this.valueSpan.style.color = '#f59e0b'; // orange - medium
        } else {
            this.valueSpan.style.color = '#ef4444'; // red - high
        }
    }

    formatValue(value) {
        return typeof value === 'number' ? value.toFixed(2) : value;
    }

    formatTime(timestamp) {
        if (!timestamp) return '--:--:--';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}