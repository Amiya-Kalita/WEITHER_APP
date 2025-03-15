/**
 * SkyPulse Weather App
 * A beautiful, modern weather application with advanced features
 * Using Open-Meteo API (no API key required)
 * 
 * Features:
 * - Real-time weather data
 * - 7-day forecast
 * - Hourly forecast
 * - Air quality data
 * - Geolocation support
 * - Location search with suggestions
 * - Favorites system
 * - Recent searches
 * - Dark/light theme
 * - Responsive design
 * - Toast notifications
 * - Temperature unit conversion
 */

// ============================================
// DOM ELEMENTS
// ============================================

// Core Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const searchSuggestions = document.getElementById('search-suggestions');
const loadingContainer = document.getElementById('loading-container');
const currentWeatherContainer = document.getElementById('current-weather');
const errorContainer = document.getElementById('error-container');
const errorMessage = document.getElementById('error-message');
const errorDismissBtn = document.getElementById('error-dismiss-btn');

// Theme Toggle
const themeSwitch = document.getElementById('theme-switch');

// Weather Details
const cityName = document.getElementById('city-name');
const currentDate = document.getElementById('current-date');
const weatherIcon = document.getElementById('weather-icon');
const temperature = document.getElementById('temperature');
const feelsLike = document.getElementById('feels-like');
const weatherDescription = document.getElementById('weather-description');
const windSpeed = document.getElementById('wind-speed');
const humidity = document.getElementById('humidity');
const uvIndex = document.getElementById('uv-index');
const visibility = document.getElementById('visibility');
const aqiValue = document.getElementById('aqi-value');
const aqiText = document.getElementById('aqi-text');

// Forecast Elements
const hourlyTab = document.getElementById('hourly-tab');
const dailyTab = document.getElementById('daily-tab');
const hourlyForecast = document.getElementById('hourly-forecast');
const dailyForecast = document.getElementById('daily-forecast');

// User Location Elements
const recentTab = document.getElementById('recent-tab');
const favoritesTab = document.getElementById('favorites-tab');
const recentContainer = document.getElementById('recent-container');
const favoritesContainer = document.getElementById('favorites-container');
const recentSearchesList = document.getElementById('recent-searches-list');
const favoritesList = document.getElementById('favorites-list');
const favoriteBtn = document.getElementById('favorite-btn');
const refreshBtn = document.getElementById('refresh-btn');
const shareBtn = document.getElementById('share-btn');

// Temperature Unit Toggle
const celsiusBtn = document.getElementById('celsius');
const fahrenheitBtn = document.getElementById('fahrenheit');

// Toast Container
const toastContainer = document.getElementById('toast-container');

// ============================================
// GLOBAL VARIABLES
// ============================================

// App State
let currentWeatherData = null;
let currentLocation = null;
let searchTimeout = null;
let isCelsius = true;

// Local Storage Data
let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let isDarkMode = localStorage.getItem('darkMode') === 'true';

// Weather Code Mapping (WMO codes to descriptions and icons)
const weatherCodeMap = {
    0: { description: "Clear sky", icon: "01d.png" },
    1: { description: "Mainly clear", icon: "01d.png" },
    2: { description: "Partly cloudy", icon: "02d.png" },
    3: { description: "Overcast", icon: "03d.png" },
    45: { description: "Fog", icon: "50d.png" },
    48: { description: "Depositing rime fog", icon: "50d.png" },
    51: { description: "Light drizzle", icon: "09d.png" },
    53: { description: "Moderate drizzle", icon: "09d.png" },
    55: { description: "Dense drizzle", icon: "09d.png" },
    56: { description: "Light freezing drizzle", icon: "09d.png" },
    57: { description: "Dense freezing drizzle", icon: "09d.png" },
    61: { description: "Slight rain", icon: "10d.png" },
    63: { description: "Moderate rain", icon: "10d.png" },
    65: { description: "Heavy rain", icon: "10d.png" },
    66: { description: "Light freezing rain", icon: "13d.png" },
    67: { description: "Heavy freezing rain", icon: "13d.png" },
    71: { description: "Slight snow fall", icon: "13d.png" },
    73: { description: "Moderate snow fall", icon: "13d.png" },
    75: { description: "Heavy snow fall", icon: "13d.png" },
    77: { description: "Snow grains", icon: "13d.png" },
    80: { description: "Slight rain showers", icon: "09d.png" },
    81: { description: "Moderate rain showers", icon: "09d.png" },
    82: { description: "Violent rain showers", icon: "09d.png" },
    85: { description: "Slight snow showers", icon: "13d.png" },
    86: { description: "Heavy snow showers", icon: "13d.png" },
    95: { description: "Thunderstorm", icon: "11d.png" },
    96: { description: "Thunderstorm with slight hail", icon: "11d.png" },
    99: { description: "Thunderstorm with heavy hail", icon: "11d.png" }
};

