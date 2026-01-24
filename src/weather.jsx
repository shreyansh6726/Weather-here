import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Sun, Cloud, CloudRain, 
  CloudLightning, Snowflake, Navigation, Heart, Sunrise, Sunset 
} from 'lucide-react';

const YouTubeLoader = () => (
  <div style={styles.loaderWrapper}>
    <motion.div
      style={styles.ytSpinner}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
    />
  </div>
);

const WeatherApp = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState('C');
  const [favorites, setFavorites] = useState([]);
  
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState({ name: 'London', lat: 51.50, lon: -0.12 });

  // Fetch Countries
  useEffect(() => {
    fetch("https://countriesnow.space/api/v0.1/countries/positions")
      .then(res => res.json())
      .then(data => setCountries(data.data || []));
  }, []);

  // Fetch Cities when country changes
  useEffect(() => {
    if (selectedCountry) {
      fetch("https://countriesnow.space/api/v0.1/countries/cities", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: selectedCountry })
      })
      .then(res => res.json())
      .then(data => setCities(data.data || []));
    } else {
      setCities([]);
    }
  }, [selectedCountry]);

  // Global Search Logic
  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const delayDebounceFn = setTimeout(async () => {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5`);
      const data = await res.json();
      setResults(data.results || []);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const getActivityTip = () => {
    if (!weather) return "";
    const { temperature, weathercode } = weather.current_weather;
    if (weathercode >= 51) return "Rainy vibes: Perfect for indoor productivity.";
    if (temperature > 28) return "Heat alert: Stay hydrated and find some shade!";
    if (temperature < 10) return "Chilly out there: Bundle up before heading out.";
    return "Weather is clear: Perfect for a light walk or run!";
  };

  const getWeatherIcon = (code) => {
    const props = { size: 54 };
    if (code === 0) return <Sun {...props} color="#fcd34d" />;
    if (code >= 1 && code <= 3) return <Cloud {...props} color="#94a3b8" />;
    if (code >= 51 && code <= 67) return <CloudRain {...props} color="#38bdf8" />;
    if (code >= 71 && code <= 77) return <Snowflake {...props} color="#f8fafc" />;
    if (code >= 95) return <CloudLightning {...props} color="#facc15" />;
    return <Cloud {...props} />;
  };

  const fetchWeather = async (lat, lon) => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,apparent_temperature&daily=sunrise,sunset&timezone=auto`);
      const data = await res.json();
      setTimeout(() => { setWeather(data); setLoading(false); }, 800);
    } catch (err) { setLoading(false); }
  };

  useEffect(() => { fetchWeather(selectedCity.lat, selectedCity.lon); }, [selectedCity]);

  const handleCitySelection = async (cityName) => {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1`);
    const data = await res.json();
    if (data.results) {
      const city = data.results[0];
      setSelectedCity({ name: city.name, lat: city.latitude, lon: city.longitude });
    }
  };

  const handleGeoLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      setSelectedCity({ name: "My Location", lat: pos.coords.latitude, lon: pos.coords.longitude });
    }, () => setLoading(false));
  };

  return (
    <div style={styles.container}>
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], backgroundColor: weather?.current_weather.temperature > 25 ? '#f59e0b' : '#3b82f6' }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={styles.blob} 
      />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 100 }} style={styles.glassCard}>
        <div style={styles.favBar}>
          <div style={styles.placeBadge}>{selectedCity.name}</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={styles.toggle} onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}>{unit}</div>
            <Heart 
              size={18} 
              onClick={() => favorites.find(f => f.name === selectedCity.name) ? setFavorites(favorites.filter(f => f.name !== selectedCity.name)) : setFavorites([...favorites, selectedCity])}
              fill={favorites.find(f => f.name === selectedCity.name) ? "#ef4444" : "none"} 
              style={{ cursor: 'pointer' }}
            />
          </div>
        </div>

        <div style={styles.selectionGroup}>
          <div style={styles.rowWrapper}>
            <div style={{ flex: 1 }}>
              <p style={styles.label}>Country</p>
              <select style={styles.fullSelect} onChange={(e) => setSelectedCountry(e.target.value)}>
                <option value="">Select...</option>
                {countries.map(c => <option key={c.name} value={c.name} style={styles.blackText}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <p style={styles.label}>City</p>
              <select 
                disabled={!selectedCountry}
                style={{...styles.fullSelect, opacity: selectedCountry ? 1 : 0.4}} 
                onChange={(e) => handleCitySelection(e.target.value)}
              >
                <option value="">{selectedCountry ? "Select..." : "Lock 🔒"}</option>
                {cities.map(city => <option key={city} value={city} style={styles.blackText}>{city}</option>)}
              </select>
            </div>
          </div>

          <div style={styles.divider}><span>OR SEARCH GLOBAL</span></div>

          <div style={styles.searchBox}>
            <Search size={16} opacity={0.4}/>
            <input style={styles.input} placeholder="Type any city..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <Navigation size={16} style={{ cursor: 'pointer' }} onClick={handleGeoLocation} />
          </div>

          <AnimatePresence>
            {results.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={styles.dropdown}>
                {results.map(c => (
                  <div key={c.id} style={styles.dropItem} onClick={() => { setSelectedCity({name: c.name, lat: c.latitude, lon: c.longitude}); setResults([]); setQuery(''); }}>
                    {c.name}, <span style={{fontSize: '10px', opacity: 0.5}}>{c.country}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={styles.mainDisplay}>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.centerCol}>
                <YouTubeLoader />
                <p style={styles.loadingText}>SYNCING...</p>
              </motion.div>
            ) : weather && (
              <motion.div key={selectedCity.name} initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}>
                <motion.div variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
                  {getWeatherIcon(weather.current_weather.weathercode)}
                </motion.div>
                <motion.h1 variants={{ hidden: { scale: 0.8, opacity: 0 }, visible: { scale: 1, opacity: 1 } }} style={styles.bigTemp}>
                  {unit === 'C' ? Math.round(weather.current_weather.temperature) : Math.round((weather.current_weather.temperature * 9/5) + 32)}°
                </motion.h1>
                <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} style={styles.sparklineContainer}>
                  <svg viewBox="0 0 200 40" style={styles.svg}>
                    <motion.polyline initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5 }} fill="none" stroke="#38bdf8" strokeWidth="2" points={weather.hourly.temperature_2m.slice(0, 24).map((t, i) => `${i * 8.6},${40 - (t - Math.min(...weather.hourly.temperature_2m.slice(0, 24)) + 5)}`).join(' ')} />
                  </svg>
                </motion.div>
                <motion.div variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }} style={styles.grid}>
                  <div style={styles.gridItem}><Sunrise size={12}/> {weather.daily.sunrise[0].split('T')[1]}</div>
                  <div style={styles.gridItem}><Sunset size={12}/> {weather.daily.sunset[0].split('T')[1]}</div>
                </motion.div>
                <motion.div variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }} style={styles.tipBox}>{getActivityTip()}</motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

const styles = {
  container: { height: '100vh', width: '100%', background: '#020617', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative', color: '#fff', fontFamily: 'Inter, sans-serif' },
  blob: { position: 'absolute', width: '700px', height: '700px', filter: 'blur(120px)', borderRadius: '50%', zIndex: 0, opacity: 0.2 },
  glassCard: { width: '420px', padding: '30px', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(40px)', borderRadius: '40px', zIndex: 1, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' },
  favBar: { display: 'flex', marginBottom: '25px', alignItems: 'center' },
  placeBadge: { padding: '6px 14px', background: 'linear-gradient(45deg, #38bdf8, #818cf8)', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' },
  toggle: { fontSize: '12px', cursor: 'pointer', opacity: 0.6, fontWeight: 'bold' },
  selectionGroup: { display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' },
  rowWrapper: { display: 'flex', gap: '10px' },
  label: { fontSize: '9px', fontWeight: 'bold', opacity: 0.3, marginBottom: '5px', textTransform: 'uppercase' },
  fullSelect: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '14px', outline: 'none', fontSize: '12px' },
  blackText: { color: '#000' },
  divider: { textAlign: 'center', margin: '5px 0', fontSize: '8px', opacity: 0.2, letterSpacing: '1px' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '12px 15px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' },
  input: { background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize: '12px' },
  dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', color: '#000', borderRadius: '14px', zIndex: 10, marginTop: '8px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
  dropItem: { padding: '12px 15px', borderBottom: '1px solid #eee', cursor: 'pointer', fontSize: '12px' },
  mainDisplay: { textAlign: 'center', marginTop: '20px', minHeight: '340px', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  bigTemp: { fontSize: '6rem', fontWeight: '100', margin: '10px 0' },
  sparklineContainer: { margin: '10px 0', width: '100%' },
  svg: { width: '100%', height: '40px' },
  grid: { display: 'flex', gap: '8px', justifyContent: 'center' },
  gridItem: { background: 'rgba(255,255,255,0.03)', padding: '8px 15px', borderRadius: '20px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '6px' },
  tipBox: { marginTop: '20px', padding: '15px', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '18px', fontSize: '11px', color: '#7dd3fc', borderLeft: '3px solid #38bdf8' },
  loaderWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  ytSpinner: { width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(255, 255, 255, 0.05)', borderTop: '3px solid #38bdf8' },
  loadingText: { fontSize: '8px', letterSpacing: '2px', marginTop: '12px', opacity: 0.5 },
  centerCol: { display: 'flex', flexDirection: 'column', alignItems: 'center' }
};

export default WeatherApp;