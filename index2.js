// Ma Petite Laverie - JavaScript Functions Only
// Version optimisée pour index2.html (contenu HTML déjà intégré)

console.log('🚀 Chargement de Ma Petite Laverie...');

// ============================================
// VARIABLES GLOBALES
// ============================================

let currentStep = 1;
const totalSteps = 6;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');

    // Initialize components
    initMobileMenu();
    initHeaderScroll();
    initCookieBanner();
    initForm();
    initIntersectionObserver();
    generateCSRFToken();

    // Wait for Swiper to load
    setTimeout(() => {
        if (typeof Swiper !== 'undefined') {
            initTestimonialsCarousel();
        }
    }, 100);

    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
        console.log('✅ Lucide Icons initialized');
    }

    console.log('✅ Ma Petite Laverie App Loaded Successfully!');
});

// ============================================
// MOBILE MENU (Slide-in from right)
// ============================================

function initMobileMenu() {
    const openBtn = document.getElementById('mobile-menu-btn');
    const closeBtn = document.getElementById('close-menu-btn');
    const menu = document.getElementById('mobile-menu');

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'mobile-menu-overlay';
    document.body.appendChild(overlay);

    // Open menu
    if (openBtn && menu) {
        openBtn.addEventListener('click', () => {
            menu.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    // Close menu function
    const closeMenu = () => {
        menu.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', closeMenu);
    }

    // Close on overlay click
    overlay.addEventListener('click', closeMenu);

    // Close on link click
    if (menu) {
        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    }
}

// ============================================
// NAVBAR SCROLL EFFECT (Transparent → White)
// ============================================

function initHeaderScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    // Set initial state
    navbar.classList.add('transparent');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.remove('transparent');
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
            navbar.classList.add('transparent');
        }
    });
}

// ============================================
// COOKIE BANNER
// ============================================

function initCookieBanner() {
    const consent = localStorage.getItem('cookie_consent');
    const banner = document.getElementById('cookie-banner');
    if (!consent && banner) {
        banner.classList.remove('hidden');
    }
}

window.acceptCookies = function() {
    localStorage.setItem('cookie_consent', 'accepted');
    document.getElementById('cookie-banner').classList.add('hidden');
    if (typeof gtag !== 'undefined') {
        gtag('consent', 'update', { 'analytics_storage': 'granted' });
    }
    trackEvent('cookie_consent', {action: 'accepted'});
};

window.refuseCookies = function() {
    localStorage.setItem('cookie_consent', 'refused');
    document.getElementById('cookie-banner').classList.add('hidden');
    trackEvent('cookie_consent', {action: 'refused'});
};

// ============================================
// CSRF TOKEN
// ============================================

function generateCSRFToken() {
    const token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
    const input = document.getElementById('csrf_token');
    if (input) input.value = token;
}

// ============================================
// FORM INITIALIZATION
// ============================================

function initForm() {
    renderFormSteps();
    showStep(1);
    initRadioAutoAdvance();
    initFormInputListeners();
}

// Ajouter des listeners sur tous les champs pour valider en temps réel
function initFormInputListeners() {
    // Écouter les changements sur tous les inputs
    document.addEventListener('input', function(e) {
        if (e.target.matches('.form-step input, .form-step select')) {
            validateCurrentStep();
        }
    });

    // Écouter les changements sur les checkboxes
    document.addEventListener('change', function(e) {
        if (e.target.matches('.form-step input[type="checkbox"]')) {
            validateCurrentStep();
        }
    });
}

// Auto-advance on radio selection
function initRadioAutoAdvance() {
    // Désactiver l'auto-advance automatique pour éviter les doubles sauts
    // L'utilisateur doit cliquer sur "Continuer" pour valider

    // Activer le bouton "Continuer" quand un choix est fait
    const radioInputs = document.querySelectorAll('.form-step input[type="radio"]');
    radioInputs.forEach(radio => {
        radio.addEventListener('change', function() {
            validateCurrentStep();
        });
    });

    // Pour le select de l'étape 5 (surface)
    const surfaceSelect = document.querySelector('select[name="surface"]');
    if (surfaceSelect) {
        surfaceSelect.addEventListener('change', function() {
            validateCurrentStep();
        });
    }
}

