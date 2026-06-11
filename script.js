/* =======================================================
   script.js — Lic. Elva Beatriz Schweizer
   ======================================================= */

function initScript() {

    // ── Scroll animations (Intersection Observer) ──────
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.12 };
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-up, .fade-in').forEach(el => observer.observe(el));

    // ── Navbar scroll effect ───────────────────────────
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 60) {
            navbar.style.background = 'rgba(250, 246, 240, 0.97)';
            navbar.style.boxShadow = '0 4px 24px rgba(46,74,66,0.07)';
        } else {
            navbar.style.background = 'rgba(250, 246, 240, 0.9)';
            navbar.style.boxShadow = 'none';
        }
    });

    // ── Mobile menu ────────────────────────────────────
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks      = document.getElementById('navLinks');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = mobileMenuBtn.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.replace('fa-bars', 'fa-times');
            } else {
                icon.classList.replace('fa-times', 'fa-bars');
            }
        });
    }

    // ── Smooth scroll for anchor links ─────────────────
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                if (navLinks && navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    const icon = mobileMenuBtn.querySelector('i');
                    icon.classList.replace('fa-times', 'fa-bars');
                }
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScript);
} else {
    initScript();
}

/* =======================================================
   Supabase & Booking Modal
   ======================================================= */

const SUPABASE_URL      = 'https://nkkyyqqqusodhwqvprik.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ra3l5cXFxdXNvZGh3cXZwcmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMjU1MDIsImV4cCI6MjA4ODYwMTUwMn0.Gs5bdRrv9HNViruVjr8mQl4Oh2Ei1Hyryr0vxpdPPhU';
const supabaseClient    = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const EMPRESA_ID        = 'psicologa_elva';

const bookingModal = document.getElementById('bookingModal');
const bookingForm  = document.getElementById('bookingForm');

let currentStep  = 1;
const totalSteps = 4;

// ── Stepper display ────────────────────────────────────
function showStep(step) {
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));

    document.querySelectorAll('.stepper-progress .step').forEach(el => {
        const stepNum = parseInt(el.getAttribute('data-step'));
        el.className = 'step';
        if      (stepNum === step) el.classList.add('active');
        else if (stepNum <  step) el.classList.add('completed');
    });

    document.querySelectorAll('.stepper-progress .step-line').forEach((el, idx) => {
        idx < step - 1 ? el.classList.add('active') : el.classList.remove('active');
    });

    const stepEl = document.getElementById(`step-${step}`);
    if (stepEl) stepEl.classList.add('active');
}

window.nextStep = function (step) {
    const stepEl = document.getElementById(`step-${step}`);
    if (!stepEl) return;
    const inputs = stepEl.querySelectorAll('input, select, textarea');
    for (let input of inputs) {
        if (!input.checkValidity()) { input.reportValidity(); return; }
    }
    if (step < totalSteps) {
        currentStep = step + 1;
        showStep(currentStep);
    }
};

window.prevStep = function (step) {
    if (step > 1) { currentStep = step - 1; showStep(currentStep); }
};

window.openBookingModal = function (servicioPreset = '') {
    bookingModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    currentStep = 1;
    showStep(1);

    const servicioSelect = document.getElementById('servicio');
    if (servicioSelect && servicioPreset) {
        Array.from(servicioSelect.options).forEach(opt => {
            if (opt.value.includes(servicioPreset)) servicioSelect.value = opt.value;
        });
    }

    const horaReservaSelect = document.getElementById('hora_reserva');
    if (horaReservaSelect) {
        horaReservaSelect.innerHTML = '<option value="">Primero seleccioná un día</option>';
        horaReservaSelect.disabled = true;
    }
};

window.closeBookingModal = function () {
    bookingModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    if (bookingForm) bookingForm.reset();
    currentStep = 1;
    showStep(1);
};

// Close modal on overlay click
if (bookingModal) {
    bookingModal.addEventListener('click', e => {
        if (e.target === bookingModal) closeBookingModal();
    });
}

