// EnvWrapper.js
require('dotenv').config(); // Load environment variables from a .env file into process.env

class EnvWrapper {
    // Method to get an environment variable
    get(key) {
        // Access the environment variable from process.env
        return process.env[key];
    }

    // You can add other necessary methods...
}

module.exports = EnvWrapper;
