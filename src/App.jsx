import { useState, useEffect } from 'react';
import { 
  Search, MapPin, Wind, Droplets, ThermometerSun, 
  Sun, CloudRain, Cloud, CloudLightning, ChevronLeft, MoreHorizontal, CloudSun, Moon
} from 'lucide-react';
import './index.css';

const API_URL = "https://api.open-meteo.com/v1/forecast";
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const REVERSE_GEO_URL = "https://nominatim.openstreetmap.org/reverse";

// Unsplash Direct Image URLs for dynamic backgrounds
const getBackgroundImage = (code, isDay) => {
  // Clear
  if (code === 0) return isDay ? 'https://images.unsplash.com/photo-1622278647429-71bc205904e8?q=80&w=1080&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1532767153582-b1a0e5145009?q=80&w=1080&auto=format&fit=crop';
  // Clouds
  if (code > 0 && code < 4) return isDay ? 'https://images.unsplash.com/photo-1534088568595-a066f410cbda?q=80&w=1080&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1476822452295-885749f7e50c?q=80&w=1080&auto=format&fit=crop';
  // Rain
  if (code >= 51 && code <= 67) return 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=1080&auto=format&fit=crop';
  // Snow
  if (code >= 71 && code <= 77) return 'https://images.unsplash.com/photo-1542601098-8fc114e148e2?q=80&w=1080&auto=format&fit=crop';
  // Thunderstorm
  if (code >= 95) return 'https://images.unsplash.com/photo-1605727216801-e27ce1d0ce30?q=80&w=1080&auto=format&fit=crop';
  
  return 'https://images.unsplash.com/photo-1622278647429-71bc205904e8?q=80&w=1080&auto=format&fit=crop';
};

