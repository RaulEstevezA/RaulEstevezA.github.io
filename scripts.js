document.addEventListener("DOMContentLoaded", function () {
    // Abrir enlaces en una nueva ventana
    var links = document.querySelectorAll('a');
    links.forEach(function(link) {
        link.setAttribute('target', '_blank');
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
});