// Air Quality Index categories
const aqiCategories = [
    { max: 20, label: "Excellent", color: "#4caf50" },
    { max: 40, label: "Good", color: "#8bc34a" },
    { max: 60, label: "Moderate", color: "#ffeb3b" },
    { max: 80, label: "Poor", color: "#ff9800" },
    { max: 100, label: "Very Poor", color: "#f44336" },
    { max: Infinity, label: "Hazardous", color: "#9c27b0" }
];

// ============================================
// EVENT LISTENERS
// ============================================

/**
 * Initialize the application once DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Setup theme
    initializeTheme();
    
    // Display user locations
    updateRecentSearches();
    updateFavorites();
    
    // Add event listeners for search
    setupSearchEvents();
    
    // Add event listeners for tabs
    setupTabEvents();
    
    // Add event listeners for temperature toggle
    setupTemperatureToggle();
    
    // Error dismiss button
    errorDismissBtn.addEventListener('click', hideError);
    
    // Action buttons
    refreshBtn.addEventListener('click', refreshCurrentWeather);
    shareBtn.addEventListener('click', shareWeather);
    favoriteBtn.addEventListener('click', toggleFavorite);
});

/**
 * Set up search-related event listeners
 */
function setupSearchEvents() {
    // Search button click
    searchBtn.addEventListener('click', () => {
        const city = cityInput.value.trim();
        if (city) {
            getWeatherByCity(city);
        }
    });
    
    // Enter key for search
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const city = cityInput.value.trim();
            if (city) {
                getWeatherByCity(city);
            }
        }
    });
    
    // Input for search suggestions
    cityInput.addEventListener('input', handleSearchInput);
    
    // Use my location button
    locationBtn.addEventListener('click', getWeatherByLocation);
}

/**
 * Set up tab-related event listeners
 */
function setupTabEvents() {
    // Forecast tabs
    hourlyTab.addEventListener('click', () => {
        dailyTab.classList.remove('active');
        hourlyTab.classList.add('active');
        dailyForecast.classList.remove('active');
        hourlyForecast.classList.add('active');
    });
    
    dailyTab.addEventListener('click', () => {
        hourlyTab.classList.remove('active');
        dailyTab.classList.add('active');
        hourlyForecast.classList.remove('active');
        dailyForecast.classList.add('active');
    });
    
    // User location tabs
    recentTab.addEventListener('click', () => {
        favoritesTab.classList.remove('active');
        recentTab.classList.add('active');
        favoritesContainer.classList.remove('active');
        recentContainer.classList.add('active');
    });
    
    favoritesTab.addEventListener('click', () => {
        recentTab.classList.remove('active');
        favoritesTab.classList.add('active');
        recentContainer.classList.remove('active');
        favoritesContainer.classList.add('active');
    });
}

/**
 * Set up temperature toggle event listeners
 */
function setupTemperatureToggle() {
    celsiusBtn.addEventListener('click', () => {
        if (!isCelsius) {
            isCelsius = true;
            celsiusBtn.classList.add('active');
            fahrenheitBtn.classList.remove('active');
            updateTemperatureDisplay();
        }
    });
    
    fahrenheitBtn.addEventListener('click', () => {
        if (isCelsius) {
            isCelsius = false;
            fahrenheitBtn.classList.add('active');
            celsiusBtn.classList.remove('active');
            updateTemperatureDisplay();
        }
    });
}

