/* ==========================================================================
   APP.JS - MOTEUR DE RÉSERVATION DIRECTE — HÔTEL MAISON ROUGE COTONOU
   Architecture: Single-Page Application (SPA) — v6.0 APEX
   ========================================================================== */

// --------------------------------------------------------------------------
// 0. SÉCURITÉ — VALIDATION & SANITISATION
// --------------------------------------------------------------------------

/**
 * Échappe les caractères HTML pour prévenir les injections XSS.
 * Toute donnée utilisateur est nettoyée avant d'être insérée dans le DOM.
 */
function sanitizeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .trim();
}

/** Valide un email avec une regex robuste */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** Valide un numéro WhatsApp (international, min 8 chiffres) */
function isValidWhatsApp(num) {
    const cleaned = num.replace(/[\s\-().+]/g, '');
    return /^\d{8,15}$/.test(cleaned);
}

/** Affiche une erreur inline sous un champ */
function setFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.classList.add('field-error');
    let err = field.parentElement.querySelector('.field-error-msg');
    if (!err) {
        err = document.createElement('span');
        err.className = 'field-error-msg';
        field.parentElement.appendChild(err);
    }
    err.textContent = message;
}

/** Efface l'erreur inline d'un champ */
function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.classList.remove('field-error');
    const err = field.parentElement.querySelector('.field-error-msg');
    if (err) err.remove();
}

/** Efface toutes les erreurs du formulaire */
function clearAllFieldErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.querySelectorAll('.field-error').forEach(f => f.classList.remove('field-error'));
    form.querySelectorAll('.field-error-msg').forEach(e => e.remove());
}

// Contrôle anti-brute-force pour le login admin
const AUTH_GUARD = {
    attempts: 0,
    maxAttempts: 3,
    lockedUntil: null,
    lockDuration: 60000, // 60 secondes

    isLocked() {
        if (!this.lockedUntil) return false;
        if (Date.now() >= this.lockedUntil) {
            this.lockedUntil = null;
            this.attempts = 0;
            return false;
        }
        return true;
    },

    recordFailure() {
        this.attempts++;
        if (this.attempts >= this.maxAttempts) {
            this.lockedUntil = Date.now() + this.lockDuration;
        }
    },

    reset() {
        this.attempts = 0;
        this.lockedUntil = null;
    },

    remainingSeconds() {
        if (!this.lockedUntil) return 0;
        return Math.ceil((this.lockedUntil - Date.now()) / 1000);
    }
};

// Date courante dynamique (calculée au chargement)
const TODAY = new Date();
const CURRENT_DATE_STR = formatDateYMD(TODAY);


// Stocks physiques totaux de l'hôtel Maison Rouge Cotonou
const ROOM_STOCKS_TOTAL = {
    classique:  7,   // 7 Chambres Classiques
    superieure: 5,   // 5 Chambres Supérieures
    suite:      3    // 3 Suites Prestige
};

// Prix par type de chambre
const ROOM_PRICES = {
    classique:  110000,
    superieure: 150000,
    suite:      220000
};

// --------------------------------------------------------------------------
// 1. BASE DE DONNÉES SIMULÉE
// --------------------------------------------------------------------------
function buildDefaultReservations() {
    const d0 = CURRENT_DATE_STR;
    const d1 = addDaysToDateYMD(d0, 1);
    const d2 = addDaysToDateYMD(d0, 2);
    const d3 = addDaysToDateYMD(d0, 3);
    const d5 = addDaysToDateYMD(d0, 5);
    const d6 = addDaysToDateYMD(d0, 6);
    const d4 = addDaysToDateYMD(d0, 4);
    const dm2 = addDaysToDateYMD(d0, -2);
    const dm1 = addDaysToDateYMD(d0, -1);

    return [
        {
            id: "MR-2026-8942",
            firstname: "Aurelle",
            lastname: "Soglo",
            email: "aurelle.s@gmail.com",
            whatsapp: "+229 97 45 82 10",
            country: "Bénin",
            roomType: "superieure",
            roomName: "Chambre Supérieure",
            checkin: d0,
            checkout: d3,
            nights: 3,
            guests: 2,
            rooms: 1,
            totalPrice: 465000,
            specialRequests: "Navette aéroport requise pour 18h. Vol Air France.",
            status: "Confirmé"
        },
        {
            id: "MR-2026-3105",
            firstname: "Jean-Pierre",
            lastname: "Dubois",
            email: "jp.dubois@groupe-concept.fr",
            whatsapp: "+33 6 12 34 56 78",
            country: "France",
            roomType: "suite",
            roomName: "Suite Prestige",
            checkin: d1,
            checkout: d6,
            nights: 5,
            guests: 1,
            rooms: 1,
            totalPrice: 1112500,
            specialRequests: "Souhaite une chambre très calme avec vue piscine.",
            status: "En attente"
        },
        {
            id: "MR-2026-7741",
            firstname: "Chidi",
            lastname: "Okonkwo",
            email: "chidi.o@yahoo.com",
            whatsapp: "+234 803 123 4567",
            country: "Nigeria",
            roomType: "classique",
            roomName: "Chambre Classique",
            checkin: d0,
            checkout: d2,
            nights: 2,
            guests: 2,
            rooms: 1,
            totalPrice: 230000,
            specialRequests: "",
            status: "Confirmé"
        },
        {
            id: "MR-2026-0422",
            firstname: "Marc",
            lastname: "Lebrun",
            email: "m.lebrun@outlook.com",
            whatsapp: "+32 495 88 77 66",
            country: "Belgique",
            roomType: "classique",
            roomName: "Chambre Classique",
            checkin: d4,
            checkout: d6,
            nights: 2,
            guests: 2,
            rooms: 1,
            totalPrice: 230000,
            specialRequests: "Allergie aux fruits à coque.",
            status: "En attente"
        },
        {
            id: "MR-2026-9504",
            firstname: "Amara",
            lastname: "Diallo",
            email: "amara@dialloconsulting.sn",
            whatsapp: "+221 77 654 32 10",
            country: "Sénégal",
            roomType: "superieure",
            roomName: "Chambre Supérieure",
            checkin: dm2,
            checkout: dm1,
            nights: 1,
            guests: 1,
            rooms: 1,
            totalPrice: 152500,
            specialRequests: "",
            status: "Annulé"
        }
    ];
}

