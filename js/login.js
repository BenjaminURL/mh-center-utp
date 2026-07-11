document.addEventListener('DOMContentLoaded', () => {
    // Referencias de las vistas de la tarjeta
    const viewWelcome = document.getElementById('view-welcome');
    const viewLogin = document.getElementById('view-login');
    const viewRegister = document.getElementById('view-register');
    const viewSuccess = document.getElementById('view-success');
    
    // Botones de acción
    const btnLoginTrigger = document.getElementById('btn-login-trigger');
    const btnRegisterTrigger = document.getElementById('btn-register-trigger');
    const btnBackLogin = document.getElementById('btn-back-login');
    const btnBackRegister = document.getElementById('btn-back-register');
    
    // Formularios
    const formLogin = document.getElementById('form-login');
    const formRegistro = document.getElementById('form-registro');
    const topLogo = document.getElementById('main-top-logo');

    // --- FLUJO DE INICIAR SESIÓN ---
    
    // 1. Mostrar formulario de Login
    btnLoginTrigger.addEventListener('click', () => {
        viewWelcome.classList.remove('active');
        viewLogin.classList.add('active');
        
        // Ocultar logo exterior en móviles/tabletas si es necesario
        if (topLogo && window.innerWidth > 992) {
            topLogo.style.opacity = '0';
        }
    });

    // 2. Botón Salir desde Login (Regresa a Bienvenida)
    btnBackLogin.addEventListener('click', () => {
        viewLogin.classList.remove('active');
        viewWelcome.classList.add('active');
        
        if (topLogo && window.innerWidth > 992) {
            topLogo.style.opacity = '1';
        }
    });

    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        window.location.href = 'psicologo.html';
    });


    // --- FLUJO DE REGISTRO ---

    // 4. Mostrar formulario de Registro
    btnRegisterTrigger.addEventListener('click', () => {
        viewWelcome.classList.remove('active');
        viewRegister.classList.add('active');
        
        if (topLogo && window.innerWidth > 992) {
            topLogo.style.opacity = '0';
        }
    });

    // 5. Botón Salir desde Registro (Regresa a Bienvenida)
    btnBackRegister.addEventListener('click', () => {
        viewRegister.classList.remove('active');
        viewWelcome.classList.add('active');
        
        if (topLogo && window.innerWidth > 992) {
            topLogo.style.opacity = '1';
        }
    });

    // 6. Enviar Formulario de Registro (Muestra éxito y luego redirige)
    formRegistro.addEventListener('submit', (e) => {
        e.preventDefault();

        viewRegister.classList.remove('active');
        viewSuccess.classList.add('active');

        // Retraso de 2.5 segundos para animación del check verde
        setTimeout(() => {
            window.location.href = 'dashboard.html'; 
        }, 2500);
    });
});