// 'use strict';

import { fetchData, url } from "./api.js";
import * as module from "./module.js";

const addEventOnElements = (elements, eventType, callback) => {
    elements.forEach(element => element.addEventListener(eventType, callback));
};

const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

const searchView = $("[data-search-view]");
const searchTogglers = $$("[data-search-toggler]");
const searchField = $("[data-search-field]");
const searchResult = $("[data-search-result]");
const container = $("[data-container]");
const loading = $("[data-loading]");
const currentLocationBtn = $("[data-current-location-btn]");
const errorContent = $("[data-error-content]");

const toggleSearch = () => searchView.classList.toggle("active");
addEventOnElements(searchTogglers, "click", toggleSearch);

let searchTimeout = null;
const searchTimeoutDuration = 500;

const showLoading = () => {
    loading.style.display = "grid";
    container.style.overflowY = "hidden";
    container.classList.remove("fade-in");
};

const hideLoading = () => {
    loading.style.display = "none";
    container.style.overflowY = "overlay";
    container.classList.add("fade-in");
};

searchField.addEventListener('input', async function() {
    clearTimeout(searchTimeout);
    if (!this.value.trim()) {
        searchResult.classList.remove("active");
        searchResult.innerHTML = "";
        this.classList.remove("searching");
        return;
    }

    this.classList.add("searching");
    searchTimeout = setTimeout(async () => {
        try {
            const locations = await fetchData(url.geo(this.value));
            this.classList.remove("searching");
            searchResult.classList.add("active");
            
            const searchList = document.createElement("ul");
            searchList.classList.add("view-list");
            searchList.setAttribute("data-search-list", "");
            
            searchResult.innerHTML = "";
            searchResult.appendChild(searchList);

            for (const { name, lat, lon, country, state } of locations) {
                const searchItem = document.createElement("li");
                searchItem.classList.add("view-item");
                searchItem.innerHTML = `
                    <span class="m-icon">location_on</span>
                    <div>
                        <p class="item-title">${name}</p>
                        <p class="label-2 item-subtitle">
                            ${state || ""} ${country}
                        </p>
                    </div>
                    <a href="#/weather?lat=${lat}&lon=${lon}" 
                       class="item-link has-state" 
                       aria-label="${name} weather" 
                       data-search-toggler>
                    </a>
                `;
                searchList.appendChild(searchItem);
            }

            const searchTogglers = searchList.querySelectorAll("[data-search-toggler]");
            addEventOnElements(searchTogglers, "click", () => {
                toggleSearch();
                searchResult.classList.remove("active");
            });
        } catch (error) {
            console.error("Failed to fetch locations:", error);
            searchResult.innerHTML = `
                <div class="error-message">
                    Failed to fetch locations. Please try again.
                </div>
            `;
        }
    }, searchTimeoutDuration);
});

