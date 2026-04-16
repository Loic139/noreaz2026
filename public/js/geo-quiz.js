/**
 * Noréaz 2026 — Géo-Quiz
 * L'utilisateur clique sur la carte pour localiser un monument.
 */
(function () {
    'use strict';

    const data = window.GEO_DATA;
    if (!data || typeof L === 'undefined') return;

    // ── Initialisation de la carte ──────────────────────────────────────────
    const map = L.map('geo-map', {
        center: [25, 15],
        zoom: 2,
        minZoom: 1,
        maxZoom: 6,
        worldCopyJump: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
    }).addTo(map);

    // ── Icônes personnalisées ───────────────────────────────────────────────
    function makeIcon(color) {
        return L.divIcon({
            className: '',
            html: `<div style="
                width:22px;height:22px;
                background:${color};
                border-radius:50%;
                border:3px solid white;
                box-shadow:0 2px 8px rgba(0,0,0,.35);
            "></div>`,
            iconSize:   [22, 22],
            iconAnchor: [11, 11],
            popupAnchor:[0, -14],
        });
    }

    const iconUser    = makeIcon('#8C2333'); // bordeaux
    const iconCorrect = makeIcon('#22c55e'); // vert

    let userMarker  = null;
    let confirmed   = false;

    // ── Clic sur la carte ──────────────────────────────────────────────────
    map.on('click', function (e) {
        if (confirmed) return;
        const { lat, lng } = e.latlng;

        if (userMarker) {
            userMarker.setLatLng([lat, lng]);
        } else {
            userMarker = L.marker([lat, lng], { icon: iconUser }).addTo(map);
            userMarker.bindPopup('Ta position').openPopup();
        }

        document.getElementById('confirm-wrapper').style.display = 'block';
    });

    // ── Bouton Confirmer ───────────────────────────────────────────────────
    document.getElementById('confirm-btn').addEventListener('click', function () {
        if (!userMarker || confirmed) return;
        confirmed = true;

        document.getElementById('confirm-wrapper').style.display = 'none';
        document.getElementById('instructions').style.display    = 'none';

        const userPos = userMarker.getLatLng();
        const distance = Math.round(haversine(userPos.lat, userPos.lng, data.lat, data.lng));
        const pts = calcPoints(distance);

        // Marqueur correct
        const correctMarker = L.marker([data.lat, data.lng], { icon: iconCorrect }).addTo(map);
        correctMarker.bindPopup(`<strong>${data.name}</strong>`).openPopup();

        // Ligne en pointillé
        L.polyline(
            [[userPos.lat, userPos.lng], [data.lat, data.lng]],
            { color: '#8C2333', weight: 2, dashArray: '8 6', opacity: 0.8 }
        ).addTo(map);

        // Recadrage sur les deux points
        map.fitBounds(
            [[userPos.lat, userPos.lng], [data.lat, data.lng]],
            { padding: [50, 50], maxZoom: 5 }
        );

        // Affichage du résultat
        showResult(distance, pts);

        // Sauvegarde serveur
        if (data.saveUrl) {
            fetch(data.saveUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ monument_id: data.monumentId, distance_km: distance, points: pts }),
            }).catch(() => {});
        }
    });

    // ── Affichage du résultat ──────────────────────────────────────────────
    function showResult(distance, pts) {
        document.getElementById('distance-text').textContent  = formatDist(distance);
        document.getElementById('geo-score-circle').textContent = pts + ' / 5';
        document.getElementById('geo-score-message').textContent = getMessage(pts);

        // Surbrillance de la ligne correspondante
        const rowEl = document.getElementById('row-' + pts);
        if (rowEl) {
            rowEl.classList.remove('opacity-30');
            rowEl.classList.add('bg-primary/10', 'font-bold');
        }

        document.getElementById('result-section').style.display = 'block';
        // Scroll vers résultat
        setTimeout(() => document.getElementById('result-section').scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }

    // ── Calcul du score ────────────────────────────────────────────────────
    function calcPoints(km) {
        if (km <=   10) return 5;
        if (km <=   50) return 4;
        if (km <=  200) return 3;
        if (km <=  500) return 2;
        if (km <= 1000) return 1;
        return 0;
    }

    // ── Formattage de la distance ──────────────────────────────────────────
    function formatDist(km) {
        if (km === 0) return 'Exactement sur place !';
        return km.toLocaleString('fr-CH') + ' km de distance';
    }

    // ── Message selon le score ─────────────────────────────────────────────
    function getMessage(pts) {
        const msgs = [
            'Aux antipodes… la géographie, c\'est dur !',
            'Loin, mais tu as osé !',
            'Tu te réchauffes…',
            'Pas mal ! Tu connais le monde.',
            'Très bien ! Tu es presque dessus !',
            '🎯 Parfait ! Tu es un as de la géographie !',
        ];
        return msgs[pts];
    }

    // ── Formule de Haversine (distance en km) ─────────────────────────────
    function haversine(lat1, lon1, lat2, lon2) {
        const R  = 6371;
        const dL = (lat2 - lat1) * Math.PI / 180;
        const dG = (lon2 - lon1) * Math.PI / 180;
        const a  = Math.sin(dL / 2) * Math.sin(dL / 2)
                 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
                 * Math.sin(dG / 2) * Math.sin(dG / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

})();
