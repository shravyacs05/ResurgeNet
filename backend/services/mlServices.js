const axios = require('axios');

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

class MLService {
    constructor() {
        this.client = axios.create({
            baseURL: ML_API_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Log initialization
        console.log(`ML Service initialized with base URL: ${ML_API_URL}`);
    }

    async checkHealth() {
        try {
            const response = await this.client.get('/health');
            return response.data;
        } catch (error) {
            console.error('ML Service health check failed:', error.message);
            throw new Error(`ML Service health check failed: ${error.message}`);
        }
    }

    async predictMessage(message) {
        try {
            console.log(`Sending prediction request for message: "${message.substring(0, 50)}..."`);
            
            const response = await this.client.post('/predict', { message });
            
            console.log('Prediction successful');
            return response.data;
        } catch (error) {
            console.error('Prediction failed:', error.message);
            
            if (error.response) {
                throw new Error(`Prediction failed: ${error.response.data.detail || error.message}`);
            } else if (error.request) {
                throw new Error('ML Service is not responding. Make sure the FastAPI server is running.');
            } else {
                throw new Error(`Prediction failed: ${error.message}`);
            }
        }
    }

    // ADD THIS METHOD for SOS-specific predictions
    async predictSOS(message) {
        try {
            console.log(`Sending SOS prediction request for message: "${message.substring(0, 50)}..."`);
            
            const response = await this.client.post('/predict', { 
                message,
                message_type: 'sos'
            });
            
            console.log('SOS Prediction successful:', response.data);
            return response.data;
        } catch (error) {
            console.error('SOS Prediction failed:', error.message);
            
            if (error.response) {
                throw new Error(`SOS Prediction failed: ${error.response.data.detail || error.message}`);
            } else if (error.request) {
                throw new Error('ML Service is not responding. Make sure the FastAPI server is running.');
            } else {
                throw new Error(`SOS Prediction failed: ${error.message}`);
            }
        }
    }

    async predictBatch(messages) {
        try {
            console.log(`Sending batch prediction request for ${messages.length} messages`);
            
            const response = await this.client.post('/predict_batch', { messages });
            
            console.log('Batch prediction successful');
            return response.data;
        } catch (error) {
            console.error('Batch prediction failed:', error.message);
            
            if (error.response) {
                throw new Error(`Batch prediction failed: ${error.response.data.detail || error.message}`);
            } else if (error.request) {
                throw new Error('ML Service is not responding. Make sure the FastAPI server is running.');
            } else {
                throw new Error(`Batch prediction failed: ${error.message}`);
            }
        }
    }

    async getCategories() {
        try {
            const response = await this.client.get('/categories');
            return response.data;
        } catch (error) {
            console.error('Failed to get categories:', error.message);
            throw new Error(`Failed to get categories: ${error.message}`);
        }
    }
    
    async predictInteractive(message) {
        try {
            const response = await this.client.post('/predict_interactive', { message });
            return response.data;
        } catch (error) {
            throw new Error(`Interactive prediction failed: ${error.message}`);
        }
    }

    // Test connection to ML service
    async testConnection() {
        try {
            await this.checkHealth();
            console.log('✅ ML Service connection successful');
            return true;
        } catch (error) {
            console.log('❌ ML Service connection failed:', error.message);
            return false;
        }
    }
}

// Create singleton instance
const mlService = new MLService();

// Test connection on startup
mlService.testConnection();

module.exports = mlService;