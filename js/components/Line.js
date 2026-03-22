// js/components/Line.js
import { store } from '../store/dataStore.js';
import { RoomComponent } from './Room.js';

export class LineComponent {
    constructor(lineData, container) {
        this.data = lineData;
        this.container = container;
        this.element = null;
        this.roomComponents = [];
        this.expanded = true;
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
        div.className = 'line-card';
        div.setAttribute('data-line', this.data.name);
        
        // Line header
        const header = document.createElement('div');
        header.className = 'line-header';
        header.onclick = () => this.toggleExpand();
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'line-title';
        
        const icon = document.createElement('span');
        icon.className = 'line-icon';
        icon.textContent = '🏭';
        
        const name = document.createElement('span');
        name.className = 'line-name';
        name.textContent = this.data.name;
        
        titleDiv.appendChild(icon);
        titleDiv.appendChild(name);
        
        const statsDiv = document.createElement('div');
        statsDiv.className = 'line-stats';
        
        const totalDrop = document.createElement('span');
        totalDrop.className = 'total-drop';
        totalDrop.textContent = `Total Drop: ${this.data.totalDrop.toFixed(2)} mv`;
        
        const roomCount = document.createElement('span');
        roomCount.textContent = `${this.data.rooms.length} Rooms`;
        
        statsDiv.appendChild(totalDrop);
        statsDiv.appendChild(roomCount);
        
        header.appendChild(titleDiv);
        header.appendChild(statsDiv);
        
        // Rooms container
        this.roomsContainer = document.createElement('div');
        this.roomsContainer.className = 'rooms-grid';
        this.roomsContainer.setAttribute('data-line-content', this.data.name);
        
        div.appendChild(header);
        div.appendChild(this.roomsContainer);
        
        // Render rooms
        this.renderRooms();
        
        return div;
    }

    renderRooms() {
        this.roomsContainer.innerHTML = '';
        this.roomComponents = [];
        
        this.data.rooms.forEach(roomData => {
            const roomComponent = new RoomComponent(roomData, this.roomsContainer);
            this.roomComponents.push(roomComponent);
        });
    }

    update(newData) {
        this.data = newData;
        
        // Update header stats
        const header = this.element.querySelector('.line-header');
        const totalDropSpan = header.querySelector('.total-drop');
        if (totalDropSpan) {
            totalDropSpan.textContent = `Total Drop: ${this.data.totalDrop.toFixed(2)} mv`;
        }
        
        // Update each room
        this.data.rooms.forEach((roomData, index) => {
            if (this.roomComponents[index]) {
                this.roomComponents[index].update(roomData);
            }
        });
        
        // Animate value changes
        this.animateValueChanges();
    }

    toggleExpand() {
        this.expanded = !this.expanded;
        this.roomsContainer.style.display = this.expanded ? 'grid' : 'none';
        
        // Add animation class
        this.element.classList.add('line-toggle-animation');
        setTimeout(() => {
            this.element.classList.remove('line-toggle-animation');
        }, 300);
    }

    animateValueChanges() {
        const valueElements = this.element.querySelectorAll('.workstation-value');
        valueElements.forEach(el => {
            el.classList.add('value-updated');
            setTimeout(() => {
                el.classList.remove('value-updated');
            }, 500);
        });
    }

    getRoomComponent(roomNumber) {
        return this.roomComponents.find(room => room.data.number === roomNumber);
    }

    destroy() {
        this.roomComponents.forEach(room => room.destroy());
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}