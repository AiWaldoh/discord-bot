// EnvWrapper.js
require('dotenv').config();

class EnvWrapper {
    get(key) {
        return process.env[key];
    }
}

module.exports = EnvWrapper;