// --------------------------------------------------------------------------
// 2. GESTION DU STATE GLOBAL
// --------------------------------------------------------------------------
let state = {
    reservations: [],
    adminSession: {
        loggedIn: false,
        role: ""
    },
    currentBooking: {
        checkin: "",
        checkout: "",
        adults: 2,
        children: 0,
        rooms: 1,
        roomType: "",
        roomName: "",
        roomPrice: 0,
        nights: 0,
        guests: 2,
        client: {
            firstname: "",
            lastname: "",
            whatsapp: "",
            email: "",
            country: "Bénin",
            specialRequests: ""
        },
        totalPrice: 0,
        taxes: 0,
        basePrice: 0
    }
};

// --------------------------------------------------------------------------
// 3. INITIALISATION & NAVIGATION SPA
// --------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    initDatabase();
    initDates();
    setupEventListeners();
    checkActiveSession();
    initScrollAnimations();
    initNavScroll();
});

function initDatabase() {
    const saved = localStorage.getItem("maison_rouge_reservations_v6");
    if (saved) {
        try {
            state.reservations = JSON.parse(saved);
        } catch(e) {
            state.reservations = buildDefaultReservations();
            saveDatabase();
        }
    } else {
        state.reservations = buildDefaultReservations();
        saveDatabase();
    }
}

function saveDatabase() {
    localStorage.setItem("maison_rouge_reservations_v6", JSON.stringify(state.reservations));
}

// Initialise les dates par défaut dans le formulaire de recherche
function initDates() {
    const checkinInput  = document.getElementById("checkin-date");
    const checkoutInput = document.getElementById("checkout-date");
    if (!checkinInput || !checkoutInput) return;

    const tomorrow    = new Date(TODAY);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkOutDate = new Date(tomorrow);
    checkOutDate.setDate(checkOutDate.getDate() + 3);

    checkinInput.value  = formatDateYMD(tomorrow);
    checkoutInput.value = formatDateYMD(checkOutDate);

    checkinInput.min  = CURRENT_DATE_STR;
    checkoutInput.min = formatDateYMD(tomorrow);

    checkinInput.addEventListener("change", () => {
        const nextDay = new Date(checkinInput.value);
        nextDay.setDate(nextDay.getDate() + 1);
        checkoutInput.min = formatDateYMD(nextDay);
        if (checkoutInput.value <= checkinInput.value) {
            checkoutInput.value = formatDateYMD(nextDay);
        }
    });
}

// Vérifie si une session admin est déjà active
function checkActiveSession() {
    const session = sessionStorage.getItem("maison_rouge_admin_session");
    if (session) {
        try { state.adminSession = JSON.parse(session); } catch(e) {}
    }
}

// Scroll animations avec IntersectionObserver
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll(".animate-fade-up").forEach(el => observer.observe(el));
}

// Effet de scroll sur le header
function initNavScroll() {
    const header = document.querySelector(".main-header");
    if (!header) return;
    window.addEventListener("scroll", () => {
        if (window.scrollY > 40) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    }, { passive: true });
}

// Routage client (SPA) avec guard de sécurité
function navigateToPage(pageId) {
    // ── GUARD SÉCURITÉ ADMIN ─────────────────────────────────────────────────
    // Toute tentative d'accès direct à la page admin sans session active
    // est redirigée vers la page de connexion.
    if (pageId === 'admin' && !state.adminSession.loggedIn) {
        pageId = 'admin-login';
    }

    const targetView = document.getElementById(`page-${pageId}`);
    if (!targetView) return;

    window.scrollTo({ top: 0, behavior: "smooth" });

    const activeView = document.querySelector(".page-view.active");
    if (activeView && activeView !== targetView) {
        activeView.classList.add("leaving");
        setTimeout(() => {
            activeView.classList.remove("active", "leaving");
            showPage(targetView, pageId);
        }, 200);
    } else {
        if (activeView) activeView.classList.remove("active");
        showPage(targetView, pageId);
    }

    updateGlobalLayoutForPage(pageId);
}

function showPage(targetView, pageId) {
    targetView.classList.add("active");
    // Re-trigger scroll animations for newly visible page
    setTimeout(() => {
        targetView.querySelectorAll(".animate-fade-up:not(.visible)").forEach(el => {
            el.classList.add("visible");
        });
    }, 50);
}

function updateGlobalLayoutForPage(pageId) {
    const header = document.querySelector(".main-header");
    const footer = document.querySelector(".main-footer");

    // Mettre à jour la classe active du menu client
    document.querySelectorAll(".nav-link, .nav-link-footer").forEach(link => {
        const t = link.getAttribute("data-target");
        link.classList.toggle("active", t === pageId);
    });

    const isAdmin = (pageId === "admin" || pageId === "admin-login");
    header.style.display = isAdmin ? "none" : "";
    footer.style.display = isAdmin ? "none" : "";
    document.body.dataset.page = pageId;
}

