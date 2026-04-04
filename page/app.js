let STATUS_CONFIG = { default: 'ONLINE', overrides: {} };
let PORTAL_SPEC = null;

function normalizeBaseUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed) return '';

    let parsed;
    try {
        parsed = new URL(trimmed);
    } catch {
        return '';
    }

    const protocol = parsed.protocol.toLowerCase();
    if (protocol !== 'http:' && protocol !== 'https:') return '';
    parsed.hash = '';

    return parsed.toString().replace(/\/+$/, '');
}

function getApiBaseUrl() {
    const queryApi = new URLSearchParams(window.location.search).get('api');
    if (queryApi) {
        const normalized = normalizeBaseUrl(queryApi);
        if (normalized) {
            localStorage.setItem('apiBaseUrl', normalized);
            return normalized;
        }
    }

    const storedApi = localStorage.getItem('apiBaseUrl');
    if (storedApi) return normalizeBaseUrl(storedApi);

    if (typeof window !== 'undefined' && window.API_BASE_URL) {
        const configured = normalizeBaseUrl(window.API_BASE_URL);
        if (configured) return configured;
    }

    return normalizeBaseUrl(window.location.origin);
}

function buildApiUrl(path) {
    if (!path || typeof path !== 'string') return getApiBaseUrl();
    const trimmedPath = path.trim();
    if (!trimmedPath) return getApiBaseUrl();
    return `${getApiBaseUrl()}${trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`}`;
}

window.updateRateLimit = function (res, directLimit, directRemaining) {
    const limit = directLimit || res?.headers?.get('x-ratelimit-limit');
    const remaining = directRemaining || res?.headers?.get('x-ratelimit-remaining');
    if (!limit || !remaining) return;

    /* state cache */
    window.lastRateLimit = { limit, remaining };

    const isLocked = limit !== 'UNLIMITED' && parseInt(remaining) === 0;
    window.setGlobalLock(isLocked);

    const badges = document.querySelectorAll('.rate-limit-status');
    badges.forEach(badge => {
        badge.style.display = 'inline-block';
        if (limit === 'UNLIMITED') {
            badge.textContent = `RATE LIMIT: UNLIMITED`;
            badge.style.background = 'var(--cyan)';
            badge.style.color = 'var(--black)';
        } else {
            badge.textContent = `RATE LIMIT: ${remaining}/${limit}`;
            const percent = (parseInt(remaining) / parseInt(limit)) * 100;
            if (percent === 0) {
                badge.style.background = 'var(--red)';
                badge.style.color = 'var(--white)';
                badge.textContent = `RATE LIMIT: EXCEEDED!`;
                badge.classList.add('glitch-text');
            } else if (percent <= 20) {
                badge.style.background = 'var(--red)';
                badge.style.color = 'var(--white)';
            } else if (percent <= 50) {
                badge.style.background = 'var(--orange)';
                badge.style.color = 'var(--black)';
            } else {
                badge.style.background = 'var(--yellow)';
                badge.style.color = 'var(--black)';
            }
        }
    });
}

window.setGlobalLock = function (locked) {
    const buttons = document.querySelectorAll('.try-btn');
    const overlay = document.getElementById('rate-limit-overlay');

    if (locked) {
        document.body.classList.add('rate-limited');
        buttons.forEach(btn => {
            if (btn.textContent === 'Execute') {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                btn.textContent = 'LOCKED';
            }
        });

        if (!overlay) {
            const div = document.createElement('div');
            div.id = 'rate-limit-overlay';
            div.innerHTML = `
                <div class="lock-card" style="background: var(--red); color: var(--white); padding: 3rem 2rem; border: 8px solid var(--black); box-shadow: 20px 20px 0 var(--black); text-align: center; max-width: 90%; width: 550px; position: relative; z-index: 10001; transform: rotate(-1.5deg); display: flex; flex-direction: column; gap: 2rem; animation: card-entry 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                    <button onclick="window.setGlobalLock(false)" style="position: absolute; top: -30px; right: -30px; background: var(--yellow); color: var(--black); border: 5px solid var(--black); width: 65px; height: 65px; font-weight: 900; cursor: pointer; font-size: 2.2rem; box-shadow: 8px 8px 0 var(--black); transition: 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: flex; align-items: center; justify-content: center; clip-path: polygon(10% 0, 90% 0, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0 90%, 0 10%);" onmouseover="this.style.transform='scale(1.1) rotate(90deg)'; this.style.background='var(--magenta)'; this.style.color='white'" onmouseout="this.style.transform='scale(1) rotate(0deg)'; this.style.background='var(--yellow)'; this.style.color='black'">✕</button>
                    <h1 style="font-size: clamp(2.5rem, 12vw, 4rem); margin: 0; text-transform: uppercase; font-weight: 900; line-height: 0.85; letter-spacing: -3px; text-shadow: 4px 4px 0 var(--black);">ACCESS<br>LOCKED</h1>
                    <p style="font-size: 1.3rem; margin: 0; font-weight: 700; color: rgba(255,255,255,0.95); line-height: 1.5; text-transform: uppercase;">Your API access is temporarily suspended.<br><span style="color: var(--yellow); background: var(--black); padding: 2px 8px;">Wait for cooldown or upgrade plan.</span></p>
                    <div style="background: var(--black); color: var(--green); padding: 18px; font-family: 'JetBrains Mono', monospace; font-size: 1.1rem; border: 4px solid var(--white); font-weight: 800; box-shadow: 10px 10px 0 rgba(0,0,0,0.5); letter-spacing: 2px; text-transform: uppercase;">STATUS: COOLDOWN_ACTIVE</div>
                </div>
            `;
            div.style.position = 'fixed';
            div.style.top = '0';
            div.style.left = '0';
            div.style.width = '100vw';
            div.style.height = '100vh';
            div.style.background = 'rgba(0,0,0,0.85)';
            div.style.backdropFilter = 'blur(12px)';
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.justifyContent = 'center';
            div.style.zIndex = '10000';
            div.style.animation = 'glitch-fade 0.3s ease-out';
            document.body.appendChild(div);
        }
    } else {
        document.body.classList.remove('rate-limited');
        buttons.forEach(btn => {
            if (btn.textContent === 'LOCKED') {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                btn.textContent = 'Execute';
            }
        });
        if (overlay) overlay.remove();
    }
}

async function initPortal() {
    try {
        const apiBase = getApiBaseUrl();

        document.querySelectorAll('.docs-link[href="/docs"]').forEach(link => {
            link.href = `${apiBase}/docs`;
        });

        /* rate limit detection */
        fetch(buildApiUrl('/api/stats'), { method: 'HEAD' })
            .then(res => {
                window.updateRateLimit(res);
                if (window.lastRateLimit) {
                    window.updateRateLimit(null, window.lastRateLimit.limit, window.lastRateLimit.remaining);
                }
            })
            .catch(() => { });

        const docsRes = await fetch(buildApiUrl('/docs'));
        const spec = await docsRes.json();
        PORTAL_SPEC = spec;

        renderServers(spec.servers);
        renderEndpoints(spec.paths);

        const badge = document.querySelector('.oas-badge');
        if (badge && spec.openapi) {
            badge.textContent = `OAS ${spec.openapi}`;
        }

    } catch (e) {
        document.getElementById('endpoint-list').innerHTML = `<div class="op-block" style="padding:2rem; background:var(--yellow)">ERROR LOADING SPEC: ${e.message}. Add ?api=https://your-api-domain on URL or set API_BASE_URL in page/config.js</div>`;
    }

    /* load last search query */
    const lastQuery = localStorage.getItem('lastQuery');
    if (lastQuery) {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.value = lastQuery;
            filterEndpoints(lastQuery);
        }
    }

    /* handle hash route */
    handleHashRoute();
    window.addEventListener('hashchange', handleHashRoute);
}

