import { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import api from '../services/api';

const containerStyle = { width: '100%', height: '450px', borderRadius: '24px' };

function HartaCofetarii() {
    const navigate = useNavigate();
    const [userLocation, setUserLocation] = useState(null);
    const [cofetarii, setCofetarii] = useState([]);
    const [loading, setLoading] = useState(true);
    const [eroare, setEroare] = useState('');
    const [selectedCofetarie, setSelectedCofetarie] = useState(null);
    const [locatieRefuzata, setLocatieRefuzata] = useState(false);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                () => {
                    setLocatieRefuzata(true);
                    setEroare('Activează locația pentru a vedea cofetăriile din apropiere.');
                    setLoading(false);
                }
            );
        } else {
            setLocatieRefuzata(true);
            setEroare('Browserul tău nu suportă geolocația.');
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!userLocation) return;
        api.get('/cofetarii/distante', {
            params: { lat: userLocation.lat, lng: userLocation.lng }
        })
        .then(res => {
            setCofetarii(res.data);
            setLoading(false);
        })
        .catch(() => {
            setEroare('Eroare la încărcarea cofetăriilor.');
            setLoading(false);
        });
    }, [userLocation]);

    if (loading) return <div className="harta-loading"><div className="spinner" /><p>Detectăm locația ta...</p></div>;
    if (locatieRefuzata || cofetarii.length === 0) return <div className="harta-eroare"><p>{eroare || 'Nu există cofetării disponibile.'}</p></div>;

    const center = userLocation;

    return (
        <div className="harta-container">
            <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
                <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13}>
                    <Marker position={userLocation} icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png" />
                    {cofetarii.map(cof => (
                        <Marker
                            key={cof._id}
                            position={{ lat: cof.lat, lng: cof.lng }}
                            onClick={() => setSelectedCofetarie(cof)}
                        />
                    ))}
                    {selectedCofetarie && (
                        <InfoWindow
                            position={{ lat: selectedCofetarie.lat, lng: selectedCofetarie.lng }}
                            onCloseClick={() => setSelectedCofetarie(null)}
                        >
                            <div className="harta-info-window">
                                {selectedCofetarie.imagine_coperta && (
                                    <img src={selectedCofetarie.imagine_coperta.startsWith('http') ? selectedCofetarie.imagine_coperta : `https://sweetgoapp.onrender.com/${selectedCofetarie.imagine_coperta}`} alt="" className="harta-info-img" />
                                )}
                                <h4>{selectedCofetarie.numeCofetarie}</h4>
                                <p><MapPin size={12} /> {selectedCofetarie.adresa}</p>
                                {selectedCofetarie.distanta_text && <p>{selectedCofetarie.distanta_text} • {selectedCofetarie.durata_text}</p>}
                                <button className="harta-btn-vezi" onClick={() => { setSelectedCofetarie(null); navigate(`/cofetarie/${selectedCofetarie._id}`); }}>Vezi meniul</button>
                            </div>
                        </InfoWindow>
                    )}
                </GoogleMap>
            </LoadScript>
        </div>
    );
}

export default HartaCofetarii;