const hamburger = document.querySelector('.hamburger');
const navLink = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
    navLink.classList.toggle('active');
    hamburger.classList.toggle('active');
});

function goToLoginPage(view) {
    window.location.href = `login.html?view=${view}`;
}

// === LOGIN FORM HANDLER ===
document.getElementById("login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
        const res = await fetch("http://localhost:4000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            alert("Login successful!");
            localStorage.setItem("token", data.token);
            handleLoginSuccess(data);
        } else {
            alert(data.message || "Login failed!");
        }
    } catch (err) {
        console.error(err);
        alert("Something went wrong!");
    }
});

// === SIGNUP FORM HANDLER ===
document.getElementById("signup-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("signup-name").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const phone = document.getElementById("signup-phone").value;
    const role = document.getElementById("signup-role").value;
    const company = document.getElementById("signup-company")?.value || null;

    try {
        const res = await fetch("http://localhost:4000/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, phone, role, company })
        });

        const data = await res.json();

        if (res.ok) {
            alert("Signup successful! Please log in.");
            window.location.href = "login.html?view=login";
        } else {
            alert(data.message || "Signup failed!");
        }
    } catch (err) {
        console.error(err);
        alert("Something went wrong!");
    }
});

// === Update UI after login ===
function updateUserMenu(user) {
    document.querySelector(".auth-btn")?.style?.setProperty("display", "none");

    const userMenu = document.querySelector(".user-menu");
    if (userMenu) userMenu.style.display = "block";

    const usernameEl = document.getElementById("username");
    if (usernameEl) usernameEl.textContent = user?.name || "User";

    const adminLink = document.getElementById("admin-link");
    if (adminLink) {
        if (user.type === "admin") {
            adminLink.style.display = "block";
        } else {
            adminLink.style.display = "none";
        }
    }

    const notificationsLink = document.getElementById("notifications-link");
    if (notificationsLink) {
        if (user.role === "owner" || user.role === "tenant") {
            notificationsLink.style.display = "block";
        } else {
            notificationsLink.style.display = "none";
        }
    }
}

// === Logout ===
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    document.querySelector(".user-menu")?.style?.setProperty("display", "none");
    document.querySelector(".auth-btn")?.style?.setProperty("display", "block");

    alert("You have logged out.");
    window.location.href = "index.html";
}

// === After login success ===
async function handleLoginSuccess(data) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    updateUserMenu(data.user);

    // Redirect user
    if (data.user.email === "admin@quickrent.com" || data.user.isAdmin) {
        window.location.href = "admin.html";
    } else {
        window.location.href = "index.html";
    }
}

// === Auto-load user menu if logged in ===
window.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user) {
        updateUserMenu(user);
    }
});

window.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const res = await fetch("http://localhost:4000/api/auth/me", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.user) return;

        const user = data.user;
        const usernameEl = document.getElementById("username");
        if (usernameEl) usernameEl.textContent = user?.name || "User";

        if (user.email === "admin@quickrent.com" || user.isAdmin) {
            const profileLink = document.getElementById("profile-link");
            const adminLink = document.getElementById("admin-link");
            if (profileLink) profileLink.style.display = "none";
            if (adminLink) adminLink.style.display = "block";
        } else {
            const profileLink = document.getElementById("profile-link");
            const adminLink = document.getElementById("admin-link");
            if (profileLink) profileLink.style.display = "block";
            if (adminLink) adminLink.style.display = "none";
        }

    } catch (err) {
        console.error(err);
    }
});

// script.js or inline <script> on index.html
window.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token"); // check if user is logged in
    const getStartedBtn = document.getElementById("get-started-btn");

    if (token && getStartedBtn) {
        getStartedBtn.style.display = "none"; // hide button
    }

    const searchForm = document.getElementById("search-form");
    const searchInput = document.getElementById("search-input");
    if (searchForm && searchInput) {
        searchForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const q = (searchInput.value || "").trim();
            const url = q ? `browse.html?q=${encodeURIComponent(q)}` : "browse.html";
            window.location.href = url;
        });
    }
});

