import yup from 'yup';
import { U } from './utils';
import path from 'path';

interface Package {
    name: string;
    dev?: boolean;
}

interface CopyTask {
    src: string;
    target: string;
    recursive?: boolean;
}

interface InstallerModule {
    prompt: string;
    promptType?: 'input' | 'confirm';
    promptDefault?: string | boolean;
    validation: yup.Schema;
    validationErrorMsg: string;
    varName?: string;
    value?: string | boolean;
    type: 'module' | 'variable';
    dependencies?: InstallerModules;
    packages?: Package[];
    copyTasks?: CopyTask[];
}

export interface InstallerModules {
    [key: string]: InstallerModule;
}

/**
 * This is an object with properties representing all the possible
 * customizations available for the installer to consider/use.
 *
 * Some of these are entire modules, and others are simple data used
 * when processing templates to customize parts of some files.
 */
export const config: InstallerModules = {
    'ms-name': {
        prompt: 'Provide a microservice name (a-zA-Z9-0-)',
        validation: yup
            .string()
            .required()
            .min(3)
            .max(64)
            .matches(/^[a-zA-Z][a-zA-Z0-9-]+[a-zA-Z0-9]$/),
        validationErrorMsg: 'Invalid microservice name',
        type: 'variable',
        copyTasks: [
            { src: U.templateDir, target: U.targetDir },
            {
                src: path.join(U.templateDir, 'src/utils'),
                target: path.join(U.targetDir, 'src/utils'),
                recursive: true,
            },
        ],
        packages: [{ name: '@jmsoffredi/ms-common' }],
    },
    'ms-description': {
        prompt: 'Provide a microservice description (128 chars max)',
        validation: yup.string().required().min(10).max(128),
        validationErrorMsg: 'Invalid microservice description',
        type: 'variable',
    },
    api: {
        prompt: 'Do you need a REST API (y/N)?',
        promptType: 'confirm',
        promptDefault: false,
        validation: yup.boolean().required(),
        validationErrorMsg: 'Possible answers Y or N',
        type: 'module',
        dependencies: {
            'use-domain': {
                prompt:
                    'Do you want to configure a domain name ? ' +
                    '[The domain needs to be already configured in AWS Route 53] (y/N)?',
                promptType: 'confirm',
                promptDefault: false,
                validation: yup.boolean().required(),
                validationErrorMsg: 'Possible answers Y or N',
                type: 'module',
                dependencies: {
                    'domain-name': {
                        prompt: 'Provide a domain name',
                        validation: yup
                            .string()
                            .matches(
                                /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/g,
                            )
                            .required(),
                        validationErrorMsg: 'Invalid domain name',
                        type: 'variable',
                    },
                    'certificate-arn': {
                        prompt: 'SSL certificate ARN for the domain provided',
                        validation: yup
                            .string()
                            .matches(
                                /^arn:aws:acm:\w+(?:-\w+)+:\d{12}:certificate\/[A-Za-z0-9]+(?:-[A-Za-z0-9]+)+$/g,
                            )
                            .required(),
                        validationErrorMsg: 'Invalid certiciate ARN',
                        type: 'variable',
                    },
                },
            },
        },
        copyTasks: [
            {
                src: path.join(U.templateDir, 'src/handlers/ms-api.ts'),
                target: path.join(U.targetDir, 'src/handlers/ms-api.ts'),
            },
            {
                src: path.join(U.templateDir, 'src/route-handlers'),
                target: path.join(U.targetDir, 'src/route-handlers'),
                recursive: true,
            },
        ],
    },
    s3: {
        prompt: 'Do you need an S3 bucket (y/N)?',
        promptType: 'confirm',
        promptDefault: false,
        validation: yup.boolean().required(),
        validationErrorMsg: 'Possible answers Y or N',
        type: 'module',
        dependencies: {
            'bucket-name': {
                prompt: 'Provide a bucket name (a-z9-0-.)',
                validation: yup
                    .string()
                    .required()
                    .min(3)
                    .max(63)
                    .matches(/^[a-z0-9][a-z0-9-\.]+[a-z0-9]$/),
                validationErrorMsg: 'Invalid bucket name',
                type: 'variable',
            },
        },
        packages: [{ name: '@aws-sdk/client-s3' }],
    },
    ddb: {
        prompt: 'Do you need a DynamoDB table (y/N)?',
        promptType: 'confirm',
        promptDefault: false,
        validation: yup.boolean().required(),
        validationErrorMsg: 'Possible answers Y or N',
        type: 'module',
        dependencies: {
            'ddb-table-name': {
                prompt: 'Provide a DynamoDB table name (a-z9-0-_.)',
                validation: yup
                    .string()
                    .required()
                    .min(3)
                    .max(255)
                    .matches(/^[a-zA-Z0-9][a-zA-Z0-9-_\.]*[a-zA-Z0-9]$/),
                validationErrorMsg: 'Invalid DynamoDB table name',
                type: 'variable',
            },
        },
        packages: [
            // { name: 'jsonwebtoken' },
            // { name: '@types/jsonwebtoken', dev: true },
        ],
    },
    events: {
        prompt: 'Do you need events support (y/N)?',
        promptType: 'confirm',
        promptDefault: false,
        validation: yup.boolean().required(),
        validationErrorMsg: 'Possible answers Y or N',
        type: 'module',
        packages: [],
    },
};

//
/**
 * File extensions to be processed as templates. The installer will
 * attempt to process any file with these extensions.
 *
 * Processing a non-template file should be harmless and the installer
 * should leave the file unchanged.
 */
export const processableFiles = ['.js', '.ts', '.yml', '.yaml'];

/**
 * Files and folders to ignore when processing templates. This is necessary
 * to enable installing on a non-empty folder.
 */
export const ignorePatterns = ['node_modules'];

interface NpmPackageType {
    cmd: string;
    args?: string[];
}

/**
 * Npm packages to install independently of the customization of the
 * install.
 */
export const npmPackages: NpmPackageType[] = [
    { cmd: 'npm', args: ['install'] },
    { cmd: 'npm', args: ['install', '@msoffredi/ms-common'] },
    { cmd: 'npm', args: ['install', '--save-dev', '@types/aws-lambda'] },
    { cmd: 'npm', args: ['install', '--save-dev', '@types/jest'] },
    { cmd: 'npm', args: ['install', '--save-dev', '@tsconfig/node18'] },
    { cmd: 'npm', args: ['install', '--save-dev', '@types/node@18'] },
    { cmd: 'npm', args: ['install', '--save-dev', 'jest'] },
    { cmd: 'npm', args: ['install', '--save-dev', 'ts-jest'] },
    { cmd: 'npm', args: ['install', '--save-dev', 'ts-node'] },
    { cmd: 'npm', args: ['install', '--save-dev', 'typescript'] },
    {
        cmd: 'npm',
        args: ['install', '--save-dev', '@typescript-eslint/eslint-plugin'],
    },
    {
        cmd: 'npm',
        args: ['install', '--save-dev', '@typescript-eslint/parser'],
    },
    { cmd: 'npm', args: ['install', '--save-dev', 'aws-sdk-client-mock'] },
    { cmd: 'npm', args: ['install', '--save-dev', 'eslint'] },
];
