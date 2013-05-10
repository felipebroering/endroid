local storyboard = require( "storyboard" )
local scene = storyboard.newScene()

local widget = require "widget"

local playBtn
local totalPoints

local function onPlayBtnRelease()
	
	storyboard.gotoScene( "level1", "fade", 500 )
	
	return true	-- indicates successful touch
end

function scene:createScene( event )
	local group = self.view

	local background = display.newImageRect( "background.jpg", display.contentWidth, display.contentHeight )
	background:setReferencePoint( display.TopLeftReferencePoint )
	background.x, background.y = 0, 0

	totalPoints = display.newText(event.params.points, 150, 0, native.systemFontBold, 20)
	totalPoints.alpha = 0


	playBtn = widget.newButton{

		labelColor = { default={255}, over={128} },
		defaultFile="images/button-restart.png",
		overFile="images/button-restart.png",
		width=154, height=40,
		onRelease = onPlayBtnRelease	-- event listener function
	}
	playBtn:setReferencePoint( display.CenterReferencePoint )
	playBtn.x = display.contentWidth*0.5
	playBtn.y = display.contentHeight - 55
	
	group:insert( background )
	group:insert( playBtn )
	group:insert( totalPoints )
end

function scene:enterScene( event )
	local group = self.view
	print('------------------Entercene')
	storyboard.removeScene("level1")
	totalPoints.text = 'Total points '..event.params.points
	totalPoints.alpha = 1
end

function scene:exitScene( event )
	local group = self.view
	totalPoints.alpha = 0
	
end

function scene:destroyScene( event )
	local group = self.view
	
	if playBtn then
		playBtn:removeSelf()	-- widgets must be manually removed
		playBtn = nil
	end
end

scene:addEventListener( "createScene", scene )

scene:addEventListener( "enterScene", scene )

scene:addEventListener( "exitScene", scene )

scene:addEventListener( "destroyScene", scene )

-----------------------------------------------------------------------------------------

return scene