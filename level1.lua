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
local lives = 3
local livesText
local speedText
local pointsText
local carsExceededText
local passPoints = 30
local carSpeed = 0
local hits = 0
local running = true
local blink = 0
local carsExceeded = 0
local lifeImage
local scoreImage
-- local scorePlate
local convertedSpeed = 0

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
	pointsText = display.newText(points, 150, 16,  "DroidLogo", 22)
	carsExceededText = display.newText(carsExceeded, 150,40, "DroidLogo", 22)
	livesText = display.newText('x'..(lives - hits), 36, 0, "DroidLogo", 12)
	speedText = display.newText('speed '..(convertedSpeed)..'KM/H', 0, 22, "DroidLogo", 12)
	livesText.font = "DroidLogo"
	
   -- scorePlate = display.newRect(80,5,150,70)
   -- scorePlate:setFillColor(black)

	-- create a grey rectangle as the backdrop
	street1 = display.newImage( "images/street.png", 320,480  )
	street2 = display.newImage("images/street.png", 320,480 )		
	street3 = display.newImage( "images/street.png", 320,480 )
	street1.x = screenW / 2
	street2.x = street1.x
	street3.x = street1.x

	street1.y = screenH / 2
	street2.y = street1.y - street2.height
	street3.y = street2.y - street3.height

	streetInitialPosition = (-street3.height * 3)

	scoreImage = display.newImageRect( "images/score.png", 40, 8)
	scoreImage.x = 155
	scoreImage.y = 12


	lifeImage = display.newImageRect( "images/coracao.png", 15, 15)
	lifeImage.x = 25
	lifeImage.y = 10

	heroCar = display.newImageRect( "images/red_car.png", 34, 56)
	heroCar.x = screenW / 2 
	heroCar.y = screenH - 100
	heroCar.speed = 1
	heroCar.myName = "carHero"
	physics.addBody( heroCar, 'static', { density=1.0, friction=0.3, bounce=0.3 } )

	

	cars = {}

	cars[0] =  {velocity = 5, color = 'blue', points = 30}
	cars[1] = {velocity = 8, color = 'white', points = 50}
	cars[2] = {velocity = 3, color = 'yellow', points = 70}

	leftArrow = display.newImageRect( "images/left_arrow.png", 64, 64)
	leftArrow.x = 40
	leftArrow.y = screenH - 30

	rightArrow = display.newImageRect( "images/right_arrow.png", 64, 64)
	rightArrow.x = screenW - 40
	rightArrow.y = screenH - 30

	movingCarDirection = "STOPED"
	
	
	group:insert( street1 )
	group:insert( street2 )
	group:insert( street3 )
	
	group:insert( heroCar )
	--group:insert( scorePlate )
	group:insert( leftArrow )
	group:insert( rightArrow )
	group:insert( pointsText )
	group:insert( livesText )
	group:insert( explosion )
	group:insert( carsExceededText )
	group:insert( speedText )
	group:insert( lifeImage )
	group:insert( scoreImage )
	
	
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
	carsExceeded = carsExceeded + 1
	carsExceededText.text = carsExceeded
	pointsText.text = points
end

function speed(value)
	return value + carSpeed
end


function scene:enterScene( event )
	local group = self.view
	running = true
	physics.start()
	
end

function scene:exitScene( event )
	local group = self.view
	physics.stop()
	
end

function goToMenu()
	local options = {
		effect = "fade",
		time = 500,
		params = { points = points }
	}
	storyboard.gotoScene( "dead", options )
end

	
function flashes()
	if blink < 5 then
		blink = blink + 1
		local function backAlpha()
			transition.to( heroCar, { time=100, alpha=1, onComplete=flashes} )
		end
		transition.to( heroCar, { time=100, alpha=0.3, onComplete=backAlpha } )
	else
		blink = 0	
	end
end	

local function death()
		
	hits = hits + 1
	livesText.text = 'x'..(lives - hits);
	if hits == lives then
		running = false
		explosion.alpha = 1
		heroCar.alpha = 0
		explosion.x = heroCar.x
		explosion.y = heroCar.y	

		explosion:reverse{ startFrame=6, endFrame=1, loop=0, goToMenu() }
	end

	if running then
		flashes()	
	end		
end


local function onCollision( event )
	if ( event.phase == "began" ) then
		if (event.object1.myName == 'carHero' and event.object2.myName == 'carEnemy') then
			death()
			carSpeed = (carSpeed / 2)
			elseif (event.object1.myName == 'carEnemy' and event.object2.myName == 'carEnemy') then	
				-- if (event.object1.y ~= nil and event.object1.y > 0 and event.object1.y < heroCar.y) then
				-- 	event.object1.velocity = (streetSpeed/2)
				-- end
			end


			elseif ( event.phase == "ended" ) then


		end
	end


	function scene:destroyScene( event )
		local group = self.view
		
		Runtime:removeEventListener( "enterFrame")


	package.loaded[physics] = nil
	physics = nil
end

local function onEnterFrame( event )
	
	if running then
		carSpeed = carSpeed + 0.1 / 15

		streetSpeed = speed(10)
		convertedSpeed = streetSpeed * 6
		speedText.text = math.floor(convertedSpeed)..' KM/H'
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
			end

			if car.y > heroCar.y + 20 and not car.pointsComputed then
				incrementPoints()
				car.pointsComputed = true
			end
		end
		for i = 1, table.getn(removedCars) do  
			table.remove(visibleCars, removedCars[i])
		end

	

		if street1.y - (street1.height/2) - 60 > screenH then
			street1:translate(  0, streetInitialPosition)
		end	
		if street2.y - (street2.height/2) - 60 > screenH then
			street2:translate(  0, streetInitialPosition)
		end	
		if street3.y - (street3.height/2) - 60 > screenH then
			street3:translate( 0, streetInitialPosition )
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

	end

-----------------------------------------------------------------------------------------
-- END OF YOUR IMPLEMENTATION
-----------------------------------------------------------------------------------------
Runtime:addEventListener( "collision", onCollision )

scene:addEventListener( "createScene", scene )

scene:addEventListener( "enterScene", scene )

scene:addEventListener( "exitScene", scene )

scene:addEventListener( "destroyScene", scene )

Runtime:addEventListener( "enterFrame", onEnterFrame)

-----------------------------------------------------------------------------------------

return scene
