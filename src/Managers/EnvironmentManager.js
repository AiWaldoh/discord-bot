// EnvironmentManager.js
const EnvWrapper = require('../Utilities/EnvWrapper');

class EnvironmentManager {
    constructor() {
        // Initialize an instance of EnvWrapper
        this.env = new EnvWrapper();
    }

    // Method to get environment variable
    getEnvVariable(key) {
        // Use the EnvWrapper's get method to fetch the environment variable
        return this.env.get(key);
    }

    // You can add other necessary methods to manage your environment variables...
}

module.exports = EnvironmentManager;
