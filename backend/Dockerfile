# Base Node.js image
FROM node:18

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

# Expose the backend port
EXPOSE 5002

# Start server
CMD ["npm", "start"]