// Valider l'étape courante et activer/désactiver le bouton Continuer
function validateCurrentStep() {
    const currentStepElement = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    if (!currentStepElement) return true;

    const continueBtn = currentStepElement.querySelector('button[onclick*="nextStep"]');
    let isValid = false;

    switch(currentStep) {
        case 1: // Type de projet
            const typeProjet = document.querySelector('input[name="type_projet"]:checked');
            isValid = !!typeProjet;
            break;

        case 2: // Budget
            const budget = document.querySelector('input[name="budget"]:checked');
            isValid = !!budget;
            break;

        case 3: // Emplacement
            const emplacement = document.querySelector('input[name="emplacement_disponible"]:checked');
            isValid = !!emplacement;
            // Si "Oui" est sélectionné, vérifier que les champs sont remplis
            if (emplacement && emplacement.value === 'oui') {
                const typeEmplacement = document.querySelector('select[name="type_emplacement"]');
                const ville = document.querySelector('input[name="ville_emplacement"]');
                isValid = typeEmplacement && typeEmplacement.value !== '' &&
                         ville && ville.value.trim() !== '';
            }
            break;

        case 4: // Timing
            const timing = document.querySelector('input[name="timing"]:checked');
            isValid = !!timing;
            break;

        case 5: // Surface
            const surface = document.querySelector('select[name="surface"]');
            isValid = surface && surface.value !== '';
            break;

        case 6: // Contact
            const prenom = document.querySelector('input[name="prenom"]');
            const nom = document.querySelector('input[name="nom"]');
            const telephone = document.querySelector('input[name="telephone"]');
            const email = document.querySelector('input[name="email"]');
            const rgpd = document.querySelector('input[name="rgpd_consent"]');

            isValid = prenom && prenom.value.trim().length >= 2 &&
                     nom && nom.value.trim().length >= 2 &&
                     telephone && telephone.value.trim() !== '' &&
                     email && email.value.trim() !== '' &&
                     rgpd && rgpd.checked;
            break;
    }

    // Activer/désactiver le bouton Continuer
    if (continueBtn) {
        if (isValid) {
            continueBtn.disabled = false;
            continueBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            continueBtn.classList.add('hover:shadow-2xl');
        } else {
            continueBtn.disabled = true;
            continueBtn.classList.add('opacity-50', 'cursor-not-allowed');
            continueBtn.classList.remove('hover:shadow-2xl');
        }
    }

    return isValid;
}