/**
 * Initialize theme based on user preference or system preference
 */
function initializeTheme() {
    themeSwitch.checked = isDarkMode;
    applyTheme();
    
    // Theme toggle click
    themeSwitch.addEventListener('change', () => {
        isDarkMode = themeSwitch.checked;
        localStorage.setItem('darkMode', isDarkMode);
        applyTheme();
    });
}

/**
 * Apply current theme to document
 */
function applyTheme() {
    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

/**
 * Handle search input changes and show suggestions
 * @param {Event} e - Input event
 */
function handleSearchInput(e) {
    const query = e.target.value.trim();
    
    // Clear previous timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // Hide suggestions if query is empty
    if (!query) {
        searchSuggestions.style.display = 'none';
        return;
    }
    
    // Set timeout to avoid too many requests
    searchTimeout = setTimeout(() => {
        getCitySuggestions(query);
    }, 300);
}

/**
 * Get city suggestions from API
 * @param {string} query - Search query
 */
async function getCitySuggestions(query) {
    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            displaySuggestions(data.results);
        } else {
            searchSuggestions.style.display = 'none';
        }
    } catch (error) {
        console.error('Error fetching city suggestions:', error);
        searchSuggestions.style.display = 'none';
    }
}

/**
 * Display city suggestions in dropdown
 * @param {Array} suggestions - Array of city objects
 */
function displaySuggestions(suggestions) {
    searchSuggestions.innerHTML = '';
    
    suggestions.forEach(city => {
        const suggestionItem = document.createElement('div');
        suggestionItem.classList.add('suggestion-item');
        
        const cityName = city.name;
        const country = city.country;
        const admin = city.admin1 || '';
        
        let displayName = cityName;
        if (admin && admin !== cityName) {
            displayName += `, ${admin}`;
        }
        displayName += `, ${country}`;
        
        suggestionItem.innerHTML = `
            <i class="fas fa-map-marker-alt"></i>
            <span>${displayName}</span>
        `;
        
        suggestionItem.addEventListener('click', () => {
            cityInput.value = displayName;
            searchSuggestions.style.display = 'none';
            getWeatherByCity(displayName);
        });
        
        searchSuggestions.appendChild(suggestionItem);
    });
    
    searchSuggestions.style.display = 'block';
}

/**
 * Get weather data by city name
 * @param {string} city - City name to search for
 */
async function getWeatherByCity(city) {
    showLoading();
    hideError();
    searchSuggestions.style.display = 'none';
    
    try {
        // First, get coordinates for the city
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        const geoData = await geoResponse.json();
        
        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('City not found. Please try a different name.');
        }
        
        const location = geoData.results[0];
        const { latitude, longitude, name, country, admin1 } = location;
        
        let displayName = name;
        if (admin1 && admin1 !== name) {
            displayName += `, ${admin1}`;
        }
        displayName += `, ${country}`;
        
        currentLocation = {
            name: displayName,
            latitude,
            longitude
        };
        
        // Get weather data using coordinates
        await getWeatherData(latitude, longitude, displayName);
        
        // Add to recent searches
        addToRecentSearches(displayName, latitude, longitude);
        
        // Update favorite button state
        updateFavoriteButtonState();
        
        // Clear input
        cityInput.value = '';
        
        // Show success toast
        showToast('success', 'Weather Updated', `Latest weather data for ${name} loaded successfully.`);
        
    } catch (error) {
        showError(error.message);
        hideLoading();
        showToast('error', 'Error', error.message);
    }
}

/**
 * Get weather based on user's current location
 */