function handleHashRoute() {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;

    const [pathPart, queryPart] = hash.substring(1).split('?');

    /* hash route detection */
    let methodPart = null;
    let effectivePath = pathPart;

    const parts = pathPart.split('/').filter(p => p);
    const commonMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
    if (parts.length > 1 && commonMethods.includes(parts[0].toLowerCase())) {
        methodPart = parts[0].toLowerCase();
        effectivePath = '/' + parts.slice(1).join('/');
    }

    const blocks = document.querySelectorAll('.op-block');
    let targetBlock = null;

    blocks.forEach(block => {
        const pathSpan = block.querySelector('.path');
        const methodSpan = block.querySelector('.method');
        const matchPath = pathSpan && pathSpan.textContent.trim() === effectivePath;
        const matchMethod = !methodPart || (methodSpan && methodSpan.textContent.trim().toLowerCase() === methodPart);

        if (matchPath && matchMethod) {
            targetBlock = block;
        }
    });

    if (targetBlock) {
        const groupContent = targetBlock.closest('.tag-group-content');
        if (groupContent && getComputedStyle(groupContent).display === 'none') {
            const header = groupContent.previousElementSibling;
            if (header) toggleCategory(header);
        }

        const sum = targetBlock.querySelector('.op-sum');
        if (sum && !sum.classList.contains('active')) {
            toggle(sum);
        }

        if (queryPart) {
            const params = new URLSearchParams(queryPart);
            const inputs = targetBlock.querySelectorAll('.param-input');
            inputs.forEach(input => {
                const key = input.getAttribute('data-key');
                if (params.has(key)) {
                    input.value = params.get(key);
                }
            });
        }

        setTimeout(() => {
            targetBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });
            targetBlock.style.transition = '0.3s';
            targetBlock.style.boxShadow = '0 0 15px var(--cyan)';
            showToast(`Link Opened: ${pathPart}`, 'success');
            setTimeout(() => {
                targetBlock.style.boxShadow = '6px 6px 0px var(--black)';
            }, 1000);
        }, 100);
    } else {
        showToast(`ERROR: Endpoint ${pathPart} Not Found`, 'error');
    }
}

