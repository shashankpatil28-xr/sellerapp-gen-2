# Stage 1: Build the Angular application
FROM node:20-alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --no-optional

# Copy the rest of the application code
COPY . .

# Build the Angular application for production
RUN npm run build 

# Stage 2: Serve the application with Nginx
FROM nginx:alpine
# Set the working directory to nginx asset directory
WORKDIR /usr/share/nginx/html

# Remove default Nginx static assets
RUN rm -rf ./*

# Copy the built Angular application from the build stage to the Nginx public directory
# Ensure 'test-sellerapp' matches the output path from the build command
COPY --from=build /app/dist/test-sellerapp/browser /usr/share/nginx/html

# Copy custom Nginx configuration for Angular routing
COPY nginx.conf /etc/nginx/conf.d/default.conf


EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]