function getWeatherByLocation() {
    showLoading();
    hideError();
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    
                    // Reverse geocoding to get city name
                    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=en&format=json`);
                    const geoData = await geoResponse.json();
                    
                    let locationName = 'Your Location';
                    if (geoData.results && geoData.results.length > 0) {
                        const { name, country, admin1 } = geoData.results[0];
                        
                        let displayName = name;
                        if (admin1 && admin1 !== name) {
                            displayName += `, ${admin1}`;
                        }
                        displayName += `, ${country}`;
                        
                        locationName = displayName;
                    }
                    
                    currentLocation = {
                        name: locationName,
                        latitude,
                        longitude
                    };
                    
                    await getWeatherData(latitude, longitude, locationName);
                    
                    // Add to recent searches
                    addToRecentSearches(locationName, latitude, longitude);
                    
                    // Update favorite button state
                    updateFavoriteButtonState();
                    
                    // Show success toast
                    showToast('success', 'Location Found', 'Using your current location for weather data.');
                    
                } catch (error) {
                    showError('Failed to get location data. Please try again or search by city name.');
                    showToast('error', 'Location Error', 'Failed to get weather for your location.');
                } finally {
                    hideLoading();
                }
            },
            (error) => {
                hideLoading();
                let errorMsg = '';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMsg = 'Location access denied. Please enable location services or search by city name.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMsg = 'Location information unavailable. Please try again or search by city name.';
                        break;
                    case error.TIMEOUT:
                        errorMsg = 'Location request timed out. Please try again or search by city name.';
                        break;
                    default:
                        errorMsg = 'An error occurred getting your location. Please try again or search by city name.';
                }
                
                showError(errorMsg);
                showToast('error', 'Location Error', errorMsg);
            }
        );
    } else {
        hideLoading();
        const errorMsg = 'Geolocation is not supported by your browser. Please search by city name.';
        showError(errorMsg);
        showToast('error', 'Not Supported', errorMsg);
    }
}

/**
 * Refresh current weather data
 */
function refreshCurrentWeather() {
    if (currentLocation) {
        const { latitude, longitude, name } = currentLocation;
        getWeatherData(latitude, longitude, name);
        showToast('info', 'Refreshing', 'Updating weather data...');
    } else {
        showToast('warning', 'No Location', 'Please search for a location first.');
    }
}

// ============================================
// WEATHER DATA HANDLING
// ============================================

/**
 * Get weather data using coordinates
 * @param {number} latitude - Location latitude
 * @param {number} longitude - Location longitude
 * @param {string} locationName - Human-readable location name
 */
async function getWeatherData(latitude, longitude, locationName) {
    showLoading();
    try {
        // Extended API call with hourly data and air quality
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?` +
            `latitude=${latitude}&longitude=${longitude}&` +
            `current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,visibility,uv_index&` +
            `hourly=temperature_2m,weather_code,visibility,wind_speed_10m,relative_humidity_2m&` +
            `daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&` +
            `air_quality=european_aqi&` +
            `timezone=auto&forecast_days=7`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch weather data. Please try again later.');
        }
        
        const data = await response.json();
        currentWeatherData = data;
        
        // Display weather data
        displayWeatherData(data, locationName);
        
    } catch (error) {
        showError(error.message || 'Failed to fetch weather data');
        showToast('error', 'Data Error', 'Could not retrieve weather information.');
    } finally {
        hideLoading();
    }
}

/**
 * Display weather data in the UI
 * @param {Object} data - Weather data from API
 * @param {string} locationName - Location name to display
 */