function App() {
  const [query, setQuery] = useState('');
  const [weather, setWeather] = useState(null);
  const [locationName, setLocationName] = useState('Monterey');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Interactive state
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchWeather = async (lat, lon, name) => {
    setLoading(true);
    setError(null);
    setSelectedDayIndex(0); // Reset to today when searching
    try {
      const response = await fetch(
        `${API_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max&timezone=auto`
      );
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setWeather(data);
      if (name) setLocationName(name);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(`${REVERSE_GEO_URL}?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            const city = data.address.city || data.address.town || data.address.state || 'Your Location';
            fetchWeather(latitude, longitude, city);
          } catch {
            fetchWeather(latitude, longitude, "Current Location");
          }
        },
        () => fetchWeather(36.6002, -121.8947, 'Monterey')
      );
    } else {
      fetchWeather(36.6002, -121.8947, 'Monterey');
    }
  };

  const searchLocation = async (e) => {
    if (e.key === 'Enter' && query.trim() !== '') {
      setLoading(true);
      try {
        const res = await fetch(`${GEO_URL}?name=${query}&count=1&language=en&format=json`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const { latitude, longitude, name } = data.results[0];
          fetchWeather(latitude, longitude, name);
          setQuery('');
        } else {
          setError('Not found');
          setLoading(false);
        }
      } catch (err) {
        setError('Error');
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  const getWeatherIcon = (code, className, isDay = 1) => {
    if (code === 0) return isDay ? <Sun className={className} /> : <Moon className={className} />;
    if (code > 0 && code < 4) return <CloudSun className={className} />;
    if (code >= 51 && code <= 67) return <CloudRain className={`${className} rain`} />;
    if (code >= 71 && code <= 77) return <CloudRain className={`${className} rain`} />; 
    if (code >= 95) return <CloudLightning className={`${className} rain`} />;
    return <CloudSun className={className} />;
  };

  const getWeatherString = (code) => {
    if (code === 0) return 'Clear';
    if (code === 1 || code === 2) return 'Partly Cloudy';
    if (code === 3) return 'Overcast';
    if (code >= 51 && code <= 67) return 'Light Rain Showers';
    if (code >= 71 && code <= 77) return 'Snow';
    if (code >= 95) return 'Thunderstorms';
    return 'Cloudy';
  };

  const formatHour = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
  };

  if (loading && !weather) {
    return <div className="loading-screen">Loading UI...</div>;
  }

  // INTERACTIVE DATA LOGIC
  const isToday = selectedDayIndex === 0;
  
  // Dates
  const targetDate = new Date(weather.daily.time[selectedDayIndex]);
  const dateStr = targetDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', weekday: 'long' });
  const cardDayStr = isToday ? targetDate.toLocaleDateString('en-US', { weekday: 'long' }) : targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const cardTimeStr = isToday ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase() : "Forecast";

  // Main Card Details
  const temp = isToday ? Math.round(weather.current.temperature_2m) : Math.round(weather.daily.temperature_2m_max[selectedDayIndex]);
  const code = isToday ? weather.current.weather_code : weather.daily.weather_code[selectedDayIndex];
  
  const secondaryTempDesc = isToday ? "Real feel" : "Min Temp";
  const secondaryTemp = isToday ? Math.round(weather.current.apparent_temperature) : Math.round(weather.daily.temperature_2m_min[selectedDayIndex]);

  // Mini Cards
  const hourIndexForDay = selectedDayIndex * 24 + 12; // 12 PM for future days
  const wind = isToday ? weather.current.wind_speed_10m : weather.daily.wind_speed_10m_max[selectedDayIndex];
  const humidity = isToday ? weather.current.relative_humidity_2m : weather.hourly.relative_humidity_2m[hourIndexForDay];
  const tempMax = Math.round(weather.daily.temperature_2m_max[selectedDayIndex]);

  // Tomorrow Card (Always shows index 1)
  const tomorrowCode = weather?.daily.weather_code[1];
  const tomorrowMax = Math.round(weather?.daily.temperature_2m_max[1]);
  const tomorrowMin = Math.round(weather?.daily.temperature_2m_min[1]);

  // Dynamic Background Calculation
  // If it's today, check if it's day or night. If a future day, default to Day.
  const isDayTheme = isToday ? weather.current.is_day : 1;
  const dynamicImageURL = getBackgroundImage(code, isDayTheme);

  return (
    <>
      {/* 1. App Background - Blurry frosted glass effect showing the dynamic image beneath */}
      <div className="app-background" style={{ backgroundImage: `url(${dynamicImageURL})` }}></div>
      <div className="app-background-overlay"></div>
      
      {/* 2. Main Content Wrapper */}
      <div>
        
        {/* Top Header */}
        <div className="header-nav">
          <button className="header-btn" onClick={getUserLocation}><ChevronLeft size={24} /></button>
          <div className="header-location">
            <div className="city-name">{locationName}</div>
            <div className="text-muted text-sm">{dateStr}</div>
          </div>
          <button className="header-btn"><MoreHorizontal size={24} /></button>
        </div>

        {/* Search */}
        <div className="search-wrapper">
          <Search className="text-muted" size={20} />
          <input 
            type="text" 
            placeholder="Search For City" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={searchLocation}
          />
          <MapPin className="text-muted" size={20} />
        </div>

        <div className="app-grid">
          
          {/* LEFT COLUMN: MAIN CARD */}
          <div>
            {/* 3. Main Card with Dynamic Background Image and Gradient Overlay */}
            <div className="main-card" style={{ backgroundImage: `url(${dynamicImageURL})` }}>
              
              <div className="main-card-header">
                <span className="font-semibold">{cardDayStr}</span>
                <span className="text-muted">{cardTimeStr}</span>
              </div>

              <div className="main-card-body">
                <div className="huge-temp">
                  {temp}<span>°C</span>
                </div>
                {getWeatherIcon(code, "weather-icon-huge", isDayTheme)}
              </div>

              <div className="real-feel">
                {secondaryTempDesc} {secondaryTemp}°C
              </div>

              {/* Highlights inside the card - using gorgeous translucent glassmorphism! */}
              <div className="mini-cards-grid">
                
                <div className="mini-card">
                  <Wind className="mini-card-icon" size={24} />
                  <div className="mini-card-title">Wind</div>
                  <div className="mini-card-value">{wind} km/h</div>
                </div>

                <div className="mini-card">
                  <ThermometerSun className="mini-card-icon" size={24} />
                  <div className="mini-card-title">Max Temp</div>
                  <div className="mini-card-value">{tempMax}°C</div>
                </div>

                <div className="mini-card">
                  <Droplets className="mini-card-icon" size={24} />
                  <div className="mini-card-title">Humidity</div>
                  <div className="mini-card-value">{humidity}%</div>
                </div>

              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: HOURLY & FORECAST LIST */}
          <div>
            <div className="section-title">
              {isToday ? "Hourly Forecast" : `${cardDayStr} Forecast`}
            </div>
            
            <div className="hourly-container">
              {weather.hourly.time.slice(selectedDayIndex * 24, (selectedDayIndex * 24) + 12).map((time, idx) => {
                const isActive = idx === 0 && isToday;
                return (
                  <div key={time} className={`hourly-item ${isActive ? 'active' : ''}`}>
                    <div className="hourly-time">{isActive ? 'Now' : formatHour(time)}</div>
                    {getWeatherIcon(weather.hourly.weather_code[(selectedDayIndex * 24) + idx], isActive ? "" : "text-muted", 1)}
                    <div className="hourly-temp">{Math.round(weather.hourly.temperature_2m[(selectedDayIndex * 24) + idx])}°</div>
                  </div>
                );
              })}
            </div>

            <div className="section-title" style={{ marginTop: '2rem', marginBottom: 0 }}>Upcoming</div>
            
            {/* Tomorrow Card */}
            <div 
              className="tomorrow-card" 
              onClick={() => setSelectedDayIndex(1)}
              style={{ 
                 cursor: 'pointer',
                 transform: selectedDayIndex === 1 ? 'scale(1.02)' : 'scale(1)',
                 border: selectedDayIndex === 1 ? '2px solid white' : 'none'
              }}
            >
              <div className="tomorrow-left">
                {getWeatherIcon(tomorrowCode, "", 1)}
                <div>
                  <div className="tomorrow-title">Tomorrow</div>
                  <div className="tomorrow-desc">{getWeatherString(tomorrowCode)}</div>
                </div>
              </div>
              <div className="tomorrow-temps">
                ↑ {tomorrowMax}° ↓ {tomorrowMin}°
              </div>
            </div>

            {/* 7-Day Extension */}
            <div className="weekly-container">
              {weather.daily.time.slice(2, 7).map((time, idx) => {
                const actualIndex = idx + 2; 
                const dayName = new Date(time).toLocaleDateString('en-US', { weekday: 'long' });
                const code = weather.daily.weather_code[actualIndex];
                const max = Math.round(weather.daily.temperature_2m_max[actualIndex]);
                const min = Math.round(weather.daily.temperature_2m_min[actualIndex]);
                
                const isActiveDay = selectedDayIndex === actualIndex;

                return (
                  <div 
                    key={time} 
                    className={`weekly-item ${isActiveDay ? 'active-day' : ''}`}
                    onClick={() => setSelectedDayIndex(actualIndex)}
                  >
                    <div className="weekly-day">{dayName}</div>
                    <div className="weekly-icon">{getWeatherIcon(code, isActiveDay ? "" : "text-muted", 1)}</div>
                    <div className="weekly-temps">
                      <span className="font-medium">{max}°</span>
                      <span className="text-muted ml-2">{min}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </>
  );
}

export default App;
