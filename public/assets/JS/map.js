let map;
let userMarker;
let resourceMarkers = [];

const resources = [
    {
        name: "Surabhi Foundation Shelter",
        type: "shelter",
        lat: 12.867032273317857,
        lng: 77.58307036587975,
        description: "Emergency shelter with 200 beds"
    },
    {
        name: "Bangalore Food Bank",
        type: "food",
        lat: 13.107568,
        lng: 77.571198,
        description: "Daily food distribution center"
    },
    {
        name: "Fortis Hospital Bannerghatta Road",
        type: "medical",
        lat: 12.993,
        lng: 77.5763,
        description: "24/7 emergency medical services"
    },
    {
        name : "Apollo Pharmacy Jayanagar",
        type : "medical",
        lat : 12.9511,
        lng : 77.6055,
        description : "Pharmacy with emergency supplies"
    },
    {
        name : "Art of Living Foundation",
        type : "shelter",   
        lat : 12.8291,
        lng : 77.5115,
        description : "Shelter and food for displaced individuals"
    },
    {
        name : "ISKCON Bengaluru Nitya Annadana Hall",
        type : "food",
        lat : 13.009415677253669,
        lng : 77.55182550924737,
        description : "Free meals for those in need"
    },
    {
        name : "Gleneagle Global Health City",
        type : "medical",
        lat : 12.912158134871454, 
        lng : 77.51499128002368,
        description : "Advanced medical care and trauma center"
    },
    {
        name : "The Public Fridge",
        type : "food",
        lat : 12.911797717474137, 
        lng : 77.62313766352145,
        description : "Community fridge for food sharing"
    },
    {
        name : "St John's Medical College Hospital",
        type : "medical",
        lat : 12.932328590631489, 
        lng : 77.62065394212823,
        description : "Emergency medical services and trauma care"
    },
    {
        name : "BBMP Night Shelter",
        type : "shelter",
        lat : 12.9716,
        lng : 77.5946,
        description : "Government-run night shelter for the homeless"
    }


];

function initMap() {
    map = L.map('map').setView([12.909477, 77.566833], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    if (navigator.geolocation) {
        document.getElementById('map-loading').classList.add('active');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = [position.coords.latitude, position.coords.longitude];

                map.setView(userLocation, 13);

                userMarker = L.marker(userLocation, {
                    icon: L.icon({
                        iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                        iconSize: [32, 32],
                        iconAnchor: [16, 32],
                        popupAnchor: [0, -32]
                    })
                }).addTo(map).bindPopup('Your Location');

                loadResources();
                document.getElementById('map-loading').classList.remove('active');
            },
            
            () => {
                document.getElementById('map-loading').textContent = 'Location access denied. Showing default resources.';
                loadResources();
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        document.getElementById('map-loading').textContent = 'Geolocation not supported. Showing default resources.';
        loadResources();
    }

    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(btn => 
                btn.classList.remove('active')
            );
            button.classList.add('active');
            filterResources(button.dataset.filter);
        });
    });
}

function loadResources() {
    resources.forEach(resource => {
        const marker = L.marker([resource.lat, resource.lng], {
            icon: L.icon({
                iconUrl: getMarkerIcon(resource.type),
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32]
            })
        }).addTo(map);

        marker.bindPopup(`
            <div>
                <h3>${resource.name}</h3>
                <p>Type: ${resource.type}</p>
                <p>${resource.description}</p>
               <a href="https://www.google.com/maps/dir/?api=1&destination=${resource.lat},${resource.lng}" ... >
                <button class="btn btn-primary">Get Directions</button>
                </a>

            </div>
        `);

        resourceMarkers.push({
            marker: marker,
            type: resource.type
        });
    });
}


function getMarkerIcon(type) {
    const icons = {
        shelter: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
        food: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png',
        medical: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
    };
    return icons[type] || 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
}

function filterResources(filter) {
    resourceMarkers.forEach(({ marker, type }) => {
        if (filter === 'all' || type === filter) {
            marker.addTo(map);
        } else {
            map.removeLayer(marker);
        }
    });
}

window.onload = initMap;
