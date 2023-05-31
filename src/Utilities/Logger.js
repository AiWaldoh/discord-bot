const fs = require('fs');

class Logger {
    constructor(logFilePath) {
        this.logFilePath = logFilePath;
        this.initializeConsoleMethods();
    }

    initializeConsoleMethods() {
        console.log = (message) => {
            this.logToFile(message);
            process.stdout.write(`${message}\n`);
        };

        console.error = (message) => {
            this.logToFile(`[ERROR] ${message}`);
            process.stderr.write(`[ERROR] ${message}\n`);
            this.handleResponse("One Moment. I 404 sometimes.");
            process.exit(1);
        };

        console.warn = (message) => {
            this.logToFile(`[WARNING] ${message}`);
            process.stdout.write(`[WARNING] ${message}\n`);
        };
    }

    logToFile(message) {
        const logMessage = `[${new Date().toISOString()}] ${message}\n`;
        fs.appendFileSync(this.logFilePath, logMessage);
    }

    handleResponse(response) {
        // Implement your response handling logic here
        console.log(`Handling response: ${response}`);
    }
}

module.exports = Logger;