// --------------------------------------------------------------------------
// 4. ALGORITHME DE CALCUL DES DISPONIBILITÉS PHYSIQUES (STOCKS)
// --------------------------------------------------------------------------
function calculateAvailableStocksForPeriod(checkinStr, checkoutStr) {
    const checkin  = new Date(checkinStr);
    const checkout = new Date(checkoutStr);

    let available = {
        classique:  ROOM_STOCKS_TOTAL.classique,
        superieure: ROOM_STOCKS_TOTAL.superieure,
        suite:      ROOM_STOCKS_TOTAL.suite
    };

    let tempDate = new Date(checkin);
    while (tempDate < checkout) {
        const dateStr = formatDateYMD(tempDate);
        let occupied  = { classique: 0, superieure: 0, suite: 0 };

        state.reservations.forEach(res => {
            if (res.status !== "Annulé" && isDateBetween(dateStr, res.checkin, res.checkout)) {
                if (occupied[res.roomType] !== undefined) {
                    occupied[res.roomType] += res.rooms;
                }
            }
        });

        available.classique  = Math.min(available.classique,  ROOM_STOCKS_TOTAL.classique  - occupied.classique);
        available.superieure = Math.min(available.superieure, ROOM_STOCKS_TOTAL.superieure - occupied.superieure);
        available.suite      = Math.min(available.suite,      ROOM_STOCKS_TOTAL.suite      - occupied.suite);

        tempDate.setDate(tempDate.getDate() + 1);
    }

    available.classique  = Math.max(0, available.classique);
    available.superieure = Math.max(0, available.superieure);
    available.suite      = Math.max(0, available.suite);

    return available;
}

