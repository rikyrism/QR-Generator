import { exec } from 'child_process';
import path from 'path';

export function restartApp() {
    return new Promise((resolve, reject) => {
        console.log('Preparing for safe application restart...');

        // Use the safe-restart script from package.json
        const process = exec('npm run safe-restart', {
            cwd: path.resolve(process.cwd())
        }, (error) => {
            if (error) {
                console.error('Error during restart:', error);
                reject(error);
                return;
            }
            resolve();
        });

        // Log output to console
        process.stdout ? .on('data', (data) => console.log(data.toString().trim()));
        process.stderr ? .on('data', (data) => console.error(data.toString().trim()));
    });
}