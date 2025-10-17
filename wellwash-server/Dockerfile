# Use Node.js version 20 to match your project's requirements
FROM node:20-alpine

# Create and define the working directory for the app
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker's build cache
COPY package*.json ./

# Install app dependencies inside the container
RUN npm install

# Copy the rest of your application's source code
COPY . .

# Your app runs on port 8002, so expose it
EXPOSE 8002

# Define the command to run your app
CMD ["node", "function-v2.js"]