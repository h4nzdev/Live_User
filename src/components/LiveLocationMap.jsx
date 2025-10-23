import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icon for famous places
const famousPlaceIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom RED icon for user location
const userLocationIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  iconRetinaUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Famous places in Cebu with coordinates - ALL SET TO 5 METERS RADIUS FOR TESTING
const famousPlaces = [
  {
    id: 1,
    name: "Magellan's Cross",
    lat: 10.2929,
    lng: 123.9013,
    description: "Historical cross planted by Ferdinand Magellan in 1521",
    type: "Historical Site",
    notificationDistance: 5,
  },
  {
    id: 2,
    name: "Basilica del Santo Niño",
    lat: 10.2942,
    lng: 123.9017,
    description: "Oldest Roman Catholic church in the Philippines",
    type: "Religious Site",
    notificationDistance: 5,
  },
  {
    id: 3,
    name: "Fort San Pedro",
    lat: 10.2921,
    lng: 123.9044,
    description: "Oldest triangular bastion fort in the Philippines",
    type: "Historical Fort",
    notificationDistance: 5,
  },
  {
    id: 4,
    name: "Taoist Temple",
    lat: 10.3396,
    lng: 123.9141,
    description: "Beautiful Taoist temple in Beverly Hills",
    type: "Religious Site",
    notificationDistance: 5,
  },
  {
    id: 5,
    name: "Cebu Taoist Temple",
    lat: 10.3394,
    lng: 123.9138,
    description: "Chinese temple with panoramic views of Cebu",
    type: "Religious Site",
    notificationDistance: 5,
  },
  {
    id: 6,
    name: "Yap-Sandiego Ancestral House",
    lat: 10.2932,
    lng: 123.9021,
    description: "One of the oldest residential houses in the Philippines",
    type: "Historical House",
    notificationDistance: 5,
  },
  {
    id: 7,
    name: "Cebu Metropolitan Cathedral",
    lat: 10.295,
    lng: 123.9025,
    description: "Ecclesiastical seat of the Metropolitan Archdiocese of Cebu",
    type: "Religious Site",
    notificationDistance: 5,
  },
  {
    id: 8,
    name: "Cebu Heritage Monument",
    lat: 10.2935,
    lng: 123.9028,
    description: "Sculptural tableau of key events in Cebu's history",
    type: "Monument",
    notificationDistance: 5,
  },
  {
    id: 9,
    name: "Colon Street",
    lat: 10.2987,
    lng: 123.8996,
    description: "Oldest street in the Philippines",
    type: "Historical Street",
    notificationDistance: 5,
  },
  {
    id: 10,
    name: "Sirao Flower Farm",
    lat: 10.3892,
    lng: 123.7994,
    description: "Little Amsterdam of Cebu with beautiful flowers",
    type: "Garden",
    notificationDistance: 5,
  },
];

// Function to calculate distance between two coordinates in meters
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Component to handle live location updates and proximity detection
function LocationUpdater({
  setLocation,
  setError,
  showNotification,
  isTesting,
  testPosition,
}) {
  const map = useMap();
  const lastNotificationTime = useRef({}); // Track last notification time per place

  useEffect(() => {
    if (isTesting) {
      // Use test position for testing mode
      const newLocation = {
        lat: testPosition.lat,
        lng: testPosition.lng,
        accuracy: 5,
      };
      setLocation(newLocation);
      checkProximity(newLocation);

      // Center map on test position
      map.setView([testPosition.lat, testPosition.lng], map.getZoom());
      return;
    }

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };

        setLocation(newLocation);
        setError(null);

        // Center map on new location
        map.setView([newLocation.lat, newLocation.lng], map.getZoom());

        // Check proximity to famous places
        checkProximity(newLocation);
      },
      (error) => {
        setError(`Error: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
        distanceFilter: 1,
      }
    );

    return () => {
      if (!isTesting) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [map, setLocation, setError, showNotification, isTesting, testPosition]);

  // Check if user is near any famous places - TRIGGER EVERY TIME!
  const checkProximity = (currentLocation) => {
    const now = Date.now();

    famousPlaces.forEach((place) => {
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        place.lat,
        place.lng
      );

      // If within notification distance - ALWAYS TRIGGER!
      if (distance <= place.notificationDistance) {
        // Prevent spam by limiting notifications to once every 10 seconds per place
        const lastNotified = lastNotificationTime.current[place.id] || 0;
        if (now - lastNotified > 10000) {
          // 10 second cooldown
          showNotification({
            title: "🏛️ Famous Place Nearby!",
            message: `You're approaching ${place.name} - ${place.description}`,
            type: "info",
            placeId: place.id,
          });
          lastNotificationTime.current[place.id] = now;

          // Also show browser notification
          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification(`🏛️ ${place.name} Nearby!`, {
              body: `You're within ${place.notificationDistance}m of ${place.name}`,
            });
          }
        }
      }
    });
  };

  return null;
}