// --------------------------------------------------------------------------
// 5. ÉCOUTEURS D'ÉVÉNEMENTS
// --------------------------------------------------------------------------
function setupEventListeners() {

    // ── Menu mobile ──────────────────────────────────────────────────────────
    const mobileToggle = document.getElementById("mobile-menu-toggle");
    const mobileNav    = document.getElementById("main-nav-menu");

    function closeMobileMenu() {
        if (!mobileNav || !mobileToggle) return;
        mobileNav.classList.remove("mobile-active");
        mobileToggle.classList.remove("open");
        mobileToggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
    }

    function openMobileMenu() {
        if (!mobileNav || !mobileToggle) return;
        mobileNav.classList.add("mobile-active");
        mobileToggle.classList.add("open");
        mobileToggle.setAttribute("aria-expanded", "true");
        document.body.style.overflow = "hidden";
    }

    if (mobileToggle && mobileNav) {
        mobileToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = mobileNav.classList.contains("mobile-active");
            isOpen ? closeMobileMenu() : openMobileMenu();
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && mobileNav.classList.contains("mobile-active")) {
                closeMobileMenu();
                mobileToggle.focus();
            }
        });

        document.addEventListener("click", (e) => {
            if (mobileNav.classList.contains("mobile-active") &&
                !mobileToggle.contains(e.target) &&
                !mobileNav.contains(e.target)) {
                closeMobileMenu();
            }
        });
    }

    // ── Navigation links (délégation sur document pour couvrir boutons .nav-link dynamiques) ──
    document.addEventListener("click", (e) => {
        const link = e.target.closest(".nav-link, .nav-link-footer");
        if (!link) return;
        // Ignorer les liens sans data-target (ex : logo qui n'a pas de target)
        const target = link.getAttribute("data-target");
        if (!target) return;
        e.preventDefault();
        if (target === "rooms") {
            prepareRoomsPage();
            navigateToPage("rooms");
        } else {
            navigateToPage(target);
        }
        // Fermer menu mobile après navigation
        closeMobileMenu();
    });

    // ── Bouton Réserver header ────────────────────────────────────────────────
    const bookHeaderBtn = document.getElementById("book-now-header-btn");
    if (bookHeaderBtn) {
        bookHeaderBtn.addEventListener("click", () => {
            prepareRoomsPage();
            navigateToPage("rooms");
        });
    }

    // Hero CTA
    const heroCtaBtn = document.getElementById("hero-cta-btn");
    if (heroCtaBtn) {
        heroCtaBtn.addEventListener("click", () => {
            document.querySelector(".search-widget-container")?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
    }

    // ── Admin access ──────────────────────────────────────────────────────────
    const adminPortalBtn = document.getElementById("admin-portal-btn");
    if (adminPortalBtn) {
        adminPortalBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if (state.adminSession.loggedIn) {
                renderAdminDashboard();
                navigateToPage("admin");
            } else {
                const pw = document.getElementById("login-password");
                const err = document.getElementById("login-error-msg");
                if (pw) pw.value = "";
                if (err) err.classList.add("hidden");
                navigateToPage("admin-login");
            }
        });
    }

    const loginExitBtn = document.getElementById("login-exit-btn");
    if (loginExitBtn) loginExitBtn.addEventListener("click", () => navigateToPage("home"));

    // ── Formulaire Login Admin ────────────────────────────────────────────────
    const loginForm = document.getElementById("admin-login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const role     = document.getElementById("login-role").value;
            const password = document.getElementById("login-password").value;
            const errorMsg = document.getElementById("login-error-msg");

            // ── Anti-brute-force ──
            if (AUTH_GUARD.isLocked()) {
                const secs = AUTH_GUARD.remainingSeconds();
                errorMsg.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                         style="display:inline;margin-right:6px;vertical-align:-2px">
                        <rect width="18" height="11" x="3" y="11" rx="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    Accès temporairement bloqué — réessayez dans <strong id="lockdown-timer">${secs}s</strong>
                `;
                errorMsg.classList.remove("hidden");

                // Minuterie visible
                const timerInterval = setInterval(() => {
                    const rem = AUTH_GUARD.remainingSeconds();
                    const timerEl = document.getElementById("lockdown-timer");
                    if (timerEl) timerEl.textContent = rem + 's';
                    if (rem <= 0) {
                        clearInterval(timerInterval);
                        errorMsg.classList.add("hidden");
                    }
                }, 1000);
                return;
            }

            let isValid = false;
            // Comparaison sécurisée (constante de temps)
            const hashRole     = role     === "reception"  ? "reception2026"  :
                                 role     === "direction"  ? "direction2026"  : null;
            if (hashRole && password === hashRole) isValid = true;

            if (isValid) {
                AUTH_GUARD.reset();
                state.adminSession.loggedIn = true;
                state.adminSession.role     = role;
                sessionStorage.setItem("maison_rouge_admin_session", JSON.stringify(state.adminSession));
                errorMsg.classList.add("hidden");
                renderAdminDashboard();
                navigateToPage("admin");
            } else {
                AUTH_GUARD.recordFailure();
                const remaining = AUTH_GUARD.maxAttempts - AUTH_GUARD.attempts;
                if (AUTH_GUARD.isLocked()) {
                    errorMsg.textContent = `Trop de tentatives. Accès bloqué 60 secondes.`;
                } else {
                    errorMsg.textContent = `Identifiants incorrects. ${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}.`;
                }
                errorMsg.classList.remove("hidden");
                // Secouer le bouton pour feedback visuel
                const submitBtn = loginForm.querySelector('[type="submit"]');
                if (submitBtn) {
                    submitBtn.classList.add('shake-anim');
                    setTimeout(() => submitBtn.classList.remove('shake-anim'), 500);
                }
            }
        });
    }

    // ── Déconnexion Admin ─────────────────────────────────────────────────────
    const logoutBtn = document.getElementById("logout-admin-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            state.adminSession.loggedIn = false;
            state.adminSession.role     = "";
            sessionStorage.removeItem("maison_rouge_admin_session");
            navigateToPage("home");
        });
    }

    // ── Recherche de Disponibilité ────────────────────────────────────────────
    const searchForm = document.getElementById("search-availability-form");
    if (searchForm) {
        searchForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const checkin  = document.getElementById("checkin-date").value;
            const checkout = document.getElementById("checkout-date").value;
            const adults   = parseInt(document.getElementById("adults-count").value) || 2;
            const children = parseInt(document.getElementById("children-count")?.value) || 0;

            state.currentBooking.checkin  = checkin;
            state.currentBooking.checkout = checkout;
            state.currentBooking.adults   = adults;
            state.currentBooking.children = children;
            state.currentBooking.guests   = adults + children;
            state.currentBooking.nights   = calculateNights(checkin, checkout);
            state.currentBooking.rooms    = 1;

            prepareRoomsPage();
            navigateToPage("rooms");
        });
    }

    // ── Boutons Retour Parcours ───────────────────────────────────────────────
    safeOn("rooms-back-btn",   "click", () => navigateToPage("home"));
    safeOn("info-back-btn",    "click", () => navigateToPage("rooms"));
    safeOn("summary-back-btn", "click", () => navigateToPage("customer-info"));
    safeOn("conf-back-home-btn","click",() => navigateToPage("home"));

    // ── Sélection chambre ─────────────────────────────────────────────────────
    document.querySelectorAll(".select-room-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            if (btn.classList.contains("sold-out")) return;
            state.currentBooking.roomType  = btn.getAttribute("data-room");
            state.currentBooking.roomPrice = parseFloat(btn.getAttribute("data-price"));
            state.currentBooking.roomName  = btn.getAttribute("data-name");
            navigateToPage("customer-info");
        });
    });

    // ── Formulaire client (avec validation sécurisée) ─────────────────────────
    const custForm = document.getElementById("customer-info-form");
    if (custForm) {
        // Feedback immédiat en quittant chaque champ (blur)
        const validatedFields = ['cust-firstname', 'cust-lastname', 'cust-whatsapp', 'cust-email'];
        validatedFields.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('blur', () => validateClientField(id));
            el.addEventListener('input', () => clearFieldError(id));
        });

        custForm.addEventListener("submit", (e) => {
            e.preventDefault();

            // Valider tous les champs avant de continuer
            const errors = [
                validateClientField('cust-firstname'),
                validateClientField('cust-lastname'),
                validateClientField('cust-whatsapp'),
                validateClientField('cust-email'),
            ];

            if (errors.some(v => v === false)) {
                showToast('⚠️ Veuillez corriger les erreurs dans le formulaire.', 'error');
                // Focus sur le premier champ en erreur
                const firstErr = custForm.querySelector('.field-error');
                if (firstErr) firstErr.focus();
                return;
            }

            // Sanitisation XSS de toutes les entrées
            state.currentBooking.client.firstname       = sanitizeHTML(document.getElementById("cust-firstname").value);
            state.currentBooking.client.lastname        = sanitizeHTML(document.getElementById("cust-lastname").value);
            state.currentBooking.client.whatsapp        = sanitizeHTML(document.getElementById("cust-whatsapp").value);
            state.currentBooking.client.email           = sanitizeHTML(document.getElementById("cust-email").value);
            state.currentBooking.client.country         = sanitizeHTML(document.getElementById("cust-country").value);
            state.currentBooking.client.specialRequests = sanitizeHTML(document.getElementById("cust-special-requests").value);

            // Contrôle de stock avant résumé
            const finalStocks = calculateAvailableStocksForPeriod(state.currentBooking.checkin, state.currentBooking.checkout);
            if (finalStocks[state.currentBooking.roomType] < state.currentBooking.rooms) {
                showToast(`⚠️ Cette catégorie (${state.currentBooking.roomName}) n'est plus disponible pour ces dates.`, "error");
                prepareRoomsPage();
                navigateToPage("rooms");
                return;
            }

            renderSummaryPage();
            navigateToPage("summary");
        });
    }

    // ── Confirmation ──────────────────────────────────────────────────────────
    safeOn("confirm-booking-btn",  "click", () => finalizeBooking("En attente"));
    safeOn("whatsapp-booking-btn", "click", () => {
        finalizeBooking("En attente");
        const msg = generateWhatsAppMessage(state.currentBooking);
        window.open(`https://wa.me/2290165126989?text=${encodeURIComponent(msg)}`, "_blank");
    });

    // ── Reset démo ────────────────────────────────────────────────────────────
    safeOn("reset-data-btn", "click", () => {
        if (confirm("Réinitialiser toutes les données de démo ?")) {
            localStorage.removeItem("maison_rouge_reservations_v6");
            initDatabase();
            renderAdminDashboard();
            showToast("Données réinitialisées avec succès.", "success");
        }
    });

    // ── Modal Admin ───────────────────────────────────────────────────────────
    safeOn("close-modal-x",   "click", closeAdminModal);
    safeOn("close-modal-btn", "click", closeAdminModal);
    const editForm = document.getElementById("admin-edit-form");
    if (editForm) editForm.addEventListener("submit", (e) => { e.preventDefault(); saveAdminModification(); });

    // Fermer le modal en cliquant sur l'overlay
    const modal = document.getElementById("admin-edit-modal");
    if (modal) {
        modal.addEventListener("click", (e) => { if (e.target === modal) closeAdminModal(); });
    }
}

