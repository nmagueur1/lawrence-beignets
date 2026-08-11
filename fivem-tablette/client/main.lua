local isOpen = false
local pending = {}
local nextRequestId = 0

local function openTablet()
    if isOpen then return end
    isOpen = true
    SetNuiFocus(true, true)
    SendNUIMessage({ action = 'open' })
end

local function closeTablet()
    if not isOpen then return end
    isOpen = false
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'close' })
end

RegisterCommand(Config.OpenCommand, function()
    if isOpen then closeTablet() else openTablet() end
end, false)

RegisterKeyMapping(Config.OpenCommand, 'Ouvrir la tablette Lawrence Beignets', 'keyboard', Config.OpenKey)

RegisterNUICallback('close', function(_, cb)
    closeTablet()
    cb('ok')
end)

-- Chaque appel de l'UI (window.tablet.call('profile')) est relayé au serveur,
-- qui seul connaît la clé API et l'identifiant du joueur — jamais exposés au
-- NUI/JS. Corrélation par requestId pour supporter plusieurs appels en //.
RegisterNUICallback('call', function(data, cb)
    nextRequestId = nextRequestId + 1
    local requestId = nextRequestId
    pending[requestId] = cb
    TriggerServerEvent('lawrence_tablette:request', requestId, data.endpoint, data.method, data.body)
end)

RegisterNetEvent('lawrence_tablette:response')
AddEventHandler('lawrence_tablette:response', function(requestId, payload)
    local cb = pending[requestId]
    if cb then
        pending[requestId] = nil
        cb(payload)
    end
end)

-- Fermeture de sécurité si le joueur meurt / se déconnecte pendant que la
-- tablette est ouverte.
AddEventHandler('onResourceStop', function(resourceName)
    if resourceName == GetCurrentResourceName() then
        closeTablet()
    end
end)
