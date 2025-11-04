#!/bin/bash

# Define the root directory name
PROJECT_ROOT="hirehub-backend"

# 1. Create the root directory
echo "Creating root directory: $PROJECT_ROOT"
mkdir $PROJECT_ROOT
cd $PROJECT_ROOT

# 2. Create all directories using -p (parent directories as needed)
echo "Creating sub-directories..."
mkdir -p config controllers middleware models routes utils

# 3. Create files within the directories
echo "Creating files..."

# config/
touch config/database.js
touch config/cloudinary.js

# controllers/
touch controllers/authController.js
touch controllers/userController.js

# middleware/
touch middleware/auth.js
touch middleware/validation.js
touch middleware/upload.js

# models/
touch models/User.js

# routes/
touch routes/auth.js
touch routes/users.js

# utils/
touch utils/validation.js
touch utils/helpers.js

# Root files
touch .env
touch server.js
touch package.json

echo "✅ Project structure for $PROJECT_ROOT created successfully."