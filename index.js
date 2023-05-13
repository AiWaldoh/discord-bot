const BotRunner = require('./src/BotRunner');

(async function main() {
  const botRunner = new BotRunner();
  botRunner.messageEmitter.on('response', botRunner.handleResponse.bind(botRunner));
  await botRunner.runBot();
})();