function toggleAuth(view) {
    const loginBtn = document.getElementById('toggle-login');
    const signupBtn = document.getElementById('toggle-signup');
    const loginForm = document.getElementById('login-form-container');
    const signupForm = document.getElementById('signup-form-container');

    if (view === 'login') {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        loginBtn.classList.add('active');
        signupBtn.classList.remove('active');
    } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        loginBtn.classList.remove('active');
        signupBtn.classList.add('active');
    }
}

function handleRoleChange() {
    const role = document.getElementById('signup-role').value;
    const ownerFields = document.querySelector('.owner-fields');
    if (role === 'owner') {
        ownerFields.style.display = 'block';
    } else {
        ownerFields.style.display = 'none';
    }
}

// Detect ?view=login or ?view=signup from URL
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view') || 'login'; // default to login
    toggleAuth(view);
});

window.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("list-property-page")) return;

    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!user) {
        alert("Please log in to list your property!");
        window.location.href = "login.html?view=login";
        return;
    }

    if (user.role !== "owner") {
        window.location.href = "index.html";
        return;
    }

    // ✅ Owner → allowed, show page
    document.getElementById("list-property-page").style.display = "block";
});


// Get current location and set coordinates input
function getCurrentLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude.toFixed(6);
            const lng = position.coords.longitude.toFixed(6);
            document.getElementById("property-coordinates").value = `${lat}, ${lng}`;
        },
        (err) => {
            alert("Failed to get location: " + err.message);
        }
    );
}

// ====== LIST PROPERTY FORM ======
document.addEventListener("DOMContentLoaded", () => {
    const propertyForm = document.getElementById("list-property-form");
    if (!propertyForm) return;

    propertyForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) return alert("Please log in first!");

        const formData = new FormData();
        formData.append("title", document.getElementById("property-title").value);
        formData.append("type", document.getElementById("property-type").value);
        formData.append("address", document.getElementById("property-address").value);
        formData.append("city", document.getElementById("property-location").value);
        formData.append("state", document.getElementById("property-state")?.value || ""); // add input for state
        formData.append("pincode", document.getElementById("property-pincode")?.value || "");
        formData.append("price", document.getElementById("property-price").value);
        formData.append("bedrooms", document.getElementById("property-bedrooms").value);
        formData.append("bathrooms", document.getElementById("property-bathrooms").value);
        formData.append("description", document.getElementById("property-description").value);

        // Additional features
        formData.append("age", document.getElementById("property-age")?.value || "");
        formData.append("floor", document.getElementById("property-floor")?.value || "");
        formData.append("totalFloors", document.getElementById("total-floors")?.value || "");
        formData.append("facing", document.getElementById("property-facing")?.value || "");
        formData.append("roommateRequired", document.getElementById("roommate-required")?.value || "false");

        // Coordinates
        const coords = document.getElementById("property-coordinates").value.split(",");
        formData.append("latitude", coords[0] || "");
        formData.append("longitude", coords[1] || "");

        // Amenities as JSON
        const amenities = Array.from(document.querySelectorAll("input[name='amenities']:checked"))
            .map(cb => cb.value);
        // ✅ FIX
         amenities.forEach(a => formData.append("amenities", a));

        // Images
        const files = document.getElementById("property-images").files;
        for (let i = 0; i < files.length; i++) formData.append("images", files[i]);

        try {
            const res = await fetch("http://localhost:4000/api/properties", {
                method: "POST",
                headers: { Authorization: "Bearer " + token },
                body: formData
            });

            const data = await res.json();
            if (res.ok) {
                alert("✅ Property submitted successfully! Pending approval.");
                propertyForm.reset();
            } else {
                alert("❌ " + (data.error || "Failed to submit property"));
            }
        } catch (err) {
            console.error(err);
            alert("Server error");
        }
    });

});

// script.js

// Global variables
let allProperties = [];
let filteredProperties = [];
let currentView = 'grid';
let selectedProperties = [];
let selectedPropertyId = null;

