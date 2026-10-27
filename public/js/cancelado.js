if (new URLSearchParams(location.search).get('lang') === 'en') {
  document.documentElement.lang = 'en';
  document.title = 'Payment canceled — Sun Shine';
  document.getElementById('titulo').textContent = 'You were not charged';
  document.getElementById('texto').textContent = 'You canceled the payment before finishing. Your cart is still saved, so you can go back and try again anytime.';
  const v = document.getElementById('volver');
  v.textContent = 'Back to store';
  v.href = '/?lang=en';
}
