const { spawn } = require('child_process');

class PythonExecutor {
    runPythonScript(fileName, command) {
        const process = spawn('python3', [fileName, ...command]);
        const output = [];

        return new Promise((resolve, reject) => {
            process.stdout.on('data', (data) => {
                output.push(data.toString().trim());
            });

            process.stderr.on('data', (data) => {
                reject(data.toString().trim());
            });

            process.on('exit', (code) => {
                if (code === 0) {
                    console.log(`Child process exited with code ${code}`);
                    resolve(output.join('\n'));
                } else {
                    console.log(`Child process exited with error code ${code}`);
                    reject(`Child process exited with error code ${code}`);
                }
            });
        });
    }
}

exports.PythonExecutor = PythonExecutor;