// Load properties on page load
window.addEventListener('DOMContentLoaded', async () => {
    await loadProperties();

    const params = new URLSearchParams(window.location.search);
    const q = (params.get('q') || '').trim().toLowerCase();
    if (q) {
        filteredProperties = allProperties.filter(p => {
            const hay = [p.title, p.type, p.address, p.city, p.state, (p.amenities || []).join(' ')].filter(Boolean).join(' ').toLowerCase();
            return hay.includes(q);
        });
        // Remove query from URL so refresh shows original properties
        if (window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, 'browse.html');
        }
    } else {
        filteredProperties = [...allProperties];
    }

    displayProperties();
    updateResultsCount();
});

// Fetch properties from backend
async function loadProperties() {
    try {
        const response = await fetch('http://localhost:4000/api/properties');
        const data = await response.json();

        if (response.ok) {
            allProperties = (data.properties || []).filter(p => p.status === 'approved');
            filteredProperties = [...allProperties];
            displayProperties();
            updateResultsCount();
        } else {
            console.error('Failed to load properties:', data.message);
            document.getElementById('browse-properties-list').innerHTML =
                '<div class="no-properties">No properties available at the moment.</div>';
        }
    } catch (error) {
        console.error('Error loading properties:', error);
        document.getElementById('browse-properties-list').innerHTML =
            '<div class="no-properties">Error loading properties. Please try again later.</div>';
    }
}

