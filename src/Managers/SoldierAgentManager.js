const SoldierAgent = require('../Agents/SoldierAgent');

class SoldierAgentManager {
    constructor() {
        this.soldierAgent = null;
    }

    async executeTask(command) {
        try {
            if (!this.soldierAgent) {
                // Create a new soldier agent if it doesn't exist
                this.soldierAgent = new SoldierAgent();
            }

            // Execute the task using the soldier agent
            const result = await this.soldierAgent.executeTask(command);

            // Handle the result as needed
            console.log('Task execution result:', result);

            return result;
        } catch (error) {
            console.error('Error executing task:', error);
            // Handle the error scenario
        }
    }

    async cleanup() {
        if (this.soldierAgent) {
            // Clean up the soldier agent if it exists
            await this.soldierAgent.cleanup();
            this.soldierAgent = null;
        }
    }
}

module.exports = SoldierAgentManager;
