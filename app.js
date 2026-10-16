/**
 * PestoGuard Main Application Logic
 * Interactive UI controls, Quote Calculator, Inspection Booking, and Pest Controls
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Canvas Insect Simulation
    const pestSimulation = new window.InsectSimulation('pest-canvas');

    // 2. Custom Spray Can Cursor
    const sprayCursor = document.getElementById('spray-can-cursor');
    let customCursorEnabled = true;

    function setSprayCursor(enabled) {
        customCursorEnabled = enabled;
        if (sprayCursor) {
            sprayCursor.style.display = enabled ? 'block' : 'none';
        }
        document.body.classList.toggle('custom-spray-cursor', enabled);
    }

    setSprayCursor(true);

    // Toggle Spray Mode button
    const toggleCursorBtn = document.getElementById('btn-toggle-spray-mode');
    if (toggleCursorBtn) {
        toggleCursorBtn.addEventListener('click', () => {
            setSprayCursor(!customCursorEnabled);
            toggleCursorBtn.classList.toggle('active', customCursorEnabled);
            toggleCursorBtn.innerHTML = customCursorEnabled
                ? '<span class="icon">🔫</span> Spray Gun: Active'
                : '<span class="icon">👆</span> Standard Mouse';
        });
    }

    // 3. Pest Spawning & Game Controls
    const btnSpawnAnt = document.getElementById('btn-spawn-ant');
    const btnSpawnTermite = document.getElementById('btn-spawn-termite');
    const btnSpawnRoach = document.getElementById('btn-spawn-roach');
    const btnSpawnSpider = document.getElementById('btn-spawn-spider');
    const btnBomb = document.getElementById('btn-deploy-bomb');
    const btnMute = document.getElementById('btn-toggle-sound');

    if (btnSpawnAnt) btnSpawnAnt.addEventListener('click', () => pestSimulation.spawnSwarm('ant', 4));
    if (btnSpawnTermite) btnSpawnTermite.addEventListener('click', () => pestSimulation.spawnSwarm('termite', 4));
    if (btnSpawnRoach) btnSpawnRoach.addEventListener('click', () => pestSimulation.spawnSwarm('cockroach', 3));
    if (btnSpawnSpider) btnSpawnSpider.addEventListener('click', () => pestSimulation.spawnSwarm('spider', 3));
    if (btnBomb) btnBomb.addEventListener('click', () => pestSimulation.triggerBugBomb());

    if (btnMute) {
        btnMute.addEventListener('click', () => {
            const muted = window.soundEffects.toggleMute();
            btnMute.innerHTML = muted ? '🔇 Sound: Off' : '🔊 Sound: On';
            btnMute.classList.toggle('muted', muted);
        });
    }

    // 4. Instant Quote Calculator
    const propTypeSelect = document.getElementById('calc-property');
    const frequencySelect = document.getElementById('calc-frequency');
    const pestCheckboxes = document.querySelectorAll('.calc-pest-check');
    const priceDisplay = document.getElementById('calc-price-display');
    const originalPriceDisplay = document.getElementById('calc-original-price');

    const basePrices = {
        '1bhk': 1199,
        '2bhk': 1599,
        '3bhk': 2199,
        'villa': 3499,
        'commercial': 4999
    };

    const pestAddons = {
        'cockroach': 300,
        'termite': 800, // Dimak treatment involves specialized anti-termite drill/chemical barrier
        'bedbug': 600,
        'ant': 200,
        'rodent': 450,
        'mosquito': 350
    };

    function calculateEstimate() {
        const prop = propTypeSelect.value;
        const freq = frequencySelect.value;
        let total = basePrices[prop] || 1499;

        pestCheckboxes.forEach(cb => {
            if (cb.checked) {
                total += pestAddons[cb.value] || 250;
            }
        });

        // Frequency multipliers and discounts
        let multiplier = 1;
        let discount = 0.15; // 15% special launch discount
        if (freq === 'quarterly') {
            multiplier = 3.2; // 4 treatments for price of 3.2
            discount = 0.25;
        } else if (freq === 'yearly') {
            multiplier = 5.5; // 8 treatments for price of 5.5
            discount = 0.35;
        }

        const discountedTotal = Math.round(total * multiplier * (1 - discount));
        const originalTotal = Math.round(total * multiplier);

        if (priceDisplay) {
            priceDisplay.textContent = `₹${discountedTotal.toLocaleString('en-IN')}`;
        }
        if (originalPriceDisplay) {
            originalPriceDisplay.textContent = `₹${originalTotal.toLocaleString('en-IN')}`;
        }
    }

    if (propTypeSelect) propTypeSelect.addEventListener('change', calculateEstimate);
    if (frequencySelect) frequencySelect.addEventListener('change', calculateEstimate);
    pestCheckboxes.forEach(cb => cb.addEventListener('change', calculateEstimate));
    calculateEstimate();

    // 5. Booking Form & Modal Logic
    const bookingForm = document.getElementById('inspection-form');
    const bookingModal = document.getElementById('booking-modal');
    const closeModalBtn = document.getElementById('btn-close-modal');
    const bookingReceipt = document.getElementById('modal-receipt-details');

    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('book-name').value;
            const phone = document.getElementById('book-phone').value;
            const city = document.getElementById('book-city') ? document.getElementById('book-city').value : 'Purnia';
            const address = document.getElementById('book-address').value;
            const pestType = document.getElementById('book-pest').value;
            const date = document.getElementById('book-date').value || 'Tomorrow';
            const slot = document.getElementById('book-slot').value;

            const bookingId = 'PG-' + Math.floor(100000 + Math.random() * 900000);

            if (bookingReceipt) {
                bookingReceipt.innerHTML = `
                    <div class="receipt-item"><span>Booking ID:</span> <strong>#${bookingId}</strong></div>
                    <div class="receipt-item"><span>Customer:</span> <strong>${name}</strong></div>
                    <div class="receipt-item"><span>Phone:</span> <strong>${phone}</strong></div>
                    <div class="receipt-item"><span>Operational Hub:</span> <strong>${city} (500 KM Coverage)</strong></div>
                    <div class="receipt-item"><span>Treatment:</span> <strong>${pestType}</strong></div>
                    <div class="receipt-item"><span>Scheduled For:</span> <strong>${date} (${slot})</strong></div>
                    <div class="receipt-item"><span>Service Address:</span> <strong>${address}</strong></div>
                    <div class="receipt-guarantee">🛡️ Certified Eco-Friendly & 100% Odorless Treatment</div>
                `;
            }

            if (bookingModal) {
                bookingModal.classList.add('open');
            }

            if (window.soundEffects) {
                window.soundEffects.playSuccess();
            }

            bookingForm.reset();
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            bookingModal.classList.remove('open');
        });
    }

    if (bookingModal) {
        bookingModal.addEventListener('click', (e) => {
            if (e.target === bookingModal) {
                bookingModal.classList.remove('open');
            }
        });
    }

    // 6. Smooth Scroll for Nav Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 7. Interactive Pest Card Quick Spray
    const pestCards = document.querySelectorAll('.pest-card');
    pestCards.forEach(card => {
        const pestType = card.getAttribute('data-pest');
        const spawnBtn = card.querySelector('.btn-test-spray');
        if (spawnBtn && pestType) {
            spawnBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                pestSimulation.spawnSwarm(pestType, 3);
                showToast(`Spawned 3 ${pestType}s! Use your spray cursor to eliminate them!`);
            });
        }
    });

    // 8. Toast Notification Helper
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'pesto-toast';
        toast.innerHTML = `<span>🎯</span> ${message}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('visible'), 50);
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 400);
        }, 3200);
    }
});
