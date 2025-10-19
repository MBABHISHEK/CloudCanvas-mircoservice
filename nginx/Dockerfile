# Use the official Nginx image as the base
FROM nginx:latest

# Remove the default nginx.conf
RUN rm /etc/nginx/nginx.conf

# Copy your custom nginx.conf into the container
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]