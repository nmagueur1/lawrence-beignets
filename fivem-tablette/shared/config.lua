Config = Config or {}

-- Commande / touche pour ouvrir la tablette. Ces valeurs sont envoyées au
-- client (shared_scripts) : n'y mets jamais de secret (clé API, URL interne
-- sensible...) — ça va dans server/config.lua, lu uniquement côté serveur.
Config.OpenCommand = 'tablette'
Config.OpenKey = 'F6'

-- true  : la tablette s'ouvre seulement si le joueur possède l'item inventaire
--         Config.ItemName (à brancher toi-même sur ton framework : ESX/QBCore
--         exposent chacun leur propre événement "useItem", voir
--         SETUP_TABLETTE.md).
-- false : ouverture libre via la commande/touche (mode test, aucun inventaire
--         requis).
Config.UseItem = false
Config.ItemName = 'tablette_lawrence'
