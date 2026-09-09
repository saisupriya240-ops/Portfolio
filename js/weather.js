/**
 * weather.js
 * Client-side Weather Dashboard powered by Open-Meteo REST APIs.
 * Demonstrates Fetch API, async/await, error resilience, safe DOM manipulation, and WCAG AA accessibility.
 */

'use strict';

// DOM Element References
let weatherForm = null;
let cityInput = null;
let searchBtn = null;
let errorContainer = null;
let errorText = null;
let loadingContainer = null;
let emptyStateContainer = null;
let resultsContainer = null;
let liveRegion = null;

// Weather Display Elements
let cityNameEl = null;
let countryBadgeEl = null;
let coordsInfoEl = null;
let tempValEl = null;
let conditionDescEl = null;
let heroIconWrapper = null;
let metricTempEl = null;
let metricHumidityEl = null;
let metricWindEl = null;
let metricConditionEl = null;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initWeatherDashboard();
});

/**
 * Initializes DOM element references and event listeners.
 */
function initWeatherDashboard() {
  weatherForm = document.getElementById('weather-form');
  cityInput = document.getElementById('city-input');
  searchBtn = document.getElementById('weather-search-btn');
  errorContainer = document.getElementById('weather-error');
  errorText = document.getElementById('weather-error-text');
  loadingContainer = document.getElementById('weather-loading');
  emptyStateContainer = document.getElementById('weather-empty-state');
  resultsContainer = document.getElementById('weather-results');
  liveRegion = document.getElementById('weather-live-region');

  // Weather result elements
  cityNameEl = document.getElementById('weather-city-name');
  countryBadgeEl = document.getElementById('weather-country-badge');
  coordsInfoEl = document.getElementById('weather-coords-info');
  tempValEl = document.getElementById('weather-temp-val');
  conditionDescEl = document.getElementById('weather-condition-desc');
  heroIconWrapper = document.getElementById('weather-hero-icon');
  metricTempEl = document.getElementById('metric-temp');
  metricHumidityEl = document.getElementById('metric-humidity');
  metricWindEl = document.getElementById('metric-wind');
  metricConditionEl = document.getElementById('metric-condition');

  if (!weatherForm || !cityInput) {
    return;
  }

  // Handle form submission
  weatherForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const city = cityInput.value.trim();
    searchCity(city);
  });

  // Handle quick suggestion pill clicks
  const quickPills = document.querySelectorAll('.weather-pill-btn');
  quickPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const city = pill.dataset.city || pill.textContent.trim();
      cityInput.value = city;
      cityInput.focus();
      searchCity(city);
    });
  });

  // Ensure clean initial state on load
  clearStatus();
  hideLoading();
  if (resultsContainer) {
    resultsContainer.hidden = true;
    resultsContainer.style.display = 'none';
  }
  if (emptyStateContainer) {
    emptyStateContainer.hidden = false;
    emptyStateContainer.style.display = 'flex';
  }
}

/**
 * Orchestrates the city search process.
 * Validates user input, manages UI loading states, fetches geocoding and forecast data,
 * and renders the final weather metrics.
 * 
 * @param {string} rawCity - Name of the city to search for
 */
async function searchCity(rawCity) {
  const city = (rawCity || '').trim();

  // Validate empty input
  if (!city) {
    showError('Please enter a city name to search.');
    if (cityInput) {
      cityInput.focus();
    }
    return;
  }

  // Start search flow
  showLoading(city);

  try {
    // Step 1: Geocoding - fetch coordinates for the city
    const locationInfo = await fetchCoordinates(city);

    // Step 2: Weather Forecast - fetch weather metrics for resolved coordinates
    const weatherData = await fetchWeather(locationInfo.latitude, locationInfo.longitude);

    // Step 3: Render results to the DOM safely
    renderWeather(weatherData, locationInfo);

    // Announce success to screen readers
    announceToLiveRegion(`Weather for ${locationInfo.name}, ${locationInfo.country} loaded. Temperature is ${weatherData.temperature_2m} degrees Celsius with ${getWeatherDescription(weatherData.weather_code).description}.`);
  } catch (error) {
    // Handle failures gracefully without crashing
    const friendlyMessage = error.message || 'Unable to retrieve weather data. Please verify your connection and try again.';
    showError(friendlyMessage);
  } finally {
    hideLoading();
  }
}

