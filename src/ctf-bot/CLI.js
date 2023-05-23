const pty = require('node-pty');
const util = require('util');
const events = require('events');

class CLI {
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

            let output = '';
            let hasExited = false;

            ptyProcess.on('data', (data) => {
                output += data;
            });

            ptyProcess.on('exit', (exitCode) => {
                hasExited = true;
                if (exitCode === 0) {
                    resolve(output);
                } else {
                    reject(new Error(`Command "${command}" exited with code ${exitCode}`));
                }
            });

            ptyProcess.on('error', (error) => {
                if (!hasExited && error.message !== 'read EIO') {
                    reject(new Error(`Failed to run command "${command}". Error: ${error.message}`));
                } else if (error.message === 'read EIO') {
                    resolve(output);
                }
            });


            // Reject the promise if command takes longer than 5 seconds
            setTimeout(() => {
                if (!hasExited) {
                    reject(new Error(`Command "${command}" taking longer than 30 seconds to execute`));
                }
            }, 30000);
        });
    }
}


module.exports = CLI;
