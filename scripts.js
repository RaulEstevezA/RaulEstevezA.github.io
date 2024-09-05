// Example: Function to show an alert when a project is clicked
function showAlert(projectName) {
    alert(`You clicked on ${projectName}`);
}

// Abrir venlaces en nueva ventana
document.addEventListener("DOMContentLoaded", function () {
    var links = document.querySelectorAll('a');
    links.forEach(function(link) {
        link.setAttribute('target', '_blank');
    });
});

document.addEventListener("DOMContentLoaded", function () {
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

    // Añadir funcionalidad para la segunda tabla
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

