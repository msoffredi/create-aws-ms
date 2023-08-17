#!/usr/bin/env node

import { config } from './config';
import { U } from './utils/index';
import { FS } from './utils/fs';
import { IO } from './utils/io';
import { Custom } from './utils/custom';

console.log('Source:', U.sourceDir);
console.log('Target:', U.targetDir);
console.log('Template:', U.templateDir);

const asyncInstaller = async () => {
    // Confirm on non-empty folder
    await FS.checkTargetFolderEmpty();

    // Customize modules to install
    await IO.customizeInstall(config);

    // Copy template files
    console.log('Copying files...');
    FS.copyFiles(config);

    // Rename files
    console.log('Renaming files...');
    FS.renameFiles(config);

    // Update package.json name, description
    console.log('Updating package.json...');
    Custom.updatePackageJson(config);

    // Process files with template variables
    console.log('Customizing files...');
    Custom.processAll(config);

    // Install packages
    console.log('Installing packages...');
    U.installPackages(config);

    console.log('Microservice setup finished!');
};

asyncInstaller();