// Render Form Steps
function renderFormSteps() {
    const container = document.getElementById('form-steps-container');
    if (!container) return;

    const formHTML = `
        <!-- Step 1 -->
        <div class="form-step active" data-step="1">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Quel est votre projet ?</h3>
            <div class="space-y-3">
                <label class="flex items-start p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-accent-500 cursor-pointer transition-all group">
                    <input type="radio" name="type_projet" value="premiere_acquisition" required class="mt-1 mr-4 w-5 h-5">
                    <div>
                        <div class="font-semibold text-gray-900">Première acquisition</div>
                        <div class="text-sm text-gray-600">Je débute</div>
                    </div>
                </label>
                <label class="flex items-start p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-accent-500 cursor-pointer transition-all group">
                    <input type="radio" name="type_projet" value="extension" required class="mt-1 mr-4 w-5 h-5">
                    <div>
                        <div class="font-semibold text-gray-900">Extension</div>
                        <div class="text-sm text-gray-600">J'ai déjà une laverie</div>
                    </div>
                </label>
                <label class="flex items-start p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-accent-500 cursor-pointer transition-all group">
                    <input type="radio" name="type_projet" value="remplacement" required class="mt-1 mr-4 w-5 h-5">
                    <div>
                        <div class="font-semibold text-gray-900">Remplacement</div>
                        <div class="text-sm text-gray-600">Moderniser</div>
                    </div>
                </label>
            </div>
            <div class="mt-6">
                <button type="button" onclick="nextStep()" class="w-full px-8 py-4 bg-gradient-to-r from-accent-500 to-accent-600 text-primary-900 rounded-xl hover:shadow-2xl transition-all font-bold flex items-center justify-center gap-2">
                    <span>Continuer</span>
                    <i data-lucide="arrow-right" class="w-5 h-5"></i>
                </button>
            </div>
        </div>

        <!-- Step 2 -->
        <div class="form-step" data-step="2">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Budget envisagé</h3>
            <div class="space-y-3">
                <label class="flex items-center p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-accent-500 cursor-pointer transition-all">
                    <input type="radio" name="budget" value="15-20k" required class="mr-4 w-5 h-5">
                    <span class="font-semibold text-gray-900">15 000€ - 20 000€</span>
                </label>
                <label class="flex items-center p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-accent-500 cursor-pointer transition-all">
                    <input type="radio" name="budget" value="20-30k" required class="mr-4 w-5 h-5">
                    <span class="font-semibold text-gray-900">20 000€ - 30 000€</span>
                </label>
                <label class="flex items-center p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-accent-500 cursor-pointer transition-all">
                    <input type="radio" name="budget" value="30k+" required class="mr-4 w-5 h-5">
                    <span class="font-semibold text-gray-900">Plus de 30 000€</span>
                </label>
            </div>
            <div class="mt-6 flex gap-3">
                <button type="button" onclick="prevStep()" class="flex-1 px-6 py-4 bg-gray-50 text-gray-900 rounded-xl hover:bg-gray-100 transition-all font-semibold flex items-center justify-center gap-2">
                    <i data-lucide="arrow-left" class="w-5 h-5"></i>
                    <span>Retour</span>
                </button>
                <button type="button" onclick="nextStep()" class="flex-1 px-6 py-4 bg-gradient-to-r from-accent-500 to-accent-600 text-primary-900 rounded-xl hover:shadow-2xl transition-all font-bold flex items-center justify-center gap-2">
                    <span>Continuer</span>
                    <i data-lucide="arrow-right" class="w-5 h-5"></i>
                </button>
            </div>
        </div>

        <!-- Step 3 -->
        <div class="form-step" data-step="3">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Emplacement ?</h3>
            <div class="space-y-3">
                <label class="flex items-center p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-accent-500 cursor-pointer transition-all">
                    <input type="radio" name="emplacement_disponible" value="oui" required class="mr-4 w-5 h-5" onchange="document.getElementById('emplacement-details').classList.remove('hidden')">
                    <span class="font-semibold text-gray-900 flex items-center gap-2">
                        <i data-lucide="check-circle" class="w-5 h-5 text-green-600"></i>
                        <span>Oui</span>
                    </span>
                </label>
                <label class="flex items-center p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-accent-500 cursor-pointer transition-all">
                    <input type="radio" name="emplacement_disponible" value="non" required class="mr-4 w-5 h-5" onchange="document.getElementById('emplacement-details').classList.add('hidden')">
                    <span class="font-semibold text-gray-900 flex items-center gap-2">
                        <i data-lucide="search" class="w-5 h-5 text-blue-600"></i>
                        <span>Non</span>
                    </span>
                </label>
            </div>
            <div id="emplacement-details" class="hidden space-y-4 mt-4 pt-4 border-t border-gray-200">
                <select name="type_emplacement" class="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">
                    <option value="">Type...</option>
                    <option value="parking">Parking</option>
                    <option value="station_service">Station-service</option>
                    <option value="station_service">Station de lavage auto</option>
                    <option value="station_service">Centre commercial</option>
                    <option value="station_service">Grande surface</option>
                    <option value="station_service">Camping</option>
                    <option value="station_service">Coopérative</option>
                    <option value="autre">Autre</option>
                </select>
                <input type="text" name="ville_emplacement" placeholder="Ville" class="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400">
            </div>
            <div class="mt-6 flex gap-3">
                <button type="button" onclick="prevStep()" class="flex-1 px-6 py-4 bg-gray-50 text-gray-900 rounded-xl hover:bg-gray-100 transition-all font-semibold flex items-center justify-center gap-2">
                    <i data-lucide="arrow-left" class="w-5 h-5"></i>
                    <span>Retour</span>
                </button>
                <button type="button" onclick="nextStep()" class="flex-1 px-6 py-4 bg-gradient-to-r from-accent-500 to-accent-600 text-primary-900 rounded-xl hover:shadow-2xl transition-all font-bold flex items-center justify-center gap-2">
                    <span>Continuer</span>
                    <i data-lucide="arrow-right" class="w-5 h-5"></i>
                </button>
            </div>
        </div>

        <!-- Step 4 -->
        <div class="form-step" data-step="4">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Timing</h3>
            <div class="space-y-3">
                <label class="flex items-center p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-accent-500 cursor-pointer transition-all">
                    <input type="radio" name="timing" value="immediat" required class="mr-4 w-5 h-5">
                    <span class="font-semibold text-gray-900 flex items-center gap-2">
                        <i data-lucide="zap" class="w-5 h-5 text-yellow-600"></i>
                        <span>Immédiat</span>
                    </span>
                </label>
                <label class="flex items-center p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-accent-500 cursor-pointer transition-all">
                    <input type="radio" name="timing" value="3_mois" required class="mr-4 w-5 h-5">
                    <span class="font-semibold text-gray-900 flex items-center gap-2">
                        <i data-lucide="calendar" class="w-5 h-5 text-blue-600"></i>
                        <span>3 mois</span>
                    </span>
                </label>
                <label class="flex items-center p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-accent-500 cursor-pointer transition-all">
                    <input type="radio" name="timing" value="6_mois_plus" required class="mr-4 w-5 h-5">
                    <span class="font-semibold text-gray-900 flex items-center gap-2">
                        <i data-lucide="clock" class="w-5 h-5 text-purple-600"></i>
                        <span>6 mois+</span>
                    </span>
                </label>
            </div>
            <div class="mt-6 flex gap-3">
                <button type="button" onclick="prevStep()" class="flex-1 px-6 py-4 bg-gray-50 text-gray-900 rounded-xl hover:bg-gray-100 transition-all font-semibold flex items-center justify-center gap-2">
                    <i data-lucide="arrow-left" class="w-5 h-5"></i>
                    <span>Retour</span>
                </button>
                <button type="button" onclick="nextStep()" class="flex-1 px-6 py-4 bg-gradient-to-r from-accent-500 to-accent-600 text-primary-900 rounded-xl hover:shadow-2xl transition-all font-bold flex items-center justify-center gap-2">
                    <span>Continuer</span>
                    <i data-lucide="arrow-right" class="w-5 h-5"></i>
                </button>
            </div>
        </div>

        <!-- Step 5 -->
        <div class="form-step" data-step="5">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Surface</h3>
            <select name="surface" required class="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-lg">
                <option value="">Sélectionnez...</option>
                <option value="moins_10m2">< 10 m²</option>
                <option value="10-20m2">10-20 m²</option>
                <option value="20-30m2">20-30 m²</option>
                <option value="plus_30m2">> 30 m²</option>
            </select>
            <div class="mt-6 flex gap-3">
                <button type="button" onclick="prevStep()" class="flex-1 px-6 py-4 bg-gray-50 text-gray-900 rounded-xl hover:bg-gray-100 transition-all font-semibold flex items-center justify-center gap-2">
                    <i data-lucide="arrow-left" class="w-5 h-5"></i>
                    <span>Retour</span>
                </button>
                <button type="button" onclick="nextStep()" class="flex-1 px-6 py-4 bg-gradient-to-r from-accent-500 to-accent-600 text-primary-900 rounded-xl hover:shadow-2xl transition-all font-bold flex items-center justify-center gap-2">
                    <span>Dernière étape</span>
                    <i data-lucide="arrow-right" class="w-5 h-5"></i>
                </button>
            </div>
        </div>

        <!-- Step 6 -->
        <div class="form-step" data-step="6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Coordonnées</h3>
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <input type="text" name="prenom" required minlength="2" placeholder="Prénom" class="p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400">
                    <input type="text" name="nom" required minlength="2" placeholder="Nom" class="p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400">
                </div>
                <input type="tel" name="telephone" required pattern="^(?:(?:\\+|00)33|0)\\s*[1-9](?:[\\s.-]*\\d{2}){4}$" placeholder="Téléphone" class="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400">
                <input type="email" name="email" required placeholder="Email" class="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400">
                <div class="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <label class="flex items-start cursor-pointer">
                        <input type="checkbox" name="rgpd_consent" required class="mt-1 mr-3 w-5 h-5">
                        <span class="text-sm text-gray-700">J'accepte le traitement de mes données. <a href="mentions-legales.html" class="text-primary-600 underline">En savoir plus</a></span>
                    </label>
                </div>
                <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <label class="flex items-start cursor-pointer">
                        <input type="checkbox" name="newsletter_optin" class="mt-1 mr-3 w-5 h-5">
                        <span class="text-sm text-gray-700">J'accepte de recevoir des informations commerciales et des offres spéciales de Ma Petite Laverie (optionnel)</span>
                    </label>
                </div>
            </div>
            <div class="mt-6 flex gap-3">
                <button type="button" onclick="prevStep()" class="flex-1 px-6 py-4 bg-gray-50 text-gray-900 rounded-xl hover:bg-gray-100 transition-all font-semibold flex items-center justify-center gap-2">
                    <i data-lucide="arrow-left" class="w-5 h-5"></i>
                    <span>Retour</span>
                </button>
                <button type="submit" id="submit-btn" class="flex-1 px-6 py-4 bg-gradient-to-r from-accent-500 to-accent-600 text-primary-900 rounded-xl hover:shadow-2xl transition-all font-bold flex items-center justify-center gap-2">
                    <i data-lucide="send" class="w-5 h-5"></i>
                    <span>Envoyer</span>
                </button>
            </div>
        </div>
    `;

    container.innerHTML = formHTML;

    // Re-initialize Lucide icons for newly added elements
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Add submit handler
    const form = document.getElementById('lead-form');
    if (form) {
        form.addEventListener('submit', submitForm);
    }

    // Re-initialize radio auto-advance after rendering
    initRadioAutoAdvance();
}

