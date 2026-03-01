let STATUS_CONFIG = { default: 'ONLINE', overrides: {} };

function updateRateLimit(res) {
    const limit = res.headers.get('x-ratelimit-limit');
    const remaining = res.headers.get('x-ratelimit-remaining');
    if (!limit || !remaining) return;

    const badges = document.querySelectorAll('.rate-limit-status');
    badges.forEach(badge => {
        badge.style.display = 'inline-block';
        if (limit === 'UNLIMITED') {
            badge.textContent = `RATE LIMIT: UNLIMITED`;
            badge.style.background = 'var(--cyan)';
            badge.style.color = 'var(--black)';
        } else {
            badge.textContent = `RATE LIMIT: ${remaining}/${limit}`;
            const percent = (remaining / limit) * 100;
            if (percent <= 20) {
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

async function initPortal() {
    try {
        const docsRes = await fetch('/docs');
        updateRateLimit(docsRes);
        const spec = await docsRes.json();

        renderServers(spec.servers);
        renderEndpoints(spec.paths);

        const badge = document.querySelector('.oas-badge');
        if (badge && spec.openapi) {
            badge.textContent = `OAS ${spec.openapi}`;
        }

    } catch (e) {
        document.getElementById('endpoint-list').innerHTML = `<div class="op-block" style="padding:2rem; background:var(--yellow)">ERROR LOADING SPEC: ${e.message}</div>`;
    }

    /* Load Last Search Query */
    const lastQuery = localStorage.getItem('lastQuery');
    if (lastQuery) {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.value = lastQuery;
            filterEndpoints(lastQuery);
        }
    }

    /* Handle deep linking from URL Hash */
    handleHashRoute();
    window.addEventListener('hashchange', handleHashRoute);
}

function handleHashRoute() {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;

    /* Format: #/api/stats?someparam=value */
    const [pathPart, queryPart] = hash.substring(1).split('?');

    const blocks = document.querySelectorAll('.op-block');
    let targetBlock = null;

    blocks.forEach(block => {
        const pathSpan = block.querySelector('.path');
        if (pathSpan && pathSpan.textContent.trim() === pathPart) {
            targetBlock = block;
        }
    });

    if (targetBlock) {
        const groupContent = targetBlock.closest('.tag-group-content');
        if (groupContent && groupContent.style.display === 'none') {
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

    /* Slide-in animation */
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
    select.innerHTML = servers.map(s => `<option value="${s.url}">${s.url} - ${s.description || ''}</option>`).join('');
}

function getStatusColor(status) {
    if (status === 'ONLINE') return 'var(--green)';
    if (status === 'OFFLINE') return 'var(--red)';
    return '#fff';
}

function renderEndpoints(paths) {
    const list = document.getElementById('endpoint-list');
    let html = '';

    const groups = {};
    for (const [path, methods] of Object.entries(paths)) {
        for (const [method, details] of Object.entries(methods)) {
            const tag = (details.tags && details.tags.length > 0) ? details.tags[0] : 'Default';
            if (!groups[tag]) groups[tag] = [];
            groups[tag].push({ path, method, details });
        }
    }

    for (const [tag, endpoints] of Object.entries(groups)) {
        html += `
        <div class="tag-group-header" onclick="toggleCategory(this)" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; font-size: 1.2rem; font-weight: 800; background: var(--white); color: var(--black); padding: 15px 20px; margin-top: 1.5rem; margin-bottom: 1rem; border: 4px solid var(--black); box-shadow: 6px 6px 0px var(--black); text-transform: uppercase;">
            <span style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <span style="background: var(--magenta); color: #fff; padding: 4px 8px; font-size: 0.8rem; font-weight: 900; box-shadow: 2px 2px 0 var(--black); border: 2px solid var(--black);">TAG</span>
                <span style="word-break: break-all;">${tag}</span>
            </span>
            <span class="cat-arrow" style="transition: transform 0.3s; font-size: 1.5rem; transform: rotate(-90deg);">▼</span>
        </div>
        <div class="tag-group-content" style="display: none; padding-left: 1rem; border-left: 4px solid var(--magenta); margin-left: 1rem;">`;

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
                        <span class="status-badge" style="background:${statusColor}">${status}</span>
                        <span class="summary">${details.summary || ''}</span>
                        <span class="op-arrow">▼</span>
                    </div>
                    <div class="op-content">
                        <div class="op-inner">
                            <div style="display: flex; justify-content: flex-end; margin-bottom: 5px;">
                                <span class="badge rate-limit-status" style="background: var(--yellow); color: var(--black); font-size: 0.7rem; padding: 4px 8px;">RATE LIMIT: ...</span>
                            </div>
                            <p class="op-desc">${details.description || 'No description provided.'}</p>
                            ${renderParams(details.parameters)}
                            ${hasBody ? `<textarea class="body-input" placeholder='{ "key": "value" }'>${getMethodExampleById(details.operationId)}</textarea>` : ''}
                            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                <button class="try-btn" onclick="execute('${path}', '${method}', '${status}', this)">Execute</button>
                                <button class="try-btn" style="background: var(--blue); color: #fff; box-shadow: 4px 4px 0 var(--black);" onclick="shareApi('${path}', this)">Share API</button>
                            </div>
                            <div class="response-box" style="position: relative;">
                                <div class="res-header">JSON RESPONSE</div>
                                <button class="copy-btn" onclick="copyResponse(this)" style="position: absolute; top: 10px; right: 10px; background: var(--cyan); color: var(--black); border: 2px solid var(--black); padding: 5px 10px; font-size: 0.8rem; font-weight: 800; cursor: pointer; box-shadow: 2px 2px 0 var(--magenta); text-transform: uppercase;">Copy</button>
                                <a href="${path}" target="_blank" class="direct-link">${method.toUpperCase()} ${path.toUpperCase()}</a>
                                <pre></pre>
                            </div>
                        </div>
                    </div>
                </div>`;
        });
        html += `</div>`;
    }
    list.innerHTML = html;
}

function toggleCategory(el) {
    const content = el.nextElementSibling;
    const arrow = el.querySelector('.cat-arrow');
    if (content.style.display === 'none') {
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
    el.classList.toggle('active');
    el.nextElementSibling.classList.toggle('active');
}

function filterEndpoints(query) {
    const q = query.toLowerCase();
    document.querySelectorAll('.op-block').forEach(block => {
        const text = block.innerText.toLowerCase();
        block.classList.toggle('hidden', !text.includes(q));
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

    try {
        const res = await fetch(requestUrl, options);
        updateRateLimit(res);

        let data;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            data = await res.json();
        } else {
            data = await res.text();
        }

        container.style.display = 'block';
        if (typeof data === 'object') {
            pre.innerHTML = syntaxHighlight(data);
        } else {
            pre.textContent = data;
        }
        link.href = requestUrl;
        link.textContent = method.toUpperCase() + ' ' + requestUrl.toUpperCase();
    } catch (e) {
        container.style.display = 'block';
        pre.textContent = '// ERROR: ' + e.message;
    } finally {
        btn.classList.remove('glitch-loading');
        btn.textContent = 'Execute';
        btn.disabled = false;
    }
}

function copyResponse(btn) {
    const pre = btn.parentElement.querySelector('pre');
    if (pre && pre.textContent) {
        navigator.clipboard.writeText(pre.textContent).then(() => {
            const originalText = btn.textContent;
            btn.textContent = 'COPIED!';
            btn.style.background = 'var(--cyan)';
            btn.style.color = 'var(--black)';
            btn.style.boxShadow = '2px 2px 0 var(--yellow)';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = 'var(--cyan)';
                btn.style.color = 'var(--black)';
                btn.style.boxShadow = '2px 2px 0 var(--magenta)';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }
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

function shareApi(path, btn) {
    const opContent = btn.closest('.op-content');
    let fullPath = path;
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

initPortal();
