// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile menu
const menu = document.getElementById('menu');
document.getElementById('burger').addEventListener('click', () => menu.classList.toggle('open'));
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));

// Reveal on scroll
const items = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('show'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  items.forEach(el => io.observe(el));
} else {
  items.forEach(el => el.classList.add('show'));
}

// Contact form: opens the visitor's email app with the message prefilled.
// To receive messages directly instead, replace this with a Formspree/Netlify Forms endpoint.
const OWNER_EMAIL = 'anantgoyal1001@gmail.com';
const form = document.getElementById('contact-form');
const note = document.getElementById('form-note');
form.addEventListener('submit', e => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(form));
  if (!d.name.trim() || !/^\S+@\S+\.\S+$/.test(d.email) || !d.message.trim()) {
    note.textContent = 'Please fill in your name, a valid email and a message.';
    return;
  }
  const subject = encodeURIComponent('Portfolio message from ' + d.name.trim());
  const body = encodeURIComponent(d.message.trim() + '\n\n- ' + d.name.trim() + ' (' + d.email.trim() + ')');
  window.location.href = 'mailto:' + OWNER_EMAIL + '?subject=' + subject + '&body=' + body;
  note.textContent = 'Opening your email app... if nothing opens, write to ' + OWNER_EMAIL;
});