// ============================================
// FORM NAVIGATION
// ============================================

function showStep(step) {
    const steps = document.querySelectorAll('.form-step');
    steps.forEach((s, i) => {
        if (i + 1 === step) {
            s.classList.add('active');
        } else {
            s.classList.remove('active');
        }
    });

    const progress = ((step - 1) / (totalSteps - 1)) * 100;
    const progressBar = document.getElementById('progress-bar');
    const progressPct = document.getElementById('progress-percentage');
    const stepLabel = document.getElementById('step-label');

    if (progressBar) progressBar.style.width = progress + '%';
    if (progressPct) progressPct.textContent = Math.round(progress) + '%';
    if (stepLabel) stepLabel.textContent = `Étape ${step} sur ${totalSteps}`;

    // Re-initialize Lucide icons for the new step
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Valider l'étape pour activer/désactiver le bouton Continuer
    setTimeout(() => {
        validateCurrentStep();
    }, 100);
}

window.nextStep = function() {
    // Valider l'étape courante avant de continuer
    if (!validateCurrentStep()) {
        // Afficher un message d'erreur
        alert('⚠️ Veuillez sélectionner une option avant de continuer.');
        return;
    }

    if (currentStep < totalSteps) {
        currentStep++;
        showStep(currentStep);
        trackEvent('form_step_completed', {step: currentStep - 1});
        const formulaire = document.getElementById('formulaire');
        if (formulaire) {
            formulaire.scrollIntoView({behavior: 'smooth', block: 'start'});
        }
    }
};

window.prevStep = function() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
};

// ============================================
// FORM VALIDATION
// ============================================

