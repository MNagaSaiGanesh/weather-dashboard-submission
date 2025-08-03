// Weather Dashboard Application
class WeatherDashboard {
    constructor() {
        this.config = {
            openMeteoApiUrl: "https://archive-api.open-meteo.com/v1/archive",
            mapConfig: {
                center: [52.52, 13.41],
                zoom: 10,
                minZoom: 8,
                maxZoom: 12
            },
            timelineConfig: {
                daysBefore: 15,
                daysAfter: 15,
                hourlyResolution: true
            },
            polygonConfig: {
                minPoints: 3,
                maxPoints: 12,
                defaultStyle: {
                    color: "#1890ff",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.6
                }
            },
            colorRules: [
                { operator: "<", value: 10, color: "#ff4d4f", label: "Cold" },
                { operator: ">=", value: 10, operatorSecond: "<", valueSecond: 25, color: "#faad14", label: "Moderate" },
                { operator: ">=", value: 25, color: "#52c41a", label: "Warm" }
            ]
        };

        this.state = {
            timelineMode: 'single', // 'single' or 'range'
            selectedTime: new Date(),
            selectedTimeRange: { start: new Date(), end: new Date() },
            polygons: [],
            isDrawing: false,
            currentPolygon: null,
            map: null,
            drawingPoints: [],
            apiCache: new Map(),
            pendingPolygon: null // Store polygon data while waiting for confirmation
        };

        this.init();
    }

    async init() {
        this.setupTimeline();
        this.setupMap();
        this.setupEventListeners();
        this.updateTimelineDisplay();
        this.showNotification('Dashboard initialized successfully', 'success');
    }

    // Timeline Management
    setupTimeline() {
        const now = new Date();
        this.state.timelineStart = new Date(now.getTime() - (this.config.timelineConfig.daysBefore * 24 * 60 * 60 * 1000));
        this.state.timelineEnd = new Date(now.getTime() + (this.config.timelineConfig.daysAfter * 24 * 60 * 60 * 1000));
        this.state.selectedTime = now;
        this.state.selectedTimeRange.start = new Date(now.getTime() - (2 * 60 * 60 * 1000)); // 2 hours before
        this.state.selectedTimeRange.end = now;

        this.setupTimelineInteraction();
    }

