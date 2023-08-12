import path from 'path';
import nodeFs from 'fs';
import { U } from './index';
import { FS } from './fs';
import { InstallerModules, ignorePatterns, processableFiles } from '../config';

export class Custom {
    public static updatePackageJson = (mods: InstallerModules) => {
        const packageJson = JSON.parse(
            nodeFs.readFileSync(path.join(U.targetDir, 'package.json'), 'utf8'),
        );

        packageJson.name = mods['ms-name']!.value;
        packageJson.description = mods['ms-description']!.value;

        nodeFs.writeFileSync(
            path.join(U.targetDir, 'package.json'),
            JSON.stringify(packageJson, null, 2),
        );
    };

    public static processFile = (
        fileContent: string,
        mods: InstallerModules,
        delimiter = '###',
    ): string => {
        // Direct replacements
        const varRegex = new RegExp(
            `${delimiter} ([a-zA-Z][a-zA-Z0-9-]+[a-zA-Z0-9]) ${delimiter}`,
            'g',
        );
        let newContent = fileContent.replace(varRegex, (match, p1): string => {
            if (
                typeof p1 === 'string' &&
                p1 &&
                mods[p1] &&
                mods[p1]!.type === 'variable' &&
                typeof mods[p1]!.value === 'string' &&
                mods[p1]!.value
            ) {
                return mods[p1]!.value as string;
            }
            return match;
        });

        // Modules
        for (const prop in mods) {
            if (
                mods[prop]!.type === 'module' &&
                typeof mods[prop]!.value === 'boolean'
            ) {
                if (mods[prop]!.value) {
                    const modRegex = new RegExp(
                        `${delimiter} ${prop}-(start|end) ${delimiter}`,
                        'g',
                    );
                    newContent = newContent.replace(modRegex, '');

                    if (mods[prop]!.dependencies) {
                        newContent = this.processFile(
                            newContent,
                            mods[prop]!.dependencies as InstallerModules,
                        );
                    }
                } else {
                    const modRegex = new RegExp(
                        `${delimiter} ${prop}-start ${delimiter}.+?${delimiter} ${prop}-end ${delimiter}`,
                        'gs',
                    );
                    newContent = newContent.replace(modRegex, '');
                }
            }
        }

        return newContent;
    };

    // Process all "processable" files
    public static processAll = (mods: InstallerModules) => {
        const files = FS.getAllFiles(U.targetDir, [], ignorePatterns);

        files.forEach((file) => {
            if (processableFiles.includes(path.extname(file).toLowerCase())) {
                let fileContent = nodeFs.readFileSync(file, 'utf8');
                fileContent = this.processFile(
                    fileContent,
                    mods,
                    this.getDelimiter(path.extname(file).toLowerCase()),
                );
                nodeFs.writeFileSync(file, fileContent);
            }
        });
    };

    private static getDelimiter = (ext: string): string => {
        if (['.js', '.ts'].includes(ext)) {
            return '///';
        }

        return '###';
    };
}
