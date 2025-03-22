// 'use strict';

const api_key = 'db9293026e00855f3c797bd25715ada0';

export const fetchData = async function(URL) {
    try {
        const response = await fetch(`${URL}&appid=${api_key}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

export const url = {
    currentWeather(lat, lon) {
        const latValue = lat.split('=')[1];
        const lonValue = lon.split('=')[1];
        return `https://api.openweathermap.org/data/2.5/weather?lat=${latValue}&lon=${lonValue}&units=metric`;
    },

    forecast(lat, lon) {
        const latValue = lat.split('=')[1];
        const lonValue = lon.split('=')[1];
        return `https://api.openweathermap.org/data/2.5/forecast?lat=${latValue}&lon=${lonValue}&units=metric`;
    },

    airPollution(lat, lon) {
        const latValue = lat.split('=')[1];
        const lonValue = lon.split('=')[1];
        return `https://api.openweathermap.org/data/2.5/air_pollution?lat=${latValue}&lon=${lonValue}`;
    },

    reverseGeo(lat, lon) {
        const latValue = lat.split('=')[1];
        const lonValue = lon.split('=')[1];
        return `https://api.openweathermap.org/geo/1.0/reverse?lat=${latValue}&lon=${lonValue}&limit=5`;
    },

    geo(query) {
        return `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5`;
    }
}