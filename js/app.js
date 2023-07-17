'use strict';

import { fetchData, url } from "./api.js";
import * as module from "./module.js";

const addEventOnEmelents = function (elements, eventType, callback) {
    for (const element of elements) {
        element.addEventListener(eventType, callback);
    }
}

const searchView = document.querySelector("[data-search-view]");
const searchTogglers = document.querySelectorAll("[data-search-toggler]");

const toggleSearch = () => {
    searchView.classList.toggle("active");
}

addEventOnEmelents(searchTogglers, "click", toggleSearch);

const searchField = document.querySelector("[data-search-field]");
const searchResult = document.querySelector("[data-search-result]");

let searchTimeout = null;
const searchTimeoutDuration = 500;

searchField.addEventListener('input', function () {
    searchTimeout ?? clearTimeout(searchTimeout);

    if (!searchField.value) {
        searchResult.classList.remove("active");
        searchResult.innerHTML = "";
        searchField.classList.add("searching");
    }
    else {
        searchField.classList.add("searching");
    }

    if (searchField.value && searchField.value != "") {
        searchTimeout = setTimeout(() => {
            if(!searchField.value == "")
            {
                fetchData(url.geo(searchField.value), function (locations) {
                    searchField.classList.remove("searching");
                    searchResult.classList.add("active");
                    searchResult.innerHTML = `
                    <ul class="view-list" data-search-list>
                            <li class="view-item">
                                <span class="m-icon">location_on</span>
                                <div>
                                    <p class="item-title">London</p>
                                    <p class="labaria-label-2 item-subtitle">
                                        State of London,GB
                                    </p>
                                </div>
    
                                <a href="#/weather?lat=51.5073219&lon=-0.1276474" class="item-link has-state" data-search-toggler></a>
                            </li>
                    </ul>
                    `;
    
                    const items = [];
    
                    for(const {name,lat,lon,country,state} of locations){
                        const searchItem = document.createElement("li");
                        searchItem.classList.add("view-item")
                        searchItem.innerHTML = `
                        <span class="m-icon">location_on</span>
                        <div>
                            <p class="item-title">${name}</p>
                            <p class="labaria-label-2 item-subtitle">
                                ${state || ""}
                            </p>
                        </div>
    
                        <a href="#/weather?lat=${lat}&lon=${lon}" class="item-link has-state" aria-label="${name} weather" data-search-toggler></a>
                        `;
                        searchResult.querySelector("[data-search-list]").appendChild(searchItem);
                        items.push(searchItem.querySelector("[data-search-toggler]"));
                    }
                    items.push(searchResult.querySelector("[data-search-toggler]"));
                    addEventOnEmelents(items,"click",function(){
                        toggleSearch();
                        searchResult.classList.remove("active");
                    })
                });

            }
            
        }, searchTimeoutDuration);
    }
});

const container = document.querySelector("[data-container]");
const loading = document.querySelector("[data-loading]");
const currentLocationBtn = document.querySelector("[data-current-location-btn]");
const errorContent = document.querySelector("[data-error-content]");

export const updateWeather = function(lat,lon){
    // loading.style.display = "grid";
    container.style.overflowY = "hidden";
    container.classList.contains("fade-in") ?? container.classList.remove("fade-in");
    errorContent.style.display = "none";

    const currentWeatherSection = document.querySelector("[data-current-weather]");
    const highlightSection = document.querySelector("[data-highlights]");
    const hourlySection = document.querySelector("[data-hourly-forecast]");
    const forecastSection = document.querySelector("[data-5-day-forecast]");

    currentWeatherSection.innerHTML = "";

    highlightSection.innerHTML = "";

    hourlySection.innerHTML = "";

    forecastSection.innerHTML = "";
    

    if(window.location.hash == "#/current-location")
    {
        currentLocationBtn.setAttribute("disabled","");
    }
    else{
        currentLocationBtn.removeAttribute("disabled");
    }

    fetchData(url.currentWeather(lat,lon),function(currentWeather){
        const {
            weather,
            dt:dateUnix,
            sys:{sunrise:sunrieseUnixUTC,sunset:sunsetUnixUTC},
            main:{temp,feels_like,pressure,humidity},
            visibility,
            timezone

        } = currentWeather;

        const [{description,icon}] = weather;

        const card = document.createElement("div");
        card.classList.add("card","card-lg","current-weather-card");

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
                <p class="title-3 meta-text">${module.getDate(dateUnix,timezone)}</p>
            </li>
            <li class="meta-item">
                <span class="m-icon">location_on</span>
                <p class="title-3 meta-text" data-location></p>
            </li>
        </ul>
        `;

       fetchData(url.reverseGeo(lat,lon),function([{name,country}]){
            card.querySelector("[data-location]").innerHTML =  `
            ${name}, ${country}
            `;
       });

       currentWeatherSection.appendChild(card);
    });

}

export const error404 = function(){};