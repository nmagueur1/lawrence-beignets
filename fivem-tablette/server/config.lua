Config = Config or {}

-- URL de l'API tablette (src/api/server.js dans le repo du bot).
-- En local pendant les tests : http://127.0.0.1:3939
-- En prod : l'adresse où tourne `npm run start:tablet-api` (process séparé du bot).
Config.ApiBaseUrl = 'http://127.0.0.1:3939'

-- DOIT être strictement identique à TABLET_API_KEY dans le .env de l'API.
-- Ne commit jamais la vraie valeur : remplace-la localement, ou charge-la
-- depuis une variable d'environnement du serveur FiveM au démarrage
-- (ex: Config.ApiKey = GetConvar('lawrence_tablet_api_key', 'CHANGE_ME')).
Config.ApiKey = 'CHANGE_ME'
