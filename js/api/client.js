// API Client with Retry Logic, Circuit Breaker, and Error Handling
class APIClient {
    constructor(config = {}) {
        this.baseURL = config.baseURL || 'http://localhost:5000/api';
        this.maxRetries = config.maxRetries || 3;
        this.timeout = config.timeout || 5000;
        this.retryDelay = config.retryDelay || 1000;
        this.cache = new Map();
        this.circuitBreaker = {
            failures: 0,
            lastFailure: null,
            state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
            threshold: 5,
            timeout: 30000
        };
    }

    async request(endpoint, options = {}) {
        // Check circuit breaker
        if (this.circuitBreaker.state === 'OPEN') {
            const now = Date.now();
            if (now - this.circuitBreaker.lastFailure > this.circuitBreaker.timeout) {
                this.circuitBreaker.state = 'HALF_OPEN';
                console.log('Circuit breaker: HALF_OPEN - testing service');
            } else {
                throw new Error('Service temporarily unavailable');
            }
        }

        let lastError;
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await this._fetchWithTimeout(endpoint, options);
                
                // Success - reset circuit breaker
                if (this.circuitBreaker.state !== 'CLOSED') {
                    this._resetCircuitBreaker();
                }
                
                return response;
            } catch (error) {
                lastError = error;
                console.warn(`Attempt ${attempt}/${this.maxRetries} failed:`, error.message);
                
                // Record failure for circuit breaker
                this._recordFailure();
                
                if (attempt === this.maxRetries) {
                    throw error;
                }
                
                // Exponential backoff
                const delay = this.retryDelay * Math.pow(2, attempt - 1);
                await this._delay(delay);
            }
        }
        throw lastError;
    }

    async _fetchWithTimeout(endpoint, options) {
        const url = `${this.baseURL}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    _recordFailure() {
        this.circuitBreaker.failures++;
        this.circuitBreaker.lastFailure = Date.now();
        
        if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
            this.circuitBreaker.state = 'OPEN';
            console.error('Circuit breaker: OPEN - service unavailable');
        }
    }

    _resetCircuitBreaker() {
        this.circuitBreaker.failures = 0;
        this.circuitBreaker.state = 'CLOSED';
        console.log('Circuit breaker: CLOSED - service restored');
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Convenience methods
    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
}

export const apiClient = new APIClient({
    baseURL: 'http://localhost:5000/api',
    maxRetries: 3,
    timeout: 5000
});