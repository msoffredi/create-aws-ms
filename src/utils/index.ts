import path from 'path';
import url from 'url';
import spawn from 'cross-spawn';
import { InstallerModules, npmPackages } from '../config';

export class U {
    public static targetDir = process.cwd();

    // Alternative to __dirname
    public static sourceDir = path.resolve(
        path.dirname(url.fileURLToPath(import.meta.url)) + '/..',
    );
    public static templateDir = path.resolve(this.sourceDir, 'repo-template');

    public static installPackages = (mods: InstallerModules): void => {
        npmPackages.forEach((pkg) => {
            spawn.sync(pkg.cmd, pkg.args);
        });

        for (const prop in mods) {
            if (
                mods[prop]!.packages &&
                mods[prop]!.type === 'module' &&
                mods[prop]!.value
            ) {
                mods[prop]!.packages?.forEach((pkg) => {
                    spawn.sync('npm', [
                        'install',
                        pkg.dev ? '--save-dev' : '--save',
                        pkg.name,
                    ]);
                });
            }
        }
    };
}
