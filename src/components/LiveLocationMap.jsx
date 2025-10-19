import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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

// Component to handle live location updates
function LocationUpdater({ setLocation, setError }) {
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    // Watch position for LIVE updates - this is what makes it real-time!
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
      },
      (error) => {
        setError(`Error: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
        distanceFilter: 1, // Update every 1 meter moved! 🚶‍♂️
      }
    );

    // Cleanup function
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [map, setLocation, setError]);

  return null;
}

const LiveLocationMap = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  return (
    <div className="h-screen w-full relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-white p-4 shadow-md">
        <h1 className="text-2xl font-bold text-center">
          📍 Live Location Tracker
        </h1>
        <p className="text-center text-gray-600">
          Move around and watch your location update in real-time!
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[1000] bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Location Info */}
      {location && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white p-4 rounded-lg shadow-lg">
          <h3 className="font-bold">Your Current Location:</h3>
          <p>Lat: {location.lat.toFixed(6)}</p>
          <p>Lng: {location.lng.toFixed(6)}</p>
          <p>Accuracy: {location.accuracy?.toFixed(1)} meters</p>
        </div>
      )}

      {/* Map Container */}
      <MapContainer
        center={[0, 0]} // Temporary center, will be updated by LocationUpdater
        zoom={16}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Live Location Marker */}
        {location && (
          <Marker position={[location.lat, location.lng]}>
            <Popup>
              You are here! <br />
              Accuracy: {location.accuracy?.toFixed(1)} meters
            </Popup>
          </Marker>
        )}

        {/* This component handles the live location updates */}
        <LocationUpdater setLocation={setLocation} setError={setError} />
      </MapContainer>
    </div>
  );
};

export default LiveLocationMap;