function showToast(message, type = 'info') {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.position = 'fixed';
        toastContainer.style.bottom = '20px';
        toastContainer.style.left = '20px';
        toastContainer.style.display = 'flex';
        toastContainer.style.flexDirection = 'column';
        toastContainer.style.gap = '10px';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    if (type === 'error') {
        toast.style.background = 'var(--red)';
        toast.style.color = 'var(--white)';
    } else if (type === 'success') {
        toast.style.background = 'var(--green)';
        toast.style.color = 'var(--black)';
    } else {
        toast.style.background = 'var(--black)';
        toast.style.color = 'var(--yellow)';
    }

    toast.style.padding = '15px 20px';
    toast.style.border = '4px solid var(--black)';
    toast.style.boxShadow = '6px 6px 0 var(--black)';
    toast.style.fontWeight = '900';
    toast.style.textTransform = 'uppercase';
    toast.style.fontFamily = "'Space Grotesk', sans-serif";
    toast.textContent = message;

    toast.style.transform = 'translateY(100px)';
    toast.style.opacity = '0';
    toast.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    }, 10);

    setTimeout(() => {
        toast.style.transform = 'translateY(100px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function renderServers(servers) {
    const select = document.getElementById('server-select');
    const apiBase = getApiBaseUrl();
    /* Fallback is used when OpenAPI spec has no `servers` (or malformed) so portal still works. */
    const safeServers = Array.isArray(servers) && servers.length > 0 ? servers : [{ url: apiBase, description: 'Configured API Server' }];
    select.textContent = '';

    safeServers.forEach((s) => {
        const safeUrl = normalizeBaseUrl(String(s?.url ?? '')) || apiBase;
        const option = document.createElement('option');
        option.value = safeUrl;
        option.textContent = `${safeUrl} - ${String(s?.description || '')}`;
        select.appendChild(option);
    });
}

function getStatusColor(status) {
    if (status === 'ONLINE') return 'var(--green)';
    if (status === 'OFFLINE') return 'var(--red)';
    return '#fff';
}

function renderEndpoints(paths) {
    const list = document.getElementById('endpoint-list');
    let html = '';

    const favorites = getFavorites();
    const favEndpoints = [];

    const groups = {};
    for (const [path, methods] of Object.entries(paths)) {
        for (const [method, details] of Object.entries(methods)) {
            const tag = (details.tags && details.tags.length > 0) ? details.tags[0] : 'Default';
            if (!groups[tag]) groups[tag] = [];
            const ep = { path, method, details };
            groups[tag].push(ep);

            if (isFavorite(path, method)) favEndpoints.push(ep);
        }
    }

    if (favEndpoints.length > 0) {
        html += renderTagGroup('FAVORITES', favEndpoints);
    }

    for (const [tag, endpoints] of Object.entries(groups)) {
        html += renderTagGroup(tag, endpoints);
    }
    list.innerHTML = html;
}

function renderTagGroup(tag, endpoints) {
    let html = `
        <div class="tag-group-header" onclick="toggleCategory(this)" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; font-size: 1.2rem; font-weight: 800; background: var(--white); color: var(--black); padding: 15px 20px; margin-top: 1.5rem; margin-bottom: 1rem; border: 4px solid var(--black); box-shadow: 6px 6px 0px var(--black); text-transform: uppercase;">
            <span style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <span style="background: var(--magenta); color: #fff; padding: 4px 8px; font-size: 0.8rem; font-weight: 900; box-shadow: 2px 2px 0 var(--black); border: 2px solid var(--black);">${tag === 'FAVORITES' ? '⭐' : 'TAG'}</span>
                <span style="word-break: break-all;">${tag}</span>
            </span>
            <span class="cat-arrow" style="transition: transform 0.3s; font-size: 1.5rem; transform: rotate(-90deg);">▼</span>
        </div>
        <div class="tag-group-content">`;

    endpoints.forEach(({ path, method, details }) => {
        const methodClass = method.toLowerCase();
        const hasBody = details.requestBody;
        const status = details['x-status'] || 'ONLINE';
        const statusColor = getStatusColor(status);

        html += `
                <div class="op-block" data-path="${path}" style="box-shadow: 4px 4px 0px var(--black);">
                    <div class="op-sum" onclick="toggle(this)">
                        <span class="method ${methodClass}">${method}</span>
                        <span class="path">${path}</span>
                        <span class="favorite-star" onclick="toggleFavorite('${path}', '${method}', event)" style="cursor: pointer; font-size: 1.2rem; margin-left: 10px; transition: 0.2s;" title="Add to Favorites">${isFavorite(path, method) ? '⭐' : '☆'}</span>
                        <span class="status-badge" style="background:${statusColor}">${status}</span>
                        <span class="summary">${details.summary || ''}</span>
                        <span class="op-arrow">▼</span>
                    </div>
                    <div class="op-content">
                        <div class="op-inner">
                            <div style="display: flex; justify-content: flex-end; margin-bottom: 5px; gap: 10px;">
                                <span class="badge rate-limit-status" style="background: var(--yellow); color: var(--black); font-size: 0.7rem; padding: 4px 8px;">RATE LIMIT: ...</span>
                            </div>
                            <p class="op-desc">${details.description || 'No description provided.'}</p>
                            ${renderParams(details.parameters)}
                            ${hasBody ? `<textarea class="body-input" placeholder='{ "key": "value" }'>${getMethodExampleById(details.operationId)}</textarea>` : ''}
                            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                <button class="try-btn" onclick="execute('${path}', '${method}', '${status}', this)">Execute</button>
                                <button class="try-btn" style="background: var(--blue); color: #fff; box-shadow: 4px 4px 0 var(--black);" onclick="shareApi('${path}', '${method}', this)">Share API</button>
                                <button class="try-btn" style="background: var(--orange); color: #000; box-shadow: 4px 4px 0 var(--black);" onclick="toggleSnippets(this, '${path}', '${method}')">Generate Code</button>
                            </div>
                            <div class="snippet-box" style="display: none; margin-top: 15px; border: 3px solid var(--black); padding: 15px; background: var(--white); box-shadow: 4px 4px 0 var(--magenta);">
                                <div class="snippet-header" style="display: flex; gap: 10px; border-bottom: 2px solid var(--black); padding-bottom: 8px; margin-bottom: 10px; align-items: center; justify-content: space-between; flex-wrap: wrap;">
                                    <div style="display: flex; gap: 5px;">
                                        <button class="snippet-tab active" onclick="switchSnippet(this, 'curl')">cURL</button>
                                        <button class="snippet-tab" onclick="switchSnippet(this, 'fetch')">Fetch</button>
                                        <button class="snippet-tab" onclick="switchSnippet(this, 'python')">Python</button>
                                    </div>
                                    <button class="copy-btn-snippet" onclick="copySnippet(this)" style="background: var(--black); color: var(--yellow); border: 2px solid var(--black); padding: 4px 10px; font-size: 0.75rem; font-weight: 800; cursor: pointer; text-transform: uppercase;">Copy Code</button>
                                </div>
                                <div class="snippet-content">
                                    <pre class="curl-code" style="color: var(--black); background: #f0f0f0; padding: 10px; border: 1px solid #ccc; font-size:0.85rem; overflow-x:auto;"></pre>
                                    <pre class="fetch-code" style="display: none; color: var(--black); background: #f0f0f0; padding: 10px; border: 1px solid #ccc; font-size:0.85rem; overflow-x:auto;"></pre>
                                    <pre class="python-code" style="display: none; color: var(--black); background: #f0f0f0; padding: 10px; border: 1px solid #ccc; font-size:0.85rem; overflow-x:auto;"></pre>
                                </div>
                            </div>
                            <div class="response-box" style="display: none;">
                                <div class="res-header" style="display: flex; align-items: center; gap: 12px; padding: 3px 12px;">
                                    <span>JSON RESPONSE</span>
                                    <span class="latency-badge" style="display: none; padding: 2px 10px; font-size: 0.75rem; border: 2px solid var(--black); box-shadow: 2px 2px 0 var(--black); font-weight: 900; text-transform: uppercase;">0ms</span>
                                </div>
                                <div class="res-controls" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px; padding-top: 10px;">
                                    <div class="filter-group" style="display: flex; gap: 5px; flex-wrap: wrap;">
                                        <input type="text" class="filter-input" placeholder="Filter path... (e.g. data.user.name)" style="flex: 1; min-width: 0; background: var(--black); color: var(--yellow); border: 2px solid var(--black); padding: 8px 12px; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; box-shadow: 2px 2px 0 var(--cyan);">
                                        <button class="filter-btn" onclick="filterJsonResponse(this)" style="background: var(--yellow); color: var(--black); border: 2px solid var(--black); padding: 8px 15px; font-size: 0.85rem; font-weight: 800; cursor: pointer; box-shadow: 2px 2px 0 var(--magenta); text-transform: uppercase;">Filter</button>
                                    </div>
                                    <button class="copy-btn-main" onclick="copyResponse(this)" style="width: 100%; background: var(--cyan); color: var(--black); border: 2px solid var(--black); padding: 10px; font-size: 0.9rem; font-weight: 800; cursor: pointer; box-shadow: 2px 2px 0 var(--magenta); text-transform: uppercase;">Copy Full JSON</button>
                                </div>
                                <a href="${path}" target="_blank" class="direct-link" style="word-break: break-all; margin-bottom: 15px; display: inline-block;">${method.toUpperCase()} ${path.toUpperCase()}</a>
                                <pre></pre>
                            </div>
                        </div>
                    </div>
                </div>`;
    });
    html += `</div>`;
    return html;
}

function toggleCategory(el) {
    const content = el.nextElementSibling;
    const arrow = el.querySelector('.cat-arrow');
    if (content.style.display === 'none' || !content.style.display) {
        content.style.display = 'block';
        arrow.style.transform = 'rotate(0deg)';
        el.style.boxShadow = '2px 2px 0px var(--black)';
        el.style.transform = 'translate(4px, 4px)';
    } else {
        content.style.display = 'none';
        arrow.style.transform = 'rotate(-90deg)';
        el.style.boxShadow = '6px 6px 0px var(--black)';
        el.style.transform = 'translate(0px, 0px)';
    }
}

function getMethodExampleById(opId) {
    return '';
}

function renderParams(params) {
    if (!params || params.length === 0) return '';
    let html = '<div class="params-grid">';
    params.forEach(p => {
        html += `
            <div class="param-group">
                <label>${p.name}${p.required ? '*' : ''}</label>
                <input type="text" class="param-input" data-key="${p.name}" data-in="${p.in}" placeholder="${p.name}...">
            </div>`;
    });
    html += '</div>';
    return html;
}

function toggle(el) {
    const isNowActive = el.classList.contains('active');

    document.querySelectorAll('.op-sum.active').forEach(openSum => {
        if (openSum !== el) {
            openSum.classList.remove('active');
            openSum.nextElementSibling.classList.remove('active');
        }
    });

    if (!isNowActive) {
        el.classList.add('active');
        el.nextElementSibling.classList.add('active');
    } else {
        el.classList.remove('active');
        el.nextElementSibling.classList.remove('active');
    }
}

function filterEndpoints(query) {
    const q = query.toLowerCase();

    document.querySelectorAll('.op-block').forEach(block => {
        const text = block.innerText.toLowerCase();
        block.classList.toggle('hidden', !text.includes(q));
    });

    document.querySelectorAll('.tag-group-content').forEach(content => {
        const header = content.previousElementSibling;
        const hasVisible = content.querySelector('.op-block:not(.hidden)') !== null;

        if (q === '') {
            header.classList.remove('hidden');
        } else {
            if (hasVisible) {
                header.classList.remove('hidden');
                content.style.display = 'block';
                const arrow = header.querySelector('.cat-arrow');
                if (arrow) arrow.style.transform = 'rotate(0deg)';
                header.style.boxShadow = '2px 2px 0px var(--black)';
                header.style.transform = 'translate(4px, 4px)';
            } else {
                header.classList.add('hidden');
                content.style.display = 'none';
            }
        }
    });

    localStorage.setItem('lastQuery', query);
}

async function execute(path, method, status, btn) {
    const opContent = btn.closest('.op-content');
    const container = opContent.querySelector('.response-box');
    const pre = container.querySelector('pre');
    const link = container.querySelector('.direct-link');
    const inputs = opContent.querySelectorAll('.param-input');
    const bodyInput = opContent.querySelector('.body-input');
    const server = document.getElementById('server-select').value;

    if (status === 'OFFLINE') {
        container.style.display = 'block';
        pre.textContent = JSON.stringify({
            error: 'Service Unavailable',
            message: 'This endpoint is currently OFFLINE.',
            status: 503
        }, null, 2);
        return;
    }

    let fullPath = path;
    const queryParams = new URLSearchParams();

    inputs.forEach(input => {
        if (input.value) {
            const key = input.getAttribute('data-key');
            const type = input.getAttribute('data-in');
            if (type === 'path') fullPath = fullPath.replace(`{${key}}`, input.value);
            else if (type === 'query') queryParams.append(key, input.value);
        }
    });

    if (queryParams.toString()) fullPath += '?' + queryParams.toString();
    const requestUrl = (server.endsWith('/') ? server.slice(0, -1) : server) + fullPath;

    btn.textContent = 'EXECUTING...';
    btn.classList.add('glitch-loading');
    btn.disabled = true;

    const options = {
        method: method.toUpperCase(),
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (bodyInput && bodyInput.value) {
        try {
            options.body = JSON.stringify(JSON.parse(bodyInput.value));
        } catch (e) {
            alert('Invalid JSON Body!');
            btn.textContent = 'Execute';
            btn.classList.remove('glitch-loading');
            btn.disabled = false;
            return;
        }
    }

    const startTime = performance.now();
    try {
        const res = await fetch(requestUrl, options);
        const duration = Math.round(performance.now() - startTime);
        updateRateLimit(res);

        const latencyBadge = container.querySelector('.latency-badge');
        if (latencyBadge) {
            latencyBadge.textContent = `${duration}ms`;
            latencyBadge.style.display = 'inline-block';

            if (duration < 300) {
                latencyBadge.style.background = 'var(--green)';
                latencyBadge.style.color = 'var(--black)';
            } else if (duration < 1000) {
                latencyBadge.style.background = 'var(--orange)';
                latencyBadge.style.color = 'var(--black)';
            } else {
                latencyBadge.style.background = 'var(--red)';
                latencyBadge.style.color = 'var(--white)';
            }
        }

        let data;
        let isBinary = false;
        const contentType = res.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            data = await res.json();
        } else if (contentType.startsWith("image/") || contentType.startsWith("video/") || contentType.startsWith("audio/")) {
            data = await res.blob();
            isBinary = true;
        } else {
            data = await res.text();
        }

        container.style.display = 'block';

        if (!isBinary) {
            container.setAttribute('data-original', typeof data === 'object' ? JSON.stringify(data) : JSON.stringify({ response: data }));
        }

        if (typeof data === 'object' && !isBinary) {
            const resHeader = container.querySelector('.res-header');
            const resControls = container.querySelector('.res-controls');
            if (resHeader) resHeader.style.display = 'flex';
            if (resControls) resControls.style.display = 'flex';

            pre.innerHTML = syntaxHighlight(data);

            if (data.result) {
                const results = Array.isArray(data.result) ? data.result : [data.result];

                if (results.length > 0 && results[0].url && results[0].type) {
                    let previewHtml = '<div class="media-preview-container" style="margin-top: 20px; border: 4px solid var(--black); box-shadow: 6px 6px 0 var(--black); background: var(--white); padding: 10px; display: flex; flex-direction: column; gap: 15px; overflow: hidden;">';

                    results.forEach((item, index) => {
                        const { url, type } = item;
                        if (!url || !type) return;

                        previewHtml += `<div class="media-item" style="border-bottom: ${index < results.length - 1 ? '2px solid #eee' : 'none'}; padding-bottom: ${index < results.length - 1 ? '15px' : '0'};">`;

                        if (type === 'image') {
                            previewHtml += `<img src="${url}" alt="Preview" style="width: 100%; height: auto; display: block; filter: contrast(110%);">`;
                        } else if (type === 'video') {
                            previewHtml += `<video src="${url}" controls style="width: 100%; display: block; background: #000;"></video>`;
                        } else if (type === 'audio') {
                            previewHtml += `<div style="padding: 20px; background: var(--black); color: var(--yellow); text-align: center;">
                                                <div style="margin-bottom: 15px; font-weight: 900; letter-spacing: 1px;">AUDIO ASSET DETECTED</div>
                                                <audio src="${url}" controls style="width: 100%;"></audio>
                                            </div>`;
                        }

                        previewHtml += '</div>';
                    });

                    previewHtml += '</div>';

                    const oldPreview = container.querySelector('.media-preview-container');
                    if (oldPreview) oldPreview.remove();

                    pre.insertAdjacentHTML('afterend', previewHtml);
                }
            }
        } else if (isBinary) {
            const blobUrl = URL.createObjectURL(data);

            const resHeader = container.querySelector('.res-header');
            const resControls = container.querySelector('.res-controls');
            if (resHeader) resHeader.style.display = 'none';
            if (resControls) resControls.style.display = 'none';

            pre.innerHTML = `<div style="padding: 20px; background: var(--black); color: var(--white); text-align: center; font-weight: 800; font-size: 0.9em; letter-spacing: 1px;">DIRECT BINARY ${contentType.toUpperCase()} DETECTED</div>`;

            let previewHtml = '<div class="media-preview-container" style="margin-top: 20px; border: 4px solid var(--black); box-shadow: 6px 6px 0 var(--black); background: var(--white); padding: 10px; display: flex; flex-direction: column; gap: 15px; overflow: hidden;">';
            previewHtml += '<div class="media-item">';

            if (contentType.startsWith('image/')) {
                previewHtml += `<img src="${blobUrl}" style="width: 100%; height: auto; display: block; filter: contrast(110%);">`;
            } else if (contentType.startsWith('video/')) {
                previewHtml += `<video src="${blobUrl}" controls style="width: 100%; display: block; background: #000;"></video>`;
            } else if (contentType.startsWith('audio/')) {
                previewHtml += `<audio src="${blobUrl}" controls style="width: 100%;"></audio>`;
            }

            previewHtml += '</div></div>';

            const oldPreview = container.querySelector('.media-preview-container');
            if (oldPreview) oldPreview.remove();

            pre.insertAdjacentHTML('afterend', previewHtml);
        } else {
            pre.textContent = data;
        }
        link.href = requestUrl;
        link.textContent = method.toUpperCase() + ' ' + requestUrl.toUpperCase();
    } catch (e) {
        container.style.display = 'block';
        pre.textContent = '/* ERROR: ' + e.message + ' */';
    } finally {
        btn.classList.remove('glitch-loading');
        btn.textContent = 'Execute';
        btn.disabled = false;
    }
}

function copyResponse(btn) {
    const wrapper = btn.closest('.response-box');
    const pre = wrapper.querySelector('pre');
    if (pre && pre.textContent) {
        copyText(pre.textContent, btn, 'Copy Full JSON');
    } else {
        showToast('NO DATA TO COPY', 'error');
    }
}

function copySnippet(btn) {
    const box = btn.closest('.snippet-box');
    const activePre = box.querySelector('.snippet-content pre:not([style*="display: none"])');
    if (activePre) {
        copyText(activePre.textContent, btn, 'Copy Code');
    }
}

function copyText(text, btn, originalText) {
    navigator.clipboard.writeText(text).then(() => {
        btn.textContent = 'COPIED!';
        const oldBg = btn.style.background;
        btn.style.background = 'var(--green)';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = oldBg || '';
        }, 2000);
        showToast('COPIED TO CLIPBOARD', 'success');
    }).catch(() => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            btn.textContent = 'COPIED!';
            setTimeout(() => { btn.textContent = originalText; }, 2000);
            showToast('COPIED!', 'success');
        } catch (err) {
            showToast('COPY FAILED', 'error');
        }
        document.body.removeChild(textArea);
    });
}