/**
 * Fetches latitude, longitude, and geographical metadata from Open-Meteo Geocoding API.
 * 
 * @param {string} city - The city name query
 * @returns {Promise<Object>} Object containing latitude, longitude, name, country, admin1
 */
async function fetchCoordinates(city) {
  const endpoint = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

  let response;
  try {
    response = await fetch(endpoint);
  } catch (netErr) {
    throw new Error('Network error: Unable to reach the geocoding service. Please check your internet connection.');
  }

  if (!response.ok) {
    throw new Error(`Geocoding service returned HTTP ${response.status}. Please try again shortly.`);
  }

  let data;
  try {
    data = await response.json();
  } catch (parseErr) {
    throw new Error('Received an unreadable response from the geocoding service.');
  }

  // Handle case where no matching location was found
  if (!data || !Array.isArray(data.results) || data.results.length === 0) {
    throw new Error(`No city found matching "${city}". Please check the spelling and try again.`);
  }

  const primaryResult = data.results[0];

  if (typeof primaryResult.latitude !== 'number' || typeof primaryResult.longitude !== 'number') {
    throw new Error('Received incomplete geographic coordinates for this location.');
  }

  return {
    latitude: primaryResult.latitude,
    longitude: primaryResult.longitude,
    name: primaryResult.name || city,
    country: primaryResult.country || primaryResult.country_code || '',
    admin1: primaryResult.admin1 || ''
  };
}

/**
 * Fetches meteorological data for given coordinates from Open-Meteo Forecast API.
 * 
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<Object>} Object containing current weather properties
 */
