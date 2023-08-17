import inquirer, { Answers } from 'inquirer';
import { exit } from 'process';
import nodeFs from 'fs';
import path from 'path';
import { U } from './index';
import { InstallerModules } from '../config';

const dotFiles = ['gitignore', 'eslintrc.json'];

export class FS {
    public static checkTargetFolderEmpty = async () => {
        // Warning on non-empty folder
        if (!(await this.isDirEmpty(U.targetDir))) {
            const answers: Answers = await inquirer.prompt([
                {
                    name: 'empty',
                    message:
                        'Warning: installing in non-empty folder and files may get overwritten. Proceed anyways?',
                    type: 'confirm',
                    default: false,
                },
            ]);

            if (
                answers &&
                answers['empty'] !== undefined &&
                !answers['empty']
            ) {
                console.log('Installer aborted!');
                exit(1);
            }
        }
    };

    public static isDirEmpty = async (dirname: string): Promise<boolean> => {
        const readDir = (dirname: string): Promise<string[]> => {
            return new Promise((resolve, reject) => {
                nodeFs.readdir(dirname, (err, files) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(files);
                    }
                });
            });
        };

        return (await readDir(dirname)).length === 0;
    };

    public static renameFiles = async (
        mods: InstallerModules,
    ): Promise<void> => {
        // Rename dot files
        dotFiles.forEach((file) => {
            nodeFs.renameSync(
                path.join(U.targetDir, file),
                path.join(U.targetDir, `.${file}`),
            );
        });

        // API-related renames
        if (mods.api && mods.api.value) {
            nodeFs.renameSync(
                path.join(U.targetDir, 'src/handlers/ms-api.ts'),
                path.join(
                    U.targetDir,
                    `src/handlers/${mods['ms-name']!.value}-api.ts`,
                ),
            );
        }
    };

    public static getAllFiles = (
        dirPath: string,
        arrayOfFiles: string[] = [],
        ignorePatterns: string[] = [],
    ) => {
        const files = nodeFs.readdirSync(dirPath);

        files.forEach((file) => {
            if (!ignorePatterns.find((pat) => pat === file)) {
                if (nodeFs.statSync(dirPath + '/' + file).isDirectory()) {
                    // Scan if it's a folder
                    arrayOfFiles = this.getAllFiles(
                        dirPath + '/' + file,
                        arrayOfFiles,
                    );
                } else {
                    arrayOfFiles.push(path.join(dirPath, file));
                }
            }
        });

        return arrayOfFiles;
    };

    public static copyFiles = (mods: InstallerModules): void => {
        // Iterate through modules in config
        for (const prop in mods) {
            // If module has files/folders to copy...
            if (mods[prop]?.copyTasks) {
                // Iterate through all files/folders to copy
                mods[prop]?.copyTasks?.forEach((task) => {
                    // If it's a filder to copy non-recursively
                    if (
                        !Boolean(task.recursive) &&
                        nodeFs.statSync(task.src).isDirectory()
                    ) {
                        // Get all files in the directory
                        const files = nodeFs.readdirSync(task.src);
                        files.forEach((file) => {
                            // Copy them only if they are not folders
                            if (
                                !nodeFs
                                    .statSync(path.join(task.src, file))
                                    .isDirectory()
                            ) {
                                nodeFs.cpSync(
                                    path.join(task.src, file),
                                    path.join(task.target, file),
                                );
                            }
                        });
                    } else {
                        // Individual files and folder recursively are copied here
                        nodeFs.cpSync(task.src, task.target, {
                            recursive: Boolean(task.recursive),
                        });
                    }
                });
            }
        }
    };
}