function validateForm(formData) {
    const errors = [];

    // Validation téléphone français
    const telephone = formData.get('telephone');
    const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
    if (telephone && !phoneRegex.test(telephone)) {
        errors.push({
            field: 'telephone',
            message: '📱 Le numéro de téléphone n\'est pas au format français valide.\nExemples : 06 12 34 56 78 ou 02 40 31 66 00'
        });
    }

    // Validation email
    const email = formData.get('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
        errors.push({
            field: 'email',
            message: '📧 L\'adresse email n\'est pas valide.\nExemple : contact@example.com'
        });
    }

    // Validation nom/prénom (minimum 2 caractères)
    const nom = formData.get('nom');
    const prenom = formData.get('prenom');
    if (nom && nom.trim().length < 2) {
        errors.push({
            field: 'nom',
            message: '✏️ Le nom doit contenir au moins 2 caractères.'
        });
    }
    if (prenom && prenom.trim().length < 2) {
        errors.push({
            field: 'prenom',
            message: '✏️ Le prénom doit contenir au moins 2 caractères.'
        });
    }

    // Validation RGPD
    const rgpd = formData.get('rgpd_consent');
    if (!rgpd) {
        errors.push({
            field: 'rgpd_consent',
            message: '✅ Vous devez accepter le traitement de vos données pour continuer.'
        });
    }

    return errors;
}

function displayValidationErrors(errors) {
    // Afficher les erreurs dans une alerte formatée
    const errorMessages = errors.map(err => err.message).join('\n\n');
    alert('❌ Veuillez corriger les erreurs suivantes :\n\n' + errorMessages);

    // Mettre en évidence le premier champ en erreur
    if (errors.length > 0) {
        const firstErrorField = document.querySelector(`[name="${errors[0].field}"]`);
        if (firstErrorField) {
            firstErrorField.focus();
            firstErrorField.classList.add('border-red-500', 'ring-2', 'ring-red-200');
            setTimeout(() => {
                firstErrorField.classList.remove('border-red-500', 'ring-2', 'ring-red-200');
            }, 3000);
        }
    }
}

// ============================================
// FORM SUBMISSION
// ============================================

