-----------------------------------------------------------------------------------------
--
-- main.lua
--
-----------------------------------------------------------------------------------------

-- hide the status bar
display.setStatusBar( display.HiddenStatusBar )

-- include the Corona "storyboard" module
local storyboard = require "storyboard"

require( "ice" )
local GGScore = require( "GGScore" )
local GGMusic = require( "GGMusic" )
local GGSound = require( "GGSound" )

music = GGMusic:new()
music:add( "musica_menu.mp3", "menu" ) -- A named track.

sound = GGSound:new{ 1, 2, 3 ,4, 5, 6}

board = GGScore:new( "best", true )
board:load()
board:setMaxNameLength( 15 )
sound:add( "explosao.mp3", "explosao" )
sound:add( "batida.mp3", "batida" )
sound:add( "curva.mp3", "curva" )
sound:add( "carro_passando_1.mp3", "carro_passando_1" )
sound:add( "carro_passando_2.mp3", "carro_passando_2" )
sound:add( "carro_passando_3.mp3", "carro_passando_3" )
sound:add( "velocidade1.mp3", "velocidade1" )
sound:add( "velocidade2.mp3", "velocidade2" )
sound:add( "velocidade3.mp3", "velocidade3" )
sound:add( "velocidade4.mp3", "velocidade4" )

settings = ice:loadBox( "settings" )
settings:storeIfNew( "music", true )
settings:storeIfNew( "effects",true )
settings:save()

-- print(settings:retrieve( "music" ))
-- print(settings:retrieve( "effects" ))

-- print('Pais '..system.getPreference("locale", "country"))
-- print('Linguagem '..system.getPreference("locale", "language"))
-- print('DeviceID '..system.getInfo( "deviceID" ) )
-- print('Nome '..system.getInfo( "name" ) )
 

-- load menu screen
storyboard.gotoScene( "menu" )