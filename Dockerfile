# Use a lightweight Node.js image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package files and install dependencies
# Doing this first caches the node_modules layer, speeding up future builds
COPY package*.json ./
RUN npm install --only=production

# Copy the rest of your application code (index.js)
COPY . .

# Expose the port your app runs on
EXPOSE 4000

# Start the application
CMD ["node", "index.js"]