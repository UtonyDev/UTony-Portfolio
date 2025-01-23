import { useState, useEffect, useRef } from 'react';
import { motion } from "framer-motion";
import LocationForm from './locationForm';
import { FaUndo } from 'react-icons/fa';
import axios from "axios";
import './uweather.css';
import './form.css';
import DaysInfoPage from './daysInfoPage';
import 'intersection-observer';
import { useAsyncError, useLocation } from 'react-router-dom';

const UWeather = () => {
    const [data, setData] = useState(null);
    const [prompt, setPrompt] = useState(false); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [indexHour, setIndexHour] = useState(0);
    const [address, setAddress] = useState('');
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [holdResult, setHoldResult] = useState('');
    const [chosenIndex, setChosenIndex] = useState(0);
    const [dayPage, setDayPage] = useState(false);
    const [dayIndex, setDayIndex] = useState(0);
    const [metricUnit, setMetricUnit] = useState(false);
    const [usUnit, setUSUnit] = useState(false);
    const [ukUnit, setUKUnit] = useState(false);
    const [fahrenhait, setFahrenhait] = useState(false);
    const [preferredUnit, setPreferredUnit] = useState('');
    const [celsiusBox, setCelsiusBox] = useState(false);
    const [fahrenhaitBox, setFahrenhaitBox] = useState(false);
    const hourInfoRef = useRef([]); 
    const hourTimeRef = useRef([]);
    const dayRef = useRef([]);
    const weatherPage = useLocation();

    const API_KEY = '124d73669936416ea36f14503e262e7d';

    const InputValChange = async (e) => {
        const value = e.target.value;
        setQuery(value);

        if (value.length > 3) { 
            try {
                const response = await axios.get(`https://api.opencagedata.com/geocode/v1/json`, {
                    params: {
                        q: value,
                        key: API_KEY,
                        limit: 6, 
                        language: "en",
                    },
                });



                const results = response.data.results.map((result) => result.formatted);
                setHoldResult(results);
                setSuggestions(results);
            
            } catch (error) {
                console.error("Error fetching suggestions:", error);
                alert(error);
            }
            
        } else {
            setSuggestions([]);
        }
    }

    const unformatLocation = (index) => {
        const chosenList = holdResult[index];
        console.log(chosenList);

       const splitData = chosenList.split(',');
       console.log(splitData)
        if (splitData) {
            const newcity = splitData[0];
            const newcountry = splitData[splitData.length - 1];
            console.log(newcountry)
            let unit = checkCountry(newcountry);
            fetchData(newcity, newcountry, unit);
            console.log('search length is:', splitData.length);
        }
    }

    const resetData = () => {
        localStorage.removeItem('weatherCache');
        localStorage.removeItem('userUnitPref');
        window.location.reload()
    }

    useEffect(() => {
        // Retrieve the weather cache object from localStorage
        const weatherCacheKey = 'weatherCache';
        const cachedData = JSON.parse(localStorage.getItem(weatherCacheKey)) || {};
    
        console.log('Cached data:', cachedData);
    
        // Check if there is any data in the cache
        if (Object.keys(cachedData).length > 0) {
            const latestKey = Object.keys(cachedData)[Object.keys(cachedData).length - 1]; // Get the last added key
            let latestData = cachedData[latestKey];
    
            setData(latestData); // Use the most recent cached data for rendering
            console.log('Using cached data from weatherCache:', latestData);
            console.log(latestData.resolvedAddress);

            let userUnitPreference = localStorage.getItem('userUnitPref');
            console.log('the user prefers: ', userUnitPreference);

            if (userUnitPreference) {
                checkCountry(userUnitPreference);
            } else {
                console.log('user hasnt set preference');
                let cacheLocation = latestData.resolvedAddress.split(',');
                const cacheCountry = cacheLocation[cacheLocation.length -1];
                checkCountry(cacheCountry);    
            }

        } else {
            // No cached data, show the location prompt
            setPrompt(true);
        }


    }, [weatherPage]);

    const iconBasePath = '/GWeatherIcons/';
    useEffect(() => {
        if (data) {
    
            if (data.days && data.days[0]?.hours) {            
                // Extract user's hour for debugging
                const timeinData = data.days[0].hours[23].datetime;
                const date = new Date(timeinData * 1000);
                const realTime = new Date();
                const realHour = realTime.getHours();
                const hour = date.getHours();

                // Current duration index being used
                const timezone = data.timezone;
                console.log(timezone);

                const currentTime = new Intl.DateTimeFormat("en-US", {
                    timeZone: timezone,
                    hour: "2-digit",
                    hour12: false // Use 24-hour format, set to true for 12-hour format
                }).format(new Date());

                function parseCurrentTime(time) {
                    if (time.charAt(0) == 0) {
                        console.log('yes theres a zero in front');
                        const parsedTime = time.slice(1);
                        return parsedTime;
                    } else {
                        return time;
                    }
                }
                const currentHour = parseCurrentTime(currentTime);

                const parts = data.resolvedAddress.split(",");
                const coordinates = parts.every(part => !isNaN(part) && part.trim() !== "");
                if (coordinates ) {
                    const resolvedAddress = localStorage.getItem("resolvedAddress");
                    console.log("Resolved Address:", resolvedAddress);
                    console.log("coords address:", address);
                    setAddress(resolvedAddress)
                } else {
                    console.log('use entered address');
                    setAddress(data.resolvedAddress);
                }

                const currentvalue = data.days[0].hours[currentHour].temp;    
                // Update the state
                console.log(currentHour);
                setIndexHour(currentHour);

            } else {
                console.log('Data structure incomplete or missing days/hours');
            }
        } else {
            console.log('Data is not yet available');
        }
 
    }, [data]); // Re-run the effect whenever 'data' changes

    // Function to fetch weather data.
    const fetchData = async (city, country, unit) => {
        const cacheKey = `${city}:${country}:${unit}`;
        const weatherCacheKey = 'weatherCache';
        let userUnitPreference = localStorage.getItem('userUnitPref');
        if (userUnitPreference) {
            checkCountry(userUnitPreference);
        } else {
            checkCountry(country);
        }
        
        // Retrieve the cache object from localStorage
        const cachedData = JSON.parse(localStorage.getItem(weatherCacheKey)) || {};
        console.log('Cache key:', cacheKey);
    
        // Check if data for the given city-country pair exists in the cache
        if (cachedData[cacheKey]) {
            const jsonCachedData = cachedData[cacheKey]; // Access cached data
            setData(jsonCachedData); // Set the state to cached data
            console.log('Using cached weather data:', jsonCachedData);
        } else {
            console.log('Data not found in cache... fetching from server');

        if (chosenIndex) {
            setPrompt(true); 
            console.log('yes', chosenIndex);
        } else {
            setPrompt(false);
            setLoading(true);
            console.log('no', chosenIndex);
        }
            try {
                const response = await fetch(`https://utony-weather-server.onrender.com/api/weather?city=${city}&country=${country}&unit=${unit}`);

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
    
                const jsonData = await response.json();
                const storedData = [];
                localStorage.setItem(storedData, jsonData);
                console.log('new stored data', storedData)
                // Update the cache object with new data
        
        
                cachedData[cacheKey] = jsonData;
                localStorage.setItem(weatherCacheKey, JSON.stringify(cachedData)); // Save the updated cache to localStorage
    
                setData(jsonData); // Set the fetched data to state
                console.log('Fetched data from server:', jsonData);

                
            } catch (err) {
                console.error('Error fetching weather data:', err);
                setError(err.message); // Handle network error
            } finally {
                setPrompt(false); // End prompt state
                setLoading(false);

            }
        }
    };

    const convertCoordinates = async (latitude, longitude, unit) => {
        const apiKey = '124d73669936416ea36f14503e262e7d';

        const url = `https://api.opencagedata.com/geocode/v1/json?key=${apiKey}&q=${latitude}%2C+${longitude}&pretty=1&no_annotations=1`;

        fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.results.length > 0) {
            const city = `${data.results[0].components._normalized_city}, ${data.results[0].components.state},`;
            const country = `${data.results[0].components.country}`;
            console.log(country);
            const unit = checkCountry(country);
            const resolvedAddress = `${city}${country}`;
            localStorage.setItem("resolvedAddress", resolvedAddress);
            setAddress(resolvedAddress);

            console.log(resolvedAddress);
            } else {
            console.log('No results found.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }

    function waitForCheckboxes(timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
    
            function check() {
                const customCheckBox1 = document.querySelector('.custom-checkbox1');
                const customCheckBox2 = document.querySelector('.custom-checkbox2');
    
                if (customCheckBox1 && customCheckBox2) {
                    resolve({ customCheckBox1, customCheckBox2 });
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error("Checkboxes did not load within the timeout period."));
                } else {
                    setTimeout(check, 100); // Check again in 100ms
                }
            }
    
            check();
        });
    }

    function checkActionCels() {
        checkCountry('metric');
        localStorage.setItem('userUnitPref', 'metric');
        const userPref = localStorage.getItem("userUnitPref");
        console.log(userPref)
    }

   function checkActionFahr() {
        checkCountry('us');
        localStorage.setItem('userUnitPref', 'us');
        const userPref = localStorage.getItem("userUnitPref");
        console.log(userPref)
   }

    async function checkCountry(countries) {
        try {
            // Wait for checkboxes to exist
            const { customCheckBox1, customCheckBox2 } = await waitForCheckboxes();
    
            const theUSA = ' United States of America';
            const theus = 'us';
            const theUS = ' United States';
            const theUKE = 'England';
            const theUK = 'United Kingdom';
    
            if (countries === theUS || countries === theUSA || countries === theus) {
                setUSUnit(true);
                setUKUnit(false);
                setMetricUnit(false);
                setFahrenhaitBox(true);
                customCheckBox1.checked = false;
                customCheckBox2.checked = true; // Set Fahrenheit radio
                defaultTempUnit();
                console.log('In the US');
            } else if (countries === theUKE || countries === theUK) {
                setUKUnit(true);
                setUSUnit(false);
                setMetricUnit(false);
                setCelsiusBox(true);
                customCheckBox1.checked = true; // Set Celsius radio
                customCheckBox2.checked = false;
                defaultTempUnit();
                console.log('In the UK');
            } else {
                setMetricUnit(true);
                setUKUnit(false);
                setUSUnit(false);
                setCelsiusBox(true);
                customCheckBox1.checked = true; // Set Celsius radio
                customCheckBox2.checked = false;
                defaultTempUnit();
                console.log('The rest of the world...');
                return 'metric';
            }
        } catch (error) {
            console.error(error.message);
        }
    }

      
    const defaultTempUnit = (tempunit) => {
        if (metricUnit) {
            const celsius = Math.round((tempunit - 32) * (5 / 9));
            return celsius;
        } else if (usUnit) {
            return Math.round(tempunit);
        } else if (ukUnit) {
            const celsius = Math.round((tempunit - 32) * (5 / 9));  
            return celsius;
        } else if (fahrenhait) {
            const Fahrenhait = Math.round((5 / 9) * (tempunit - 32));
            return Fahrenhait;
        }
     }

     const tempSymbol = () => {
        if (usUnit) return '°F';
        return '°C'; // Defaults to Celsius for both metricUnit and ukUnit
      };      
      const symb = tempSymbol();

    if (loading) {
        return (
            <div className="bg-blue-50 place-items-center relative grid w-full h-screen">
                <span className="absolute top-1/3  spinner"></span>
                <div className="plead-message"> Please hold on this may take a while...</div>
            </div>
        )
    }

    if (prompt) {
        return (
            <div className='weather-app h-screen backdrop-blur-sm' id='target'>
                <LocationForm fetchData={fetchData} 
                convertCoordinates={convertCoordinates}/>
            </div>
        );
    }

    if (error) {
        return (
            <div className='weather-app h-screen'>
                <p>Error: {error} please enter a valid address...</p>
            </div>
        );
    }

     const updateDayIndex = (index) => {
        setDayIndex(index);
     }

     const defaultPage = (page) => {
        setDayPage(page);
     }
                 
    const gradientVariants = {
        start: { background: 'linear-gradient(to right, aliceblue, white)' },
        end: { background: 'linear-gradient(to right, white, aliceblue)' },
    };

     const hourMinFormat = (fullTime) => {
         const formattedTime = fullTime.slice(0, -3);
         return formattedTime;
     }
 
     const dateFormats = {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
    };

    const formatFullDay = (numDay) => {
        const day = new Date(numDay);
        const realDate = new Intl.DateTimeFormat('en-US', dateFormats).format(day);
        return realDate;
    };

    const precipType = (type, amount, snowamount, snowdepth) => {
        const rainmessage = `${amount}, mm  of rainfall` 
        const snowmessage = `${snowamount}, cm  of snow with ${snowdepth} cm Depth`;

        if (type === null) {
            return 'No Current Precipitation'; 
        } else if (type.includes('rain' && 'snow')
        ) {
            return (rainmessage, snowmessage);
        } else if (type.includes('rain')) {
            return (rainmessage);
        } else if (type.includes('rain')) {
            return (snowmessage);
        }
    }
    
    const getHumidityColor = (humidity) => {
        if (humidity >= 0 && humidity < 30) return '#bef264'/*lime-300*/;
        if (humidity >= 30 && humidity < 60) return '#7dd3fc' /*sky-300*/;
        if (humidity >= 60 && humidity <= 100) return '#fdba74'/*orange-300*/;
        return 'gray'; // Default color
    };
    
    const getHumidityBGColor = (humidity) => {
    if (humidity >= 0 && humidity < 30) return '#65a30d'/*lime-600*/;
    if (humidity >= 30 && humidity < 60) return '#0284c7' /*sky-600*/ ;
    if (humidity >= 60 && humidity <= 100) return '#ea580c'/*orange-600*/;
    return 'gray-600'; // Default dark color
    }; 
    
    const getHumidityTxtColor = (humidity) => {
    if (humidity >= 0 && humidity < 30) return '#65a30d'/*lime-600*/;
    if (humidity >= 30 && humidity < 60) return '#7dd3fc' /*sky-600*/ ;
    if (humidity >= 60 && humidity <= 100) return '#fdba74'/*orange-600*/;
    return 'gray-600'; // Default dark color
    }; 
      
    const bearingConversion = (wcb) => {
        if (wcb >= 0 && wcb < 90) { 
            return `N${Math.round(wcb)}E`;
        } else if (wcb >= 90 && wcb < 180) {
            return `N${Math.round(180 - wcb)}E`;
        } else if (wcb >= 180 && wcb < 270) {
            return `S${Math.round(wcb - 180)}W`;
        } else if (wcb >= 270 && wcb < 360) {
            return `S${Math.round(360 - wcb)}E`
        }
    }

    const toKiloM = (mph) => {
        const kmh = Math.round(mph * 1.60934);
        return kmh;
    }

    const baroPercent = (pressure) => {
    const perCent = ( pressure * 100 ) / ( 1013.25 * 1.2 ); // 1.2 added for scalling
    return perCent;
    }

    const UVLevel = (uvval) => {
    const uvPercent = ( uvval * 100 ) / 12;
    return uvPercent;
    }

    const bttmAlign = (uvPercent) => {
    if (uvPercent >= 0 && uvPercent < 50) { return `32`};
    if (uvPercent >= 50 && uvPercent < 75) { return `16`};
    if (uvPercent >= 75 && uvPercent < 100) { return `8`};
    }

    const getPhaseType = (phase) => {
        if (phase == 0) { return `new-moon-phase`};
        if (phase > 0 && phase < 0.25) { return `waxing-crescent-phase`};
        if (phase == 0.25) { return `first-quarter-phase`};
        if (phase > 0.25 && phase < 0.5) { return `waxing-gibbous-phase`};
        if (phase == 0.5) { return `full-moon-phase`};
        if (phase > 0.5 && phase < 0.75) { return `waning-gibbous-phase`};
        if (phase == 0.75) { return `last-quarter-phase`};
        if (phase > 0.75 && phase < 1) { return `waning-crescent-phase`};
    }

    const getPhaseInfo = (phase) => {
        if (phase == 0) { return `New Moon`};
        if (phase > 0 && phase < 0.25) { return `Waxing Crescent`};
        if (phase == 0.25) { return `First Quarter`};
        if (phase > 0.25 && phase < 0.5) { return `Waxing Gibbous`};
        if (phase == 0.5) { return `Full Moon`};
        if (phase > 0.5 && phase < 0.75) { return `Waning Gibbous`};
        if (phase == 0.75) { return `Last Quarter`};
        if (phase > 0.75 && phase < 1) { return `Waning crescent`};
    }
        
    const settingElement = document.querySelector('#w-menu-card');
    const showSetting = () => {
        if (settingElement.classList.contains('hidden')) {
            settingElement.classList.replace('hidden', "block");
        } else {
            settingElement.classList.toggle('hidden');
            settingElement.classList.add('block');
        }
    }
   
 
     const showCurrentHour = () => {
        if (hourInfoRef.current.length > 0) {
            hourInfoRef.current[indexHour].scrollIntoView({
                behavior: 'instant',
                block: 'nearest',
                inline: 'start',
            });
            
            if (hourTimeRef.current[indexHour]) {
                hourTimeRef.current[indexHour].textContent = 'Now';
                dayRef.current[0].textContent = 'Today';
            }
        } else {
            console.log('elemnt doesnt exist yet')
        }
    };

     if (dayPage) {
        return (
            <div className='weather-app place-items-center relative grid w-full' id='target'>
               <div className="daily-page"> 
                <DaysInfoPage 
                    data={data} checkCountry={checkCountry} defaultTempUnit={defaultTempUnit} dayIndex={dayIndex}
                     onPageUpdate={defaultPage}
                     precipType={precipType} 
                     getHumidityBGColor={getHumidityBGColor}
                     getHumidityColor={getHumidityColor}
                     getHumidityTxtColor={getHumidityTxtColor}
                     bearingConversion={bearingConversion}
                     toKiloM={toKiloM}
                     baroPercent={baroPercent}
                     UVLevel={UVLevel}
                     bttmAlign={bttmAlign}
                     getPhaseType={getPhaseType}
                     getPhaseInfo={getPhaseInfo}
                     hourMinFormat={hourMinFormat}
                     formatFullDay={formatFullDay}
                     showCurrentHour={showCurrentHour}
                /></div>
            </div>
        )
    }
    
    return (
        <motion.div initial="start"
        animate="end"
        variants={gradientVariants}
        transition={{ duration: 5, yoyo: Infinity }} // Infinite gradient animation
        style={{ minHeight: '100vh' }}

        className='h-auto w-auto' 
        id='target'>
            {data && (
                <div id="weather-app" className='grid justify-items-center grid-rows-auto grid-col-2 gap-5 relative top-4 mt-10 ' 
                 >
                    <div className="search z-50 top-12 grid grid-auto w-full">
                        <input type="search"
                         value={query} 
                         className='search-icon bg-teal-100 justify-self-center w-11/12 row-span-auto p-3 focus:outline-none focus:shadow-lg focus:shadow-sky-100 border text-md border-shy-900 shadow-md rounded-full' 
                         name="place" id="place" 
                         onChange={InputValChange} 
                         placeholder={address} />
                    {suggestions.length > 0 && (
                        <ul className=' absolute justify-self-center w-11/12 top-12 text-zinc-800 bg-sky-50 backdrop-blur-md shadow-teal-100 rounded-md overflow-y-auto'>
                            {suggestions.map((suggestion, index) => (
                                <li key={index} className='p-1 border-b border-zinc-300 text-zinc-800 hover:opacity-70' onClick={
                                     () => {
                                        setQuery(suggestion);
                                        setSuggestions([]);
                                        setChosenIndex(index);
                                        unformatLocation(index);
                                        }
                                    }> {suggestion} </li>
                            ))}
                        </ul>
                    )}
                    </div>

                    <div className="temp-con grid grid-auto justify-self-center w-11/12 px-7 py-5 backdrop-blur-sm gap-5 shadow-sm rounded-lg z-40">
                        <h1 className="avg-temp col-span-2 text-teal-900 font-600 text-7xl lining- leading-snug
                        ">{defaultTempUnit(data.days[0].hours[indexHour].temp)}°</h1>
                        <div className="conditions text-s relative top-1/4 place-self-center ms-6">{data.days[0].hours[indexHour].conditions} 
                            <img src={`${iconBasePath}${data.days[0].hours[indexHour].icon}.png`} alt="" className="src size-10" />
                        </div>
                        <div className="feelslike col-span-3 text-teal-600 line-clamp-2 text-sm"> Feels like: {defaultTempUnit(data.days[0].hours[indexHour].feelslike)}{tempSymbol(symb)}</div>

                        <div className="high-temp" > <h2 className='text-teal-600'>High</h2> {defaultTempUnit(data.days[0].tempmax)}{tempSymbol(symb)} </div>
                        <div className="low-temp"> <h2 className='text-teal-600'>Low</h2> {defaultTempUnit(data.days[0].tempmin)}{tempSymbol(symb)} </div>
                        <div className="weather-menu px-1 text-sm py-1 place-self-end w-fit shadow-none">
                            <span className="menu-butn" onTouchStartCapture={showSetting}>
                                <img src="/icons8-menu-vertical-24.png" 
                                className='active:opacity-70 bg-transparent p-1 rounded-full size-fit'
                                alt="" srcSet="" />
                            </span>

                            <div
                                id='w-menu-card' 
                                className="w-menu-card hidden absolute left-[50%] bg-stone-300 w-32 h-40 p-4 rounded z-50"
                              >
                                <div className="pref-units">
                                    <h1 className="desc desc text-base font-medium shadow-sm text-teal-600"> Temperature Units</h1>
                                    <label className="custom-checkbox" htmlFor="">
                                        <p 
                                            className="units check-button1"
                                            onClick={checkActionCels}
                                            >
                                            <input type="radio" className='custom-checkbox1 pe-4' name="celsius" value={'metric'}  /><span></span>Celsius</p>
                                        <p 
                                            className="units check-button2"
                                            onClick={checkActionFahr}
                                            >
                                            <input type="radio" className='custom-checkbox2 pe-4' name="fahrenhait" value={'us'} /> <span></span>Fahrenhait</p>
                                    </label>
                                </div>
                                <button className="px-1 text-sm relative top-4 w-fit shadow-none active:opacity-70" onClick={resetData}> Reset</button>
                            </div>
                        </div>
                    </div>

                    <div className="hourly-forecast forecast grid grid-rows-1 justify-self-center w-11/12 p-4 bg-[#F4F9FF] gap-3 shadow-md rounded-lg">
                        <div className="desc text-xl font-medium text-teal-600"> Hourly Forecast </div>
                        <ul className="flex xtra-sm:space-x-0 space-x-4 overflow-x-auto whitespace-nowrap">
                            {data.days[0].hours.map((hour, index) => (
                            <li 
                            key={index} 
                            className="hour-info bg-sky-100 p-4 rounded-md" 
                            style={{marginInlineEnd: '0.5em'}}
                            ref={(el) => (hourInfoRef.current[index] = el)}
                            onLoad={showCurrentHour}>
                                <p 
                                    className='py-1 hour-time text-zinc-500'
                                    ref={(el) => (hourTimeRef.current[index] = el)}>{hourMinFormat(hour.datetime)}</p>
                                <p className='py-1 text-teal-600 bold'>{defaultTempUnit(hour.temp)}{tempSymbol(symb)}</p>
                                <p className='py-1 text-zinc-500'><img src={`${iconBasePath}${hour.icon}.png`} alt="" className="src size-6" /></p>
                                <p className='py-1 text-zinc-500'> {data.days[0].hours[indexHour].precipprob}% </p>
                            </li>
                            ))}
                        </ul>
                    </div>

                    <div className="daily-forecast forecast grid grid-rows-1 w-11/12 bg-[#F4F9FF] p-3 mt-1 mb mx-3 shadow-md rounded-lg">
                        <div className="desc text-xl font-medium text-teal-600"> Daily Forecast </div>

                        <ul className=" max-h-96 overflow-y-scroll">
                            {data.days.slice(0, 10).map((day, index) => (
                                <li key={index} 
                                    className="grid grid-flow-col bg-sky-100 p-4 rounded-md active:scale-95" 
                                    style={{
                                        marginBlockEnd: '.5em',
                                    }}
                                    onClick={() => {
                                        setDayPage(true);
                                        updateDayIndex(index);
                                        }}
                                    >
                                    <p className='inline-block font-medium text-zinc-500' ref={(el) => (dayRef.current[index]) = el }>{formatFullDay(day.datetime)}</p>
                                    <span className="dayInfo justify-self-end ">
                                    <p className='inline-block italic text-teal-600 px-2'>{defaultTempUnit(day.temp)}{tempSymbol(symb)}</p>
                                    <p className='inline-block text-zinc-700 px-2'>{Math.round(day.precipprob)}%</p>
                                    <p className="inline-block "><img src={`${iconBasePath}${day.icon}.png`} alt="" className="src size-5" /> </p>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="current-conditions justify-self-center w-11/12">
                            <div className="desc text-xl text-teal-600 font-medium py-2"> Current Conditions </div>

                        <div className="weather-elements grid row-auto grid-cols-2 justify-items w-full gap-x-4 gap-y-4">

                            <div className="precip bg-[#F4F9FF] border w-full h-fit p-4  rounded-sm drop-shadow-sm">
                                <div className="desc text-xl font-meduim text-teal-600 bold">Precipitaion</div>
                                <p className='px-2 py-3 text-5xl font-medium text-blue-500'> {Math.round(data.days[0].hours[indexHour].precipprob)}% </p> 
                                <p className="raininfo my-2 text-blue-900">Chance of rain</p> 
                                <hr className='my-2 text-zinc-700' />                  
                                <p className='py-1 font-medium text-zinc-700'> {precipType(data.days[0].hours[indexHour].preciptype, data.days[0].hours[indexHour].precip, data.days[0].hours[indexHour].snow, data.days[0].hours[indexHour].snowdepth)} </p> 
                            </div>

                            <div className="humid bg-[#F4F9FF] border w-full h-fit p-4 rounded-lg drop-shadow-sm" >
                                <div className="desc text-xl font-medium  text-teal-600 bold"> Humidity </div>
                                <div className="ms-4 mt-4 text-sm text-zinc-400">100</div>
                                <p className={`auto grid border-xl border-zinc-200 shadow-lg relative px-6 h-20 w-fit m-1 rounded-full overflow-hidden`}
                                style={{
                                    backgroundColor: getHumidityColor((data.days[0].hours[indexHour].humidity))
                                }}>
                                   <span 
                                        className={`level absolute left-0 top-full transform -translate-y-full w-full px-6 rounded-`}
                                        style={{
                                            height: `${(data.days[0].hours[indexHour].humidity)}%`,
                                            backgroundColor: getHumidityBGColor((data.days[0].hours[indexHour].humidity))
                                            }}>
                                        <span className={`humid text-lg ps-0 py-1 w-full font-bold absolute left-[15%] top-3/4 transform -translate-y-full`}
                                        style={{
                                            color: getHumidityTxtColor((data.days[0].hours[indexHour].humidity))
                                        }}>
                                        {Math.round(data.days[0].hours[indexHour].humidity)}%</span>
                                    </span>
                                </p> <div className="ms-6 mb-4 text-sm text-zinc-400"> 0 </div>
                                <p className='py-1 inline'> 
                                    <span className="dew inline-block border rounded-full p-1 text-center text-green-700 bg-green-300"> 
                                    {Math.round(defaultTempUnit(data.days[0].hours[indexHour].dew))}°</span> <span className="wr text-zinc-500 inline-block">Dew point</span>  </p>                       
                            </div>

                            <div className="wind bg-[#F4F9FF] relative bottom-[7%] border w-full h-fit p-4 rounded-sm drop-shadow-sm">
                                <div className="desc text-xl font-medium text-teal-600 bold">Wind</div>

                                <div className="compass grid">
                                    <div className="north justify-self-center text-zinc-500">N</div>
                                    <div className="east justify-self-end relative top-full text-zinc-500">E</div>
                                    <div 
                                    className="arrow justify-self-center text-4xl"
                                    >
                                        <img src="/compass.png" alt="" srcSet="" className='w-6 h-6 '
                                        style={{
                                            transform: `rotate(${data.days[0].hours[indexHour].winddir}deg)`,
                                            }}/>
                                        
                                    </div>
                                    <div className="west relative bottom-full text-zinc-500">W</div>
                                    <div className="south justify-self-center text-zinc-500">S</div>
                                </div>
                                <p className='py-1 text-zinc-700'> {bearingConversion(data.days[0].hours[indexHour].winddir)} </p>
                                <hr className='my-2 text-zinc-400' />
                                <p className='py-1 text-teal-500'> 
                                    <span className="speed text-2xl font-semibold"> {toKiloM(data.days[0].hours[indexHour].windspeed)} </span>
                                    km/h
                                </p>
                            </div>

                            <div className="pressure bg-[#F4F9FF] border w-full h-fit p-4 rounded-sm drop-shadow-sm">
                                <div className="desc text-xl font-medium text-teal-600"> Pressure </div>

                                <div className="p_ring  relative bg w-16 h-16 grid place-items-center m-2 rounded-full">
                                    <span className="block absolute z-20 bottom-0 top-[80%] left-[25%] right-0 h-1/4 w-1/2 bg-[#F4F9FF] rounded-full " aria-hidden="true"></span>
                                    <div className="progress absolute w-full h-full rounded-full"
                                    style={{
                                        background: `conic-gradient(
                                        from 150deg,
                                        #0ea5e9 20%,
                                        #0ea5e9 ${baroPercent(data.days[0].hours[indexHour].pressure)}%,
                                        #bae6fd 50%,
                                        #bae6fd 100%
                                        )`,
                                        mask: `radial-gradient(circle, transparent 55%, black 55%)`,
                                    }} 
                                    
                                    ></div>
                                </div>
                                <span className="h z-30 relative bottom-4 ms-3 text-xs text-zinc-400">low</span>
                                <span className="l z-30 relative bottom-4 ms-4 text-xs text-zinc-400">high</span>
                                <p className='py-1 text-zinc-500'> 
                                    <span className="pval font-semibold text-2xl">{data.days[0].hours[indexHour].pressure}</span> mb 
                                </p>
                            </div>

                            <div className="visible relative bottom-[9%] border w-full h-fit p-3 bg-[#F4F9FF] rounded-sm drop-shadow-sm">
                                <div className="desc text-xl font-medium text-teal-600">Visibility</div>

                                <img src="/horizon.png" alt="" className="s m-4" />
                                <p className='py-1 text-zinc-500'> <img src="/visibility.png" alt="" className='me-1 inline-block'/>
                                    {toKiloM(data.days[0].hours[indexHour].visibility)} km
                                </p>
                                <p className='py-1  text-zinc-500'> <img src="/cloud-cover.png" alt="" className="me-1 inline-block" />
                                    {data.days[0].hours[indexHour].cloudcover} %
                                </p>                                                
                            </div>

                            <div className="solar border w-full bg-[#F4F9FF] relative bottom-[27%] h-fit p-4 rounded-sm drop-shadow-sm">
                                <div className="desc text-xl font-medium text-teal-600 bold">UV Index</div>

                                <div className="uvmeter relative h-fit">
                                <div className="ms-8 relative top-3 text-sm text-zinc-400">11+</div>
                                    <div className="currentUV absolute bottom-1 left-1 text-zinc-400"
                                    style={{
                                            height: `${UVLevel(data.days[0].hours[indexHour].uvindex)}%`,
                                            bottom: `${bttmAlign(UVLevel(data.days[0].hours[indexHour].uvindex))}px`
                                        }}> {data.days[0].hours[indexHour].uvindex} </div>

                                    <div className="sun relative w-16 h-16 m-3 bg-amber-400 rounded-full overflow-clip">
                                        <div className="lev absolute bottom-0  bg-red-600 w-full" 
                                        style={{
                                            height: `${UVLevel(data.days[0].hours[indexHour].uvindex)}%`,
                                        }}></div>
                                    </div>
                                <div className="ms-10 relative bottom-3 text-sm text-zinc-400">0</div>
                                </div>

                                <p className='py-1 text-zinc-500 '> <img src="/sunrays.png" alt="" className="ray inline-block text-zinc-500" /> {data.days[0].hours[indexHour].solarradiation} W/m² </p>
                            </div>

                            <div className="phases grid row-auto grid-cols-2 col-span-2 border w-full h-fit p-4 bg-[#F4F9FF] relative bottom-[35%] rounded-sm drop-shadow-sm">
                                <div className="desc text-xl col-span-2 font-medium text-teal-600 bold"> Astro </div>
                                
                                <div className="sun-phase col-span-1 row-span-2">
                                    <div className="sunrise ">
                                        <h1 className=' text-teal-500'> Sunrise </h1>
                                        <p className='py-1 text-zinc-500'> {hourMinFormat(data.days[0].sunrise)} </p>
                                    </div>
                                    <div className="sunset ">
                                        <h1 className=' text-teal-500'> Sunset </h1>
                                        <p className='py-1 text-zinc-500'> {hourMinFormat(data.days[0].sunset)} </p>
                                    </div> 
                                </div>

                               <div className="moon row-span-2 mx-10">
                                    <div className=" text-teal-500"> Moon </div>
                                    <img src={`/moon-phases/${getPhaseType(data.days[0].moonphase)}.png`} alt="" srcSet="" />
                                    <h1 className="moon-info text-zinc-500"> {getPhaseInfo(data.days[0].moonphase)} </h1>

                                </div>
                                            
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </motion.div>
    );
};

export default UWeather;