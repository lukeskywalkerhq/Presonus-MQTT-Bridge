# Use a Node.js base image with LTS (Long Term Support) and Alpine for a smaller image
FROM node:20-alpine

# Install git and other necessary tools
# git is needed because your application clones a repository at runtime.
RUN apk add --no-cache git

# Set the working directory inside the container
WORKDIR /app

# Copy ALL application files first, including package.json, package-lock.json,
# tsconfig.json, and the 'src' directory.
# This ensures that 'tsc' can find everything it needs when called.
COPY . .

# Install project dependencies
# This will also run your 'install' script from package.json, which runs 'transpile'.
# We'll then explicitly run 'build' afterwards for clarity and robustness.
RUN npm install

# Explicitly build the TypeScript application.
# Your 'build' script runs 'lint clean transpile'.
# We want to ensure the final JavaScript files are in 'dist'.
RUN npm run build

# Expose any ports your application might be listening on (e.g., for web servers, if applicable)
# Replace 1883 with the actual port your MQTT or other services might use
# If your app doesn't expose a port, you can omit this.
# EXPOSE 1883

# Command to run your application
# Ensure your 'main' script in package.json points to the compiled JS file
CMD [ "node", "dist/main.js" ]