const WHATSAPP_NUMBER = '593992759073';
const REQUEST_TYPES = ['parts', 'consumables', 'gse', 'maintenance'];

const copy = {
  es: {
    greeting: 'Hola, Muso Business. Me gustaría solicitar una cotización.',
    fields: {
      name: 'Nombre', company: 'Empresa', request: 'Solicitud',
      part: 'Número de parte o descripción', quantity: 'Cantidad',
      equipment: 'Aeronave o equipo', destination: 'Destino',
      urgency: 'Prioridad', notes: 'Información adicional',
    },
    requests: { parts: 'Repuestos aeronáuticos', consumables: 'Consumibles', gse: 'Equipos y repuestos GSE', maintenance: 'Mantenimiento' },
    service: 'Descripción del servicio',
    normal: 'Normal',
    aog: 'AOG — aeronave en tierra',
    whitespace: 'Complete este campo con información válida.',
    prepared: 'Solicitud preparada. Revise el mensaje y pulse «Abrir WhatsApp» para continuar. Aún no se ha enviado.',
    copied: 'Mensaje copiado.',
    copyFailed: 'Seleccione y copie el mensaje manualmente.',
  },
  en: {
    greeting: 'Hello, Muso Business. I would like to request a quote.',
    fields: {
      name: 'Name', company: 'Company', request: 'Request',
      part: 'Part number or description', quantity: 'Quantity',
      equipment: 'Aircraft or equipment', destination: 'Destination',
      urgency: 'Priority', notes: 'Additional information',
    },
    requests: { parts: 'Aircraft parts', consumables: 'Consumables', gse: 'GSE equipment and parts', maintenance: 'Maintenance' },
    service: 'Service description',
    normal: 'Normal',
    aog: 'AOG — aircraft on ground',
    whitespace: 'Please enter valid information in this field.',
    prepared: 'Request prepared. Review the message and select “Open WhatsApp” to continue. It has not been sent yet.',
    copied: 'Message copied.',
    copyFailed: 'Select and copy the message manually.',
  },
};

export function formatQuote(data, language = 'es') {
  const text = copy[language] || copy.es;
  const values = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value ?? '').trim()]));
  const lines = [text.greeting, ''];

  for (const [key, label] of Object.entries(text.fields)) {
    if (!values[key] || (key === 'quantity' && values.request === 'maintenance')) continue;
    let value = values[key];
    if (key === 'request') value = text.requests[value] || value;
    if (key === 'urgency') value = value === 'aog' ? text.aog : text.normal;
    const fieldLabel = key === 'part' && values.request === 'maintenance' ? text.service : label;
    lines.push(`${fieldLabel}: ${value}`);
  }

  return lines.join('\n');
}

export function createWhatsAppURL(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function setupMenu() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const nav = document.getElementById('site-nav');
  if (!toggle || !nav) return;

  function closeMenu(returnFocus = false) {
    toggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
    if (returnFocus) toggle.focus();
  }

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(isOpen));
    nav.classList.toggle('is-open', isOpen);
  });
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('click', (event) => {
    if (!nav.contains(event.target) && !toggle.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });
}

function setupQuote() {
  const form = document.getElementById('quote-form');
  if (!form) return;
  const language = document.documentElement.lang.startsWith('en') ? 'en' : 'es';
  const text = copy[language];
  const request = form.elements.namedItem('request');
  const part = form.elements.namedItem('part');
  const quantity = form.elements.namedItem('quantity');
  const quantityField = form.querySelector('[data-quantity-field]');
  const partLabel = form.querySelector('[data-part-label]');
  const result = document.getElementById('quote-result');
  const message = document.getElementById('quote-message');
  const open = document.getElementById('quote-open');
  const copyButton = document.getElementById('quote-copy');
  const status = document.getElementById('quote-status');

  function updateRequest() {
    const maintenance = request.value === 'maintenance';
    quantity.disabled = maintenance;
    quantity.required = !maintenance;
    quantity.min = '1';
    quantityField.hidden = maintenance;
    part.required = true;
    partLabel.textContent = `${maintenance ? text.service : text.fields.part} *`;
    part.placeholder = maintenance ? text.service : text.fields.part;
  }

  const params = new URLSearchParams(window.location.search);
  if (REQUEST_TYPES.includes(params.get('request'))) request.value = params.get('request');
  if (['normal', 'aog'].includes(params.get('urgency'))) form.elements.namedItem('urgency').value = params.get('urgency');
  updateRequest();
  request.addEventListener('change', updateRequest);

  form.addEventListener('input', (event) => {
    if (typeof event.target.setCustomValidity === 'function') event.target.setCustomValidity('');
    result.hidden = true;
    status.textContent = '';
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    for (const field of form.querySelectorAll('input, textarea')) {
      if (field.disabled) continue;
      field.value = field.value.trim();
      field.setCustomValidity(field.required && !field.value ? text.whitespace : '');
    }
    if (!form.reportValidity()) return;

    const data = Object.fromEntries(new FormData(form));
    const quote = formatQuote(data, language);
    message.value = quote;
    open.href = createWhatsAppURL(quote);
    result.hidden = false;
    status.textContent = text.prepared;
    message.focus();
  });
  form.querySelector('[data-quote-submit]').disabled = false;

  copyButton.addEventListener('click', async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message.value);
      } else {
        message.focus();
        message.select();
        if (!document.execCommand('copy')) throw new Error('Copy unavailable');
      }
      status.textContent = text.copied;
    } catch {
      message.focus();
      message.select();
      status.textContent = text.copyFailed;
    }
  });
}

if (typeof document !== 'undefined') {
  setupMenu();
  setupQuote();
}
