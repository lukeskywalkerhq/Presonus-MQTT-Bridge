# Use a Node.js base image with LTS (Long Term Support) and Alpine for a smaller image
FROM node:20-alpine

# Install git and other necessary tools
# git is needed because your application clones a repository at runtime.
RUN apk add --no-cache git

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to leverage Docker cache
# This helps in not re-installing dependencies if only source code changes
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of your application code to the container
# This includes all your .ts files and config.json
COPY . .

# Build the TypeScript application
# Assuming your tsconfig.json is set up to output to a 'dist' directory
RUN npm run build # Or `npx tsc` if you don't have a build script in package.json

# Expose any ports your application might be listening on (e.g., for web servers, if applicable)
# Replace 1883 with the actual port your MQTT or other services might use
# If your app doesn't expose a port, you can omit this.
# EXPOSE 1883

# Command to run your application
# Ensure your 'main' script in package.json points to the compiled JS file
# For example, if main.ts compiles to dist/main.js
CMD [ "node", "dist/main.js" ]