async function submitForm(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-btn');
    if (!submitBtn) return;

    const formData = new FormData(e.target);

    // Validation côté client
    const validationErrors = validateForm(formData);
    if (validationErrors.length > 0) {
        displayValidationErrors(validationErrors);
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i><span>Envoi...</span>';

    // Re-initialize Lucide for the loader icon
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    try {
        const response = await fetch('submit-form.php', {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        const result = await response.json();

        if (result.success) {
            document.getElementById('lead-form').style.display = 'none';
            document.getElementById('form-success').classList.remove('hidden');
            trackEvent('form_submission', { event_category: 'Lead', value: 1 });
            trackEvent('conversion', { 'send_to': 'AW-CONVERSION_ID/LABEL' });
        } else {
            alert('Erreur. Réessayez ou contactez-nous au 02 40 31 66 00');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i data-lucide="send" class="w-5 h-5"></i><span>Envoyer</span>';
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Erreur réseau. Réessayez ou contactez-nous directement.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="send" class="w-5 h-5"></i><span>Envoyer</span>';
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// ============================================
// INTERSECTION OBSERVER (Scroll Animations)
// ============================================

function initIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    setTimeout(() => {
        document.querySelectorAll('.fade-in-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }, 100);
}

// ============================================
// TESTIMONIALS CAROUSEL
// ============================================

function initTestimonialsCarousel() {
    if (typeof Swiper === 'undefined') {
        console.warn('Swiper not loaded');
        return;
    }

    new Swiper('.testimonialsSwiper', {
        slidesPerView: 1,
        spaceBetween: 30,
        loop: true,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        breakpoints: {
            768: {
                slidesPerView: 2,
                spaceBetween: 30,
            },
            1024: {
                slidesPerView: 3,
                spaceBetween: 30,
            }
        }
    });

    console.log('✅ Testimonials carousel initialized');
}

// ============================================
// FAQ TOGGLE
// ============================================

window.toggleFAQ = function(button) {
    const faqItem = button.closest('.faq-item');
    const answer = faqItem.querySelector('.faq-answer');
    const icon = button.querySelector('svg');

    // Close all other FAQs
    document.querySelectorAll('.faq-item').forEach(item => {
        if (item !== faqItem) {
            const otherAnswer = item.querySelector('.faq-answer');
            const otherIcon = item.querySelector('svg');
            if (otherAnswer) {
                otherAnswer.classList.add('hidden');
                otherAnswer.style.maxHeight = '0px';
            }
            if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
        }
    });

    // Toggle current FAQ
    if (answer.classList.contains('hidden')) {
        answer.classList.remove('hidden');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        if (icon) icon.style.transform = 'rotate(180deg)';
    } else {
        answer.classList.add('hidden');
        answer.style.maxHeight = '0px';
        if (icon) icon.style.transform = 'rotate(0deg)';
    }
};

// ============================================
// ANALYTICS TRACKING
// ============================================

window.trackEvent = function(eventName, eventParams = {}) {
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, eventParams);
    }
    console.log('Event tracked:', eventName, eventParams);
};

// ============================================
// MODIFICATION DES BOUTONS CTA DANS LA SECTION SOLUTIONS
// ============================================

/**
 * Initialiser les boutons CTA des cartes Solutions
 * À appeler dans initForm() ou DOMContentLoaded
 */
function initSolutionsCTA() {
    // Bouton Kiosque - Ouvre le carrousel photo
    const btnKiosque = document.querySelector('[data-solution="kiosque"]');
    if (btnKiosque) {
        btnKiosque.addEventListener('click', function(e) {
            e.preventDefault();
            openCarouselKiosqueModal();
        });
    }

    // Bouton Bungalow - Ouvre la vidéo YouTube
    const btnBungalow = document.querySelector('[data-solution="bungalow"]');
    if (btnBungalow) {
        btnBungalow.addEventListener('click', function(e) {
            e.preventDefault();
            // Remplacer YOUR_BUNGALOW_VIDEO_ID par l'ID réel de votre vidéo YouTube
            openVideoModal('bungalow', 'j3EcPetdp9Q');
        });
    }

    // Bouton Locaux - Ouvre le carrousel photo
    const btnLocaux = document.querySelector('[data-solution="locaux"]');
    if (btnLocaux) {
        btnLocaux.addEventListener('click', function(e) {
            e.preventDefault();
            openCarouselModal();
        });
    }

    console.log('✅ Boutons CTA Solutions initialisés');
}

// Appeler l'initialisation au chargement
document.addEventListener('DOMContentLoaded', function() {
    initSolutionsCTA();
});


// ============================================
// MODALES VIDÉO (Kiosque et Bungalow)
// ============================================

/**
 * Ouvrir la modale vidéo
 * @param {string} type - 'kiosque' ou 'bungalow'
 * @param {string} videoId - ID de la vidéo YouTube
 */
window.openVideoModal = function(type, videoId) {
    const modal = document.getElementById(`modal-video-${type}`);
    const iframe = document.getElementById(`video-iframe-${type}`);

    if (modal && iframe) {
        // Charger la vidéo YouTube
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;

        // Afficher la modale
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        // Empêcher le scroll de la page
        document.body.style.overflow = 'hidden';

        // Track event
        trackEvent('video_opened', { type: type, video_id: videoId });
    }
};

/**
 * Fermer la modale vidéo et arrêter la lecture
 * @param {string} type - 'kiosque' ou 'bungalow'
 */
window.closeVideoModal = function(type) {
    const modal = document.getElementById(`modal-video-${type}`);
    const iframe = document.getElementById(`video-iframe-${type}`);

    if (modal && iframe) {
        // Arrêter la vidéo en retirant la source
        iframe.src = '';

        // Masquer la modale
        modal.classList.add('hidden');
        modal.classList.remove('flex');

        // Réactiver le scroll
        document.body.style.overflow = '';

        // Track event
        trackEvent('video_closed', { type: type });
    }
};

// Fermer les modales vidéo avec la touche Échap
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeVideoModal('kiosque');
        closeVideoModal('bungalow');
        closeCarouselModal();
    }
});

// Fermer les modales en cliquant sur le fond
document.addEventListener('click', function(e) {
    if (e.target.id === 'modal-video-kiosque') {
        closeVideoModal('kiosque');
    }
    if (e.target.id === 'modal-video-bungalow') {
        closeVideoModal('bungalow');
    }
    if (e.target.id === 'modal-carousel-locaux') {
        closeCarouselModal();
    }
});


// ============================================
// MODALE CARROUSEL (Locaux)
// ============================================

// Variable globale pour le carrousel
let carouselLocauxSwiper = null;

/**
 * Ouvrir la modale carrousel pour les locaux
 */
window.openCarouselModal = function() {
    const modal = document.getElementById('modal-carousel-locaux');

    if (modal) {
        // Afficher la modale
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        // Empêcher le scroll
        document.body.style.overflow = 'hidden';

        // Initialiser le carrousel Swiper si pas encore fait
        if (!carouselLocauxSwiper) {
            // Petit délai pour s'assurer que la modale est visible
            setTimeout(() => {
                initCarouselLocaux();
            }, 100);
        }

        // Track event
        if (typeof trackEvent === 'function') {
            trackEvent('carousel_opened', { type: 'locaux' });
        }
    }
};

/**
 * Fermer la modale carrousel
 */
window.closeCarouselModal = function() {
    const modal = document.getElementById('modal-carousel-locaux');

    if (modal) {
        // Masquer la modale
        modal.classList.add('hidden');
        modal.classList.remove('flex');

        // Réactiver le scroll
        document.body.style.overflow = '';

        // Remettre le carrousel à la première slide
        if (carouselLocauxSwiper) {
            carouselLocauxSwiper.slideTo(0, 0);
        }

        // Track event
        if (typeof trackEvent === 'function') {
            trackEvent('carousel_closed', { type: 'locaux' });
        }
    }
};

/**
 * Initialiser le carrousel Swiper pour les locaux - VERSION CORRIGÉE
 */
function initCarouselLocaux() {
    // Vérifier que Swiper est disponible
    if (typeof Swiper === 'undefined') {
        console.error('❌ Swiper non disponible. Assurez-vous que Swiper est chargé.');
        return;
    }

    // Vérifier que la modale existe
    const modalExists = document.querySelector('.carousel-locaux-swiper');
    if (!modalExists) {
        console.error('❌ Carrousel non trouvé. Vérifiez la classe "carousel-locaux-swiper"');
        return;
    }

    try {
        // Initialiser Swiper avec configuration complète
        carouselLocauxSwiper = new Swiper('.carousel-locaux-swiper', {
            // Activer le mode loop pour navigation infinie
            loop: true,

            // Autoplay (optionnel)
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
            },

            // Vitesse de transition
            speed: 600,

            // Effet de transition
            effect: 'slide', // 'slide', 'fade', 'cube', 'coverflow', 'flip'

            // Navigation avec flèches
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },

            // Pagination (points)
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
                dynamicBullets: true,
            },

            // Clavier
            keyboard: {
                enabled: true,
                onlyInViewport: false,
            },

            // Mousewheel (scroll avec molette)
            mousewheel: {
                forceToAxis: true,
            },

            // Swipe sur mobile
            touchEventsTarget: 'container',
            simulateTouch: true,
            grabCursor: true,

            // Responsive breakpoints
            breakpoints: {
                320: {
                    slidesPerView: 1,
                    spaceBetween: 0
                },
                768: {
                    slidesPerView: 1,
                    spaceBetween: 0
                },
                1024: {
                    slidesPerView: 1,
                    spaceBetween: 0
                }
            },

            // Événements
            on: {
                init: function () {
                    console.log('✅ Carrousel Locaux initialisé avec succès');
                },
                slideChange: function () {
                    console.log('Slide actif:', this.activeIndex);
                }
            }
        });

        // Vérifier que l'initialisation a réussi
        if (carouselLocauxSwiper && carouselLocauxSwiper.initialized) {
            console.log('✅ Carrousel Locaux prêt à l\'emploi');
        }

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation du carrousel:', error);
    }
}

