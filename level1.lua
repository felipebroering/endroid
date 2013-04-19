-----------------------------------------------------------------------------------------
--
-- level1.lua
--
-----------------------------------------------------------------------------------------

local storyboard = require( "storyboard" )
local scene = storyboard.newScene()

-- include Corona's "physics" library
local physics = require "physics"
physics.start(); physics.pause(); physics.setGravity(0,0);

--------------------------------------------

-- forward declarations and other locals
local screenW, screenH, halfW = display.contentWidth, display.contentHeight, display.contentWidth*0.5
local leftArrow, rightArrow, street1, street2, street3
local streetInitialPosition
local movingCarDirection

local heroCar, car
local visibleCars = {}
local points = 0

-----------------------------------------------------------------------------------------
-- BEGINNING OF YOUR IMPLEMENTATION
-- 
-- NOTE: Code outside of listener functions (below) will only be executed once,
--		 unless storyboard.removeScene() is called.
-- 
-----------------------------------------------------------------------------------------

local function onLeftArrowTouch( event )
	if event.phase == 'began' then
    	movingCarDirection = "LEFT"
    end

    if event.phase == 'ended' then
    	movingCarDirection = "STOPED"
    end
    return true
end 

local function onRightArrowTouch( event )
	if event.phase == 'began' then
    	movingCarDirection = "RIGHT"
    end
    
    if event.phase == 'ended' then
    	movingCarDirection = "STOPED"
    end
    return true
end


-- Called when the scene's view does not exist:
function scene:createScene( event )
	 group = self.view

	function getXPosition()
		return math.random(40,280);
	end	

	-- create a grey rectangle as the backdrop
	street1 = display.newImageRect( "images/street.png" , 320, 480)
	street1.x = screenW / 2
	street1.y = screenH / 2

	street2 = display.newImageRect( "images/street.png" , 320, 480)
	street2.x = street1.x
	street2.y = street1.y - street2.height

	street3 = display.newImageRect( "images/street.png" , 320, 480)
	street3.x = street1.x
	street3.y = street2.y - street3.height

	streetInitialPosition = street3.y + 10

	heroCar = display.newImageRect( "images/red_car.png", 34, 56)
	heroCar.x = screenW / 2 
	heroCar.y = screenH - 100
	physics.addBody( heroCar, 'static', { density=1.0, friction=0.3, bounce=0.3 } )

	--greenCar = display.newImageRect("images/red_car.png", 34, 56)
	--greenCar.x = getXPosition()
--	greenCar.y = -140
--	greenCar.velocity = 5
--	physics.addBody( greenCar, { density=1.0, friction=0.3, bounce=0.3 } )

--	yellowCar = display.newImageRect("images/red_car.png", 34, 56)
--	yellowCar.x = getXPosition()
--	yellowCar.y = -200
--	yellowCar.velocity = 3
--	physics.addBody( yellowCar, { density=1.0, friction=0.3, bounce=0.3 } )	

--	whiteCar = display.newImageRect("images/red_car.png", 34, 56)
--	whiteCar.x = getXPosition()
--	whiteCar.y = -200
--	whiteCar.velocity = 8
--	physics.addBody( whiteCar, { density=1.0, friction=0.3, bounce=0.3 } )	

	cars = {}

	cars[0] =  {velocity = 5, color = 'blue'}
	cars[1] = {velocity = 8, color = 'white'}
	cars[2] = {velocity = 3, color = 'yellow'}

	leftArrow = display.newImageRect( "images/left_arrow.png", 60, 30)
	leftArrow.x = 40
	leftArrow.y = screenH - 30

	rightArrow = display.newImageRect( "images/right_arrow.png", 60, 30)
	rightArrow.x = screenW - 40
	rightArrow.y = screenH - 30

	movingCarDirection = "STOPED"
	
	-- -- make a crate (off-screen), position it, and rotate slightly
	-- local crate = display.newImageRect( "crate.png", 90, 90 )
	-- crate.x, crate.y = 160, -100
	-- crate.rotation = 15
	
	-- -- add physics to the crate
	-- physics.addBody( crate, { density=1.0, friction=0.3, bounce=0.3 } )
	
	-- -- create a grass object and add physics (with custom shape)
	-- local grass = display.newImageRect( "grass.png", screenW, 82 )
	-- grass:setReferencePoint( display.BottomLeftReferencePoint )
	-- grass.x, grass.y = 0, display.contentHeight
	
	-- -- define a shape that's slightly shorter than image bounds (set draw mode to "hybrid" or "debug" to see)
	-- local grassShape = { -halfW,-34, halfW,-34, halfW,34, -halfW,34 }
	-- physics.addBody( grass, "static", { friction=0.3, shape=grassShape } )
	
	-- -- all display objects must be inserted into group
	group:insert( street1 )
	group:insert( street2 )
	group:insert( street3 )
	-- group:insert( crate )
	group:insert( heroCar )
	--group:insert( greenCar )
	--group:insert( yellowCar )
	--group:insert( whiteCar )	
	group:insert( leftArrow )
	group:insert( rightArrow )

	
	leftArrow:addEventListener( "touch", onLeftArrowTouch )
	rightArrow:addEventListener( "touch", onRightArrowTouch )
end

function carFactory()
		local carNumber = math.random(0,2)
		car = display.newImageRect("images/".. cars[carNumber].color .. "_car.png", 34, 56)
    	car.x = getXPosition()
    	car.y = math.random(200, 600) * -1
    	car.velocity = cars[carNumber].velocity
 		physics.addBody( car, { density=1.0, friction=0.3, bounce=0.3 } )
 		return car	
	
end	

-- Called immediately after scene has moved onscreen:
function scene:enterScene( event )
	local group = self.view
	
	physics.start()
	
end

-- Called when scene is about to move offscreen:
function scene:exitScene( event )
	local group = self.view
	
	physics.stop()
	
end

-- If scene's view is removed, scene:destroyScene() will be called just prior to:
function scene:destroyScene( event )
	local group = self.view
	
	package.loaded[physics] = nil
	physics = nil
end

local function onEnterFrame( event )
	local streetSpeed = 10
	street1.y = street1.y + streetSpeed
	street2.y = street2.y + streetSpeed
	street3.y = street3.y + streetSpeed

    if table.getn(visibleCars) < 3 then
    	table.insert(visibleCars, carFactory());
    end	

    local removedCars = {}
    for i = 1, table.getn(visibleCars) do
		visibleCars[i].y = visibleCars[i].y + visibleCars[i].velocity 
    	if visibleCars[i].y - 240 > 480 then
    		table.insert(removedCars, i) 
    		--table.remove(visibleCars, i)
    		--visibleCars[i].y = -140
    		--visibleCars[i].x = getXPosition()
    	end
    end
    for i = 1, table.getn(removedCars) do
    	table.remove(visibleCars, removedCars[i])
    end

	if street1.y - 240 > 480 then
		street1.y = streetInitialPosition
	end

	if street2.y - 240 > 480 then
		street2.y = streetInitialPosition
	end

	if street3.y - 240 > 480 then
		street3.y = streetInitialPosition
	end

	local speed = 5

	if movingCarDirection == "RIGHT" then
		if heroCar.x <= 280 then
			heroCar.x = heroCar.x + speed
		end

	elseif movingCarDirection == "LEFT" then
			if heroCar.x >= 40 then
			heroCar.x = heroCar.x - speed
		    end
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

Runtime:addEventListener( "enterFrame", onEnterFrame)

-----------------------------------------------------------------------------------------

return scene