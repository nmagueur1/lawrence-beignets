fx_version 'cerulean'
game 'gta5'

name 'lawrence-tablette'
author 'Lawrence Beignets'
description 'Tablette in-game (prototype) — miroir RP du bot Discord Lawrence Beignets'
version '0.1.0-test'

shared_scripts {
    'shared/config.lua'
}

client_scripts {
    'client/main.lua'
}

server_scripts {
    'server/config.lua',
    'server/main.lua'
}

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/style.css',
    'html/app.js'
}

lua54 'yes'