// Arrow Controller Component for Testing
const ArrowController = ({ position, setPosition, isTesting }) => {
  const moveStep = 0.0001; // Small movement step for precise control

  const move = (direction) => {
    let newLat = position.lat;
    let newLng = position.lng;

    switch (direction) {
      case "up":
        newLat += moveStep;
        break;
      case "down":
        newLat -= moveStep;
        break;
      case "left":
        newLng -= moveStep;
        break;
      case "right":
        newLng += moveStep;
        break;
      default:
        break;
    }

    setPosition({ lat: newLat, lng: newLng });
  };

  if (!isTesting) return null;

  return (
    <div className="absolute top-20 left-4 z-[1000] bg-white p-4 rounded-lg shadow-lg">
      <h3 className="font-bold mb-2">🧭 Testing Controller</h3>
      <p className="text-xs text-gray-600 mb-2">Move the marker with arrows</p>

      {/* Up Arrow */}
      <div className="flex justify-center mb-1">
        <button
          onClick={() => move("up")}
          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded w-12 h-12 flex items-center justify-center text-xl"
        >
          ↑
        </button>
      </div>

      {/* Left/Right Arrows */}
      <div className="flex justify-between mb-1">
        <button
          onClick={() => move("left")}
          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded w-12 h-12 flex items-center justify-center text-xl"
        >
          ←
        </button>
        <button
          onClick={() => move("right")}
          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded w-12 h-12 flex items-center justify-center text-xl"
        >
          →
        </button>
      </div>

      {/* Down Arrow */}
      <div className="flex justify-center">
        <button
          onClick={() => move("down")}
          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded w-12 h-12 flex items-center justify-center text-xl"
        >
          ↓
        </button>
      </div>

      <div className="mt-2 text-xs">
        <p>Lat: {position.lat.toFixed(6)}</p>
        <p>Lng: {position.lng.toFixed(6)}</p>
      </div>
    </div>
  );
};

