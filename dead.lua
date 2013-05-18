local storyboard = require( "storyboard" )
local scene = storyboard.newScene()

local widget = require "widget"

local playBtn
local scoreBtn
local totalPoints
local listScores
local gameScore


local function tableViewListener( event )
    local phase = event.phase

    print( event.phase )
end

-- Handle row rendering
local function onRowRender( event )
    local phase = event.phase
    local row = event.row
    -- local rowTitle = display.newText( row,'#' .. row.index .. ' ' ..  scores[row.index].name .. ' ' .. scores[row.index].value, 0, 0, nil, 14 )
    -- rowTitle.x = row.x - ( row.contentWidth * 0.5 ) + ( rowTitle.contentWidth * 0.5 )
    -- rowTitle.y = row.contentHeight * 0.5
    -- rowTitle:setTextColor( 0, 0, 0 )


    local number = display.newText(row, "#" .. row.index .. " - ", 12, 0, "Helvetica-Bold", 18 )
    number:setReferencePoint( display.CenterLeftReferencePoint )
    number.x = 15
    number.y = row.height * 0.5
    number:setTextColor( 0, 0, 0 )

    local name = display.newText(row, scores[ row.index ].name, 12, 0, "Helvetica-Bold", 18 )
    name:setReferencePoint( display.CenterLeftReferencePoint )
    name.x = number.x + number.contentWidth
    name.y = row.height * 0.5
    name:setTextColor( 0, 0, 0 )

    local score = display.newText(row, scores[ row.index ].value, 12, 0, "Helvetica-Bold", 18 )
    score:setReferencePoint( display.CenterLeftReferencePoint )
    score.x = display.contentWidth - score.contentWidth - 20
    score.y = row.height * 0.5
    score:setTextColor( 0, 0, 0 )
end

local function onPlayBtnRelease()
	tableView.alpha = 0	
	storyboard.gotoScene( "level1", "fade", 500 )
	
	return true	-- indicates successful touch
end


local function onScoreBtnRelease()
	
	if tableView.alpha == 0 then
		transition.to( tableView, { time=300, alpha=1 } )
	else
		transition.to( tableView, { time=300, alpha=0} )
	end	
	
end

function scene:createScene( event )
	 group = self.view

	local background = display.newImageRect( "background.jpg", display.contentWidth, display.contentHeight )
	background:setReferencePoint( display.TopLeftReferencePoint )
	background.x, background.y = 0, 0

	totalPoints = display.newText(event.params.points, 150, 0, "DroidLogo", 20)
	listScores = display.newText('score board', 150, 0, "DroidLogo", 14)
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

	scoreBtn = widget.newButton{

		labelColor = { default={255}, over={128} },
		defaultFile="images/list_scores.png",
		overFile="images/list_scores.png",
		width=20, height=40,
		onRelease = onScoreBtnRelease	-- event listener function
	}
	
	scoreBtn.y = display.contentHeight - 95
	listScores.x = totalPoints.x - 10
	scoreBtn.x = listScores.x + listScores.width - 25
	listScores.y = display.contentHeight - 95
	
	group:insert( background )
	group:insert( listScores )
	group:insert( playBtn )
	group:insert( scoreBtn )
	group:insert( totalPoints )
end


function scene:enterScene( event )
	local group = self.view
	local msg = ''
	storyboard.removeScene("level1")
	scores = board:getScores()
	gameScore = event.params.points
	if (#scores > 0) and (gameScore > scores[1].value) then
		msg = 'New record '
	else
		msg = 'Total points '
	end	
	totalPoints.text = msg..gameScore
	totalPoints.alpha = 1
	totalPoints.font = "DroidLogo"
	
	
	board:add( system.getInfo( "name" ), gameScore )
	

	tableView = widget.newTableView
	{
	    top = 117,
	    width = 320, 
	    height = 247,
	    listener = tableViewListener,
	    onRowRender = onRowRender,
	}
	tableView.alpha = 0
	group:insert( tableView )
	tableView.alpha = 0
-- 
	for i = 1, #scores, 1 do
    local isCategory = false
    local rowHeight = 40
    local rowColor = 
    { 
        default = { 255, 255, 255 },
    }


    -- Insert the row into the tableView
    tableView:insertRow
    {
        isCategory = isCategory,
        rowHeight = rowHeight,
        rowColor = rowColor,
    }
end 
	
	
end

function scene:exitScene( event )
	local group = self.view
	totalPoints.alpha = 0
	
end

function scene:destroyScene( event )
	local group = self.view
	
	if scoreBtn then
		scoreBtn:removeSelf()	-- widgets must be manually removed
		scoreBtn = nil
	end

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