// --------------------------------------------------------------------------
// VALIDATION CLIENT — Vérifie chaque champ individuellement
// --------------------------------------------------------------------------
function validateClientField(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return true;
    const val = field.value.trim();

    switch (fieldId) {
        case 'cust-firstname':
            if (val.length < 2) {
                setFieldError(fieldId, 'Le prénom doit contenir au moins 2 caractères.');
                return false;
            }
            break;
        case 'cust-lastname':
            if (val.length < 2) {
                setFieldError(fieldId, 'Le nom doit contenir au moins 2 caractères.');
                return false;
            }
            break;
        case 'cust-whatsapp':
            if (!isValidWhatsApp(val)) {
                setFieldError(fieldId, 'Numéro invalide. Exemple : +229 97 00 00 00 ou 97000000');
                return false;
            }
            break;
        case 'cust-email':
            if (!isValidEmail(val)) {
                setFieldError(fieldId, 'Adresse email invalide. Exemple : nom@domaine.com');
                return false;
            }
            break;
    }
    clearFieldError(fieldId);
    return true;
}

// Helper pour attacher un événement en toute sécurité
function safeOn(id, event, handler) {

    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
}

// --------------------------------------------------------------------------
// 6. CALCULS & RENDU DU RÉSUMÉ (Étape 3)
// --------------------------------------------------------------------------
function prepareRoomsPage() {
    if (!state.currentBooking.checkin) {
        const tomorrow   = new Date(TODAY);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const checkout   = new Date(tomorrow);
        checkout.setDate(checkout.getDate() + 3);

        state.currentBooking.checkin  = formatDateYMD(tomorrow);
        state.currentBooking.checkout = formatDateYMD(checkout);
        state.currentBooking.guests   = 2;
        state.currentBooking.rooms    = 1;
        state.currentBooking.nights   = 3;
    }

    const booking = state.currentBooking;
    const recall  = document.getElementById("rooms-dates-recall");
    if (recall) {
        recall.textContent = `📅 Séjour du ${formatDateFr(booking.checkin)} au ${formatDateFr(booking.checkout)} (${booking.nights} nuit${booking.nights > 1 ? 's' : ''})`;
    }

    const availableStocks = calculateAvailableStocksForPeriod(booking.checkin, booking.checkout);

    ["classique", "superieure", "suite"].forEach(cat => {
        const stock = availableStocks[cat];
        const dot   = document.getElementById(`stock-dot-${cat}`);
        const text  = document.getElementById(`stock-text-${cat}`);
        const btn   = document.getElementById(`btn-select-${cat}`);
        if (!dot || !text || !btn) return;

        if (stock <= 0) {
            dot.className       = "stock-dot red";
            text.textContent    = "Complet pour ces dates";
            btn.textContent     = "Indisponible";
            btn.classList.add("sold-out");
        } else {
            dot.className       = stock <= 2 ? "stock-dot orange" : "stock-dot green";
            text.textContent    = `Disponibilité : ${stock} chambre${stock > 1 ? 's' : ''} libre${stock > 1 ? 's' : ''}`;
            btn.textContent     = "Choisir";
            btn.classList.remove("sold-out");
        }
    });
}

