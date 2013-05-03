-----------------------------------------------------------------------------------------
--
-- level1.lua
--
-----------------------------------------------------------------------------------------

local storyboard = require( "storyboard" )
local movieclip = require("movieclip")
local scene = storyboard.newScene()

-- include Corona's "physics" library
local physics = require "physics"
physics.start(); physics.pause(); physics.setGravity(0,0);

--------------------------------------------

-- forward declarations and other locals
local screenW, screenH, halfW = display.contentWidth, display.contentHeight, display.contentWidth*0.5
local leftArrow, rightArrow, street1, street2, street3
local streetInitialPosition
local movingCarDirection, group

local heroCar, car
local visibleCars = {}
local points = 0
local pointsText
local passPoints = 30
local carSpeed = 0
local hits = 0

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
		return math.random(40,280)
	end

	explosion = movieclip.newAnim{"images/explode1.png", "images/explode2.png", "images/explode3.png", "images/explode4.png", "images/explode5.png", "images/explode6.png","images/explode7.png","images/explode8.png","images/explode9.png"}
	explosion.alpha = 0

	--native.systemFontBold
	pointsText = display.newText(points, 150, 0, native.systemFontBold, 32)


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
	heroCar.speed = 1
	heroCar.myName = "carHero"
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

	cars[0] =  {velocity = 5, color = 'blue', points = 30}
	cars[1] = {velocity = 8, color = 'white', points = 50}
	cars[2] = {velocity = 3, color = 'yellow', points = 70}

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
	group:insert( pointsText )
	group:insert( explosion )
	
	leftArrow:addEventListener( "touch", onLeftArrowTouch )
	rightArrow:addEventListener( "touch", onRightArrowTouch )
end

function carFactory()
	local carNumber = math.random(0,2)
	car = display.newImageRect("images/".. cars[carNumber].color .. "_car.png", 34, 56)
	car.x = getXPosition()
	car.y = math.random(200, 600) * -1
	car.pointsComputed = false
	car.velocity = cars[carNumber].velocity
	physics.addBody( car, { density=1.0, friction=0.3, bounce=0.3 } )
  car.myName = "carEnemy"
	return car	
	
end

function incrementPoints()
	points = points + passPoints
 	pointsText.text = points
end

function speed(value)
	return value + carSpeed
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

function goToMenu()
	storyboard.gotoScene( "menu", "fade", 500 )
end

local function death()
  hits = hits + 1
  if hits == 3 then
	explosion.alpha = 1
	heroCar.alpha = 0
	explosion.x = heroCar.x
	explosion.y = heroCar.y	
	explosion:reverse{ startFrame=6, endFrame=1, loop=0, goToMenu() }

  end
end


local function onCollision( event )
  if ( event.phase == "began" ) then
			if (event.object1.myName == 'carHero' and event.object2.myName == 'carEnemy') then
				death()
				carSpeed = (carSpeed / 2)
				print('bateu morreu, bateu dead')
			elseif (event.object1.myName == 'carEnemy' and event.object2.myName == 'carEnemy') then	
			if (event.object1.y > 0 and event.object1.y < heroCar.y) then
					 event.object1.velocity = (streetSpeed/2)
					--event.object2.velocity = event.object2.velocity + 10 
				end
				print('inimigos se batendo')
			end
          

  elseif ( event.phase == "ended" ) then


  end
end


-- If scene's view is removed, scene:destroyScene() will be called just prior to:
function scene:destroyScene( event )
	local group = self.view
	heroCar:removeSelf()	-- widgets must be manually removed
	car:removeSelf()
	explosion:removeSelf()
	 visibleCars = {}
	 points = 0
	 carSpeed = 0
	 hits = 0
	
	package.loaded[physics] = nil
	physics = nil
end

local function onEnterFrame( event )
	carSpeed = carSpeed + 0.1 / 15

	streetSpeed = speed(10)
	street1.y = street1.y + streetSpeed
	street2.y = street2.y + streetSpeed
	street3.y = street3.y + streetSpeed

  if table.getn(visibleCars) < 3 then
  	local car = carFactory();
  	group:insert( 4, car )

  	table.insert(visibleCars, car);
  end	

  local removedCars = {}
  for i = 1, table.getn(visibleCars) do
  	local car = visibleCars[i]
		car.y = car.y + speed(car.velocity)
  	if car.y - 240 > 480 then
  		table.insert(removedCars, i) 
  		--table.remove(visibleCars, i)
  		--visibleCars[i].y = -140
  		--visibleCars[i].x = getXPosition()
  	end

  	if car.y > heroCar.y + 20 and not car.pointsComputed then
  		incrementPoints()
  		car.pointsComputed = true
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

	local movingSpeed = 5

	if movingCarDirection == "RIGHT" then
		if heroCar.x <= 280 then
			heroCar.x = heroCar.x + movingSpeed
		end

	elseif movingCarDirection == "LEFT" then
		if heroCar.x >= 40 then
			heroCar.x = heroCar.x - movingSpeed
		end
	end


end

-----------------------------------------------------------------------------------------
-- END OF YOUR IMPLEMENTATION
-----------------------------------------------------------------------------------------
Runtime:addEventListener( "collision", onCollision )

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
