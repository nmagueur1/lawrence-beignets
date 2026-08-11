-- Identifiant standalone par défaut (license Rockstar/FiveM), disponible sur
-- tout serveur quel que soit le framework. Si tu utilises ESX/QBCore et
-- préfères lier la tablette au personnage (citizenid) plutôt qu'à la license,
-- remplace cette fonction par l'équivalent de ton framework — voir
-- SETUP_TABLETTE.md.
local function getIdentifier(src)
    for _, id in ipairs(GetPlayerIdentifiers(src)) do
        if string.find(id, 'license:') then
            return id
        end
    end
    return nil
end

local function callApi(method, path, body)
    local url = Config.ApiBaseUrl .. path
    local headers = {
        ['Content-Type'] = 'application/json',
        ['X-Api-Key'] = Config.ApiKey,
    }
    local payload = body and json.encode(body) or nil

    local resultStatus, resultData = nil, nil
    local done = false

    PerformHttpRequest(url, function(statusCode, responseText, _responseHeaders)
        resultStatus = statusCode
        local ok, decoded = pcall(json.decode, responseText or '{}')
        resultData = ok and decoded or { error = 'Réponse API illisible.' }
        done = true
    end, method, payload, headers)

    local waited = 0
    while not done and waited < 10000 do
        Wait(0)
        waited = waited + 1
    end

    if not done then
        return 0, { error = "L'API tablette ne répond pas (timeout)." }
    end

    return resultStatus, resultData
end

-- endpoint attendu côté NUI : 'link' (POST), 'profile', 'salaire', 'points',
-- 'classement?type=points|ventes|gains', 'reglement', 'organigramme',
-- 'vente' (POST), 'absence' (POST).
RegisterNetEvent('lawrence_tablette:request')
AddEventHandler('lawrence_tablette:request', function(requestId, endpoint, method, body)
    local src = source
    method = method or 'GET'
    endpoint = endpoint or ''

    local identifier = getIdentifier(src)
    if not identifier then
        TriggerClientEvent('lawrence_tablette:response', src, requestId, { error = 'Identifiant joueur introuvable.' })
        return
    end

    local path

    if endpoint == 'link' then
        path = '/link'
        body = { code = body and body.code, identifier = identifier, playerName = GetPlayerName(src) }
    elseif endpoint == 'vente' then
        path = ('/player/%s/vente'):format(identifier)
    elseif endpoint == 'absence' then
        path = ('/player/%s/absence'):format(identifier)
    elseif endpoint == 'profile' or endpoint == 'salaire' or endpoint == 'points' then
        path = ('/player/%s/%s'):format(identifier, endpoint)
    elseif string.find(endpoint, '^classement') then
        path = '/' .. endpoint
    elseif endpoint == 'reglement' or endpoint == 'organigramme' then
        path = '/company/' .. endpoint
    else
        TriggerClientEvent('lawrence_tablette:response', src, requestId, { error = 'Endpoint inconnu : ' .. tostring(endpoint) })
        return
    end

    local status, data = callApi(method, path, body)
    TriggerClientEvent('lawrence_tablette:response', src, requestId, { status = status, data = data })
end)