export const updateWeather = async function(lat, lon) {
    try {
        showLoading();
        errorContent.style.display = "none";

        const currentWeatherSection = $("[data-current-weather]");
        const highlightSection = $("[data-highlights]");
        const hourlySection = $("[data-hourly-forecast]");
        const forecastSection = $("[data-5-day-forecast]");

        [currentWeatherSection, highlightSection, hourlySection, forecastSection]
            .forEach(section => section.innerHTML = "");

        if (window.location.hash === "#/current-location") {
            currentLocationBtn.setAttribute("disabled", "");
        } else {
            currentLocationBtn.removeAttribute("disabled");
        }

        const [currentWeather, airPollution, forecast, geoData] = await Promise.all([
            fetchData(url.currentWeather(lat, lon)),
            fetchData(url.airPollution(lat, lon)),
            fetchData(url.forecast(lat, lon)),
            fetchData(url.reverseGeo(lat, lon))
        ]);

        const {
            weather,
            dt: dateUnix,
            sys: { sunrise: sunriseUnixUTC, sunset: sunsetUnixUTC },
            main: { temp, feels_like, pressure, humidity },
            visibility,
            timezone
        } = currentWeather;

        const [{ description, icon }] = weather;

        const card = document.createElement("div");
        card.classList.add("card", "card-lg", "current-weather-card");

        card.innerHTML = `
            <h2 class="title-2 card-title">Now</h2>
            <div class="weapper">
                <p class="heading">${parseInt(temp)}&deg;<sup>c</sup></p>
                <img src="./img/weather_icons/${icon}.png" alt="${description}" class="weather-icon" width="64"
                    height="64" />
            </div>
            <p class="body-3">${description}</p>
            <ul class="meta-list">
                <li class="meta-item">
                    <span class="m-icon">calendar_today</span>
                    <p class="title-3 meta-text">${module.getDate(dateUnix, timezone)}</p>
                </li>
                <li class="meta-item">
                    <span class="m-icon">location_on</span>
                    <p class="title-3 meta-text">${geoData[0].name}, ${geoData[0].country}</p>
                </li>
            </ul>
        `;

        currentWeatherSection.appendChild(card);

        const card1 = document.createElement("div");
        card1.classList.add("card", "card-lg");

        const [{
            main: { aqi },
            components: { no2, o3, so2, pm2_5 }
        }] = airPollution.list;

        card1.innerHTML = `
            <h2 class="title-2">Today's Highlights</h2>
            <div class="highlight-list">
                <div class="card card-sm highlight-card one">
                    <h3 class="title-3">Air Quality Index</h3>

                    <div class="wrapper">
                        <span class="m-icon">air</span>
                        <ul class="card-list">
                            <li class="card-item">
                                <p class="title-1">${pm2_5.toPrecision(3)}</p>
                                <p class="label-1">PM <sub>2.5</sub></p>
                            </li>

                            <li class="card-item">
                                <p class="title-1">${Number(o3).toPrecision(3)}</p>
                                <p class="label-1">O<sub>3</sub></p>
                            </li>

                            <li class="card-item">
                                <p class="title-1">${Number(so2).toPrecision(3)}</p>
                                <p class="label-1">SO<sub>2</sub></p>
                            </li>

                            <li class="card-item">
                                <p class="title-1">${Number(no2).toPrecision(3)}</p>
                                <p class="label-1">NO<sub>2</sub></p>
                            </li>
                        </ul>
                    </div>

                    <span class="badge aqi-${aqi} label-${aqi}" title="${module.aqiText[aqi].message}">
                        ${module.aqiText[aqi].level}
                    </span>
                </div>

                <div class="card card-sm highlight-card two">
                    <h3 class="title-3">Sunrise & Sunset</h3>
                    <div class="card-list">
                        <div class="card-item">
                            <span class="m-icon">clear_day</span>
                            <div>
                                <p class="label-1">Sunrise</p>
                                <p class="label-1">${module.getTime(sunriseUnixUTC, timezone)}</p>
                            </div>
                        </div>
                        <div class="card-item">
                            <span class="m-icon">clear_night</span>
                            <div>
                                <p class="label-1">Sunset</p>
                                <p class="label-1">${module.getTime(sunsetUnixUTC, timezone)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card card-sm highlight-card">
                    <h3 class="title-3">Humidity</h3>
                    <div class="wrapper">
                        <span class="m-icon">humidity_percentage</span>
                        <p class="title-1">${humidity}<sup>%</sup></p>
                    </div>
                </div>

                <div class="card card-sm highlight-card">
                    <h3 class="title-3">Pressure</h3>
                    <div class="wrapper">
                        <span class="m-icon">airwave</span>
                        <p class="title-1">${pressure}<sub>hPa</sub></p>
                    </div>
                </div>

                <div class="card card-sm highlight-card">
                    <h3 class="title-3">Visibility</h3>
                    <div class="wrapper">
                        <span class="m-icon">visibility</span>
                        <p class="title-1">${visibility / 1000}<sub>km</sub></p>
                    </div>
                </div>

                <div class="card card-sm highlight-card">
                    <h3 class="title-3">Feels Like</h3>
                    <div class="wrapper">
                        <span class="m-icon">thermostat</span>
                        <p class="title-1">${parseInt(feels_like)}&deg;<sub>c</sub></p>
                    </div>
                </div>
            </div>
        `;

        highlightSection.appendChild(card1);

        const {
            list: forecastList,
            city: { timezone: forecastTimezone }
        } = forecast;

        hourlySection.innerHTML = `
            <h3 class="title-2" id="today">Today at</h3>
            <div class="slider-container">
                <ul class="slider-list" data-temp></ul>
                <ul class="slider-list" data-wind></ul>
            </div>
        `;

        for (const [index, data] of forecastList.entries()) {
            if (index > 7) break;
            const {
                dt: dateTimeUnix,
                main: { temp },
                weather,
                wind: { deg: windDirection, speed: windSpeed }
            } = data;

            const [{ icon, description }] = weather;

            const tempLi = document.createElement('li');
            tempLi.classList.add("slider-item");

            tempLi.innerHTML = `
                <div class="card card-sm slider-card">
                    <p class="body-3">${module.getHours(dateTimeUnix, forecastTimezone)}</p>
                    <img src="./img/weather_icons/${icon}.png" alt="${description}" class="weather-icon" width="48"
                        height="48" />
                    <p class="body-3">${parseInt(temp)}&deg;</p>
                </div>
            `;

            hourlySection.querySelector("[data-temp]").appendChild(tempLi);

            const windLi = document.createElement("li");
            windLi.classList.add("slider-item");

            windLi.innerHTML = `
                <div class="card card-sm slider-card">
                    <p class="body-3">${module.getHours(dateTimeUnix, forecastTimezone)}</p>
                    <img src="./img/weather_icons/direction.png" alt="" class="weather-icon" width="48" 
                        style="transform:rotate(${windDirection - 180}deg)"
                        height="48" />
                    <p class="body-3">${parseInt(module.mps_to_kmh(windSpeed))} km/h</p>
                </div>
            `;

            hourlySection.querySelector("[data-wind]").appendChild(windLi);
        }

        forecastSection.innerHTML = `
            <h2 class="title-2" id="forecast-label">5 Day Forecast</h2>
            <div class="card card-lg forecast-card">
                <ul data-forecast></ul>
            </div>
        `;

        for (let i = 7, len = forecastList.length; i < len; i += 8) {
            const {
                main: { temp_max },
                weather,
                dt_txt
            } = forecastList[i];

            const [{ icon, description }] = weather;
            const date = new Date(dt_txt);

            const li = document.createElement("li");
            li.classList.add("card-item");

            li.innerHTML = `
                <div class="icon-wrapper">
                    <img src="./img/weather_icons/${icon}.png" alt="${description}" width="36" height="36"
                        class="weather-icon" />
                    <span class="span">
                        <p class="title-2">${parseInt(temp_max)}&deg;</p>
                    </span>
                </div>
                <p class="label-1">${date.getDate()} ${module.monthNames[date.getUTCMonth()]}</p>
                <p class="label-1">${module.weekDayNames[date.getUTCDay()]}</p>
            `;

            forecastSection.querySelector("[data-forecast]").appendChild(li);
        }

        hideLoading();
    } catch (error) {
        console.error("Failed to update weather:", error);
        errorContent.style.display = "flex";
        hideLoading();
    }
}

export const error404 = () => {
    errorContent.style.display = "flex";
};