// Días con atención presencial
const PRESENCIAL_DAYS = [1, 4]; // Lunes y Jueves

// ── Date/time availability ─────────────────────────────
const fechaReservaInput = document.getElementById('fecha_reserva');
const horaReservaSelect = document.getElementById('hora_reserva');

if (fechaReservaInput && horaReservaSelect) {
    // Set min date to today
    const tzOffset  = (new Date()).getTimezoneOffset() * 60000;
    const todayStr  = new Date(Date.now() - tzOffset).toISOString().split('T')[0];
    fechaReservaInput.setAttribute('min', todayStr);

    fechaReservaInput.addEventListener('change', async function () {
        const dateStr = this.value;
        if (!dateStr) {
            horaReservaSelect.innerHTML = '<option value="">Primero seleccioná un día</option>';
            horaReservaSelect.disabled = true;
            return;
        }

        const selectedDate = new Date(dateStr + 'T00:00:00');
        const dayOfWeek    = selectedDate.getDay(); // 0=dom, 6=sáb

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            Swal.fire('Día no disponible', 'Elva no atiende sábados ni domingos. Por favor elegí otro día.', 'warning');
            this.value = '';
            horaReservaSelect.innerHTML = '<option value="">Primero seleccioná un día</option>';
            horaReservaSelect.disabled = true;
            return;
        }

        // ── Validación modalidad presencial ──────────────
        const modalidadSelect = document.getElementById('modalidad');
        const modalidadVal    = modalidadSelect ? modalidadSelect.value : '';

        if (modalidadVal === 'Presencial' && !PRESENCIAL_DAYS.includes(dayOfWeek)) {
            Swal.fire({
                title: 'Modalidad no disponible',
                html: 'La atención <strong>presencial</strong> solo está disponible los <strong>lunes y jueves</strong>.<br>Por favor elegí otro día o cambiá la modalidad a Online.',
                icon: 'warning',
                confirmButtonColor: '#8B7BA8'
            });
            this.value = '';
            horaReservaSelect.innerHTML = '<option value="">Primero seleccioná un día</option>';
            horaReservaSelect.disabled = true;
            return;
        } else if (modalidadVal === 'Online' && PRESENCIAL_DAYS.includes(dayOfWeek)) {
            Swal.fire({
                title: 'Modalidad no disponible',
                html: 'Los días <strong>lunes y jueves</strong> son <strong>exclusivos para atención presencial</strong>.<br>Por favor elegí otro día o cambiá la modalidad a Presencial.',
                icon: 'warning',
                confirmButtonColor: '#8B7BA8'
            });
            this.value = '';
            horaReservaSelect.innerHTML = '<option value="">Primero seleccioná un día</option>';
            horaReservaSelect.disabled = true;
            return;
        }

        horaReservaSelect.innerHTML = '<option value="">Cargando horarios...</option>';
        horaReservaSelect.disabled = true;

        try {
            // 1. Obtener los horarios configurados para este día de la semana
            const { data: horariosData, error: horariosError } = await supabaseClient
                .from('aahorarios_dia')
                .select('hora')
                .eq('empresa_id', EMPRESA_ID)
                .eq('dia_semana', dayOfWeek)
                .order('hora', { ascending: true });

            if (horariosError) throw horariosError;

            let slots = horariosData.map(h => h.hora.substring(0, 5));

            if (slots.length === 0) {
                horaReservaSelect.innerHTML = '<option value="">No hay turnos disponibles este día</option>';
                horaReservaSelect.disabled = true;
                return;
            }

            // 2. Bloqueos del día (panel admin)
            const { data: bloqueos, error: bloqueoError } = await supabaseClient
                .from('aabloques')
                .select('hora, tipo')
                .eq('empresa_id', EMPRESA_ID)
                .eq('fecha', dateStr);

            if (bloqueoError) throw bloqueoError;

            const isDayBlocked = bloqueos && bloqueos.some(b => !b.hora || b.tipo === 'dia_completo');
            if (isDayBlocked) {
                Swal.fire('Día no disponible', 'Elva no tiene disponibilidad ese día. Por favor elegí otra fecha.', 'info');
                this.value = '';
                horaReservaSelect.innerHTML = '<option value="">Día sin disponibilidad</option>';
                horaReservaSelect.disabled = true;
                return;
            }

            const blockedHours = bloqueos
                ? bloqueos.map(b => b.hora ? b.hora.substring(0, 5) : null).filter(Boolean)
                : [];

            // 3. Turnos ya reservados ese día
            const { data, error } = await supabaseClient
                .from('aareservas')
                .select('hora_reserva')
                .eq('empresa_id', EMPRESA_ID)
                .eq('fecha_reserva', dateStr)
                .neq('estado', 'Cancelado');

            if (error) throw error;

            const occupiedTimes  = data.map(r => r.hora_reserva.substring(0, 5));
            const availableSlots = slots.filter(s => !occupiedTimes.includes(s) && !blockedHours.includes(s));

            if (availableSlots.length === 0) {
                horaReservaSelect.innerHTML = '<option value="">Sin turnos disponibles este día</option>';
                horaReservaSelect.disabled = true;
            } else {
                horaReservaSelect.innerHTML =
                    '<option value="">Seleccioná una hora...</option>' +
                    availableSlots.map(s => `<option value="${s}">${s} hs</option>`).join('');
                horaReservaSelect.disabled = false;
            }

        } catch (err) {
            console.error(err);
            horaReservaSelect.innerHTML = '<option value="">Error al buscar horarios</option>';
            Swal.fire('Error', 'Hubo un problema al cargar los horarios. Intentá más tarde.', 'error');
        }
    });
}