    setupTimelineInteraction() {
        const track = document.getElementById('timelineTrack');
        const primaryHandle = document.getElementById('primaryHandle');
        const secondaryHandle = document.getElementById('secondaryHandle');
        const range = document.getElementById('timelineRange');

        let isDragging = false;
        let activeHandle = null;

        const getTimeFromPosition = (x) => {
            const trackRect = track.getBoundingClientRect();
            const percent = Math.max(0, Math.min(1, (x - trackRect.left) / trackRect.width));
            const totalTime = this.state.timelineEnd.getTime() - this.state.timelineStart.getTime();
            return new Date(this.state.timelineStart.getTime() + (percent * totalTime));
        };

        const updateHandlePosition = (handle, time) => {
            const totalTime = this.state.timelineEnd.getTime() - this.state.timelineStart.getTime();
            const timeOffset = time.getTime() - this.state.timelineStart.getTime();
            const percent = Math.max(0, Math.min(1, timeOffset / totalTime));
            handle.style.left = `${percent * 100}%`;
        };

        const updateRange = () => {
            if (this.state.timelineMode === 'range') {
                const startPercent = (this.state.selectedTimeRange.start.getTime() - this.state.timelineStart.getTime()) / 
                                   (this.state.timelineEnd.getTime() - this.state.timelineStart.getTime());
                const endPercent = (this.state.selectedTimeRange.end.getTime() - this.state.timelineStart.getTime()) / 
                                 (this.state.timelineEnd.getTime() - this.state.timelineStart.getTime());
                
                range.style.left = `${startPercent * 100}%`;
                range.style.width = `${(endPercent - startPercent) * 100}%`;
            } else {
                const percent = (this.state.selectedTime.getTime() - this.state.timelineStart.getTime()) / 
                               (this.state.timelineEnd.getTime() - this.state.timelineStart.getTime());
                range.style.left = `${percent * 100}%`;
                range.style.width = '2px';
            }
        };

        const handleMouseDown = (e, handle) => {
            isDragging = true;
            activeHandle = handle;
            e.preventDefault();
        };

        const handleMouseMove = (e) => {
            if (!isDragging || !activeHandle) return;
            
            const newTime = getTimeFromPosition(e.clientX);
            
            if (this.state.timelineMode === 'single') {
                this.state.selectedTime = newTime;
                updateHandlePosition(primaryHandle, newTime);
            } else {
                if (activeHandle === primaryHandle) {
                    this.state.selectedTimeRange.start = newTime;
                    if (this.state.selectedTimeRange.start > this.state.selectedTimeRange.end) {
                        this.state.selectedTimeRange.end = this.state.selectedTimeRange.start;
                        updateHandlePosition(secondaryHandle, this.state.selectedTimeRange.end);
                    }
                    updateHandlePosition(primaryHandle, this.state.selectedTimeRange.start);
                } else {
                    this.state.selectedTimeRange.end = newTime;
                    if (this.state.selectedTimeRange.end < this.state.selectedTimeRange.start) {
                        this.state.selectedTimeRange.start = this.state.selectedTimeRange.end;
                        updateHandlePosition(primaryHandle, this.state.selectedTimeRange.start);
                    }
                    updateHandlePosition(secondaryHandle, this.state.selectedTimeRange.end);
                }
            }
            
            updateRange();
            this.updateTimelineDisplay();
        };

        const handleMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                activeHandle = null;
                this.onTimelineChange();
            }
        };

        const handleTrackClick = (e) => {
            if (isDragging) return;
            
            const newTime = getTimeFromPosition(e.clientX);
            
            if (this.state.timelineMode === 'single') {
                this.state.selectedTime = newTime;
                updateHandlePosition(primaryHandle, newTime);
            } else {
                // For range mode, set the start time and keep the current duration
                const duration = this.state.selectedTimeRange.end.getTime() - this.state.selectedTimeRange.start.getTime();
                this.state.selectedTimeRange.start = newTime;
                this.state.selectedTimeRange.end = new Date(newTime.getTime() + duration);
                updateHandlePosition(primaryHandle, this.state.selectedTimeRange.start);
                updateHandlePosition(secondaryHandle, this.state.selectedTimeRange.end);
            }
            
            updateRange();
            this.updateTimelineDisplay();
            this.onTimelineChange();
        };

        // Event listeners
        primaryHandle.addEventListener('mousedown', (e) => handleMouseDown(e, primaryHandle));
        secondaryHandle.addEventListener('mousedown', (e) => handleMouseDown(e, secondaryHandle));
        track.addEventListener('click', handleTrackClick);
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        // Initialize positions
        updateHandlePosition(primaryHandle, this.state.selectedTime);
        updateHandlePosition(secondaryHandle, this.state.selectedTimeRange.end);
        updateRange();
    }

    updateTimelineDisplay() {
        document.getElementById('startLabel').textContent = this.formatDateTime(this.state.timelineStart);
        document.getElementById('endLabel').textContent = this.formatDateTime(this.state.timelineEnd);
        
        const selectedTimeText = document.getElementById('selectedTimeText');
        if (this.state.timelineMode === 'single') {
            selectedTimeText.textContent = `Selected: ${this.formatDateTime(this.state.selectedTime)}`;
        } else {
            selectedTimeText.textContent = `Range: ${this.formatDateTime(this.state.selectedTimeRange.start)} - ${this.formatDateTime(this.state.selectedTimeRange.end)}`;
        }
    }

    formatDateTime(date) {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Map Management
    async setupMap() {
        this.state.map = L.map('map', {
            center: this.config.mapConfig.center,
            zoom: this.config.mapConfig.zoom,
            minZoom: this.config.mapConfig.minZoom,
            maxZoom: this.config.mapConfig.maxZoom
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.state.map);

        this.setupMapInteraction();
    }

    setupMapInteraction() {
        this.state.map.on('click', (e) => {
            if (this.state.isDrawing) {
                this.addPolygonPoint(e.latlng);
            }
        });

        this.state.map.on('dblclick', (e) => {
            if (this.state.isDrawing) {
                e.originalEvent.preventDefault();
                this.completePolygon();
            }
        });
    }

    // Polygon Drawing
    startDrawing() {
        this.state.isDrawing = true;
        this.state.drawingPoints = [];
        this.state.currentPolygon = null;
        
        document.getElementById('startDrawingBtn').classList.add('hidden');
        document.getElementById('cancelDrawingBtn').classList.remove('hidden');
        document.getElementById('drawingInstructions').classList.remove('hidden');
        
        this.state.map.getContainer().style.cursor = 'crosshair';
        this.showNotification('Click on the map to start drawing a polygon', 'info');
    }

    cancelDrawing() {
        this.state.isDrawing = false;
        this.state.drawingPoints = [];
        this.state.pendingPolygon = null;
        
        if (this.state.currentPolygon) {
            this.state.map.removeLayer(this.state.currentPolygon);
            this.state.currentPolygon = null;
        }
        
        this.resetDrawingUI();
        this.showNotification('Polygon drawing cancelled', 'info');
    }

    addPolygonPoint(latlng) {
        this.state.drawingPoints.push(latlng);
        
        if (this.state.currentPolygon) {
            this.state.map.removeLayer(this.state.currentPolygon);
        }
        
        if (this.state.drawingPoints.length >= 2) {
            this.state.currentPolygon = L.polygon(this.state.drawingPoints, {
                ...this.config.polygonConfig.defaultStyle,
                interactive: false
            }).addTo(this.state.map);
        }
        
        // Show progress
        const remaining = Math.max(0, this.config.polygonConfig.minPoints - this.state.drawingPoints.length);
        if (remaining > 0) {
            this.showNotification(`Add ${remaining} more points (minimum)`, 'info');
        } else if (this.state.drawingPoints.length < this.config.polygonConfig.maxPoints) {
            this.showNotification(`Double-click to complete polygon (${this.state.drawingPoints.length}/${this.config.polygonConfig.maxPoints} points)`, 'info');
        }
        
        if (this.state.drawingPoints.length >= this.config.polygonConfig.maxPoints) {
            this.completePolygon();
        }
    }

    async completePolygon() {
        if (this.state.drawingPoints.length < this.config.polygonConfig.minPoints) {
            this.showNotification(`Minimum ${this.config.polygonConfig.minPoints} points required`, 'error');
            return;
        }
        
        // Prepare polygon data for confirmation
        this.state.pendingPolygon = {
            coordinates: this.state.drawingPoints.map(p => [p.lat, p.lng]),
            centroid: this.calculateCentroid(this.state.drawingPoints),
            layer: this.state.currentPolygon
        };
        
        this.state.isDrawing = false;
        this.resetDrawingUI();
        
        // Show data source selection modal
        this.showDataSourceModal();
    }

    showDataSourceModal() {
        const modal = document.getElementById('dataSourceModal');
        modal.classList.remove('hidden');
        
        // Ensure the radio button is selected
        const radioButton = document.querySelector('input[name="dataSource"][value="temperature"]');
        if (radioButton) {
            radioButton.checked = true;
        }
    }

    async confirmDataSource() {
        if (!this.state.pendingPolygon) {
            this.showNotification('No polygon to confirm', 'error');
            return;
        }

        const selectedDataSource = document.querySelector('input[name="dataSource"]:checked');
        if (!selectedDataSource) {
            this.showNotification('Please select a data source', 'error');
            return;
        }
        
        // Remove the temporary drawing layer if it exists
        if (this.state.currentPolygon) {
            this.state.map.removeLayer(this.state.currentPolygon);
        }
        
        const polygonId = Date.now().toString();
        const polygon = {
            id: polygonId,
            coordinates: this.state.pendingPolygon.coordinates,
            dataSource: selectedDataSource.value,
            layer: null,
            data: null,
            centroid: this.state.pendingPolygon.centroid
        };
        
        // Create the actual polygon layer with default styling
        polygon.layer = L.polygon(this.state.pendingPolygon.coordinates.map(coord => [coord[0], coord[1]]), {
            ...this.config.polygonConfig.defaultStyle,
            fillColor: '#cccccc' // Default gray until data is loaded
        }).addTo(this.state.map);
        
        // Add popup
        polygon.layer.bindPopup(`
            <div>
                <strong>Polygon ${this.state.polygons.length + 1}</strong><br>
                <em>Loading weather data...</em>
            </div>
        `);
        
        // Add to polygons array
        this.state.polygons.push(polygon);
        
        // Clean up temporary state
        this.state.drawingPoints = [];
        this.state.currentPolygon = null;
        this.state.pendingPolygon = null;
        
        // Hide modal
        document.getElementById('dataSourceModal').classList.add('hidden');
        
        // Update UI immediately
        this.updatePolygonList();
        
        // Fetch and apply data
        await this.updatePolygonData(polygon);
        
        this.showNotification('Polygon created successfully!', 'success');
    }

    calculateCentroid(points) {
        let lat = 0, lng = 0;
        points.forEach(point => {
            lat += point.lat;
            lng += point.lng;
        });
        return {
            lat: lat / points.length,
            lng: lng / points.length
        };
    }

    resetDrawingUI() {
        document.getElementById('startDrawingBtn').classList.remove('hidden');
        document.getElementById('cancelDrawingBtn').classList.add('hidden');
        document.getElementById('drawingInstructions').classList.add('hidden');
        this.state.map.getContainer().style.cursor = '';
    }

    // Weather Data API
    async fetchWeatherData(lat, lng, date) {
        const cacheKey = `${lat.toFixed(2)}_${lng.toFixed(2)}_${date.toISOString().split('T')[0]}`;
        
        if (this.state.apiCache.has(cacheKey)) {
            return this.state.apiCache.get(cacheKey);
        }
        
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        
        const params = new URLSearchParams({
            latitude: lat.toFixed(4),
            longitude: lng.toFixed(4),
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            hourly: 'temperature_2m',
            timezone: 'auto'
        });
        
        try {
            const response = await fetch(`${this.config.openMeteoApiUrl}?${params}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.state.apiCache.set(cacheKey, data);
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async updatePolygonData(polygon) {
        this.showLoadingOverlay(true);
        
        try {
            const targetTime = this.state.timelineMode === 'single' 
                ? this.state.selectedTime 
                : this.state.selectedTimeRange.start;
                
            const weatherData = await this.fetchWeatherData(
                polygon.centroid.lat,
                polygon.centroid.lng,
                targetTime
            );
            
            const hourIndex = targetTime.getHours();
            const temperature = weatherData.hourly?.temperature_2m?.[hourIndex];
            
            if (temperature !== undefined) {
                polygon.data = {
                    temperature: temperature,
                    timestamp: targetTime
                };
                
                // Apply color based on temperature
                const color = this.getColorForTemperature(temperature);
                polygon.layer.setStyle({ fillColor: color });
                
                // Update popup
                polygon.layer.setPopupContent(`
                    <div>
                        <strong>Polygon ${this.state.polygons.indexOf(polygon) + 1}</strong><br>
                        <strong>Temperature:</strong> ${temperature.toFixed(1)}°C<br>
                        <strong>Time:</strong> ${this.formatDateTime(targetTime)}<br>
                        <strong>Location:</strong> ${polygon.centroid.lat.toFixed(3)}, ${polygon.centroid.lng.toFixed(3)}
                    </div>
                `);
                
                this.updateApiStatus('success', `Last updated: ${new Date().toLocaleTimeString()}`);
                
                // Update polygon list after data is loaded
                this.updatePolygonList();
            } else {
                throw new Error('No temperature data available');
            }
        } catch (error) {
            console.error('Error updating polygon data:', error);
            polygon.layer.setStyle({ fillColor: '#999999' });
            polygon.layer.setPopupContent(`
                <div>
                    <strong>Polygon ${this.state.polygons.indexOf(polygon) + 1}</strong><br>
                    <em style="color: #ff4d4f;">Error loading weather data</em>
                </div>
            `);
            this.updateApiStatus('error', 'Failed to fetch weather data');
            this.showNotification('Failed to fetch weather data', 'error');
        } finally {
            this.showLoadingOverlay(false);
        }
    }

    getColorForTemperature(temp) {
        for (const rule of this.config.colorRules) {
            if (rule.operatorSecond) {
                // Range rule (e.g., >= 10 and < 25)
                if (this.evaluateOperator(temp, rule.operator, rule.value) && 
                    this.evaluateOperator(temp, rule.operatorSecond, rule.valueSecond)) {
                    return rule.color;
                }
            } else {
                // Single condition rule
                if (this.evaluateOperator(temp, rule.operator, rule.value)) {
                    return rule.color;
                }
            }
        }
        return '#cccccc'; // Default color
    }

    evaluateOperator(value, operator, threshold) {
        switch (operator) {
            case '<': return value < threshold;
            case '<=': return value <= threshold;
            case '>': return value > threshold;
            case '>=': return value >= threshold;
            case '=': return value === threshold;
            default: return false;
        }
    }

    // UI Updates
    updatePolygonList() {
        const polygonList = document.getElementById('polygonList');
        
        if (this.state.polygons.length === 0) {
            polygonList.innerHTML = '<p class="empty-state">No polygons created yet</p>';
            return;
        }
        
        polygonList.innerHTML = this.state.polygons.map((polygon, index) => `
            <div class="polygon-item">
                <div class="polygon-info">
                    <div class="polygon-name">Polygon ${index + 1}</div>
                    <div class="polygon-data">
                        ${polygon.data ? 
                            `${polygon.data.temperature.toFixed(1)}°C` : 
                            'Loading...'}
                    </div>
                </div>
                <div class="polygon-actions">
                    <button class="btn btn--sm btn--outline" onclick="dashboard.deletePolygon('${polygon.id}')">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }

    deletePolygon(polygonId) {
        const polygonIndex = this.state.polygons.findIndex(p => p.id === polygonId);
        if (polygonIndex >= 0) {
            const polygon = this.state.polygons[polygonIndex];
            this.state.map.removeLayer(polygon.layer);
            this.state.polygons.splice(polygonIndex, 1);
            this.updatePolygonList();
            this.showNotification('Polygon deleted', 'info');
        }
    }

    async onTimelineChange() {
        if (this.state.polygons.length === 0) return;
        
        this.showLoadingOverlay(true);
        
        try {
            for (const polygon of this.state.polygons) {
                await this.updatePolygonData(polygon);
            }
            this.updatePolygonList();
        } finally {
            this.showLoadingOverlay(false);
        }
    }

    showLoadingOverlay(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    updateApiStatus(status, message) {
        const statusElement = document.getElementById('apiStatus');
        const statusClass = status === 'success' ? 'status--success' : 
                           status === 'error' ? 'status--error' : 'status--info';
        
        statusElement.innerHTML = `<div class="status ${statusClass}">${message}</div>`;
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    // Sidebar toggle functionality
    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const isCollapsed = sidebar.classList.contains('collapsed');
        
        if (isCollapsed) {
            sidebar.classList.remove('collapsed');
            sidebar.style.transform = 'translateX(0)';
        } else {
            sidebar.classList.add('collapsed');
            sidebar.style.transform = 'translateX(-280px)';
        }
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Timeline mode toggle
        document.getElementById('singleModeBtn').addEventListener('click', () => {
            this.setTimelineMode('single');
        });
        
        document.getElementById('rangeModeBtn').addEventListener('click', () => {
            this.setTimelineMode('range');
        });
        
        // Polygon drawing controls
        document.getElementById('startDrawingBtn').addEventListener('click', () => {
            this.startDrawing();
        });
        
        document.getElementById('cancelDrawingBtn').addEventListener('click', () => {
            this.cancelDrawing();
        });
        
        // Modal controls
        document.getElementById('closeModal').addEventListener('click', () => {
            document.getElementById('dataSourceModal').classList.add('hidden');
            this.cancelDrawing();
        });
        
        document.getElementById('confirmDataSource').addEventListener('click', () => {
            this.confirmDataSource();
        });
        
        // Map controls
        document.getElementById('centerMapBtn').addEventListener('click', () => {
            this.state.map.setView(this.config.mapConfig.center, this.config.mapConfig.zoom);
        });
        
        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            this.toggleSidebar();
        });
        
        // Modal background click to close
        document.getElementById('dataSourceModal').addEventListener('click', (e) => {
            if (e.target.id === 'dataSourceModal') {
                document.getElementById('dataSourceModal').classList.add('hidden');
                this.cancelDrawing();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.state.isDrawing) {
                    this.cancelDrawing();
                }
                // Close modal if open
                const modal = document.getElementById('dataSourceModal');
                if (!modal.classList.contains('hidden')) {
                    modal.classList.add('hidden');
                    this.cancelDrawing();
                }
            }
        });
    }

    setTimelineMode(mode) {
        this.state.timelineMode = mode;
        
        // Update button states
        document.getElementById('singleModeBtn').classList.toggle('active', mode === 'single');
        document.getElementById('rangeModeBtn').classList.toggle('active', mode === 'range');
        
        // Show/hide secondary handle
        const secondaryHandle = document.getElementById('secondaryHandle');
        if (mode === 'range') {
            secondaryHandle.classList.remove('hidden');
        } else {
            secondaryHandle.classList.add('hidden');
        }
        
        // Update range display
        const range = document.getElementById('timelineRange');
        if (mode === 'single') {
            const percent = (this.state.selectedTime.getTime() - this.state.timelineStart.getTime()) / 
                           (this.state.timelineEnd.getTime() - this.state.timelineStart.getTime());
            range.style.left = `${percent * 100}%`;
            range.style.width = '2px';
        } else {
            const startPercent = (this.state.selectedTimeRange.start.getTime() - this.state.timelineStart.getTime()) / 
                               (this.state.timelineEnd.getTime() - this.state.timelineStart.getTime());
            const endPercent = (this.state.selectedTimeRange.end.getTime() - this.state.timelineStart.getTime()) / 
                             (this.state.timelineEnd.getTime() - this.state.timelineStart.getTime());
            
            range.style.left = `${startPercent * 100}%`;
            range.style.width = `${(endPercent - startPercent) * 100}%`;
        }
        
        this.updateTimelineDisplay();
        
        // Trigger polygon updates if any exist
        if (this.state.polygons.length > 0) {
            this.onTimelineChange();
        }
    }
}

// Initialize dashboard when DOM is loaded
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new WeatherDashboard();
});

// Make dashboard available globally for button callbacks
window.dashboard = dashboard;