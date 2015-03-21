//Chart Object for Brazilian Muni Mayor Salaries
//Evan Andrews
//March 2015

function chartObj(){
  /*Chart object adapted from Data Visualization with D3.js Cookbook, Nick Qi Zhu*/
  var _x, _y; //_x and _y are scales, defined when object is consctructed

  /*tell svg object the coordinates of origin on the page*/
  var _leftPos, _topPos; 

  //observations are the dataset, defined by invoking code. 
  var _observations = {}
  var _variableInfo = {}
  var _chart = {}  //container for the scatterplot and line chart

  var _width = 880, _height = 550 ;
  var _margins = {top: 60, left:60, right: 60, bottom: 60} ;
  var _svg, _bodyG, _axesG, _textG, _line, _fittedPath;
  var  _data = []; 
  //_colors = d3.scale.category10() ;
  
  //headline render function
  _chart.render = function() {
    //append chart svg element if not already present
    if(!_svg) {
      _svg = d3.select("div#projectCanvas").append("svg")
          .attr("height", _height)
          .attr("width", _width);
    }
    //render axes (hack to avoid redrawing axes)
    if(!_axesG){ renderAxes(_svg);};
    //chart body and data
    renderBody(_svg);
    //axes labels, units, and title
    renderText(_svg);
    
    //tooltip div
    renderToolTip();
  }
  //render axes
  function renderAxes(svg){
    if(!_axesG){
      _axesG = svg.append("g")
              .attr("class", "axes");
    }
    
    renderXAxis();
    renderYAxis();
  }
  function renderXAxis(){
    var xAxis = d3.svg.axis()
          .scale(_x.range([0, quadrantWidth()]))
          .orient("bottom");

    _axesG.append("g")
        .attr("class", "x axis")
        .attr("transform", function(){
            return "translate(" + xStart() + " " + yStart() + " )";
        })
        .call(xAxis);

    d3.selectAll("g.x g.tick")
        .append("line")
          .classed("grid-line", true)
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", 0)
          .attr("y2", - quadrantHeight()) ;
  }
  function renderYAxis(){
    var yAxis = d3.svg.axis()
          .scale(_y.range([quadrantHeight(), 0]))
          .orient("left");

    _axesG.append("g")
        .attr("class", "y axis")
        .attr("transform", function(){
            return "translate(" + xStart() + " " + yEnd() + " )";
        })
        .call(yAxis);

    d3.selectAll("g.y g.tick")
        .append("line")
          .classed("grid-line", true)
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", quadrantWidth())
          .attr("y2", 0) ;
  }
  //render the data
  function renderBody(svg){
    if(!_bodyG){
      _bodyG = svg.append("g")
          .attr("class", "body")
          .attr("transform", "translate(" + xStart() + "," + yEnd() + ")");
    }

    renderFittedLine();  //render first to put on bottom
    renderDots();
  }
  //fitted line
  function renderFittedLine(){
    var dataHatArr = [];  //array to hold the predicted datapoints

    //Fitted Line Formula for Salary Budget
    //recover the plot domain and range in native units (reais)
    var maxBudget = d3.max(_x.domain());
    var minBudget = d3.min(_x.domain());
    var maxSalary = d3.max(_y.domain());
    var minSalary = d3.min(_y.domain());
    dataHatArr.push(d3.range(maxBudget).map(function (i) {
        //this formula comes from regressing salary on city budget for all observations
        var salaryHat = 10.644 + 2.276703 * Math.log(i);
        return {x: i, yhat: salaryHat};
    }));
    dataHat = dataHatArr[0];   //FIXME: shouldnt be necessary
    dataHat.shift();     //dont include log of zero

    //scaling (based on all munis including SP)
    //x goes from values to pixels. Max budget, not SP city budget
    var xLine = d3.scale.linear().domain([minBudget, maxBudget]).range([0, quadrantWidth()]);
    //y from values to pixels and flip
    var yLine = d3.scale.linear().domain([0, maxSalary]).range([quadrantHeight(),0]);

    //plot the fitted line
    _line = d3.svg.line()
        .x(function(d) {return xLine(d.x); })
        .y(function(d) {return yLine(d.yhat); });

    if(!_fittedPath){
      _fittedPath = _bodyG.append("path")
          .attr("d", _line(dataHat))
          .attr("id", "fittedLineSalBudget")
          .attr("class", "fittedLine")
          .attr("transform", "translate(" + 0 + "," + 0 + ")");
    }
  }
  //scatterplot
  function renderDots(){
    _bodyG.selectAll("circle")
        .data(_observations)
        .enter().append("circle")
        .attr("cx", function(d){ return _x(d.budget1M2012); })
        .attr("cy", function(d){ return _y(d.salaryMayor1k2014); })
        .attr("r", function(d){
            if(d.pop1k2012 > 11000){
              //In the case of SP
              return Math.sqrt(d.pop1k2012) / 150; 
            }
            return Math.sqrt(d.pop1k2012); 
        })
        .attr("id", function(d){ return d.muniName; })  //css classes 4 bubbles
        .attr("class", function(d) { 
          classStr = "muniBubble "  //base class name for each circle
          classStr = classStr + d.metroRegion.replace(/\s/g, "_") ; 
          //microregion class
          classStr = classStr + " " + d.microName.replace(/\s/g, "_") ;
          //mayor party class
          classStr = classStr + " " + d.partyOfMayor2012.replace(/\s/g, "_") ;
          //data availability class
          var missing = "";
          if(d.flagSalaryMissing === 1 | d.flagBudgetMissing === 1){
            missing = "dataMissing";
          } else {
            missing = "dataAvailable";
          }
          classStr = classStr + " " + missing;
          return classStr;
        })
        .style("fill", function(d){
            if(d.salaryMayor1k2014 < 0.01 | d.budget1M2012 < 0.01){
              return bubbleColors.background;
            }
            return bubbleColors.main;
        })
        .style("opacity", bubbleFillOpacity.main)
        .style("stroke", bubbleStrokeColor.main)
        .on("mouseover", function(d){
          d3.select(this)
              .transition().duration(200).ease("quad")
              .style("fill", bubbleColors.flash)
              .style("opacity", bubbleFillOpacity.flash)
              .style("stroke", bubbleStrokeColor.flash)
              .style("stroke-opacity", bubbleStrokeOpacity.flash);
          circleR = Math.sqrt(d.pop1k2012);
          d3.select("#tooltip")
            .style("z-index", "1")
            .style("left", _x(d.budget1M2012) + _margins.left + _leftPos + "px")
            .style("top", _y(d.salaryMayor1k2014) + _margins.top + _topPos - Math.sqrt(d.pop1k2012)*1.15 + "px")
            .transition().duration(200).ease("quad")
            .text(d.muniName)
            .style("opacity", 0.8);
        })
        .on("mouseout", function(d){
          var bubble = d3.select(this);
          bubble.transition().duration(200).ease("quad");
          //All bubbles are selected. Transition back to main display mode
          if(microRegion === "muniBubble"){
            bubble
              .style("fill", function(d){
                  if(d.salaryMayor1k2014 < 0.01 | d.budget1M2012 < 0.01){
                    return bubbleColors.background;
                  }
                  return bubbleColors.main;
              })
              .style("opacity", bubbleFillOpacity.main)
              .style("stroke", bubbleStrokeColor.main)
              .style("stroke-opacity", bubbleStrokeOpacity.main);
          } else {
            var microName_ = d.microName.replace(/\s/g, "_") ; 
            //return to highlight mode
            if(microRegion === microName_){
              bubble
                .style("fill", bubbleColors.highlight)
                .style("opacity", bubbleFillOpacity.highlight)
                .style("stroke", bubbleStrokeColor.highlight)
                .style("stroke-opacity", bubbleStrokeOpacity.highlight);
            } else {
              //go to background mode
              bubble
                .style("fill", bubbleColors.background)
                .style("opacity", bubbleFillOpacity.background)
                .style("stroke", bubbleStrokeColor.background)
                .style("stroke-opacity", bubbleStrokeOpacity.background);
            }
          }
          d3.select("#tooltip")
            .transition().duration(200).ease("quad")
            .style("z-index", "-1")
            .style("opacity", 0);
        })
    
  }
  //Plot Text
  function renderText(svg){
    //determine variable values
    var budgetVar = _variableInfo.filter(function( obj ) {
      return obj.variable === "budget1M2012";
    });
    var salaryVar = _variableInfo.filter(function( obj ) {
      return obj.variable === "salaryMayor1k2014";
    });

    //set variables in chosen language
    if(lang === "EN"){
      xLabel = budgetVar[0].varLabelEN;
      xUnits = budgetVar[0].unitsEN;
      yLabel = salaryVar[0].varLabelEN;
      yUnits = salaryVar[0].unitsEN;
      titleText = "City Budget and Monthly Mayor Salary*";
      subTitleText = "Brazilian Municipalities in Sao Paulo Metro Region, 2014";
      noteText = "*Size of Bubble based on Population";
    }
    if(lang === "PT"){
      xLabel = budgetVar[0].varLabelPT;
      xUnits = budgetVar[0].unitsPT;
      yLabel = salaryVar[0].varLabelPT;
      yUnits = salaryVar[0].unitsPT;
      //FIXME: These encodings arent working
      titleText = "Orcamento Municipal e Subsidio Mensal do Prefeito*";
      subTitleText = "Municipios na Regiao Metropolitana de Sao Paulo, 2014";
      noteText = "*Tamanho da Bolha eh baseado em Populacao";
      /*
      titleText = "Orçamento Municipais e Subsídio Mensal do Prefeito*";
      subTitleText = "Municípios na Região Metropolitana de São Paulo, 2014";
      noteText = "*Tamanho da Bolha é baseado em População";
      */
    }
    //place the text on the page
    if(_textG){
      _textG.remove();
    }
    //create text element
     _textG = svg.append("g")
                  .attr("class", "text");
    //x-variable
    _textG.append("text")
      .attr("class", "x label")
      .attr("text-anchor", "middle")
      .attr("x", 0).attr("y", 0)
      .attr("transform", function(){ 
          var xPos = _margins.left + quadrantWidth() / 2 ;
          var yPos = yStart() + 40;  
          return "translate(" + xPos + ", " + yPos + ")"; 
        })
      .text(xLabel + " (" + xUnits + ")");
    //y-variable
    _textG.append("text")
      .attr("class", "y label")
      .attr("text-anchor", "middle")
      .attr("x", 0).attr("y", 0)
      .attr("dy", ".75em")
      .attr("transform", function(){ 
          return "translate(15, " + (yEnd() + quadrantHeight() / 2) + ") rotate(-90)"; 
        })
      .text(yLabel + " (" + yUnits + ")");
    //Title Text
    _textG.append("text")
      .attr("class", "title")
      .attr("text-anchor", "middle")
      .attr("x", 0).attr("y", 0)
      .attr("transform", function(){ 
          var xPos = _margins.left + quadrantWidth() / 2 ;
          var yPos = yEnd() - 40;  
          return "translate(" + xPos + ", " + yPos + ")"; 
        })
      .text(titleText + " ");
    //SubTitle Text
    _textG.append("text")
      .attr("class", "subtitle")
      .attr("text-anchor", "middle")
      .attr("x", 0).attr("y", 0)
      .attr("transform", function(){ 
          var xPos = _margins.left + quadrantWidth() / 2 ;
          var yPos = yEnd() - 20;  
          return "translate(" + xPos + ", " + yPos + ")"; 
        })
      .text(subTitleText);
    //Note Text
    _textG.append("text")
      .attr("class", "note")
      .attr("text-anchor", "middle")
      .attr("x", 0).attr("y", 0)
      .style("font-family", "Verdana")
      .style("font-size", "0.55em")
      .attr("transform", function(){ 
          var xPos = xEnd() - (1.5 * _margins.right) ;
          var yPos = yStart() + _margins.bottom - 10;  
          return "translate(" + xPos + ", " + yPos + ")"; 
        })
      .text(noteText);
  }
  //tooltips
  function renderToolTip(){
    d3.select("body").append("div")
      .attr("id", "tooltip")
      .style("opacity", 0);
    
  }

  //positioning functions
  function xStart() {
      return _margins.left;
  }

  function yStart() {
      return _height - _margins.bottom;
  }

  function xEnd() {
      return _width - _margins.right;
  }

  function yEnd() {
      return _margins.top;
  }

  function quadrantWidth() {
      return _width - _margins.left - _margins.right;
  }

  function quadrantHeight() {
      return _height - _margins.top - _margins.bottom;
  }
  function heightOffset() {
      return (quadrantHeight() + _margins.top);
  }
  //accessor functions for objectfn properties
  _chart.observations = function(obs) {
      if (!arguments.length) return _observations;
      _observations = obs;
      return _chart;
  };
  _chart.variableInfo = function(vars) {
      if (!arguments.length) return _variableInfo;
      _variableInfo = vars;
      return _chart;
  };
  _chart.lang = function(l) {
      if (!arguments.length) return lang;
      if (l === "EN"){ lang = l; }
      if (l === "PT"){ lang = l; }
      console.log("Language not Recognized (EN or PT)");
      return _chart;
  };
  _chart.width = function (w) {
      if (!arguments.length) return _width;
      _width = w;
      return _chart;
  };

  _chart.height = function (h) { // <-1C
      if (!arguments.length) return _height;
      _height = h;
      return _chart;
  };

  _chart.margins = function (m) {
      if (!arguments.length) return _margins;
      _margins = m;
      return _chart;
  };

  _chart.colors = function (c) {
      if (!arguments.length) return _colors;
      _colors = c;
      return _chart;
  };

  _chart.x = function (x) {
      if (!arguments.length) return _x;
      _x = x;
      return _chart;
  };

  _chart.y = function (y) {
      if (!arguments.length) return _y;
      _y = y;
      return _chart;
  };
  _chart.leftPos = function (l) {
      if (!arguments.length) return _leftPos;
      _leftPos = l;
      return _chart;
  };
  _chart.topPos = function (l) {
      if (!arguments.length) return _topPos;
      _topPos = l;
      return _chart;
  };
  return _chart;
}
