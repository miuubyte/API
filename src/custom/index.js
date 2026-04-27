import { preloaderCSS } from './styles/preloader.js'
import { bannerCSS } from './styles/banner.js'
import { scalarConfig } from '../configs/app.js'

const ICONS = {
  discord: '<svg viewBox="0 0 127.14 96.36"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.71,32.65-1.82,56.6.4,80.21a105.73,105.73,0,0,0,32.17,16.15,77.7,77.7,0,0,0,6.89-11.11,68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c3.39-29,1.24-52.75-16.9-72.13ZM42.45,65.69C36.18,65.69,31,60,31,53s5.12-12.67,11.45-12.67S54,46,53.86,53,48.74,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5.12-12.67,11.44-12.67S96.14,46,96,53,90.89,65.69,84.69,65.69Z"/></svg>'
}

export function buildBrandingScript() {
  const combinedCSS = preloaderCSS + bannerCSS;
  const { footer, clientButton } = scalarConfig.customBranding;
  const btnIcon = ICONS[clientButton.icon] || '';

  return `
<script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>
<script type="text/javascript">
  (function() {
    function patchScalar() {
      var styleEl = document.createElement('style');
      styleEl.textContent = ${JSON.stringify(combinedCSS)} + ' .scalar-mcp-layer, .scalar-mcp-layer-link, [class*="scalar-mcp"], .mcp-logo, .mcp-nav, .ask-agent-scalar-input-label, [data-v-78f5377c] { display: none !important; visibility: hidden !important; pointer-events: none !important; height: 0 !important; width: 0 !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; position: absolute !important; } .m-discord-btn svg { width: 16px; height: 16px; margin-right: 6px; fill: currentColor; vertical-align: middle; }';
      document.head.appendChild(styleEl);

      var preloader = document.createElement('div');
      preloader.id = 'm-preloader';
      preloader.innerHTML = '<div class="m-loader-content">' +
        '<svg class="m-svg" viewBox="0 0 3413.33 3413.33">' +
          '<g id="m-logo">' +
            '<polygon class="m-path" points="2634.05,1319.2 3373.33,3366.08 2353.15,3366.08 1947.48,3368.9" />' +
            '<polygon class="m-path" points="1239.45,45.11 2173.24,43.33 2553.3,1095.61 2072.6,2529.52" />' +
            '<polygon class="m-path" points="40,3366.08 1157.96,270.76 1628.66,1666.78 1059,3366.08" />' +
          '</g>' +
        '</svg>' +
        '<div class="m-loader-text">MiuuAPI</div>' +
      '</div>';
      document.body.appendChild(preloader);
      document.body.style.overflow = 'hidden';

      anime.timeline({
        complete: function() {
          preloader.style.opacity = '0';
          preloader.style.visibility = 'hidden';
          document.body.style.overflow = '';
          setTimeout(function() { preloader.remove(); }, 300);
        }
      })
      .add({ 
        targets: '.m-path', 
        strokeDashoffset: [anime.setDashoffset, 0], 
        easing: 'easeInOutQuart', 
        duration: 1000, 
        delay: anime.stagger(100) 
      })
      .add({ 
        targets: '.m-path', 
        fill: ['#ffffff00', 'var(--scalar-color-accent)'], 
        duration: 800, 
        easing: 'easeOutQuad', 
        offset: '-=200',
        update: function(anim) {
          var paths = document.querySelectorAll('.m-path');
          paths.forEach(p => p.style.filter = 'drop-shadow(0 0 10px var(--scalar-color-accent))');
        }
      })
      .add({ 
        targets: '.m-loader-text', 
        opacity: [0, 1], 
        translateY: [20, 0], 
        duration: 800, 
        easing: 'easeOutExpo', 
        offset: '-=600',
        begin: function(anim) {
          var textWrapper = document.querySelector('.m-loader-text');
          textWrapper.innerHTML = textWrapper.textContent.split('').map(function(c) {
            return "<span class='letter' style='display:inline-block'>" + (c === ' ' ? '&nbsp;' : c) + "</span>";
          }).join('');
          anime({
            targets: '.m-loader-text .letter',
            translateY: [40,0],
            translateZ: 0,
            opacity: [0,1],
            easing: "easeOutExpo",
            duration: 1000,
            delay: (el, i) => 200 + 30 * i
          });
        }
      });

      function customizeUI() {
        var targets = document.querySelectorAll('.scalar-mcp-layer, .scalar-mcp-layer-link, .mcp-logo, .ask-agent-scalar-input-label, [data-v-78f5377c]');
        for (var i = 0; i < targets.length; i++) targets[i].remove();

        var buttons = document.querySelectorAll('button');
        buttons.forEach(function(btn) {
          var txt = btn.innerText || '';
          if (txt.includes('Ask AI') || txt.includes('Deploy') || txt.includes('Share')) {
            btn.style.setProperty('display', 'none', 'important');
          }
        });

        var configTitles = document.querySelectorAll('span.text-base.font-medium.text-c-1');
        configTitles.forEach(function(el) {
          if (el.innerText.includes('Scalar Configuration')) {
            el.innerText = 'Configuration';
          }
        });

        var footerLink = document.querySelector('.scalar-footer-link, a[href*="scalar.com"]');
        if (footerLink) {
          footerLink.href = ${JSON.stringify(footer.url)};
          footerLink.innerText = ${JSON.stringify(footer.text)};
        }

        var clientButtons = document.querySelectorAll('.open-api-client-button');
        clientButtons.forEach(function(btn) {
          if (!btn.classList.contains('m-discord-btn')) {
            btn.classList.add('m-discord-btn');
            btn.href = ${JSON.stringify(clientButton.url)};
            btn.target = '_blank';
            btn.innerHTML = ${JSON.stringify(btnIcon + ' ' + clientButton.text)};
          }
        });

        var introText = Array.from(document.querySelectorAll('span, p')).find(el => el.innerText.includes('A simple and easy to use API') || el.innerText.includes('Star to support our work'));
        if (introText && !document.querySelector('.m-intro-banner')) {
          var introSection = introText.closest('section');
          if (introSection) introSection.classList.add('introduction');
          var wrapper = document.createElement('div');
          wrapper.className = 'm-banner-wrapper';
          wrapper.innerHTML = '<img class="m-intro-banner" src="/assets/banner.jpg" alt="Banner">';
          introText.parentElement.appendChild(wrapper);
        }
        
        var emailBtn = document.querySelector('a[href*="mailto:"]');
        if (emailBtn && !document.getElementById('rate-limit-btn')) {
          var rateLimitBtn = document.createElement('div');
          rateLimitBtn.id = 'rate-limit-btn';
          rateLimitBtn.className = 'text-c-1 mr-2 flex min-h-7 min-w-7 items-center rounded-lg border px-2 py-1 group-last:mr-0 xl:border-none no-underline hover:bg-b-2';
          rateLimitBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="1em" height="1em" class="size-3 text-current"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg><span class="ml-1 empty:hidden" id="rl-val" style="font-size: 13px; font-weight: 600;">RATE LIMIT: Checking...</span>';
          emailBtn.parentNode.insertBefore(rateLimitBtn, emailBtn);
          
          window.fetch('/api/auth/check', { method: 'HEAD' }).catch(function(){});
        }
      }

      function initRateLimitBanner() {
        var originalFetch = window.fetch;
        window.fetch = async function() {
            var response = await originalFetch.apply(this, arguments);
            var remaining = response.headers.get('X-RateLimit-Remaining');
            var limit = response.headers.get('X-RateLimit-Limit');
            if (remaining && limit) {
                var rlVal = document.getElementById('rl-val');
                if (rlVal) {
                    if (limit === 'UNLIMITED') {
                        rlVal.innerText = 'RATE LIMIT: Unlimited';
                    } else {
                        rlVal.innerText = 'RATE LIMIT: ' + remaining;
                        if (parseInt(remaining) < (parseInt(limit) * 0.2)) {
                            rlVal.style.color = '#f87171';
                        } else {
                            rlVal.style.color = '';
                        }
                    }
                }
            }
            return response;
        };
      }

      customizeUI();
      initRateLimitBanner();
      var observer = new MutationObserver(customizeUI);
      observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patchScalar);
    else patchScalar();
  })();
</script>
`;
}
