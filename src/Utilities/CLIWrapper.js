const pty = require('node-pty');
const util = require('util');
const events = require('events');

class CLIWrapper {
    constructor() {
        this.shell = 'bash';
    }

    runCommand(command) {
        return new Promise((resolve, reject) => {
            const ptyProcess = pty.spawn(this.shell, ['-c', command], {
                name: 'xterm-color',
                cols: 80,
                rows: 30,
                cwd: process.cwd(),
                env: process.env
            });

            //SUCCESS
            let output = `ok$ ${command}\n`;
            let hasExited = false;

            ptyProcess.on('data', (data) => {
                output += data;
            });

            ptyProcess.on('exit', (exitCode) => {
                hasExited = true;
                if (exitCode === 0) {
                    resolve(output);
                } else {
                    reject(new Error(`error$ "${command}" \n ${exitCode}`));
                }
            });

            //ERROR
            ptyProcess.on('error', (error) => {
                if (!hasExited && error.message !== 'read EIO') {
                    reject(new Error(`error$ "${command}" \n ${error.message}`));
                } else if (error.message === 'read EIO') {
                    resolve(output);
                }
            });


            // Reject the promise if command takes longer than X seconds
            setTimeout(() => {
                if (!hasExited) {
                    reject(new Error(`Command "${command}" taking longer than 30 seconds to execute`));
                }
            }, 30000);
        });
    }
}


module.exports = CLIWrapper;
