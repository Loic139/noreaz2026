/**
 * Noréaz 2026 — Géo-Quiz
 * L'utilisateur clique sur la carte pour localiser un monument.
 * Le serveur calcule la distance et les points (anti-triche).
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
        maxZoom: 12,
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
    const confirmBtn = document.getElementById('confirm-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async function () {
            if (!userMarker || confirmed) return;
            confirmed = true;

            document.getElementById('confirm-wrapper').style.display = 'none';
            document.getElementById('instructions').style.display    = 'none';

            const userPos = userMarker.getLatLng();

            // Désactive les futurs clics
            confirmBtn.disabled = true;

            let result;
            try {
                const resp = await fetch(data.checkUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        monument_id: data.monumentId,
                        lat: userPos.lat,
                        lng: userPos.lng,
                    }),
                });
                result = await resp.json();
            } catch (_) {
                alert('Erreur réseau. Réessaie plus tard.');
                return;
            }

            if (!result || !result.ok) {
                if (result && result.error === 'already_played') {
                    alert('Tu as déjà joué ce monument.');
                    window.location.reload();
                    return;
                }
                alert('Erreur lors de la validation.');
                return;
            }

            drawResult(userPos, result.target, result.distance_km, result.points);
        });
    }

    // ── Affichage de la correction sur la carte ────────────────────────────
    function drawResult(userPos, target, distance, pts) {
        // Marqueur correct
        const correctMarker = L.marker([target.lat, target.lng], { icon: iconCorrect }).addTo(map);
        correctMarker.bindPopup(`<strong>${escapeHtml(target.name || data.name)}</strong>`).openPopup();

        // Ligne en pointillé
        L.polyline(
            [[userPos.lat, userPos.lng], [target.lat, target.lng]],
            { color: '#8C2333', weight: 2, dashArray: '8 6', opacity: 0.8 }
        ).addTo(map);

        // Recadrage sur les deux points
        map.fitBounds(
            [[userPos.lat, userPos.lng], [target.lat, target.lng]],
            { padding: [50, 50], maxZoom: 5 }
        );

        showResult(distance, pts);
    }

    // ── Affichage de la section résultat ───────────────────────────────────
    function showResult(distance, pts) {
        const distEl  = document.getElementById('distance-text');
        const scoreEl = document.getElementById('geo-score-circle');
        const msgEl   = document.getElementById('geo-score-message');
        if (distEl)  distEl.textContent  = formatDist(distance);
        if (scoreEl) scoreEl.textContent = pts + ' / 5';
        if (msgEl)   msgEl.textContent   = getMessage(pts);

        const rowEl = document.getElementById('row-' + pts);
        if (rowEl) {
            rowEl.classList.remove('opacity-30');
            rowEl.classList.add('bg-primary/10', 'font-bold');
        }

        const section = document.getElementById('result-section');
        if (section) {
            section.style.display = 'block';
            setTimeout(() => section.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
        }
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

    // ── Échappement HTML basique ───────────────────────────────────────────
    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[c]);
    }

})();
