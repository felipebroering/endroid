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
GGScore = require( "GGScore" )
board = GGScore:new( "best", true )
board:setMaxNameLength( 15 )

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