// Fermer avec la touche Échap
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeCarouselModal();
        closeCarouselKiosqueModal();
    }
});

// Fermer en cliquant sur le fond (mais pas sur le carrousel)
document.addEventListener('click', function(e) {
    if (e.target.id === 'modal-carousel-locaux') {
        closeCarouselModal();
    }
    if (e.target.id === 'modal-carousel-kiosque') {
        closeCarouselKiosqueModal();
    }
});


// ============================================
// MODALE CARROUSEL (Kiosque)
// ============================================

// Variable globale pour le carrousel kiosque
let carouselKiosqueSwiper = null;

/**
 * Ouvrir la modale carrousel pour les kiosques
 */
window.openCarouselKiosqueModal = function() {
    const modal = document.getElementById('modal-carousel-kiosque');

    if (modal) {
        // Afficher la modale
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        // Empêcher le scroll
        document.body.style.overflow = 'hidden';

        // Initialiser le carrousel Swiper si pas encore fait
        if (!carouselKiosqueSwiper) {
            // Petit délai pour s'assurer que la modale est visible
            setTimeout(() => {
                initCarouselKiosque();
            }, 100);
        }

        // Track event
        if (typeof trackEvent === 'function') {
            trackEvent('carousel_opened', { type: 'kiosque' });
        }
    }
};

/**
 * Fermer la modale carrousel kiosque
 */
window.closeCarouselKiosqueModal = function() {
    const modal = document.getElementById('modal-carousel-kiosque');

    if (modal) {
        // Masquer la modale
        modal.classList.add('hidden');
        modal.classList.remove('flex');

        // Réactiver le scroll
        document.body.style.overflow = '';

        // Remettre le carrousel à la première slide
        if (carouselKiosqueSwiper) {
            carouselKiosqueSwiper.slideTo(0, 0);
        }

        // Track event
        if (typeof trackEvent === 'function') {
            trackEvent('carousel_closed', { type: 'kiosque' });
        }
    }
};

/**
 * Initialiser le carrousel Swiper pour les kiosques
 */