function displayWeatherData(data, locationName) {
    // Set city name
    cityName.textContent = locationName;
    
    // Set current date
    const date = new Date();
    currentDate.textContent = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Set current weather data
    const currentWeather = data.current;
    const weatherCode = currentWeather.weather_code;
    const weatherInfo = weatherCodeMap[weatherCode] || { description: "Unknown", icon: "unknown.png" };
    
    weatherIcon.src = `https://openweathermap.org/img/wn/${weatherInfo.icon}`;
    weatherIcon.alt = weatherInfo.description;
    weatherDescription.textContent = weatherInfo.description;
    
    // Store temperature for unit conversion
    currentWeatherData.temp_c = currentWeather.temperature_2m;
    currentWeatherData.feels_like_c = currentWeather.apparent_temperature;
    currentWeatherData.temp_f = celsiusToFahrenheit(currentWeather.temperature_2m);
    currentWeatherData.feels_like_f = celsiusToFahrenheit(currentWeather.apparent_temperature);
    
    // Display temperature based on current unit
    updateTemperatureDisplay();
    
    // Set weather details
    windSpeed.textContent = `${currentWeather.wind_speed_10m} km/h`;
    humidity.textContent = `${currentWeather.relative_humidity_2m}%`;
    uvIndex.textContent = currentWeather.uv_index;
    visibility.textContent = `${(currentWeather.visibility / 1000).toFixed(1)} km`;
    
    // Set air quality if available
    if (data.air_quality && data.air_quality.current && data.air_quality.current.european_aqi) {
        const aqi = Math.round(data.air_quality.current.european_aqi);
        aqiValue.textContent = aqi;
        
        // Find the AQI category
        const category = aqiCategories.find(cat => aqi <= cat.max);
        aqiText.textContent = `Air Quality: ${category.label}`;
        aqiValue.style.color = category.color;
    } else {
        aqiValue.textContent = 'N/A';
        aqiText.textContent = 'Air quality data unavailable';
    }
    
    // Display hourly forecast (next 24 hours)
    displayHourlyForecast(data.hourly);
    
    // Display daily forecast
    displayDailyForecast(data.daily);
    
    // Show weather container
    currentWeatherContainer.style.display = 'block';
}

/**
 * Display hourly forecast
 * @param {Object} hourlyData - Hourly forecast data
 */
function displayHourlyForecast(hourlyData) {
    hourlyForecast.innerHTML = '';
    
    // Get current hour to start from
    const currentHour = new Date().getHours();
    
    // Display 24 hour forecast starting from next hour
    for (let i = 1; i <= 24; i++) {
        const time = new Date(hourlyData.time[i]);
        const hour = time.getHours();
        const hourFormatted = hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
        
        const temperature = Math.round(hourlyData.temperature_2m[i]);
        const weatherCode = hourlyData.weather_code[i];
        const weatherInfo = weatherCodeMap[weatherCode] || { description: "Unknown", icon: "unknown.png" };
        
        const forecastItem = document.createElement('div');
        forecastItem.classList.add('forecast-item');
        
        forecastItem.innerHTML = `
            <div class="forecast-time">${hourFormatted}</div>
            <img class="forecast-icon" src="https://openweathermap.org/img/wn/${weatherInfo.icon}" alt="${weatherInfo.description}">
            <div class="forecast-temp">${temperature}°</div>
            <div class="forecast-desc">${weatherInfo.description}</div>
        `;
        
        hourlyForecast.appendChild(forecastItem);
    }
}

/**
 * Display daily forecast
 * @param {Object} dailyData - Daily forecast data
 */
