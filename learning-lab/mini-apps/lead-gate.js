/* zenday Lead-Gate für Mini-Apps
   Zeigt ein Formular (Pop-up), bevor ein Ergebnis heruntergeladen, gedruckt oder kopiert wird.
   Sendet an den Zapier-Workflow „zenday-landingpage-leads“ (Sheet „FB Leads“, Reiter 2024 + Slack #leads).
   Nach dem Absenden bleibt die App in diesem Browser freigeschaltet (localStorage).

   Nutzung:
     zdLeadGate({ slug: 'fristen-generator', aktion: 'csv', titel: '…', text: '…', button: '…' })
       .then(function () { … Aktion ausführen … });
     zdLeadGate.frei('fristen-generator')  → true, wenn schon freigeschaltet
*/
(function () {
  'use strict';

  var ENDPOINT = 'https://hooks.zapier.com/hooks/catch/5504389/C5lwaBt49fBLCqbw/';
  var KEY = 'zd-lead-frei:';

  function frei(slug) {
    try { return localStorage.getItem(KEY + slug) === '1'; } catch (e) { return false; }
  }
  function merken(slug) {
    try { localStorage.setItem(KEY + slug, '1'); } catch (e) {}
    document.documentElement.classList.add('zd-lead-frei');
  }

  var CSS = '' +
    '.zdlg{margin:auto;border:0;padding:0;border-radius:var(--zd-radius-l);box-shadow:var(--zd-schatten-l);width:min(560px,calc(100vw - 2rem));max-height:calc(100dvh - 2rem);overflow:auto;background:var(--zd-weiss);color:var(--zd-text)}' +
    '.zdlg::backdrop{background:rgba(43,47,56,.55)}' +
    '.zdlg__innen{padding:var(--zd-s-6)}' +
    '.zdlg__kopf{display:flex;justify-content:space-between;align-items:flex-start;gap:var(--zd-s-4);margin-bottom:var(--zd-s-3)}' +
    '.zdlg__kopf h2{font-size:var(--zd-fs-h3);line-height:var(--zd-lh-titel);margin:0}' +
    '.zdlg__zu{background:none;border:0;font-size:1.6rem;line-height:1;cursor:pointer;color:var(--zd-text-leise);padding:0 .25rem;min-width:44px;min-height:44px}' +
    '.zdlg__text{margin:0 0 var(--zd-s-5);color:var(--zd-text-leise)}' +
    '.zdlg .zd-formular{display:grid;gap:var(--zd-s-4)}' +
    '.zdlg__klein{font-size:var(--zd-fs-xs);color:var(--zd-text-leise);margin:0}' +
    '@media (max-width:600px){.zdlg__innen{padding:var(--zd-s-5)}.zdlg .zd-grid--2{grid-template-columns:1fr}}';

  var dlg = null;

  function bauen() {
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    dlg = document.createElement('dialog');
    dlg.className = 'zdlg';
    dlg.setAttribute('aria-labelledby', 'zdlg-titel');
    dlg.innerHTML =
      '<div class="zdlg__innen">' +
        '<div class="zdlg__kopf"><h2 id="zdlg-titel"></h2><button type="button" class="zdlg__zu" aria-label="Schließen">×</button></div>' +
        '<p class="zdlg__text" id="zdlg-text"></p>' +
        '<form class="zd-formular" novalidate>' +
          '<div class="zd-grid zd-grid--2">' +
            '<div class="zd-feld"><label for="zdlg-vorname">Vorname<span class="zd-pflicht">*</span></label><input class="zd-input" id="zdlg-vorname" name="vorname" autocomplete="given-name" autofocus required></div>' +
            '<div class="zd-feld"><label for="zdlg-rolle">Ihre Rolle<span class="zd-pflicht">*</span></label>' +
              '<select class="zd-select" id="zdlg-rolle" name="rolle" required>' +
                '<option value="">Bitte wählen</option>' +
                '<option value="Praxisinhaber/in">Praxisinhaber:in</option>' +
                '<option value="Praxismanager/in">Praxismanager:in</option>' +
                '<option value="QM-Beauftragte/r">QM-Beauftragte:r</option>' +
                '<option value="Empfang/Assistenz">Empfang/Assistenz</option>' +
                '<option value="Andere">Andere</option>' +
              '</select></div>' +
          '</div>' +
          '<div class="zd-grid zd-grid--2">' +
            '<div class="zd-feld"><label for="zdlg-email">E-Mail<span class="zd-pflicht">*</span></label><input class="zd-input" id="zdlg-email" name="email" type="email" autocomplete="email" inputmode="email" required></div>' +
            '<div class="zd-feld"><label for="zdlg-telefon">Telefon<span class="zd-pflicht">*</span></label><input class="zd-input" id="zdlg-telefon" name="telefon" type="tel" autocomplete="tel" inputmode="tel" pattern="[0-9+()\\/ -]{6,}" required></div>' +
          '</div>' +
          '<div aria-hidden="true"><label class="zd-sr-only" for="zdlg-website">Website</label><input class="zd-sr-only" id="zdlg-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>' +
          '<label class="zd-check"><input type="checkbox" name="consent" value="ja"><span>Ja, ich möchte weitere Praxis-Tipps von zenday per E-Mail erhalten. Abmeldung jederzeit möglich.</span></label>' +
          '<button type="submit" class="zd-btn zd-btn--primaer zd-btn--voll" id="zdlg-senden"></button>' +
          '<p class="zd-feld__fehler" id="zdlg-fehler" role="alert" hidden>Das hat leider nicht geklappt. Bitte versuchen Sie es erneut oder schreiben Sie an support@zen-day.de.</p>' +
          '<p class="zdlg__klein">Kostenlos. Wir melden uns ggf. kurz telefonisch zu Ihrem Ergebnis. Mehr in der <a href="https://www.zen-day.ai/datenschutz" target="_blank" rel="noopener">Datenschutzerklärung</a>.</p>' +
        '</form>' +
      '</div>';
    document.body.appendChild(dlg);
    dlg.querySelector('.zdlg__zu').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); }); // Klick auf den Hintergrund
    dlg.querySelector('form').addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid') === 'true' && e.target.checkValidity()) e.target.setAttribute('aria-invalid', 'false');
    });
  }

  function quelleAusUrl(p) {
    if (p.get('utm_medium') === 'paid') return 'meta-paid';
    if (p.get('utm_source')) return p.get('utm_source');
    return 'website-organisch';
  }

  function zdLeadGate(cfg) {
    if (frei(cfg.slug)) { document.documentElement.classList.add('zd-lead-frei'); return Promise.resolve(); }
    if (!dlg) bauen();

    var form = dlg.querySelector('form');
    var btn = dlg.querySelector('#zdlg-senden');
    var fehler = dlg.querySelector('#zdlg-fehler');
    var btnText = cfg.button || 'Freischalten';
    dlg.querySelector('#zdlg-titel').textContent = cfg.titel || 'Ergebnis kostenlos freischalten';
    dlg.querySelector('#zdlg-text').textContent = cfg.text || '';
    btn.textContent = btnText; btn.disabled = false; fehler.hidden = true;

    return new Promise(function (resolve) {
      function absenden(ev) {
        ev.preventDefault();
        fehler.hidden = true;
        form.querySelectorAll('[required]').forEach(function (f) { f.setAttribute('aria-invalid', f.checkValidity() ? 'false' : 'true'); });
        if (!form.reportValidity()) return;

        var fertig = function () { merken(cfg.slug); form.removeEventListener('submit', absenden); dlg.close(); resolve(); };
        var data = new URLSearchParams(new FormData(form));
        if (data.get('website')) { fertig(); return; } // Honeypot: still verwerfen
        data.delete('website');

        var p = new URLSearchParams(location.search);
        data.set('consent', form.querySelector('[name=consent]').checked ? 'ja' : 'nein');
        data.set('ebook', cfg.slug);
        data.set('persona', cfg.persona || 'inhaber-praxismanagement');
        data.set('quelle', quelleAusUrl(p));
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function (k) { data.set(k, p.get(k) || ''); });
        data.set('aktion', cfg.aktion || '');
        data.set('seite', location.href.split('?')[0]);
        data.set('zeitstempel', new Date().toISOString());
        if (cfg.extra) Object.keys(cfg.extra).forEach(function (k) { data.set(k, String(cfg.extra[k] == null ? '' : cfg.extra[k])); });

        btn.disabled = true; btn.textContent = 'Wird gesendet …';
        fetch(ENDPOINT, { method: 'POST', body: data })
          .then(function (r) {
            if (!r.ok) throw new Error('Status ' + r.status);
            if (typeof window.fbq === 'function') window.fbq('track', 'Lead', { content_name: cfg.slug });
            fertig();
          })
          .catch(function () { fehler.hidden = false; btn.disabled = false; btn.textContent = btnText; });
      }
      form.onsubmit = null;
      form.addEventListener('submit', absenden);
      dlg.addEventListener('close', function weg() { form.removeEventListener('submit', absenden); dlg.removeEventListener('close', weg); }, { once: true });
      dlg.showModal(); // Fokus landet per autofocus im Feld „Vorname“
    });
  }

  zdLeadGate.frei = frei;
  window.zdLeadGate = zdLeadGate;
})();