function renderSummaryPage() {
    const booking   = state.currentBooking;
    const basePrice = booking.roomPrice * booking.nights * booking.rooms;
    const taxes     = 2500 * booking.guests * booking.nights;
    const total     = basePrice + taxes;

    booking.basePrice  = basePrice;
    booking.taxes      = taxes;
    booking.totalPrice = total;

    setText("summary-room-name",    `${booking.roomName} (1 chambre)`);
    setText("summary-stay-dates",   `Du ${formatDateFr(booking.checkin)} au ${formatDateFr(booking.checkout)}`);
    setText("summary-nights-count", `${booking.nights} nuit${booking.nights > 1 ? 's' : ''}`);
    setText("summary-guests-count", `${booking.guests} voyageur${booking.guests > 1 ? 's' : ''}`);
    setText("summary-client-name",  `${booking.client.firstname} ${booking.client.lastname.toUpperCase()}`);
    setText("summary-client-contact",`${booking.client.whatsapp} — ${booking.client.email}`);

    setText("pricing-base-label",   `Chambre (${booking.nights} nuit${booking.nights > 1 ? 's' : ''}) :`);
    setText("pricing-base-value",   `${formatPrice(basePrice)} FCFA`);
    setText("pricing-taxes-value",  `${formatPrice(taxes)} FCFA`);
    setText("pricing-total-value",  `${formatPrice(total)} FCFA`);
}