function displayDailyForecast(dailyData) {
    dailyForecast.innerHTML = '';
    
    // Get daily data (days 0-6)
    for (let i = 0; i < dailyData.time.length; i++) {
        const date = new Date(dailyData.time[i]);
        const isToday = i === 0;
        const dayName = isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
        const weatherCode = dailyData.weather_code[i];
        const weatherInfo = weatherCodeMap[weatherCode] || { description: "Unknown", icon: "unknown.png" };
        const maxTemp = Math.round(dailyData.temperature_2m_max[i]);
        const minTemp = Math.round(dailyData.temperature_2m_min[i]);
        const uvIndexMax = dailyData.uv_index_max[i];
        
        const sunrise = new Date(dailyData.sunrise[i]);
        const sunset = new Date(dailyData.sunset[i]);
        const sunriseTime = sunrise.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const sunsetTime = sunset.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        
        const forecastItem = document.createElement('div');
        forecastItem.classList.add('forecast-item');
        
        // Add a highlighted class for today
        if (isToday) {
            forecastItem.classList.add('today');
        }
        
        forecastItem.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <img class="forecast-icon" src="https://openweathermap.org/img/wn/${weatherInfo.icon}" alt="${weatherInfo.description}">
            <div class="forecast-temp">${maxTemp}° / ${minTemp}°</div>
            <div class="forecast-desc">${weatherInfo.description}</div>
        `;
        
        // Add tooltip with additional info
        forecastItem.title = `
            ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            High: ${maxTemp}°C | Low: ${minTemp}°C
            UV Index: ${uvIndexMax}
            Sunrise: ${sunriseTime} | Sunset: ${sunsetTime}
        `;
        
        dailyForecast.appendChild(forecastItem);
    }
}

/**
 * Update temperature display based on selected unit
 */
function updateTemperatureDisplay() {
    if (!currentWeatherData) return;
    
    if (isCelsius) {
        temperature.textContent = `${Math.round(currentWeatherData.temp_c)}°`;
        feelsLike.textContent = `${Math.round(currentWeatherData.feels_like_c)}°`;
    } else {
        temperature.textContent = `${Math.round(currentWeatherData.temp_f)}°`;
        feelsLike.textContent = `${Math.round(currentWeatherData.feels_like_f)}°`;
    }
}

// ============================================
// USER LOCATIONS MANAGEMENT
// ============================================

/**
 * Add location to recent searches
 * @param {string} locationName - Location name
 * @param {number} latitude - Location latitude
 * @param {number} longitude - Location longitude
 */
function addToRecentSearches(locationName, latitude, longitude) {
    // Create location object
    const location = {
        name: locationName,
        latitude,
        longitude,
        timestamp: Date.now()
    };
    
    // Remove if it already exists
    recentSearches = recentSearches.filter(item => item.name !== locationName);
    
    // Add to the beginning of the array
    recentSearches.unshift(location);
    
    // Keep only the last 5 searches
    if (recentSearches.length > 5) {
        recentSearches = recentSearches.slice(0, 5);
    }
    
    // Save to localStorage
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    
    // Update UI
    updateRecentSearches();
}

/**
 * Update recent searches UI
 */
function updateRecentSearches() {
    recentSearchesList.innerHTML = '';
    
    if (recentSearches.length === 0) {
        recentSearchesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>Your recent searches will appear here</p>
            </div>
        `;
        return;
    }
    
    recentSearches.forEach(location => {
        const item = document.createElement('div');
        item.classList.add('location-item');
        
        item.innerHTML = `
            <i class="fas fa-history"></i>
            <span class="location-name">${location.name}</span>
        `;
        
        // Add click event to search for this location
        item.addEventListener('click', () => {
            getWeatherData(location.latitude, location.longitude, location.name);
            
            // Update current location
            currentLocation = {
                name: location.name,
                latitude: location.latitude,
                longitude: location.longitude
            };
            
            // Update favorite button state
            updateFavoriteButtonState();
            
            // Show toast
            showToast('info', 'Location Selected', `Loading weather for ${location.name}`);
        });
        
        recentSearchesList.appendChild(item);
    });
}

/**
 * Toggle favorite status of current location
 */
function toggleFavorite() {
    if (!currentLocation) {
        showToast('warning', 'No Location', 'Please search for a location first to add it to favorites.');
        return;
    }
    
    const locationName = currentLocation.name;
    const locationExists = favorites.some(loc => loc.name === locationName);
    
    if (locationExists) {
        // Remove from favorites
        favorites = favorites.filter(loc => loc.name !== locationName);
        showToast('info', 'Removed from Favorites', `${locationName} has been removed from your favorites.`);
        favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
    } else {
        // Add to favorites
        favorites.push({
            name: locationName,
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude
        });
        showToast('success', 'Added to Favorites', `${locationName} has been added to your favorites.`);
        favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
    }
    
    // Save to localStorage
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // Update favorites UI
    updateFavorites();
}

/**
 * Update favorite button state based on current location
 */
function updateFavoriteButtonState() {
    if (!currentLocation) return;
    
    const isFavorite = favorites.some(loc => loc.name === currentLocation.name);
    
    if (isFavorite) {
        favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
        favoriteBtn.title = 'Remove from favorites';
    } else {
        favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
        favoriteBtn.title = 'Add to favorites';
    }
}

