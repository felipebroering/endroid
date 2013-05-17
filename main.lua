-----------------------------------------------------------------------------------------
--
-- main.lua
--
-----------------------------------------------------------------------------------------

-- hide the status bar
display.setStatusBar( display.HiddenStatusBar )

-- include the Corona "storyboard" module
local storyboard = require "storyboard"

print('Pais '..system.getPreference("locale", "country"))
print('Linguagem '..system.getPreference("locale", "language"))
print('DeviceID '..system.getInfo( "deviceID" ) )
print('Nome '..system.getInfo( "name" ) )
 

-- load menu screen
storyboard.gotoScene( "menu" )