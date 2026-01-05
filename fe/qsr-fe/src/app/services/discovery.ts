import { API_ENDPOINTS } from '../constants';

const PORT_RANGE = [8080, 8081, 8082, 8083];

export async function discoverBackends(): Promise<string[]> {
    const available: string[] = [];

    const scanPromises = PORT_RANGE.map(async (port) => {
        const url = `http://localhost:${port}`;
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 1000);

            const response = await fetch(`${url}${API_ENDPOINTS.HEALTH}`, {
                signal: controller.signal,
            });

            clearTimeout(id);

            if (response.ok) {
                return url;
            }
        } catch (e) {
            return null;
        }
        return null;
    });

    const results = await Promise.all(scanPromises);
    return results.filter((url): url is string => url !== null);
}