function syntaxHighlight(json) {
    if (typeof json != 'string') {
        json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === '/' || (e.ctrlKey && e.key === 'k')) {
        e.preventDefault();
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }
});

function shareApi(path, method, btn) {
    const opContent = btn.closest('.op-content');
    let fullPath = `/${method.toLowerCase()}${path}`;
    const queryParams = new URLSearchParams();

    const inputs = opContent.querySelectorAll('.param-input');
    inputs.forEach(input => {
        if (input.value) {
            const key = input.getAttribute('data-key');
            queryParams.append(key, input.value);
        }
    });

    let hashStr = '#' + fullPath;
    if (queryParams.toString()) {
        hashStr += '?' + queryParams.toString();
    }

    const shareUrl = window.location.origin + window.location.pathname + hashStr;
    navigator.clipboard.writeText(shareUrl).then(() => {
        const originalText = btn.textContent;
        btn.textContent = 'LINK COPIED!';
        btn.style.background = 'var(--green)';
        btn.style.color = 'var(--black)';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = 'var(--blue)';
            btn.style.color = '#fff';
        }, 2000);
    });
}

function filterJsonResponse(btn) {
    const wrapper = btn.closest('.response-box');
    const input = wrapper.querySelector('.filter-input');
    const pre = wrapper.querySelector('pre');
    const path = input.value.trim();
    const raw = wrapper.getAttribute('data-original');

    if (!raw) {
        showToast('EXECUTE API FIRST', 'error');
        return;
    }

    try {
        const fullData = JSON.parse(raw);
        if (!path) {
            pre.innerHTML = syntaxHighlight(fullData);
            return;
        }

        const keys = path.split('.');
        let result = fullData;
        for (const key of keys) {
            if (result && result[key] !== undefined) {
                result = result[key];
            } else {
                result = undefined;
                break;
            }
        }

        if (result !== undefined) {
            pre.innerHTML = typeof result === 'object' ? syntaxHighlight(result) : `<span class="string">"${result}"</span>`;
            showToast('FILTER APPLIED', 'success');
        } else {
            showToast('PATH NOT FOUND', 'error');
        }
    } catch (e) {
        showToast('FILTER ERROR', 'error');
    }
}

