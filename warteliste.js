/* warteliste.js — Warteliste zenday KI Teamassistenz auf allen Website-Seiten (Version 1.0)
   Verdrahtet jedes <form data-warteliste> und die Ankündigungsleiste (.zd-ankuendigung).
   Leads gehen an denselben Zapier-Workflow wie /ki-teamassistenz/:
   zenday-ki-warteliste-leads → Sheet „FB Leads“ (Reiter KI Warteliste) + Slack.
   Einbinden: <script src="/warteliste.js?v=1.0" defer></script> */
(function () {
  var FORM_ENDPOINT = 'https://hooks.zapier.com/hooks/catch/5504389/wtUb5ebMG1q4iShm/';
  var DANKE_URL = '/ki-teamassistenz/danke/';
  var params = new URLSearchParams(location.search);

  document.querySelectorAll('form[data-warteliste]').forEach(function (form) {
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function (k) {
      var el = form.querySelector('[name="' + k + '"]');
      if (el) el.value = params.get(k) || '';
    });
    form.addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid') === 'true' && e.target.checkValidity()) e.target.setAttribute('aria-invalid', 'false');
    });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var btn = form.querySelector('button[type=submit]');
      var err = form.querySelector('[data-fehler]');
      if (err) err.hidden = true;
      form.querySelectorAll('[required]').forEach(function (f) { f.setAttribute('aria-invalid', f.checkValidity() ? 'false' : 'true'); });
      if (!form.reportValidity()) return;
      if (form.website && form.website.value) { location.href = DANKE_URL; return; } // Honeypot
      btn.disabled = true;
      var data = new URLSearchParams(new FormData(form));
      data.delete('website');
      data.set('consent', form.consent && form.consent.checked ? 'ja' : 'nein');
      data.set('bestandskunde', form.bestandskunde && form.bestandskunde.checked ? 'ja' : 'nein');
      data.set('seite', location.pathname);
      data.set('zeitstempel', new Date().toISOString());
      fetch(FORM_ENDPOINT, { method: 'POST', body: data })
        .then(function (r) {
          if (!r.ok) throw new Error('status ' + r.status);
          location.href = DANKE_URL + (form.consent && form.consent.checked ? '?doi=1' : '');
        })
        .catch(function () {
          if (err) err.hidden = false;
          btn.disabled = false;
        });
    });
  });

  // Ankündigungsleiste: lässt sich für die laufende Sitzung schließen
  var leiste = document.querySelector('.zd-ankuendigung');
  if (leiste) {
    try { if (sessionStorage.getItem('zd-ki-leiste') === 'zu') leiste.hidden = true; } catch (e) {}
    var zu = leiste.querySelector('[data-schliessen]');
    if (zu) zu.addEventListener('click', function () {
      leiste.hidden = true;
      try { sessionStorage.setItem('zd-ki-leiste', 'zu'); } catch (e) {}
    });
  }
})();