const LiveLocationMap = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isTesting, setIsTesting] = useState(true); // Default to testing mode for easier testing
  const [testPosition, setTestPosition] = useState({
    lat: 10.2929,
    lng: 123.9013,
  });

  // Show notification function
  const showNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      ...notification,
      timestamp: new Date().toLocaleTimeString(),
    };

    setNotifications((prev) => [newNotification, ...prev.slice(0, 4)]);

    setTimeout(() => {
      setNotifications((prev) =>
        prev.filter((n) => n.id !== newNotification.id)
      );
    }, 8000);
  };

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Get current position for marker - FIXED: Works in both modes
  const getCurrentPosition = () => {
    if (isTesting) {
      return testPosition;
    }
    return location ? { lat: location.lat, lng: location.lng } : null;
  };

  const currentPosition = getCurrentPosition();

  return (
    <div className="h-screen w-full relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-white p-4 shadow-md">
        <h1 className="text-2xl font-bold text-center">
          🏝️ Cebu Tourist Guide - Live Location Tracker
        </h1>
        <p className="text-center text-gray-600">
          {isTesting
            ? "TESTING MODE - Use arrows to move"
            : "LIVE MODE - Using your GPS location"}
        </p>
        <p className="text-center text-sm text-red-500 font-bold">
          ⚡ Notifications trigger every time you enter 5m radius
        </p>
      </div>

      {/* Testing Mode Toggle */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[1000]">
        <button
          onClick={() => setIsTesting(!isTesting)}
          className={`px-4 py-2 rounded-lg font-bold ${
            isTesting
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-green-500 hover:bg-green-600 text-white"
          }`}
        >
          {isTesting ? "🛑 Exit Testing Mode" : "🧪 Enter Testing Mode"}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-[1000] bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Notifications Panel */}
      <div className="absolute top-32 right-4 z-[1000] max-w-sm w-80">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 mb-2 rounded-lg shadow-lg border-l-4 ${
              notification.type === "info"
                ? "bg-blue-50 border-blue-500 text-blue-700"
                : "bg-green-50 border-green-500 text-green-700"
            }`}
          >
            <div className="font-bold">{notification.title}</div>
            <div className="text-sm">{notification.message}</div>
            <div className="text-xs text-gray-500 mt-1">
              {notification.timestamp}
            </div>
          </div>
        ))}
      </div>

      {/* Arrow Controller */}
      <ArrowController
        position={testPosition}
        setPosition={setTestPosition}
        isTesting={isTesting}
      />

      {/* Location Info */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white p-4 rounded-lg shadow-lg">
        <h3 className="font-bold">
          {isTesting ? "🧪 Test Location:" : "📍 Your Current Location:"}
        </h3>
        {currentPosition ? (
          <>
            <p>Lat: {currentPosition.lat.toFixed(6)}</p>
            <p>Lng: {currentPosition.lng.toFixed(6)}</p>
            {!isTesting && location && (
              <p>Accuracy: {location.accuracy?.toFixed(1)} meters</p>
            )}
            <p className="mt-2 text-sm text-gray-600">
              Nearby places (within 5m):{" "}
              {
                famousPlaces.filter(
                  (place) =>
                    calculateDistance(
                      currentPosition.lat,
                      currentPosition.lng,
                      place.lat,
                      place.lng
                    ) <= 5
                ).length
              }
            </p>
          </>
        ) : (
          <p className="text-gray-500">Getting your location...</p>
        )}
      </div>

      {/* Map Container */}
      <MapContainer
        center={[10.2929, 123.9013]} // Start at Magellan's Cross for testing
        zoom={18} // Higher zoom for better testing
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Famous Places Markers with 5m radius circles */}
        {famousPlaces.map((place) => (
          <React.Fragment key={place.id}>
            <Marker position={[place.lat, place.lng]} icon={famousPlaceIcon}>
              <Popup>
                <div className="text-center">
                  <h3 className="font-bold text-lg">{place.name}</h3>
                  <p className="text-sm text-gray-600">{place.type}</p>
                  <p className="text-xs mt-2">{place.description}</p>
                  <p className="text-xs text-green-500 mt-1 font-bold">
                    ⚡ Notification: 5m radius
                  </p>
                </div>
              </Popup>
            </Marker>

            {/* Circle showing 5m radius */}
            <Circle
              center={[place.lat, place.lng]}
              radius={5}
              pathOptions={{
                color: "blue",
                fillColor: "blue",
                fillOpacity: 0.1,
              }}
            />
          </React.Fragment>
        ))}

        {/* User Location Marker - ALWAYS SHOW WHEN WE HAVE POSITION */}
        {currentPosition && (
          <Marker
            position={[currentPosition.lat, currentPosition.lng]}
            icon={userLocationIcon}
          >
            <Popup>
              {isTesting ? "🧪 Test Location" : "📍 You are here!"} <br />
              {!isTesting &&
                location &&
                `Accuracy: ${location.accuracy?.toFixed(1)} meters`}
              {isTesting && "Use arrows to move around!"}
            </Popup>
          </Marker>
        )}

        {/* This component handles the live location updates */}
        <LocationUpdater
          setLocation={setLocation}
          setError={setError}
          showNotification={showNotification}
          isTesting={isTesting}
          testPosition={testPosition}
        />
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-white p-3 rounded-lg shadow-lg">
        <h4 className="font-bold mb-2">Map Legend</h4>
        <div className="flex items-center mb-1">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span className="text-sm">Your Location</span>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-sm">Famous Places</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-transparent border-2 border-blue-500 rounded-full mr-2"></div>
          <span className="text-sm">5m Radius</span>
        </div>
      </div>
    </div>
  );
};

export default LiveLocationMap;