function displayProperties() {
    const container = document.getElementById('browse-properties-list');
    const user = JSON.parse(localStorage.getItem("currentUser"));

    if (filteredProperties.length === 0) {
        container.innerHTML = '<div class="no-properties">No properties match your filters.</div>';
        return;
    }

    container.innerHTML = filteredProperties.map(property => `
        <div class="property-card" data-property-id="${property._id}">
            <div class="property-image">
                <img src="http://localhost:4000${property.images?.[0]}" 
     alt="${property.title}">


                <div class="property-badge">${property.type.charAt(0).toUpperCase() + property.type.slice(1)}</div>
                <button class="compare-btn" onclick="toggleCompare('${property._id}')">
                    <i class="fas fa-balance-scale"></i>
                </button>
            </div>
            <div class="property-info">
                <h3>${property.title}</h3>
                <p class="property-location"><i class="fas fa-map-marker-alt"></i> ${(property.city || property.state || property.address || '').toString()}</p>
                <div class="property-details">
                    <span><i class="fas fa-bed"></i> ${property.bedrooms} bed</span>
                    <span><i class="fas fa-bath"></i> ${property.bathrooms} bath</span>
                    <span><i class="fas fa-home"></i> ${property.type}</span>
                </div>
                <div class="property-amenities">
                    ${property.amenities?.slice(0, 3).map(amenity =>
        `<span class="amenity-tag">${amenity}</span>`).join('') || ''}
                </div>
                <div class="property-footer">
                    <div class="property-price">
                        <span class="price">₹${property.price.toLocaleString()}</span>
                        <span class="period">/month</span>
                    </div>
                    <div class="property-actions">
                        ${property.roommateRequired ? '<span class="amenity-tag" title="Roommate required">Roommate</span>' : ''}
                        <button class="btn-primary" onclick="viewProperty('${property._id}')">View Details</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}



// Filtering
function filterProperties() {
    const locationFilter = document.getElementById('location-filter').value.toLowerCase();
    const typeFilter = document.getElementById('type-filter').value.toLowerCase();
    const priceFilter = document.getElementById('price-filter').value;
    const bedroomFilter = document.getElementById('bedroom-filter').value;
    const sortFilter = document.getElementById('sort-filter').value;
    const roommateFilter = document.getElementById('roommate-filter')?.value;

    const selectedAmenities = Array.from(document.querySelectorAll('.amenity-checkboxes input:checked'))
        .map(input => input.value);

    filteredProperties = allProperties.filter(property => {
        if (locationFilter) {
            const hay = [property.city, property.state, property.address].filter(Boolean).join(' ').toLowerCase();
            if (!hay.includes(locationFilter)) return false;
        }
        if (typeFilter && property.type !== typeFilter) return false;

        if (priceFilter) {
            const [min, max] = priceFilter.split('-').map(p => parseInt(p.replace(/[^\d]/g, '')));
            if (max && (property.price < min || property.price > max)) return false;
            if (!max && property.price < min) return false;
        }

        if (bedroomFilter && property.bedrooms < parseInt(bedroomFilter)) return false;

        if (selectedAmenities.length > 0) {
            if (!selectedAmenities.every(amenity => property.amenities?.includes(amenity))) return false;
        }
        if (roommateFilter === 'true' && property.roommateRequired !== true) return false;
        if (roommateFilter === 'false' && property.roommateRequired === true) return false;

        return true;
    });

    switch (sortFilter) {
        case 'price-low': filteredProperties.sort((a, b) => a.price - b.price); break;
        case 'price-high': filteredProperties.sort((a, b) => b.price - a.price); break;
        case 'bedrooms': filteredProperties.sort((a, b) => b.bedrooms - a.bedrooms); break;
        case 'newest': default: filteredProperties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
    }

    displayProperties();
    updateResultsCount();
}

// Reset filters
function resetFilters() {
    document.getElementById('location-filter').value = '';
    document.getElementById('type-filter').value = '';
    document.getElementById('price-filter').value = '';
    document.getElementById('bedroom-filter').value = '';
    document.getElementById('sort-filter').value = 'newest';
    document.querySelectorAll('.amenity-checkboxes input').forEach(input => input.checked = false);

    filteredProperties = [...allProperties];
    displayProperties();
    updateResultsCount();
}

// Update results count
function updateResultsCount() {
    const count = filteredProperties.length;
    document.getElementById('results-count').textContent = `${count} propert${count === 1 ? 'y' : 'ies'} found`;
}

// View property details
function viewProperty(propertyId) {
    // Redirect to property detail page
    window.location.href = `property.html?id=${propertyId}`;
}


// Comparison
function toggleCompare(propertyId) {
    const index = selectedProperties.indexOf(propertyId);
    if (index > -1) selectedProperties.splice(index, 1);
    else {
        if (selectedProperties.length >= 3) { alert('You can compare up to 3 properties.'); return; }
        selectedProperties.push(propertyId);
    }
    updateComparisonBar();
    updateCompareButtons();
    // Auto open compare when 2 or more selected; close if fewer than 2
    const modal = document.getElementById('compare-modal');
    if (selectedProperties.length >= 2) {
        openCompareModal();
    } else if (modal && modal.style.display !== 'none') {
        closeCompareModal();
    }
}

function updateComparisonBar() {
    const bar = document.getElementById('comparison-bar');
    const count = document.getElementById('comparison-count');

    if (selectedProperties.length > 0) {
        bar.style.display = 'block';
        count.textContent = `${selectedProperties.length} propert${selectedProperties.length === 1 ? 'y' : 'ies'} selected`;
    } else bar.style.display = 'none';
}

function updateCompareButtons() {
    document.querySelectorAll('.compare-btn').forEach(btn => {
        const propertyId = btn.closest('.property-card').dataset.propertyId;
        btn.classList.toggle('selected', selectedProperties.includes(propertyId));
    });
}

function showComparison() {
    if (selectedProperties.length < 2) { alert('Select at least 2 properties to compare.'); return; }
    openCompareModal();
}

function clearComparison() {
    selectedProperties = [];
    updateComparisonBar();
    updateCompareButtons();
}

function openCompareModal() {
    const modal = document.getElementById('compare-modal');
    const table = document.getElementById('compare-table');
    const properties = selectedProperties.map(id => allProperties.find(p => p._id === id)).filter(Boolean);

    if (properties.length < 2) { alert('Select at least 2 properties to compare.'); return; }

    const rows = [];
    const fields = [
        { label: 'Preview', render: p => `<img src="http://localhost:4000${p.images?.[0] || ''}" alt="${p.title}" style="width:140px;height:90px;object-fit:cover;border-radius:8px;">` },
        { label: 'Title', render: p => p.title || '' },
        { label: 'Price (/month)', render: p => `₹${Number(p.price || 0).toLocaleString()}` },
        { label: 'Type', render: p => p.type || '' },
        { label: 'Bedrooms', render: p => p.bedrooms ?? '' },
        { label: 'Bathrooms', render: p => p.bathrooms ?? '' },
        { label: 'Floor', render: p => p.floor ?? '' },
        { label: 'Total Floors', render: p => p.totalFloors ?? '' },
        { label: 'Facing', render: p => p.facing || '' },
        { label: 'Location', render: p => [p.city, p.state, p.pincode].filter(Boolean).join(', ') || p.address || '' },
        { label: 'Amenities', render: p => Array.isArray(p.amenities) ? p.amenities.join(', ') : '' },
        { label: 'Roommate Required', render: p => p.roommateRequired ? 'Yes' : 'No' },
        { label: 'Description', render: p => p.description || '' },
    ];

    rows.push(`<tr><th style="width:180px;text-align:left;padding:10px;border-bottom:1px solid #e5e7eb;"></th>` +
        properties.map(() => `<th style="text-align:left;padding:10px;border-bottom:1px solid #e5e7eb;"></th>`).join('') + `</tr>`);

    fields.forEach(f => {
        const cells = properties.map(p => `<td style="padding:10px;vertical-align:top;border-bottom:1px solid #f1f5f9;">${f.render(p)}</td>`).join('');
        rows.push(`<tr><th style="text-align:left;padding:10px;color:#334155;background:#f9fafb;border-bottom:1px solid #e5e7eb;">${f.label}</th>${cells}</tr>`);
    });

    table.innerHTML = rows.join('');
    modal.style.display = 'flex';
}

function closeCompareModal() {
    document.getElementById('compare-modal').style.display = 'none';
}

// Views
function setView(view) {
    currentView = view;
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    const btn = document.querySelector(`[data-view="${view}"]`);
    if (btn) btn.classList.add('active');

    if (view === 'map') showMapView();
    else if (view === 'list') showListView();
    else showGridView();
}

function showGridView() {
    document.getElementById('map-view-section').style.display = 'none';
    document.getElementById('budget-rooms-section').style.display = 'none';
    document.querySelector('.properties-container').style.display = 'block';
    const grid = document.getElementById('browse-properties-list');
    grid.classList.remove('list-view');
}

function showMapView() {
    document.getElementById('map-view-section').style.display = 'block';
    document.getElementById('budget-rooms-section').style.display = 'none';
    document.querySelector('.properties-container').style.display = 'none';

    document.getElementById('property-map').innerHTML =
        '<div id="leaflet-map" style="height:100%; width:100%;"></div>';

    initLeafletMap();
}

let leafletMap;
function initLeafletMap() {
    if (leafletMap) {
        leafletMap.invalidateSize();
        return;
    }

    leafletMap = L.map('leaflet-map');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(leafletMap);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const here = [lat, lng];
            leafletMap.setView(here, 13);
            L.marker(here).addTo(leafletMap).bindPopup('You are here');
            plotNearbyProperties(here);
        }, () => {
            // Fallback center
            const fallback = [20.5937, 78.9629];
            leafletMap.setView(fallback, 5);
            plotNearbyProperties(null);
        });
    } else {
        const fallback = [20.5937, 78.9629];
        leafletMap.setView(fallback, 5);
        plotNearbyProperties(null);
    }
}

function plotNearbyProperties(centerLatLng) {
    const maxDistanceKm = 25; // client-side filter radius
    const props = allProperties.filter(p => typeof p.latitude === 'number' && typeof p.longitude === 'number');

    props.forEach(p => {
        const marker = L.marker([p.latitude, p.longitude]).addTo(leafletMap);
        const html = `
                    <div style="min-width:180px;">
                        <strong>${p.title}</strong><br/>
                        ₹${Number(p.price || 0).toLocaleString()}/month<br/>
                        <a href="property.html?id=${p._id}">View</a>
                    </div>
                `;
        marker.bindPopup(html);
    });

    if (centerLatLng) {
        // Optionally filter by distance
        const toKm = (a, b) => {
            const R = 6371;
            const dLat = (b[0] - a[0]) * Math.PI / 180;
            const dLon = (b[1] - a[1]) * Math.PI / 180;
            const lat1 = a[0] * Math.PI / 180;
            const lat2 = b[0] * Math.PI / 180;
            const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
            return 2 * R * Math.asin(Math.sqrt(x));
        };

        // Zoom to bounds of nearby properties
        const nearby = props.filter(p => toKm(centerLatLng, [p.latitude, p.longitude]) <= maxDistanceKm);
        if (nearby.length > 0) {
            const bounds = L.latLngBounds(nearby.map(p => [p.latitude, p.longitude]).concat([centerLatLng]));
            leafletMap.fitBounds(bounds.pad(0.2));
        }
    }
}

function showListView() {
    document.getElementById('map-view-section').style.display = 'none';
    document.getElementById('budget-rooms-section').style.display = 'none';
    document.querySelector('.properties-container').style.display = 'block';
    const grid = document.getElementById('browse-properties-list');
    grid.classList.add('list-view');
}

// Budget rooms
function showBudgetRooms() {
    const budgetThreshold = 15000;
    const budgetProperties = allProperties.filter(p => Number(p.price) < budgetThreshold).sort((a, b) => Number(a.price) - Number(b.price));

    document.getElementById('budget-properties-list').innerHTML =
        budgetProperties.length > 0
            ? budgetProperties.map(property => `
                 <div class="property-card">
                    <div class="property-image">
                         <img src="http://localhost:4000${property.images?.[0]}" 
     alt="${property.title}">

                        <div class="property-badge">Budget</div>
                    </div>
                    <div class="property-info">
                        <h3>${property.title}</h3>
                        <p class="property-location"><i class="fas fa-map-marker-alt"></i> ${property.location}</p>
                        <div class="property-price">
                            <span class="price">₹${property.price.toLocaleString()}</span>
                            <span class="period">/month</span>
                        </div>
                        <button class="btn-secondary book-btn" onclick="handleBooking('${property._id}')">Book Property</button>
                    </div>
                </div>
            `).join('')
            : '<div class="no-properties">No budget rooms available.</div>';

    document.getElementById('budget-rooms-section').style.display = 'block';
    document.getElementById('map-view-section').style.display = 'none';
    document.querySelector('.properties-container').style.display = 'none';
}

const API_BASE = "http://localhost:4000"; // replace with your backend URL when deployed
        const token = localStorage.getItem("token");

        // --- Helper: get token and user ---
function getToken() {
    return localStorage.getItem("token");
}

function getUser() {
    return JSON.parse(localStorage.getItem("user") || "null");
}

// --- Admin check ---
function ensureAdmin() {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!token || !user || !(user.email === "admin@quickrent.com" || user.isAdmin)) {
        // Only redirect if we are on admin pages
        if (window.location.pathname.includes("admin")) {
            alert("Please log in as admin!");
            window.location.href = "login.html";
        }
        return false;
    }
    return true;
}

// Usage on admin page
window.addEventListener("DOMContentLoaded", () => {
    ensureAdmin(); // call only on admin pages
});


        // ------------------- USERS -------------------
        async function loadUsers() {
    if (!ensureAdmin()) return;

    try {
        const res = await fetch(`${API_BASE}/api/admin/users`, {
            headers: { "Authorization": `Bearer ${getToken()}` }
        });

        if (res.status === 403) throw new Error("Access denied");

        const data = await res.json();

        const tbody = document.querySelector("#users-table tbody");
        if (!tbody) return;

        tbody.innerHTML = "";

        if (!data.users || data.users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5">No users found</td></tr>`;
            return;
        }

        data.users.forEach(user => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${user.company || '-'}</td>
                <td>
                    <button class="btn-edit" onclick="editUser('${user._id}')">Edit</button>
                    <button class="btn-delete" onclick="deleteUser('${user._id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error("Error loading users:", err);
        alert("Failed to load users. Check admin login.");
    }
}

        // ------------------- PROPERTIES -------------------
        async function loadProperties(statusFilter = 'all') {
    if (!ensureAdmin()) return;

    try {
        const res = await fetch(`${API_BASE}/api/admin/properties`, {
            headers: { "Authorization": `Bearer ${getToken()}` }
        });

        if (res.status === 403) throw new Error("Access denied");

        const contentType = res.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await res.json() : {};

        const tbody = document.querySelector("#properties-table tbody");
        if (!tbody) return;

        tbody.innerHTML = "";

        let filteredProperties = data.properties || [];
        if (statusFilter !== 'all') {
            filteredProperties = filteredProperties.filter(prop => prop.status === statusFilter);
        }

        if (filteredProperties.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6">No properties found</td></tr>`;
            return;
        }

        filteredProperties.forEach(property => {
            const statusBadge = getStatusBadge(property.status);
            const actionButtons = getActionButtons(property, property.status);

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${property.title}</td>
                <td>${property.ownerName || '-'}</td>
                <td>${property.location}</td>
                <td>₹${property.price.toLocaleString()}</td>
                <td>${statusBadge}</td>
                <td>${actionButtons}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error("Error loading properties:", err);
        alert("Failed to load properties. Check admin login.");
    }
}

        // ------------------- STATUS BADGES -------------------
        function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="status-badge pending">Pending</span>',
        'approved': '<span class="status-badge approved">Approved</span>',
        'rejected': '<span class="status-badge rejected">Rejected</span>'
    };
    return badges[status] || status;
}

        // ------------------- ACTION BUTTONS -------------------
