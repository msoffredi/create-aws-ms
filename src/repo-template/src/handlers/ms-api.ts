import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    BadRequestError,
    CustomError,
    ResponseBody,
    BadMethodError,
} from '@msoffredi/ms-common';
import { validateEnvVars } from '../utils/validations';
import { healthcheckHandler } from '../route-handlers/healthcheck';

export const handler = async (
    event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
    console.log('Received event:', event);

    validateEnvVars();

    let status = 200;
    let body: ResponseBody = null;
    // const perm = Config.userService;

    try {
        switch (event.resource) {
            case '/private':
                if (event.httpMethod === 'GET') {
                    body = await healthcheckHandler(event);
                } else {
                    throw new BadMethodError();
                }
                break;

            case '/healthcheck':
                if (event.httpMethod === 'GET') {
                    body = await healthcheckHandler(event);
                } else {
                    throw new BadMethodError();
                }
                break;

            default:
                // We should never reach this point if the API Gateway is configured properly
                throw new BadRequestError();
        }
    } catch (err) {
        console.error(err);

        if (err instanceof CustomError) {
            status = err.statusCode;
            body = err.serializeErrors();
        }
    }

    return {
        statusCode: status,
        body: JSON.stringify(body),
        headers: {
            // CORS enabled, but should be improved with your domain(s)
            // for production environments
            'Access-Control-Allow-Origin': '*',
        },
    };
};
