document.addEventListener("DOMContentLoaded", function () {
    // Abrir enlaces en una nueva ventana
    var links = document.querySelectorAll('a');
    links.forEach(function(link) {
        const href = link.getAttribute('href');
        if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
            link.setAttribute('target', '_blank');
        }
    });

    // Funcionalidad para la primera tabla
    var toggleButton = document.getElementById('toggleButton');
    var coursesTable = document.getElementById('coursesTable');

    toggleButton.addEventListener('click', function () {
        if (coursesTable.classList.contains('hidden')) {
            coursesTable.classList.remove('hidden');
            toggleButton.textContent = 'Hide';
        } else {
            coursesTable.classList.add('hidden');
            toggleButton.textContent = 'Show';
        }
    });

    // Funcionalidad para la segunda tabla
    var toggleButton2 = document.getElementById('toggleButton2');
    var professionalCertificateTable = document.getElementById('professionalCertificateTable');

    toggleButton2.addEventListener('click', function () {
        if (professionalCertificateTable.classList.contains('hidden')) {
            professionalCertificateTable.classList.remove('hidden');
            toggleButton2.textContent = 'Hide';
        } else {
            professionalCertificateTable.classList.add('hidden');
            toggleButton2.textContent = 'Show';
        }
    });

    // Funcionalidad para la pantalla inicial
    const introScreen = document.getElementById('intro-screen');
    const header = document.querySelector('.navbar'); // Seleccionamos la barra superior
    let introHidden = false; // Variable para registrar si la pantalla inicial ya fue oculta

    // Asegurarnos de que la barra esté oculta al principio
    header.style.opacity = 0;
    header.style.pointerEvents = "none"; // Desactiva interacción al principio

    // Detectar el scroll para ocultar la pantalla inicial y mostrar la barra superior
    window.addEventListener('scroll', function () {
        if (window.scrollY > 50 && !introHidden) {
            introScreen.classList.add('hidden'); // Ocultar pantalla inicial
            header.style.opacity = 1; // Mostrar la barra superior
            header.style.pointerEvents = "auto"; // Activar interacción con la barra
            introHidden = true; // Marcar que la pantalla inicial ya fue ocultada
        } else if (window.scrollY <= 50 && !introHidden) {
            introScreen.classList.remove('hidden'); // Mostrar la pantalla inicial si no ha sido ocultada definitivamente
            header.style.opacity = 0; // Ocultar la barra superior
            header.style.pointerEvents = "none"; // Desactivar interacción
        }
    });



    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); // Evita el comportamiento predeterminado
            const targetId = this.getAttribute('href').substring(1); // Obtén el ID de destino
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                const offset = 120; // Altura de la barra superior
                const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
                const offsetPosition = elementPosition - offset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth' // Desplazamiento suave
                });
            }
        });
    });


});