function toggleFavorite(path, method, event) {
    if (event) event.stopPropagation();
    const favorites = getFavorites();
    const key = `${method}:${path}`;
    const idx = favorites.indexOf(key);
    if (idx > -1) {
        favorites.splice(idx, 1);
        showToast('REMOVED FROM FAVORITES', 'info');
    } else {
        favorites.push(key);
        showToast('ADDED TO FAVORITES', 'success');
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    /* reload favorited group */
    if (PORTAL_SPEC?.paths) {
        renderEndpoints(PORTAL_SPEC.paths);
    }
}

function getFavorites() {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
}

function isFavorite(path, method) {
    return getFavorites().includes(`${method}:${path}`);
}

function toggleSnippets(btn, path, method) {
    const wrapper = btn.closest('.op-inner');
    const snippetBox = wrapper.querySelector('.snippet-box');
    if (snippetBox.style.display === 'none') {
        const queryParams = Array.from(wrapper.querySelectorAll('.params-grid .param-input')).map(input => {
            return `${input.placeholder}=${encodeURIComponent(input.value)}`;
        }).join('&');
        const finalPath = queryParams ? `${path}?${queryParams}` : path;
        const bodyValue = wrapper.querySelector('.body-input')?.value;

        const server = document.getElementById('server-select').value;
        const baseUrl = server.endsWith('/') ? server.slice(0, -1) : server;
        const fullUrl = `${baseUrl}${finalPath}`;

        let curl = `curl -X ${method.toUpperCase()} "${fullUrl}"`;
        if (bodyValue) curl += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${bodyValue}'`;
        snippetBox.querySelector('.curl-code').textContent = curl;

        let fetchCode = `fetch("${fullUrl}", {\n  method: "${method.toUpperCase()}"`;
        if (bodyValue) fetchCode += `,\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify(${bodyValue})`;
        fetchCode += `\n}).then(res => res.json()).then(console.log);`;
        snippetBox.querySelector('.fetch-code').textContent = fetchCode;

        let python = `import requests\n\nurl = "${fullUrl}"\nresponse = requests.${method.toLowerCase()}(url`;
        if (bodyValue) python += `, json=${bodyValue}`;
        python += `)\nprint(response.json())`;
        snippetBox.querySelector('.python-code').textContent = python;

        snippetBox.style.display = 'block';
        showToast('CODE GENERATED', 'success');
    } else {
        snippetBox.style.display = 'none';
    }
}

function switchSnippet(btn, type) {
    const box = btn.closest('.snippet-box');
    box.querySelectorAll('.snippet-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    box.querySelectorAll('.snippet-content pre').forEach(p => p.style.display = 'none');
    box.querySelector(`.${type}-code`).style.display = 'block';
}

function downloadSpec() {
    const server = document.getElementById('server-select')?.value || getApiBaseUrl();
    const url = server.endsWith('/') ? server + 'docs' : server + '/docs';
    fetch(url).then(res => {
        if (!res.ok) throw new Error();
        return res.blob();
    }).then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'openapi.json';
        a.click();
        showToast('SPEC DOWNLOADED', 'success');
    }).catch(() => showToast('DOWNLOAD FAILED (openapi.json not found)', 'error'));
}

initPortal();
