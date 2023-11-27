# Use an official Node runtime as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the current directory contents into the container at /usr/src/app
COPY . .

# Install any needed packages specified in package.json
RUN npm install

# build the app
RUN npm run build || true

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define environment variable
ENV NODE_ENV=production
# Get all the environment variables
ARG PRIVATE_KEY
ARG PINATA_API_KEY
ARG DUCKY_ASSET_CONTRACT
ARG PORT
ARG GATEWAY_KEY
ARG GATEWAY_URL
ARG FRONTEND_URL

# Set the environment variables
ENV PRIVATE_KEY=$PRIVATE_KEY
ENV PINATA_API_KEY=$PINATA_API_KEY
ENV DUCKY_ASSET_CONTRACT=$DUCKY_ASSET_CONTRACT
ENV PORT=$PORT
ENV GATEWAY_KEY=$GATEWAY_KEY
ENV GATEWAY_URL=$GATEWAY_URL
ENV FRONTEND_URL=$FRONTEND_URL

# Run the app when the container launches
CMD ["npm", "run", "start"]