// ── Form submit ────────────────────────────────────────
if (bookingForm) {
    // Enter key navega al siguiente paso sin enviar
    bookingForm.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            const activeStep = document.querySelector('.step-content.active');
            if (activeStep) {
                const nextBtn   = activeStep.querySelector('.btn-next');
                const submitBtn = activeStep.querySelector('.btn-submit');
                if (nextBtn)   nextBtn.click();
                else if (submitBtn) submitBtn.click();
            }
        }
    });

    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!bookingForm.checkValidity()) { bookingForm.reportValidity(); return; }

        const submitBtn  = bookingForm.querySelector('.btn-submit');
        const origText   = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        submitBtn.disabled  = true;

        const fd = new FormData(bookingForm);
        const reservaData = {
            empresa_id:      EMPRESA_ID,
            nombre_cliente:  fd.get('nombre_cliente'),
            telefono_cliente: fd.get('telefono_cliente'),
            email_cliente:   fd.get('email_cliente') || null,
            servicio:        fd.get('servicio'),
            modalidad:       fd.get('modalidad'),
            fecha_reserva:   fd.get('fecha_reserva'),
            hora_reserva:    fd.get('hora_reserva'),
            mensaje:         fd.get('mensaje') || null,
            estado:          'Pendiente'
        };

        try {
            const { error } = await supabaseClient.from('aareservas').insert([reservaData]);
            if (error) throw error;

            await Swal.fire({
                title: '¡Consulta solicitada!',
                text: 'Tu solicitud fue enviada correctamente. Elva se pondrá en contacto a la brevedad para confirmar.',
                icon: 'success',
                confirmButtonColor: '#8B7BA8'
            });
            closeBookingModal();

        } catch (err) {
            console.error('Error al guardar reserva:', err);
            Swal.fire({
                title: 'Error',
                text: 'Hubo un problema al procesar tu solicitud. Por favor intentá nuevamente.',
                icon: 'error',
                confirmButtonColor: '#7A9E8E'
            });
        } finally {
            submitBtn.innerHTML = origText;
            submitBtn.disabled  = false;
        }
    });
}
