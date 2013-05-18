-----------------------------------------------------------------------------------------
--
-- menu.lua
--
-----------------------------------------------------------------------------------------

local storyboard = require( "storyboard" )
local scene = storyboard.newScene()

-- include Corona's "widget" library
local widget = require "widget"


--------------------------------------------

-- forward declarations and other locals
local playBtn
local musicOnBtn 
local musicOffBtn
local effectsOnBtn
local effectsOffBtn

function musicLoad()
	if  settings:retrieve( "music" ) then
		music:play("fundo")
	else	
		music:stop()
	end	

end	

-- 'onRelease' event listener for playBtn
local function onPlayBtnRelease()
	
	-- go to level1.lua scene
	music:stop()
	storyboard.gotoScene( "level1", "fade", 500 )
	
	return true	-- indicates successful touch
end

function onMusicBtnRelease()
	settings:store( "music", (not settings:retrieve( "music" )) )
	settings:save()
	 musicLoad()
	return true	-- indicates successful touch
end

-----------------------------------------------------------------------------------------
-- BEGINNING OF YOUR IMPLEMENTATION
-- 
-- NOTE: Code outside of listener functions (below) will only be executed once,
--		 unless storyboard.removeScene() is called.
-- 
-----------------------------------------------------------------------------------------

-- Called when the scene's view does not exist:
function scene:createScene( event )
	local group = self.view
	local widget = require( "widget" )



	-- display a background image
	local background = display.newImageRect( "background.jpg", display.contentWidth, display.contentHeight )
	background:setReferencePoint( display.TopLeftReferencePoint )
	background.x, background.y = 0, 0
	
	-- create/position logo/title image on upper-half of the screen

	
	-- create a widget button (which will loads level1.lua on release)
	playBtn = widget.newButton{

		labelColor = { default={255}, over={128} },
		defaultFile="images/button-play.png",
		overFile="images/button-play.png",
		width=154, height=40,
		onRelease = onPlayBtnRelease	-- event listener function
	}
	playBtn:setReferencePoint( display.CenterReferencePoint )
	playBtn.x = display.contentWidth*0.5
	playBtn.y = display.contentHeight - 55
	
	-- all display objects must be inserted into group
	group:insert( background )

	group:insert( playBtn )
	
	music:add( "musica_menu.m4a", "fundo" ) -- A named track.
	music:add( "musica_fundo.m4a", "level1" ) -- A named track.
	music:setVolume( 0.2)
	 -- 
	 
	 musicOnBtn = widget.newButton{

		labelColor = { default={255}, over={128} },
		defaultFile="images/music_on.png",
		overFile="images/music_on.png",
		width=25, height=25,
		onRelease = onMusicBtnRelease	-- event listener function
	}

	musicOnBtn:setReferencePoint( display.CenterReferencePoint )
	musicOnBtn.x = display.contentWidth - 30
	musicOnBtn.y = 20

	 musicLoad()
	group:insert( musicOnBtn )
end

-- Called immediately after scene has moved onscreen:
function scene:enterScene( event )
	local group = self.view
	
	-- INSERT code here (e.g. start timers, load audio, start listeners, etc.)
	
end

-- Called when scene is about to move offscreen:
function scene:exitScene( event )
	local group = self.view
	
	-- INSERT code here (e.g. stop timers, remove listenets, unload sounds, etc.)
	
end

-- If scene's view is removed, scene:destroyScene() will be called just prior to:
function scene:destroyScene( event )
	local group = self.view
	
	if playBtn then
		playBtn:removeSelf()	-- widgets must be manually removed
		playBtn = nil
	end
end

-----------------------------------------------------------------------------------------
-- END OF YOUR IMPLEMENTATION
-----------------------------------------------------------------------------------------

-- "createScene" event is dispatched if scene's view does not exist
scene:addEventListener( "createScene", scene )

-- "enterScene" event is dispatched whenever scene transition has finished
scene:addEventListener( "enterScene", scene )

-- "exitScene" event is dispatched whenever before next scene's transition begins
scene:addEventListener( "exitScene", scene )

-- "destroyScene" event is dispatched before view is unloaded, which can be
-- automatically unloaded in low memory situations, or explicitly via a call to
-- storyboard.purgeScene() or storyboard.removeScene().
scene:addEventListener( "destroyScene", scene )

-----------------------------------------------------------------------------------------

return scene