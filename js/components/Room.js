// js/components/Room.js
import { WorkstationComponent } from './Workstation.js';

export class RoomComponent {
    constructor(roomData, container) {
        this.data = roomData;
        this.container = container;
        this.element = null;
        this.workstationComponents = [];
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
        div.className = 'room-card';
        div.setAttribute('data-room', this.data.number);
        
        // Room header
        const header = document.createElement('div');
        header.className = 'room-header';
        
        const title = document.createElement('span');
        title.className = 'room-title';
        title.textContent = this.data.number;
        
        const total = document.createElement('span');
        total.className = 'room-total';
        total.textContent = `Total: ${this.data.totalValue.toFixed(2)} mv`;
        
        header.appendChild(title);
        header.appendChild(total);
        
        // Workstations container
        this.workstationsContainer = document.createElement('div');
        this.workstationsContainer.className = 'workstations-grid';
        
        div.appendChild(header);
        div.appendChild(this.workstationsContainer);
        
        // Render workstations
        this.renderWorkstations();
        
        return div;
    }

    renderWorkstations() {
        this.workstationsContainer.innerHTML = '';
        this.workstationComponents = [];
        
        this.data.workstations.forEach(wsData => {
            const wsComponent = new WorkstationComponent(wsData, this.workstationsContainer);
            this.workstationComponents.push(wsComponent);
        });
    }

    update(newData) {
        this.data = newData;
        
        // Update header total
        const header = this.element.querySelector('.room-header');
        const totalSpan = header.querySelector('.room-total');
        if (totalSpan) {
            totalSpan.textContent = `Total: ${this.data.totalValue.toFixed(2)} mv`;
        }
        
        // Update each workstation
        this.data.workstations.forEach((wsData, index) => {
            if (this.workstationComponents[index]) {
                this.workstationComponents[index].update(wsData);
            }
        });
    }

    getWorkstationComponent(wsName) {
        return this.workstationComponents.find(ws => ws.data.name === wsName);
    }

    destroy() {
        this.workstationComponents.forEach(ws => ws.destroy());
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}