function getActionButtons(property, status) {
    if (status === 'pending') {
        return `
            <button class="btn-approve" onclick="updatePropertyStatus('${property._id}', 'approve')">Approve</button>
            <button class="btn-reject" onclick="updatePropertyStatus('${property._id}', 'reject')">Reject</button>
        `;
    } else if (status === 'approved') {
        return `<button class="btn-reject" onclick="updatePropertyStatus('${property._id}', 'reject')">Reject</button>`;
    } else if (status === 'rejected') {
        return `<button class="btn-approve" onclick="updatePropertyStatus('${property._id}', 'approve')">Approve</button>`;
    }
    return '';
}

// ------------------- APPROVE / REJECT -------------------
async function updatePropertyStatus(id, action) {
    if (!confirm(`${action === 'approve' ? 'Approve' : 'Reject'} this property?`)) return;

    try {
        const res = await fetch(`${API_BASE}/api/admin/properties/${id}/${action}`, {
            method: 'PUT',
            headers: { "Authorization": `Bearer ${getToken()}` }
        });

        const data = await res.json();
        if (res.ok) {
            alert(data.message);
            loadProperties();
        } else {
            alert(data.message || "Failed to update property");
        }
    } catch (err) {
        console.error(err);
        alert("Error updating property");
    }
}

// ------------------- FILTER BUTTON -------------------
function filterProperties(status, event) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (event) event.target.classList.add('active');
    loadProperties(status);
}

// ------------------- PLACEHOLDER FUNCTIONS -------------------
function editUser(id) { alert("Edit user: " + id); }
function deleteUser(id) { alert("Delete user: " + id); }
function editProperty(id) { alert("Edit property: " + id); }
function deleteProperty(id) { alert("Delete property: " + id); }

// ------------------- INITIAL LOAD -------------------
window.addEventListener("DOMContentLoaded", () => {
    if (ensureAdmin()) {
        loadUsers();
        loadProperties();
    }
});