/**
 * Update favorites UI
 */
function updateFavorites() {
    favoritesList.innerHTML = '';
    
    if (favorites.length === 0) {
        favoritesList.innerHTML = `
            <div class="empty-state">
                <i class="far fa-heart"></i>
                <p>Your favorite locations will appear here</p>
            </div>
        `;
        return;
    }
    
    favorites.forEach(location => {
        const item = document.createElement('div');
        item.classList.add('location-item', 'favorite');
        
        item.innerHTML = `
            <i class="fas fa-heart"></i>
            <span class="location-name">${location.name}</span>
        `;
        
        // Add click event to get weather for this location
        item.addEventListener('click', () => {
            getWeatherData(location.latitude, location.longitude, location.name);
            
            // Update current location
            currentLocation = {
                name: location.name,
                latitude: location.latitude,
                longitude: location.longitude
            };
            
            // Update favorite button state
            updateFavoriteButtonState();
            
            // Show toast
            showToast('info', 'Favorite Selected', `Loading weather for ${location.name}`);
        });
        
        favoritesList.appendChild(item);
    });
}

/**
 * Share current weather information
 */
function shareWeather() {
    if (!currentLocation || !currentWeatherData) {
        showToast('warning', 'Nothing to Share', 'Please search for a location first.');
        return;
    }
    
    const locationName = currentLocation.name;
    const temp = isCelsius 
        ? `${Math.round(currentWeatherData.temp_c)}°C` 
        : `${Math.round(currentWeatherData.temp_f)}°F`;
    const description = weatherDescription.textContent;
    
    const shareText = `Current weather in ${locationName}: ${temp}, ${description}. Checked via SkyPulse Weather App.`;
    
    // Use Web Share API if available
    if (navigator.share) {
        navigator.share({
            title: 'Weather Update',
            text: shareText
        })
        .then(() => {
            showToast('success', 'Shared Successfully', 'Weather information shared!');
        })
        .catch(error => {
            console.error('Error sharing:', error);
            fallbackShare(shareText);
        });
    } else {
        fallbackShare(shareText);
    }
}

/**
 * Fallback share method using clipboard
 * @param {string} text - Text to copy to clipboard
 */
function fallbackShare(text) {
    // Create a temporary input element
    const input = document.createElement('textarea');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    
    try {
        // Copy text
        document.execCommand('copy');
        showToast('success', 'Copied to Clipboard', 'Weather information copied! You can now paste and share it.');
    } catch (err) {
        showToast('error', 'Copy Failed', 'Could not copy weather information.');
    }
    
    // Remove the temporary element
    document.body.removeChild(input);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert Celsius to Fahrenheit
 * @param {number} celsius - Temperature in Celsius
 * @returns {number} Temperature in Fahrenheit
 */
function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}

/**
 * Show loading state
 */
function showLoading() {
    loadingContainer.style.display = 'flex';
    currentWeatherContainer.style.display = 'none';
}

/**
 * Hide loading state
 */
function hideLoading() {
    loadingContainer.style.display = 'none';
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    errorMessage.textContent = message;
    errorContainer.style.display = 'flex';
}

/**
 * Hide error message
 */
function hideError() {
    errorContainer.style.display = 'none';
}

/**
 * Show toast notification
 * @param {string} type - Toast type (success, error, warning, info)
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 */
function showToast(type, title, message) {
    const toast = document.createElement('div');
    toast.classList.add('toast', type);
    
    let iconClass = 'fas fa-info-circle';
    switch (type) {
        case 'success':
            iconClass = 'fas fa-check-circle';
            break;
        case 'error':
            iconClass = 'fas fa-exclamation-circle';
            break;
        case 'warning':
            iconClass = 'fas fa-exclamation-triangle';
            break;
    }
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="${iconClass}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add close button functionality
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Remove toast after 4 seconds
    setTimeout(() => {
        if (toast.parentNode === toastContainer) {
            toast.remove();
        }
    }, 4000);
}
