FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Install Playwright browsers
RUN npx playwright install chromium

# Install CloudBees Smart Tests (Launchable) CLI and git
RUN apt-get update && \
    apt-get install -y python3 python3-pip openjdk-17-jre-headless git && \
    pip3 install launchable && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy playwright config (tests come from ConfigMap)
COPY playwright.config.js ./

# Keep container running - tests will be executed via kubectl exec
CMD ["tail", "-f", "/dev/null"]