function initCarouselKiosque() {
    // Vérifier que Swiper est disponible
    if (typeof Swiper === 'undefined') {
        console.error('❌ Swiper non disponible. Assurez-vous que Swiper est chargé.');
        return;
    }

    // Vérifier que la modale existe
    const modalExists = document.querySelector('.carousel-kiosque-swiper');
    if (!modalExists) {
        console.error('❌ Carrousel Kiosque non trouvé. Vérifiez la classe "carousel-kiosque-swiper"');
        return;
    }

    try {
        // Initialiser Swiper avec configuration complète
        carouselKiosqueSwiper = new Swiper('.carousel-kiosque-swiper', {
            // Activer le mode loop pour navigation infinie
            loop: true,

            // Autoplay (optionnel)
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
            },

            // Vitesse de transition
            speed: 600,

            // Effet de transition
            effect: 'slide', // 'slide', 'fade', 'cube', 'coverflow', 'flip'

            // Navigation avec flèches
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },

            // Pagination (points)
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
                dynamicBullets: true,
            },

            // Clavier
            keyboard: {
                enabled: true,
                onlyInViewport: false,
            },

            // Mousewheel (scroll avec molette)
            mousewheel: {
                forceToAxis: true,
            },

            // Swipe sur mobile
            touchEventsTarget: 'container',
            simulateTouch: true,
            grabCursor: true,

            // Responsive breakpoints
            breakpoints: {
                320: {
                    slidesPerView: 1,
                    spaceBetween: 0
                },
                768: {
                    slidesPerView: 1,
                    spaceBetween: 0
                },
                1024: {
                    slidesPerView: 1,
                    spaceBetween: 0
                }
            },

            // Événements
            on: {
                init: function () {
                    console.log('✅ Carrousel Kiosque initialisé avec succès');
                },
                slideChange: function () {
                    console.log('Slide actif Kiosque:', this.activeIndex);
                }
            }
        });

        // Vérifier que l'initialisation a réussi
        if (carouselKiosqueSwiper && carouselKiosqueSwiper.initialized) {
            console.log('✅ Carrousel Kiosque prêt à l\'emploi');
        }

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation du carrousel Kiosque:', error);
    }
}


// ============================================
// ACCORDÉONS (3 Avantages)
// ============================================

/**
 * Fonction pour gérer l'ouverture/fermeture des accordéons
 * @param {HTMLElement} button - Le bouton de l'accordéon cliqué
 */
window.toggleAccordion = function(button) {
    const accordionItem = button.closest('.accordion-item');
    const content = accordionItem.querySelector('.accordion-content');
    const icon = accordionItem.querySelector('.accordion-icon');
    const isOpen = content.style.maxHeight && content.style.maxHeight !== '0px';

    // Fermer tous les autres accordéons (optionnel - pour un seul ouvert à la fois)
    const allAccordions = document.querySelectorAll('.accordion-item');
    allAccordions.forEach(item => {
        if (item !== accordionItem) {
            const otherContent = item.querySelector('.accordion-content');
            const otherIcon = item.querySelector('.accordion-icon');
            otherContent.style.maxHeight = '0px';
            otherIcon.style.transform = 'rotate(0deg)';
        }
    });

    // Toggle l'accordéon actuel
    if (isOpen) {
        // Fermer
        content.style.maxHeight = '0px';
        icon.style.transform = 'rotate(0deg)';
    } else {
        // Ouvrir
        content.style.maxHeight = content.scrollHeight + 'px';
        icon.style.transform = 'rotate(180deg)';
    }

    // Réinitialiser les icônes Lucide si nécessaire
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
};

// Ouvrir le premier accordéon par défaut au chargement
document.addEventListener('DOMContentLoaded', function() {
    const firstAccordion = document.querySelector('.accordion-item');
    if (firstAccordion) {
        const firstButton = firstAccordion.querySelector('.accordion-header');
        // Petit délai pour s'assurer que tout est chargé
        setTimeout(() => {
            if (firstButton) {
                toggleAccordion(firstButton);
            }
        }, 100);
    }
});


// ============================================
// HERO VIDEO BACKGROUND
// ============================================

/**
 * Gestion de la vidéo en arrière-plan du hero
 * - Assure que la vidéo se charge correctement
 * - Pause la vidéo quand elle n'est pas visible (performance)
 * - Gestion des erreurs de chargement
 */
document.addEventListener('DOMContentLoaded', function() {
    const heroVideo = document.querySelector('#hero video');

    if (!heroVideo) {
        console.log('ℹ️ Aucune vidéo hero détectée');
        return;
    }

    // Forcer la lecture de la vidéo (certains navigateurs peuvent bloquer l'autoplay)
    heroVideo.play().catch(error => {
        console.log('⚠️ Autoplay bloqué par le navigateur:', error);
        // La vidéo ne se lancera pas, mais l'image poster sera visible
    });

    // Optimisation : Pause la vidéo quand la page n'est pas visible
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            heroVideo.pause();
        } else {
            heroVideo.play().catch(() => {});
        }
    });

    // Intersection Observer pour pauser la vidéo quand elle n'est plus visible
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    heroVideo.play().catch(() => {});
                } else {
                    heroVideo.pause();
                }
            });
        }, {
            threshold: 0.1
        });

        observer.observe(heroVideo);
    }

    // Gestion des erreurs de chargement
    heroVideo.addEventListener('error', function(e) {
        console.error('❌ Erreur de chargement de la vidéo hero:', e);
        // L'image poster restera visible en cas d'erreur
    });

    // Log quand la vidéo est prête
    heroVideo.addEventListener('loadeddata', function() {
        console.log('✅ Vidéo hero chargée avec succès');
    });
});


