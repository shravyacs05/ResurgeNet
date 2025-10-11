// frontend/src/services/chatApiService.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

class ChatApiService {
  async sendMessage(message, chatHistory = []) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          chatHistory
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to send message');
      }

      return data.data.response;

    } catch (error) {
      console.error('Chat API call failed:', error);
      throw new Error('Failed to connect to chat service. Please try again.');
    }
  }

  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

const chatApiService = new ChatApiService();
export default chatApiService;