async function fetchWeather(latitude, longitude) {
  const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&wind_speed_unit=kmh`;

  let response;
  try {
    response = await fetch(endpoint);
  } catch (netErr) {
    throw new Error('Network error: Unable to reach the weather forecast service. Please check your internet connection.');
  }

  if (!response.ok) {
    throw new Error(`Weather service returned HTTP ${response.status}. Please try again shortly.`);
  }

  let data;
  try {
    data = await response.json();
  } catch (parseErr) {
    throw new Error('Received an unreadable response from the weather forecast service.');
  }

  // Validate the current object in the response
  if (!data || typeof data.current !== 'object' || data.current === null) {
    throw new Error('Weather data is temporarily unavailable for this location.');
  }

  return data.current;
}

/**
 * Updates DOM elements safely with weather information.
 * All dynamic text is set via textContent or safe DOM nodes to prevent XSS.
 * 
 * @param {Object} current - The current weather metrics
 * @param {Object} location - The resolved geographic location
 */
function renderWeather(current, location) {
  // Clear any existing errors
  clearStatus();

  // Hide loading, hide empty state, show results
  hideLoading();
  if (emptyStateContainer) {
    emptyStateContainer.hidden = true;
    emptyStateContainer.style.display = 'none';
  }
  if (resultsContainer) {
    resultsContainer.hidden = false;
    resultsContainer.style.display = 'block';
  }

  // Location display
  if (cityNameEl) {
    cityNameEl.textContent = location.admin1 ? `${location.name} (${location.admin1})` : location.name;
  }
  if (countryBadgeEl) {
    countryBadgeEl.textContent = location.country || 'Global';
  }
  if (coordsInfoEl) {
    const latFormatted = location.latitude.toFixed(2);
    const lonFormatted = location.longitude.toFixed(2);
    coordsInfoEl.textContent = `Lat: ${latFormatted}°, Lon: ${lonFormatted}°`;
  }

  // Temperature
  const tempNumber = typeof current.temperature_2m === 'number' ? Math.round(current.temperature_2m * 10) / 10 : '--';
  if (tempValEl) {
    tempValEl.textContent = `${tempNumber}`;
  }
  if (metricTempEl) {
    metricTempEl.textContent = `${tempNumber}°C`;
  }

  // Humidity
  const humidityVal = typeof current.relative_humidity_2m === 'number' ? `${current.relative_humidity_2m}%` : '--%';
  if (metricHumidityEl) {
    metricHumidityEl.textContent = humidityVal;
  }

  // Wind Speed
  const windVal = typeof current.wind_speed_10m === 'number' ? `${current.wind_speed_10m} km/h` : '-- km/h';
  if (metricWindEl) {
    metricWindEl.textContent = windVal;
  }

  // Weather Code and Description
  const weatherInfo = getWeatherDescription(current.weather_code);
  if (conditionDescEl) {
    conditionDescEl.textContent = weatherInfo.description;
  }
  if (metricConditionEl) {
    metricConditionEl.textContent = weatherInfo.description;
  }

  // Update Hero Weather Icon SVG safely
  if (heroIconWrapper) {
    setWeatherIcon(heroIconWrapper, weatherInfo.iconType, weatherInfo.description);
  }
}

/**
 * Translates numeric WMO weather interpretation codes into human-readable descriptions
 * and icon classifications.
 * 
 * @param {number} code - WMO weather code from Open-Meteo
 * @returns {Object} Object with description and iconType
 */
function getWeatherDescription(code) {
  switch (code) {
    case 0:
      return { description: 'Clear sky', iconType: 'sun' };
    case 1:
      return { description: 'Mainly clear', iconType: 'sun-cloud' };
    case 2:
      return { description: 'Partly cloudy', iconType: 'cloud-sun' };
    case 3:
      return { description: 'Overcast', iconType: 'cloud' };
    case 45:
      return { description: 'Fog', iconType: 'fog' };
    case 48:
      return { description: 'Depositing rime fog', iconType: 'fog' };
    case 51:
      return { description: 'Light drizzle', iconType: 'drizzle' };
    case 53:
      return { description: 'Moderate drizzle', iconType: 'drizzle' };
    case 55:
      return { description: 'Dense drizzle', iconType: 'drizzle' };
    case 56:
    case 57:
      return { description: 'Freezing drizzle', iconType: 'snow' };
    case 61:
      return { description: 'Slight rain', iconType: 'rain' };
    case 63:
      return { description: 'Moderate rain', iconType: 'rain' };
    case 65:
      return { description: 'Heavy rain', iconType: 'rain-heavy' };
    case 66:
    case 67:
      return { description: 'Freezing rain', iconType: 'snow' };
    case 71:
      return { description: 'Slight snowfall', iconType: 'snow' };
    case 73:
      return { description: 'Moderate snowfall', iconType: 'snow' };
    case 75:
      return { description: 'Heavy snowfall', iconType: 'snow' };
    case 77:
      return { description: 'Snow grains', iconType: 'snow' };
    case 80:
      return { description: 'Slight rain showers', iconType: 'rain' };
    case 81:
      return { description: 'Moderate rain showers', iconType: 'rain' };
    case 82:
      return { description: 'Violent rain showers', iconType: 'rain-heavy' };
    case 85:
    case 86:
      return { description: 'Snow showers', iconType: 'snow' };
    case 95:
      return { description: 'Thunderstorm', iconType: 'thunderstorm' };
    case 96:
    case 99:
      return { description: 'Thunderstorm with hail', iconType: 'thunderstorm' };
    default:
      return { description: `Variable conditions (Code ${code ?? 'unknown'})`, iconType: 'cloud' };
  }
}

/**
 * Injects an accessible, inline SVG icon representing the weather condition.
 * 
 * @param {HTMLElement} container - The DOM node to receive the SVG
 * @param {string} iconType - The type of weather icon to generate
 * @param {string} label - Accessible description for title/label
 */
function setWeatherIcon(container, iconType, label) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  if (iconType === 'sun') {
    // Sun icon
    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '5');
    svg.appendChild(circle);

    const rays = [
      ['12', '1', '12', '3'],
      ['12', '21', '12', '23'],
      ['4.22', '4.22', '5.64', '5.64'],
      ['18.36', '18.36', '19.78', '19.78'],
      ['1', '12', '3', '12'],
      ['21', '12', '23', '12'],
      ['4.22', '19.78', '5.64', '18.36'],
      ['18.36', '5.64', '19.78', '4.22']
    ];
    rays.forEach(([x1, y1, x2, y2]) => {
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      svg.appendChild(line);
    });
  } else if (iconType === 'cloud' || iconType === 'sun-cloud' || iconType === 'cloud-sun') {
    // Cloud icon
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z');
    svg.appendChild(path);
  } else if (iconType === 'rain' || iconType === 'rain-heavy' || iconType === 'drizzle') {
    // Cloud with rain lines
    const cloud = document.createElementNS(svgNS, 'path');
    cloud.setAttribute('d', 'M16 13v8m-8-5v6m4-3v7M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25');
    svg.appendChild(cloud);
  } else if (iconType === 'snow') {
    // Snowflake icon
    const lines = [
      ['12', '2', '12', '22'],
      ['2', '12', '22', '12'],
      ['4.93', '4.93', '19.07', '19.07'],
      ['19.07', '4.93', '4.93', '19.07']
    ];
    lines.forEach(([x1, y1, x2, y2]) => {
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      svg.appendChild(line);
    });
  } else if (iconType === 'thunderstorm') {
    // Lightning cloud
    const cloud = document.createElementNS(svgNS, 'path');
    cloud.setAttribute('d', 'M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9');
    svg.appendChild(cloud);

    const bolt = document.createElementNS(svgNS, 'polyline');
    bolt.setAttribute('points', '13 11 9 17 15 17 11 23');
    svg.appendChild(bolt);
  } else if (iconType === 'fog') {
    // Fog horizontal lines
    const lines = [
      ['4', '8', '20', '8'],
      ['2', '12', '22', '12'],
      ['4', '16', '20', '16'],
      ['7', '20', '17', '20']
    ];
    lines.forEach(([x1, y1, x2, y2]) => {
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      svg.appendChild(line);
    });
  } else {
    // Default circle
    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '8');
    svg.appendChild(circle);
  }

  container.appendChild(svg);
}

/**
 * Displays the loading state, disables submit button, and announces to screen readers.
 * 
 * @param {string} city - Searched city query
 */
function showLoading(city) {
  clearStatus();

  if (loadingContainer) {
    loadingContainer.hidden = false;
    loadingContainer.style.display = 'flex';
  }
  if (resultsContainer) {
    resultsContainer.hidden = true;
    resultsContainer.style.display = 'none';
  }
  if (emptyStateContainer) {
    emptyStateContainer.hidden = true;
    emptyStateContainer.style.display = 'none';
  }
  if (searchBtn) {
    searchBtn.disabled = true;
  }

  announceToLiveRegion(`Searching current weather conditions for ${city}...`);
}

/**
 * Hides the loading state and re-enables the search button.
 */
function hideLoading() {
  if (loadingContainer) {
    loadingContainer.hidden = true;
    loadingContainer.style.display = 'none';
  }
  if (searchBtn) {
    searchBtn.disabled = false;
  }
}

/**
 * Displays a user-friendly error message in the alert box and live region.
 * 
 * @param {string} message - Error description to display
 */
function showError(message) {
  if (resultsContainer) {
    resultsContainer.hidden = true;
    resultsContainer.style.display = 'none';
  }
  if (loadingContainer) {
    loadingContainer.hidden = true;
    loadingContainer.style.display = 'none';
  }
  if (searchBtn) {
    searchBtn.disabled = false;
  }
  if (emptyStateContainer) {
    emptyStateContainer.hidden = false;
    emptyStateContainer.style.display = 'flex';
  }

  if (errorContainer) {
    if (errorText) {
      errorText.textContent = message;
    }
    errorContainer.hidden = false;
    errorContainer.style.display = 'flex';
  }

  announceToLiveRegion(`Error: ${message}`);
}

/**
 * Resets status messages and errors.
 */
function clearStatus() {
  if (errorContainer) {
    errorContainer.hidden = true;
    errorContainer.style.display = 'none';
  }
  if (errorText) {
    errorText.textContent = '';
  }
}

/**
 * Updates the screen-reader accessible live region.
 * 
 * @param {string} message - Text for assistive technologies
 */
function announceToLiveRegion(message) {
  if (liveRegion) {
    liveRegion.textContent = '';
    // Brief timeout ensures browsers re-read the updated text
    setTimeout(() => {
      liveRegion.textContent = message;
    }, 50);
  }
}
