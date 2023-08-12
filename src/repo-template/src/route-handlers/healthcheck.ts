import {
    HealthcheckResponseBody,
    ServiceStatus,
    RouteHandler,
} from '@msoffredi/ms-common';

export const healthcheckHandler: RouteHandler =
    async (): Promise<HealthcheckResponseBody> => {
        return {
            serviceStatus: ServiceStatus.Healthy,
        };
    };
