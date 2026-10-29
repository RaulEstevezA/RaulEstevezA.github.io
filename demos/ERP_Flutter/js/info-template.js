export function renderInfoTemplate(root = document) {
  const template = root.getElementById('info');
  if (!template) return;

  root.querySelectorAll('[data-info]').forEach((slot) => {
    slot.appendChild(template.content.cloneNode(true));
  });
}

