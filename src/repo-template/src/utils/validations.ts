import { exit } from 'process';

export const validateEnvVars = (): void => {
    // Validating environment variables
    if (!process.env.ENV_TYPE) {
        console.error('No ENV_TYPE env var defined');
        exit(1);
    }
    /// s3-start ///

    if (!process.env.BUCKET_NAME) {
        console.error('No BUCKET_NAME env var defined');
        exit(1);
    }
    /// s3-end ///
    /// ddb-start ///

    if (!process.env.DDB_NAME) {
        console.error('No DDB_NAME env var defined');
        exit(1);
    }
    /// ddb-end ///
    /// events-start ///

    if (!process.env.EVENT_BUS_NAME) {
        console.error('No EVENT_BUS_NAME env var defined');
        exit(1);
    }
    /// events-end ///
};
