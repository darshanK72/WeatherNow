// 'use strict';

import { updateWeather, error404 } from "./app.js";

const defaultLocation = "#/weather?lat=51.5073219&lon=-0.1276474"; // London

const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
};

const currentLocation = async () => {
    try {
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;
        await updateWeather(`lat=${latitude}`, `lon=${longitude}`);
    } catch (error) {
        console.error("Failed to get current location:", error);
        window.location.hash = defaultLocation;
    }
};

const searchLocation = async (query) => {
    try {
        const [lat, lon] = query.split('&');
        await updateWeather(lat, lon);
    } catch (error) {
        console.error("Failed to update weather for location:", error);
        error404();
    }
};

const routes = new Map([
    ["/current-location", currentLocation],
    ["/weather", searchLocation]
]);

const checkHash = async () => {
    try {
        const requestURL = window.location.hash.slice(1);
        const [route, query] = requestURL.includes('?') ? requestURL.split("?") : [requestURL];
        
        const handler = routes.get(route);
        if (handler) {
            await handler(query);
        } else {
            error404();
        }
    } catch (error) {
        console.error("Route handling error:", error);
        error404();
    }
};

window.addEventListener("hashchange", checkHash);
window.addEventListener("load", () => {
    if (!window.location.hash) {
        window.location.hash = "#/current-location";
    } else {
        checkHash();
    }
});