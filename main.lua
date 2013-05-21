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

sound = GGSound:new{ 1, 2, 3 }

board = GGScore:new( "best", true )
board:load()
board:setMaxNameLength( 15 )
-- sound:add( "explosao.wav", "explosao" )
-- sound:add( "batida.wav", "batida" )
-- sound:add( "velocidade1.wav", "velocidade1" )
-- sound:add( "velocidade2.wav", "velocidade2" )
-- sound:add( "velocidade3.wav", "velocidade3" )
-- sound:add( "velocidade4.wav", "velocidade4" )

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