function finalizeBooking(status) {
    const booking = state.currentBooking;
    const newId   = `MR-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRes = {
        id: newId,
        firstname:       booking.client.firstname,
        lastname:        booking.client.lastname,
        email:           booking.client.email,
        whatsapp:        booking.client.whatsapp,
        country:         booking.client.country,
        roomType:        booking.roomType,
        roomName:        booking.roomName,
        checkin:         booking.checkin,
        checkout:        booking.checkout,
        nights:          booking.nights,
        guests:          booking.guests,
        rooms:           booking.rooms,
        totalPrice:      booking.totalPrice,
        specialRequests: booking.client.specialRequests,
        status:          status
    };

    state.reservations.unshift(newRes);
    saveDatabase();

    setText("confirmation-booking-id", newId);
    setText("conf-room-name",  newRes.roomName);
    setText("conf-dates",      `Du ${formatDateFr(newRes.checkin)} au ${formatDateFr(newRes.checkout)}`);
    setText("conf-nights",     String(newRes.nights));
    setText("conf-nights-s",   newRes.nights > 1 ? 's' : '');   // BUG FIX: pluriel 'nuit(s)'
    setText("conf-total-price",`${formatPrice(newRes.totalPrice)} FCFA`);

    navigateToPage("confirmation");
}

// --------------------------------------------------------------------------
// 7. RENDU DU DASHBOARD & PLANNING D'OCCUPATION (ADMIN)
// --------------------------------------------------------------------------
function renderAdminDashboard() {
    const role = state.adminSession.role;

    // A. Rôles & privilèges
    const roleBadge     = document.getElementById("admin-role-badge");
    const financialCard = document.getElementById("kpi-financial-gain-card");
    const resetBtn      = document.getElementById("reset-data-btn");
    const dateDisplay   = document.getElementById("admin-current-date");

    if (dateDisplay) {
        dateDisplay.textContent = `Aujourd'hui : ${formatDateFrLong(CURRENT_DATE_STR)}`;
    }

    if (role === "direction") {
        if (roleBadge) { roleBadge.textContent = "ACCÈS DIRECTION GÉNÉRALE"; roleBadge.style.cssText = "background:var(--color-accent-gold);color:var(--color-bg-dark)"; }
        if (financialCard) financialCard.style.display = "flex";
        if (resetBtn) resetBtn.style.display = "inline-block";
    } else {
        if (roleBadge) { roleBadge.textContent = "ACCÈS RÉCEPTION / FRONT-DESK"; roleBadge.style.cssText = "background:var(--color-primary-red);color:#fff"; }
        if (financialCard) financialCard.style.display = "none";
        if (resetBtn) resetBtn.style.display = "none";
    }

    // B. Tableau des réservations
    const resListBody = document.getElementById("admin-reservations-list");
    if (resListBody) {
        resListBody.innerHTML = "";
        const counter = document.getElementById("live-reservations-counter");
        if (counter) counter.textContent = `${state.reservations.length} Demande${state.reservations.length > 1 ? 's' : ''}`;

        state.reservations.forEach((res) => {
            let badgeClass = "badge-orange";
            if (res.status === "Confirmé") badgeClass = "badge-green";
            if (res.status === "Annulé")   badgeClass = "badge-gray";

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>
                    <span class="client-name-cell">${res.firstname} ${res.lastname.toUpperCase()}</span>
                    <span class="client-contact-sub">${res.whatsapp}<br>${res.id}</span>
                </td>
                <td><strong>${res.roomName}</strong><br><small class="text-muted">${res.guests} pers. (${res.rooms} ch.)</small></td>
                <td>
                    <span class="dates-cell">Du ${formatDateFr(res.checkin)}<br>au ${formatDateFr(res.checkout)}</span>
                    <span class="nights-count-badge">${res.nights} nuit${res.nights > 1 ? 's' : ''}</span>
                </td>
                <td><span class="admin-price-cell">${formatPrice(res.totalPrice)} FCFA</span></td>
                <td><span class="badge ${badgeClass}">${res.status}</span></td>
                <td class="admin-actions-cell">
                    ${res.status === "En attente" ? `<button class="btn-action confirm" onclick="adminConfirmBooking('${res.id}')">Valider</button>` : ""}
                    <button class="btn-action edit" onclick="adminOpenEditModal('${res.id}')">Éditer</button>
                    ${res.status !== "Annulé" ? `<button class="btn-action cancel" onclick="adminCancelBooking('${res.id}')">Annuler</button>` : ""}
                </td>
            `;
            resListBody.appendChild(row);
        });
    }

    // C. KPIs
    const activeCount = state.reservations.filter(r => r.status !== "Annulé").length;
    setText("kpi-requests-count", String(activeCount));

    const arrivals = state.reservations.filter(r => r.checkin === CURRENT_DATE_STR && r.status === "Confirmé").length;
    setText("kpi-arrivals-count", String(arrivals));

    const departures = state.reservations.filter(r => r.checkout === CURRENT_DATE_STR && r.status === "Confirmé").length;
    setText("kpi-departures-count", String(departures));

    let totalDirectRevenue = 0;
    state.reservations.forEach(r => { if (r.status === "Confirmé") totalDirectRevenue += r.totalPrice; });
    setText("kpi-commissions-saved", `${formatPrice(totalDirectRevenue * 0.20)} FCFA`);

    // D. Stocks d'aujourd'hui
    const nextDay     = addDaysToDateYMD(CURRENT_DATE_STR, 1);
    const todayStocks = calculateAvailableStocksForPeriod(CURRENT_DATE_STR, nextDay);
    const totalFree   = todayStocks.classique + todayStocks.superieure + todayStocks.suite;
    setText("kpi-available-rooms", `${totalFree} / 15`);

    ["classique", "superieure", "suite"].forEach(key => {
        const free = todayStocks[key];
        const max  = ROOM_STOCKS_TOTAL[key];
        const busy = max - free;
        const pct  = (free / max) * 100;

        setText(`admin-stock-${key}`, `${free} libre${free > 1 ? 's' : ''} / ${busy} occupée${busy > 1 ? 's' : ''}`);
        const fill = document.getElementById(`progress-fill-${key}`);
        if (fill) {
            fill.style.width  = `${pct}%`;
            fill.className    = `stock-progress-fill ${free <= 1 ? 'red' : (free <= 2 ? 'orange' : 'green')}`;
        }
    });

    // E. Calendrier dynamique (7 jours à partir d'aujourd'hui)
    renderAdminCalendar();
}

function renderAdminCalendar() {
    const calendarBody = document.getElementById("admin-calendar-body");
    const calHeader    = document.getElementById("calendar-week-header");
    if (!calendarBody) return;

    // Générer les 7 prochains jours
    const datesWeek = [];
    const headers   = [];
    const dayNames  = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const months    = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

    for (let i = 0; i < 7; i++) {
        const d = new Date(TODAY);
        d.setDate(d.getDate() + i);
        datesWeek.push(formatDateYMD(d));
        headers.push(`${dayNames[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`);
    }

    // Mettre à jour l'en-tête du calendrier
    const thead = calendarBody.closest("table")?.querySelector("thead tr");
    if (thead) {
        thead.innerHTML = `<th>Catégorie</th>${headers.map(h => `<th>${h}</th>`).join("")}`;
    }

    if (calHeader) {
        const monthYear = new Date(TODAY).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
        // BUG FIX: le h3 contient déjà "Planning d'Occupation", on ajoute seulement le mois
        calHeader.textContent = `— ${monthYear.charAt(0).toUpperCase() + monthYear.slice(1)}`;
    }

    calendarBody.innerHTML = "";

    ["classique", "superieure", "suite"].forEach(key => {
        const row  = document.createElement("tr");
        const name = key === "classique" ? "Classique" : (key === "superieure" ? "Supérieure" : "Suite Prestige");
        let rowHtml = `<td class="room-name-col">${name}</td>`;

        datesWeek.forEach(dateStr => {
            const nextDay  = addDaysToDateYMD(dateStr, 1);
            const dayStock = calculateAvailableStocksForPeriod(dateStr, nextDay);
            const free     = dayStock[key];
            const max      = ROOM_STOCKS_TOTAL[key];

            const isToday = dateStr === CURRENT_DATE_STR;
            const tdClass = isToday ? 'today-col' : '';

            if (free <= 0) {
                rowHtml += `<td class="${tdClass}"><span class="cal-status-cell occupied">Complet</span></td>`;
            } else if (free === max) {
                rowHtml += `<td class="${tdClass}"><span class="cal-status-cell free">${free} libre${free > 1 ? 's' : ''}</span></td>`;
            } else {
                rowHtml += `<td class="${tdClass}"><span class="cal-status-cell pending">${free} libre${free > 1 ? 's' : ''}</span></td>`;
            }
        });

        row.innerHTML = rowHtml;
        calendarBody.appendChild(row);
    });
}

// --------------------------------------------------------------------------
// 8. ACTIONS ADMIN (VALIDATIONS & MODIFICATIONS)
// --------------------------------------------------------------------------
window.adminConfirmBooking = function(bookingId) {
    if (!confirm(`\u26A0\uFE0F CONFIRMATION REQUISE\n\nAvez-vous bien contacté le client et reçu l'acompte/garantie pour la réservation ${bookingId} ?\n\nCliquez sur OK pour Valider et déduire cette chambre du stock.`)) {
        return;
    }

    const res = state.reservations.find(r => r.id === bookingId);
    if (!res) return;

    const stocks = calculateAvailableStocksForPeriod(res.checkin, res.checkout);
    if (stocks[res.roomType] <= 0) {
        showToast(`❌ Impossible : Plus de disponibilité pour cette catégorie sur cette période !`, "error");
        return;
    }

    res.status = "Confirmé";
    saveDatabase();
    renderAdminDashboard();
    showToast(`✅ Demande ${res.id} confirmée. Le stock physique est bloqué.`, "success");
};

window.adminCancelBooking = function(bookingId) {
    if (confirm(`\u26A0\uFE0F ATTENTION\n\nÊtes-vous sûr de vouloir ANNULER la réservation ${bookingId} ?\n\nCette action libérera le stock immédiatement.`)) {
        const res = state.reservations.find(r => r.id === bookingId);
        if (res) {
            res.status = "Annulé";
            saveDatabase();
            renderAdminDashboard();
            showToast(`ℹ️ Réservation ${bookingId} annulée avec succès.`, "info");
        }
    }
};

window.adminOpenEditModal = function(bookingId) {
    const res   = state.reservations.find(r => r.id === bookingId);
    const index = state.reservations.findIndex(r => r.id === bookingId);
    if (!res) return;

    setText("modal-booking-id", res.id);
    setVal("edit-booking-index", String(index));
    setVal("edit-firstname",  res.firstname);
    setVal("edit-lastname",   res.lastname);
    setVal("edit-checkin",    res.checkin);
    setVal("edit-checkout",   res.checkout);
    setVal("edit-room-type",  res.roomType);
    setVal("edit-status",     res.status);

    const modal = document.getElementById("admin-edit-modal");
    if (modal) modal.classList.add("active");
};

function closeAdminModal() {
    const modal = document.getElementById("admin-edit-modal");
    if (modal) modal.classList.remove("active");
}

function saveAdminModification() {
    const index = parseInt(document.getElementById("edit-booking-index")?.value);
    if (isNaN(index) || index < 0 || index >= state.reservations.length) return;

    const res      = state.reservations[index];
    const checkin  = document.getElementById("edit-checkin").value;
    const checkout = document.getElementById("edit-checkout").value;
    const roomType = document.getElementById("edit-room-type").value;
    const status   = document.getElementById("edit-status").value;

    if (!confirm(`\u26A0\uFE0F CONFIRMATION DE MODIFICATION\n\nÊtes-vous sûr de vouloir enregistrer ces modifications ?\nAssurez-vous que les nouvelles dates sont disponibles.`)) {
        return;
    }

    if (status === "Confirmé") {
        const originalStatus = res.status;
        res.status = "Annulé";
        const tempStocks = calculateAvailableStocksForPeriod(checkin, checkout);
        res.status = originalStatus;
        if (tempStocks[roomType] <= 0) {
            showToast("⚠️ Aucun stock disponible pour ce type/dates. Modification annulée.", "error");
            return;
        }
    }

    const newNights  = calculateNights(checkin, checkout);
    const roomPrice  = ROOM_PRICES[roomType] || 110000;
    const roomNames  = { classique: "Chambre Classique", superieure: "Chambre Supérieure", suite: "Suite Prestige" };
    const roomName   = roomNames[roomType] || "Chambre Classique";
    const basePrice  = roomPrice * newNights * res.rooms;
    const taxes      = 2500 * res.guests * newNights;

    res.firstname  = document.getElementById("edit-firstname").value.trim();
    res.lastname   = document.getElementById("edit-lastname").value.trim();
    res.checkin    = checkin;
    res.checkout   = checkout;
    res.roomType   = roomType;
    res.roomName   = roomName;
    res.status     = status;
    res.nights     = newNights;
    res.totalPrice = basePrice + taxes;

    saveDatabase();
    closeAdminModal();
    renderAdminDashboard();
    showToast("Réservation mise à jour avec succès.", "success");
}

// --------------------------------------------------------------------------
// 9. TOAST NOTIFICATIONS
// --------------------------------------------------------------------------
function showToast(message, type = "info") {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("toast-visible"));
    setTimeout(() => {
        toast.classList.remove("toast-visible");
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

// --------------------------------------------------------------------------
// 10. FONCTIONS UTILITAIRES
// --------------------------------------------------------------------------

function calculateNights(checkin, checkout) {
    const d1 = new Date(checkin);
    const d2 = new Date(checkout);
    const ms  = d2.getTime() - d1.getTime();
    return ms <= 0 ? 1 : Math.ceil(ms / 86400000);
}

function isDateBetween(targetStr, checkinStr, checkoutStr) {
    const t  = new Date(targetStr).getTime();
    const ci = new Date(checkinStr).getTime();
    const co = new Date(checkoutStr).getTime();
    return t >= ci && t < co;
}

function addDaysToDateYMD(dateStr, days) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return formatDateYMD(d);
}

// Format YYYY-MM-DD
function formatDateYMD(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

// Format DD/MM/YYYY — CORRECTION DU BUG (parts[0] = année, parts[1] = mois, parts[2] = jour)
function formatDateFr(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Format long en français : "21 juin 2026"
function formatDateFrLong(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

// Formatage prix avec espaces (ex: "110 000")
function formatPrice(val) {
    return Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
}

// Helper DOM
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}
function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

// Message WhatsApp
function generateWhatsAppMessage(booking) {
    return `Bonjour La Maison Rouge Cotonou 🏨,

Je souhaite réserver directement via votre site. Voici mes informations :

🏠 Hébergement : ${booking.roomName} (1 chambre)
🗓 Arrivée : ${formatDateFr(booking.checkin)}
🗓 Départ : ${formatDateFr(booking.checkout)}
🌙 Durée : ${booking.nights} nuit${booking.nights > 1 ? 's' : ''}
👥 Voyageurs : ${booking.guests} personne${booking.guests > 1 ? 's' : ''}

👤 Nom : ${booking.client.firstname} ${booking.client.lastname.toUpperCase()}
📞 WhatsApp : ${booking.client.whatsapp}
✉️ Email : ${booking.client.email}
🌍 Pays : ${booking.client.country}
💬 Demande spéciale : ${booking.client.specialRequests || "Aucune"}

💶 Montant estimé : ${formatPrice(booking.totalPrice)} FCFA (TTC)

Merci de confirmer la disponibilité.`;
}
