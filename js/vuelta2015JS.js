            
            
            //size & height            
            var w = 800,
                h = 500,
            Rmargin = {
                top: 10,
                right: 20,
                bottom: 10,
                left: 100};

            var Pmargin = {
                top: 10,
                right: Rmargin.right,
                bottom: 20,
                left: Rmargin.left
            },
                Pwidth = w,
                Pheight = 80;

             // Scales                
            var xScale = d3.scale.linear().range([Rmargin.left, w + Rmargin.left]),
                yScale = d3.scale.linear().range([Rmargin.top,  h + Rmargin.top]),
                yScaleConstant = d3.scale.linear().range(yScale.range()), //untouched scale for zoom calcs
                yTimeScale = d3.time.scale().range(yScale.range()),
                yTimeScaleConstant = d3.time.scale().range(yScale.range()),
                yZoomScale = d3.scale.linear().range(yScale.range()).domain([0,1]);

            var Py = d3.scale.linear()
                .range([Pheight + Pmargin.top, Pmargin.top]);

            var StageColor = d3.scale.ordinal()
                .domain([0, 1])
                .range(["#bdbdbd", "#636363"]); //sets the color of alternating stage profiles

            var StageToDistance = d3.scale.ordinal()
            
             //declare gloabl variables
            var dataset;
            var timegap;
            var currentStage;
            var currentDisplay = 0; //display 0 place, 1 timegap
            var maxRiders = 0; //Total number of riders starting the race
            var maxTime = 0; //current Maxtimegap
            var TotalStages = 21; //how many stages there are total
            var GConly = false; //should we zoom in on only gc riders
            var Sformat = d3.time.format("+%S")
            var Mformat = d3.time.format("+%M:%S");
            var Hformat = d3.time.format("+%H:%M:%S");
            var ToolTipFormat = d3.time.format("%-Hh %-Mm %-Ss");
            var DefaultOpacity = .4; //default opacity of rider paths
            var CurrentOpacity = .4; //current selected opacity
            var TransitionTime = 500; //default transition time
            var GCPlace = 30; //gc places to show
            var GCTime = d3.time.format("%M").parse("20"); //gc timegap to show
            
             // Functions
            var yAxis = d3.svg.axis()
                .scale(yScale)
                .orient("left");
            
            var yTAxis = d3.svg.axis()
                .scale(yTimeScale)
                .orient("left")
            .tickFormat(d3.time.format('%-Hh %-Mm'));

            var dropDownCountry = d3.select("#CountriesDrop")
                .attr("data-placeholder","Select a Country")
                .style("width","350px");
            
            var dropDownTeam = d3.select("#TeamDrop")
                .attr("data-placeholder","Select a Team")
                .style("width","350px");
            
            var dropDownRider = d3.select("#RiderDrop")
                .attr("data-placeholder","Select Riders")
                .style("width","350px");

            var ProfileSvg =d3.select("#ProfilePlot").append("svg:svg")
                .attr("width", Pwidth + Pmargin.left + Pmargin.right)
                .attr("height", Pheight + Pmargin.top + Pmargin.bottom)
                .append("svg:g");
            
            var svg = d3.select("#RiderGraph").append("svg:svg")
                .attr("width", w+ Rmargin.left+Rmargin.right)
                .attr("height", h + Rmargin.top + Rmargin.bottom)
                .append("svg:g");

             var area = d3.svg.area()
                .x(function(d) {
                    return xScale(d["TotalDistance"]);
                })
                .y0(Pheight + Pmargin.top)
                .y1(function(d) {
                    return Py(d["altitude (m)"]);
                });
            
            //Zoom & pan bar
            var svgZoom = d3.select("#ZoomBar").append("svg")
                .attr("width", 20)
                .attr("height", h + Rmargin.top + Rmargin.bottom)
            
            var brush = d3.svg.brush()
            .y(yZoomScale)
            .extent([0, 1])
            .on("brushstart", brushstart)
            .on("brush", brushmove)
            .on("brushend", brushend);
            
            var arc = d3.svg.arc()
                .outerRadius(20 / 2)
                .startAngle(-.5*Math.PI)
                .endAngle(function(d, i) { return i ? (-1.5*Math.PI) : (.5*Math.PI); });

            var brushg = svgZoom.append("g")
            .attr("class", "brush")
            .call(brush);

            brushg.selectAll(".resize").append("path")
            .attr("transform", "translate(10," +  0 + ")")
            .attr("d", arc);

            brushg.selectAll("rect")
            .attr("width", 20);

            brushstart();
            brushmove();

            function brushstart() {
            //    svg.classed("selecting", true);
                
            }

            function brushmove() {
                if ((currentDisplay == 0) && ((0!=brush.extent()[0]) || (yZoomScale.invert(yScaleConstant(GCPlace))!=brush.extent()[1]))) {
                    document.getElementById("GCcheckbox").checked=false;
                    GConly=false;
                }
                else if ((currentDisplay == 1) && ((0!=brush.extent()[0]) || (yZoomScale.invert(yTimeScaleConstant(GCTime))!=brush.extent()[1]))) {
                    document.getElementById("GCcheckbox").checked=false;
                    GConly=false;
                }
                updateData(0);
                
            }

            function brushend() {
            //    svg.classed("selecting", !d3.event.target.empty());
                updateData(0);
            }

            
            //Slider Control for Opacity
            var Smargin = {top: 10, right: 20, bottom: 15, left: 20},
                width = 200 - Smargin.left - Smargin.right,
                height = 50 - Smargin.bottom - Smargin.top;

            var xSlider = d3.scale.linear()
                .domain([0, 1])
                .range([0, width])
                .clamp(true);

            var slide = d3.svg.brush()
                .x(xSlider)
                .extent([0, 0])
                .on("brush", brushed);

            var svgSlider = d3.select("#OSlider").append("svg")
                .attr("width", width + Smargin.left + Smargin.right)
                .attr("height", height + Smargin.top + Smargin.bottom)
              .append("g")
                .attr("transform", "translate(" + Smargin.left + "," + Smargin.top + ")");

            svgSlider.append("text")
                .style("font-family", "sans-serif")
                .style("font-size", "18px")
                .style("text-anchor","middle")
                .attr("x",xSlider(.5))
                .attr("y",Smargin.top - 3)
                .text("Opacity");

            svgSlider.append("g")
                .attr("class", "SliderAxis")
                .attr("transform", "translate(0," + (height) + ")")
                .call(d3.svg.axis()
                  .scale(xSlider)
                  .tickSize(0)
                  .ticks(0))
              .select(".domain")
              .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
                .attr("class", "halo");


            var slider = svgSlider.append("g")
                .attr("class", "slider")
                .call(slide);

            slider.selectAll(".extent,.resize")
                .remove();

            slider.select(".background")
                .attr("height", height);

            var handle = slider.append("circle")
                .attr("class", "handle")
                .attr("transform", "translate(0," + (height) + ")")
                .attr("r", 9);

            slider
                .call(slide.event)
                .call(slide.extent([DefaultOpacity, DefaultOpacity]))
                .call(slide.event);

            function brushed() {
                var value = slide.extent()[0];

                if (d3.event.sourceEvent) { // not a programmatic event
                    value = xSlider.invert(d3.mouse(this)[0]);
                    slide.extent([value, value]);
                }

                handle.attr("cx", xSlider(value)); // move the handle to the current position
                CurrentOpacity = value; // store the current opacity value
                
                svg.select("g.riders").selectAll("g.EachRider").filter(function(d) {
  //                  debugger;
                    return d3.select(this).select("path").attr("brushed") != "true";
                })
                    .selectAll("path").attr("stroke-opacity", value);
                
                svg.select("g.riders").selectAll("g.EachRider").filter(function(d) {
                    return (d3.select(this).select("path").attr("brushed") != "true") && (d3.select(this).select("path").attr("status") == "Abandon");
                })
                    .selectAll("circle").attr("opacity", value);
                
            }
            //End of slider code
            
            
             //Import both datasets
            d3.csv("Data/Vuelta2015Results.csv", 
                   function(d) {  //Function to parse rider info input
                       temptime=null;
                       if (d.Gap.length <4){
                            temptime= Sformat.parse(d.Gap);
                       } else if (d.Gap.length <7){
                             temptime= Mformat.parse(d.Gap);
                       } else {
                             temptime= Hformat.parse(d.Gap);
                       }
                       if(temptime==null){
                           //Problem
                       }
                       return{
                           Country: d.Country,
                           Name: d.Name,
                           Rank: d.Rank,
                           Stage: d.Stage,
                           Team: d.Team,
                           "gap(s)": d["gap(s)"],
                           GapForm: temptime
                       };
                   }, function(dataset) { //sets rider info = dataset
                d3.csv("Data/VueltaProfile2015_Trim.csv", function(error, RawStages) {

                    var nested_data = d3.nest()
                        .key(function(d) {
                            return d.Name;
                        })
                        .entries(dataset);

                    var nested_stages = d3.nest()
                        .key(function(d) {
                            return d.StageNum;
                        })
                        .entries(RawStages);

                    currentStage = d3.max(nested_data, function(d) {
                        return d.values.length;
                    });


                    maxRiders = d3.max(dataset, function(d) {
                        return +d.Rank;
                    });
                    maxTime = d3.max(dataset, function(d) {
                        return +d["gap(s)"];
                    })
                    maxDate = d3.max(dataset, function(d) { //Max rider timegap in date format
                        return d["GapForm"];
                    });

                    StageToDistance.domain(d3.range(1, d3.max(nested_stages, function(d) {
                                    return +d.key
                                }) + 1))
                        .range(d3.map(nested_stages, function(d) {
                                len = d.values.length;
                                return +d.values[len - 1]["TotalDistance"];
                            }).keys());

                    // Compute the x-domain and y-domain 
                    //            xScale.domain([1, TotalStages]);  //even spacing
                    xScale.domain([0, d3.max(RawStages, function(d) {
                                    return +d["TotalDistance"];
                                })]);

                    yScale.domain([1, maxRiders]); //Rider Result Y scale
                    yScaleConstant.domain(yScale.domain());
                    
                    yTimeScale.domain([d3.time.format("%S").parse("0"), maxDate]); //Rider Time Scale
                    yTimeScaleConstant.domain(yTimeScale.domain());

                    Py.domain([0, d3.max(RawStages, function(d) {
                                    return +d["altitude (m)"];
                                })]).nice(); //Stage Profile Y scale

                    //Set up Drop Down Menus
                    var Countries = d3.set(nested_data.map(function(d) {
                                return d.values[0].Country;
                            })).values();
                    Countries.sort();
               //     Countries.unshift("Select a Country");

                    var TeamList = d3.set(nested_data.map(function(d) {
                                return d.values[0].Team;
                            })).values();
                    TeamList.sort();
                    TeamList.unshift("Select a Team");

                    
                    
                    var nested_team = d3.nest()
                        .key(function(d) {
                            return d.Team;
                        })
                        .sortKeys(d3.ascending)
                        .key(function(d) {
                            return d.Name;
                        })
                        .sortKeys(d3.ascending)
                        .entries(dataset);
                    
                    var RiderList = d3.set(nested_data.map(function(d) {return d.key})).values();
                    RiderList.sort();
                    RiderList.unshift("Select a Rider");

             //       dropDownCountry.append("option").attr("value","");
                    
                    dropDownCountry.selectAll("option")
                        .data(Countries)
                        .enter()
                        .append("option")
                        .text(function(d) {
                            return d;
                        })
                        .attr("value", function(d) {
                            return d;
                        });

                    $("#CountriesDrop").trigger("chosen:updated"); //make chosen update to show the options added
                //    $("#CountriesDrop").chosen({allow_single_deselect: true });
                    
                    $('#CountriesDrop').on('change', function(evt, params) {
                        var tempC = "";
                        if (params != undefined) {
                            tempC = params.selected;
                        }
                        svg.select("g.riders").selectAll("path")
                            .attr("brushed", false)
                            .attr("stroke", "black")
                            .attr("stroke-width", 1)
                            .attr("stroke-opacity",CurrentOpacity);
                        svg.select("g.riders").selectAll("circle").attr("opacity",CurrentOpacity);
                        svg.select("g.riders").selectAll("path").filter(function(v) {
                            return v.values[0].Country == tempC;
                        })
                            .attr("brushed", true)
                            .attr("stroke", "red")
                            .attr("stroke-width", 3)
                            .attr("stroke-opacity",1);
                        svg.select("g.riders").selectAll("g.EachRider").filter(function(d) {
                            return (d3.select(this).select("path").attr("brushed") == "true") && (d3.select(this).select("path").attr("status") == "Abandon");
                        })
                        .selectAll("circle").attr("opacity", 1);
                        
                        
                        document.getElementById("TeamDrop").selectedIndex = "0"; //reset other drop down
                        $("#TeamDrop").trigger("chosen:updated");
                    //    d3.select("#RiderDrop").selectAll("option").attr("selected","false");
                        $('#RiderDrop').val("");
                        $('#RiderDrop').trigger('chosen:updated');
                    });                    
                    
                    dropDownTeam.append("option")
                        .attr("value","");
                    
                    dropDownTeam.selectAll("option")
                        .data(TeamList)
                        .enter()
                        .append("option")
                        .text(function(d) {
                            return d;
                        });

                    $("#TeamDrop").trigger("chosen:updated"); //make chosen update to show the options added
                    
                    $('#TeamDrop').on('change', function(evt, params) {
                        var tempT = "";
                        if (params != undefined) {
                            tempT = params.selected;
                        }
                        svg.select("g.riders").selectAll("path")
                            .attr("brushed", false)
                            .attr("stroke", "black")
                            .attr("stroke-width", 1)
                            .attr("stroke-opacity",CurrentOpacity);
                        svg.select("g.riders").selectAll("circle").attr("opacity",CurrentOpacity);
                        svg.select("g.riders").selectAll("path").filter(function(v) {
                            return v.values[0].Team == tempT;
                        })
                            .attr("brushed", true)
                            .attr("stroke", "red")
                            .attr("stroke-width", 3)
                            .attr("stroke-opacity",1);
                        svg.select("g.riders").selectAll("g.EachRider").filter(function(d) {
                            return (d3.select(this).select("path").attr("brushed") == "true") && (d3.select(this).select("path").attr("status") == "Abandon");
                        })
                        .selectAll("circle").attr("opacity", 1);
                        
                        
                        document.getElementById("CountriesDrop").selectedIndex = "0"; //reset other drop down
                        $("#CountriesDrop").trigger("chosen:updated"); //make chosen update
                        $('#RiderDrop').val("");
                        $('#RiderDrop').trigger('chosen:updated');
                    });

                    dropDownRider
                        .append("option")
                        .attr("value","");
                    
                    dropDownRider.selectAll("optgroup")
                        .data(nested_team)
                        .enter()
                        .append("optgroup")
                        .attr("label",function(d) {
                            return d.key;
                        })
                        .selectAll("option")
                        .data(function(d) {
                            return d.values;
                        })
                        .enter()
                        .append("option")
                        .text(function(j) {
                            return j.key;
                        })
                        .attr('value',function(j) {
                            return j.key;
                        });
                    
                //    $("#RiderDrop").chosen({max_selected_options: 2 });
                    $("#RiderDrop").trigger("chosen:updated");
                    
                    $('#RiderDrop').on('change', function(evt, params) {
                        var tempR = params.selected;
                        svg.select("g.riders").selectAll("path")
                            .attr("brushed", false)
                            .attr("stroke", "black")
                            .attr("stroke-width", 1)
                            .attr("stroke-opacity",CurrentOpacity);
                        svg.select("g.riders").selectAll("circle").attr("opacity",CurrentOpacity); //reset abandon circle
                        svg.select("g.riders").selectAll("path").filter(function(v) {
                            return $.inArray(v.key, $('#RiderDrop').val()) >=0;
                        })
                            .attr("brushed", true)
                            .attr("stroke", "red")
                            .attr("stroke-width", 3)
                            .attr("stroke-opacity",1);
                        svg.select("g.riders").selectAll("g.EachRider").filter(function(d) {
                            return (d3.select(this).select("path").attr("brushed") == "true") && (d3.select(this).select("path").attr("status") == "Abandon");
                        })
                        .selectAll("circle").attr("opacity", 1);
                        
                        document.getElementById("CountriesDrop").selectedIndex = "0"; //reset other drop down
                        $("#CountriesDrop").trigger("chosen:updated"); //make chosen update
                        document.getElementById("TeamDrop").selectedIndex = "0"; //reset other drop down
                        $("#TeamDrop").trigger("chosen:updated"); //make chosen update
                    });
                    
                    //Draw Stage Profile data
                    var stages = ProfileSvg.append("svg:g")
                        .attr("class", "stages")
                        .selectAll("path")
                        .data(nested_stages)
                        .enter()
                        .append("svg:g")
                        .attr("id", "stagegroup")
                        .append("path")
                        .attr("d", function(d) {
                            d.area = this;
                            return area(d.values);
                        })
                        .attr("fill", function(d) {
                            return StageColor(d.key % 2); // test stage number even odd to choose fill
                        })
                        .attr("stroke", function(d) {
                            return d3.rgb(StageColor(d.key % 2)).darker(); // test stage number even odd to choose fill
                        })
                        .attr("stroke-width", 1.5);


                    //Draw invisible mouseover rectangles for each stage profile  
                    d3.selectAll("g#stagegroup").append("rect")
                        .attr("y", Pmargin.top)
                        .attr("x", function(d) {
                            return xScale(d.values[0]["TotalDistance"]);
                        })
                        .attr("height", Pheight)
                        .attr("width", function(d) {
                            len = d.values.length - 1;
                            //         console.log(d.values[len]["distance (km)"]);
                            return xScale(d.values[len]["distance (km)"]) - Pmargin.left;
                        })
                        .style("fill", "none");
                    /*
                        .attr("pointer-events", "all")
                        .on("mouseover", function() {
                            //modal code
                            d3.select(this).classed("hover", true);
                            })
                        .on("mouseout", function() {
                            d3.select(this).classed("hover", false);
                        });
                    */ 
                    
                    
                    //Add text labels for each stage
                    d3.selectAll("g#stagegroup").append("text")
                        .style("font-family", "sans-serif")
                        .style("font-size", "16px")
                        .style("text-anchor","middle")
                        .attr("y",Pmargin.top+Pheight+Pmargin.bottom)
                        .attr("x",function(d){
                            middlestage = Math.round(d.values.length/2);
                            return xScale(d.values[middlestage]["TotalDistance"]);
                        })
                        .text(function(d){
                            return d.key;
                        });
                    
                    //Add Axis label
                    ProfileSvg.append("text")
                        .style("font-family", "sans-serif")
                        .style("font-size", "16px")
                        .style("text-anchor","middle")
                        .attr("y",13)
                        .attr("x",xScale(xScale.domain()[1]/2))
                        .text("Total Distance & Stage Profile");
                    
                    //Label TT stages
                    ProfileSvg.append("text")
                        .style("font-family", "sans-serif")
                        .style("font-size", "16px")
                        .style("text-anchor","middle")
                        .attr("transform","translate(12,0) rotate(-90," + xScale(StageToDistance(1))+",50)")
                        .attr("y",50)
                        .attr("x",xScale(StageToDistance(1)))
                        .text("TTT");
                              
                    ProfileSvg.append("text")
                        .style("font-family", "sans-serif")
                        .style("font-size", "16px")
                        .style("text-anchor","middle")
                        .attr("y",30)
                        .attr("x",xScale(StageToDistance(17)))
                        .attr("transform","rotate(-90," + xScale(StageToDistance(17))+",30)")
                        .text("ITT");

                    //Draw Y axis for stage profile data
                    ProfileSvg.append("g")
                        .attr("class", "axis axis--y")
                        .attr("transform", "translate(" + (Pmargin.left - 25) + ",0)")
                        .call(d3.svg.axis() //hello world, trying to fix this code
                        .scale(Py)
                        .orient("left")
                        .ticks(3)
                        .innerTickSize(0)  //-(Pwidth + Pmargin.left + Pmargin.right)
                        .outerTickSize(0))
                        .append("text")
                        .attr("transform", "translate(" + (-Pmargin.left *(2/3)) + "," + (Pheight / 2 + Pmargin.top) + ") " + "rotate(-90)")
                        .attr("x", 4)
                        .attr("dy", ".32em")
                        .attr("text-anchor", "middle")
                        .attr("font-size", "16px")
                        .text("Elevation (m)");

                     //Hide Profile Y Axis line
                    d3.select("#ProfilePlot").select("g.axis--y").selectAll("path").remove();

                    //Draw Rider Results
                    var riders = svg.append("svg:g")
                        .attr("class", "riders")
                        .selectAll("path")
                        .data(nested_data)
                        .enter()
                        .append("g")
                        .attr("class","EachRider")
                        .append("path")
                        .attr("brushed", false) //default brushing tracker to false
                    .attr("name", function(d) {
                        return d.key;
                    })
                        .attr("team", function(d) {
                            return d.values[0].Team;
                        })
                        .attr("country", function(d) {
                            return d.values[0].Country;
                        })
                        .attr("d", function(d) {
                            return PathString(d.values.map(function(v) {
                                        return v.Rank;
                                    }))
                        })
                        .attr("stroke", "black")
                        .attr("stroke-width", 1)
                        .attr("stroke-opacity", DefaultOpacity)
                        .attr("fill", "none")
                        .attr("place", function(d) {
                                return d.values[d.values.length-1].Rank
                        })
                        .attr("timegap", function(d) {
                                return d.values[d.values.length-1]["GapForm"]
                        })
                        .attr("status", function(d) {
                            if (typeof d.values[currentStage - 1] == 'undefined') {
                                return "Abandon"
                            } else {
                                return "Still Riding"
                            }
                        })
                        .on('mouseover', function(d) {

                            //Get this bar's x/y values, then augment for the tooltip

                            var Rider = d3.select(this).attr("name");
                            var Place = d3.select(this).attr("place");
                            var cGap = new Date(d3.select(this).attr("timegap"));
                  //          var xPosition = xScale(StageToDistance(currentStage)) + 0 + svgSlider.node().getBoundingClientRect().width - window.pageXOffset;
                            var xPosition = xScale(StageToDistance(currentStage)) + $("#RiderGraph").position().left +20;
                        //    var xPosition = xScale(StageToDistance(currentStage)) + 0 + d3.select("#RiderGraph").node().getBoundingClientRect().left + window.pageXOffset;
                            var yPosition = 0;

                            if (currentDisplay == 0) {
                                //       console.log("stage data")
                               // yPosition = yScale(Place)+d3.select("#RiderGraph").node().getBoundingClientRect().top + window.pageYOffset;
                                yPosition = yScale(Place);
                            } else if (currentDisplay == 1) {
                                //      console.log("time data")
                             //   yPosition = yTimeScale(cGap) + d3.select("#RiderGraph").node().getBoundingClientRect().top + window.pageYOffset;
                                yPosition = yTimeScale(cGap);
                            }
                            //if tooltip will be off the screen move it back up
                            if (yPosition > (h+Rmargin.top)){
                                yPosition = h+Rmargin.top-20;
                            }
                            yPosition = yPosition +$("#RiderGraph").position().top;
//debugger;
                            //Update the tooltip position and value
                            d3.select("#tooltip1a")
                                .style("left", xPosition + "px")
                                .style("top", yPosition - 60 + "px")
                                .select("#place")
                                .text(Place);
                            d3.select("#tooltip1a")
                                .select("#name")
                                .text(Rider);
                            d3.select("#tooltip1a")
                                .select("#timegap")
                                .text(ToolTipFormat(cGap));
                            d3.select("#tooltip1a")
                                .select("#Team")
                                .text(d3.select(this).attr("team"));
                            d3.select("#tooltip1a")
                                .select("#Country")
                                .text(d3.select(this).attr("country"));
                            //Show the tooltip
                            d3.select("#tooltip1a").classed("hidden1a", false);

                            //highlight the path
                            d3.select(this).attr("stroke-width", 5)
                                .attr("stroke-opacity",1);
                        })
                        .on('mouseout', function() {
                            //Hide the tooltip
                            d3.select("#tooltip1a").classed("hidden1a", true);
                            if (d3.select(this).attr("brushed") == "true") {
                                d3.select(this).attr("stroke-width", 3);
                            } else {
                                d3.select(this).attr("stroke-width", 1)
                                    .attr("stroke-opacity",CurrentOpacity);
                            }
                        })
                        .each(function(d){ //if they have abandoned add mark
                            if((d.values.length < currentStage)&&(d.values.length>1)){
                                d3.select(this.parentNode)
                                    .append("circle")
                                    .attr("class","AbandonMark")
                                    .attr("r", 2)
                                    .attr("cx",xScale(StageToDistance(d.values.length)))
                                    .attr("cy",yScale(d.values[d.values.length-1].Rank))
                                    .style("fill","black");
                            }
                        });
  

                    // Draw Rider Y axis
                    svg.append("g")
                        .attr("class", "Rider axis")
                        .call(yAxis)
                        .attr("transform", "translate(" + Rmargin.left + ",0)")
                        .append("text")
                        .attr("class", "yaxis_label")
                        .attr("transform", "translate(-" + (Rmargin.left-12) + "," + ((h - Rmargin.top - Rmargin.bottom) / 2 + Rmargin.bottom) + ") rotate(-90)") //move label
                        .attr("dy", ".71em")
                        .style("text-anchor", "middle")
                        .style("font-size", "20px")
                        .text("Place");
                        
                    svg.select(".Rider.axis").selectAll(".tick")  //Hide the 0 mark for the rider y axis
                        .filter(function(d) {
                            return d===0;
                        })
                        .attr("visibility","hidden");



                });
            });

             //function to switch y axis units

            function updateData(Ttime) {
                if (currentDisplay == 0) { //by rank view
                    //       console.log("stage data")
                    if (! GConly) {
                    //    yScale.domain([1, maxRiders]);
                        yScale.domain([yScaleConstant.invert(yZoomScale(brush.extent()[0])),yScaleConstant.invert(yZoomScale(brush.extent()[1]))]);
                    }else {
                        yScale.domain([1,GCPlace]);
                    }

                    svg.select("g.riders").selectAll("path")
                        .transition()
                        .duration(Ttime)
                        .attr("d", function(d) {
                            return PathString(d.values.map(function(v) {
                                        return v.Rank;
                                    }))
                        });
                    svg.select("g.riders").selectAll("circle") //move the abandon marks
                        .transition()
                        .duration(Ttime)
                        .attr("cy", function(d) {
                            return yScale(d.values[d.values.length-1].Rank);
                        });
                    svg.select(".Rider.axis")  //y.axis
                    .transition()
                    .duration(Ttime)
                    .call(yAxis)
                    .select(".yaxis_label")
                    .text("Place");
                } else if (currentDisplay == 1) {  //display time time
                    if (! GConly) {
                       // yTimeScale.domain([d3.time.format("%S").parse("0"), maxDate]);
                       yTimeScale.domain([yTimeScaleConstant.invert(yZoomScale(brush.extent()[0])),yTimeScaleConstant.invert(yZoomScale(brush.extent()[1]))]); 
                    }else { 
                        yTimeScale.domain([d3.time.format("%S").parse("0"), GCTime]);
                    }

                    svg.select("g.riders").selectAll("path")
                        .transition()
                        .duration(Ttime)
                        .attr("d", function(d) {
                            return PathString(d.values.map(function(v) {
                                        return v["GapForm"];
                                    }))
                        });
                    svg.select("g.riders").selectAll("circle")  //move the abandon marks
                        .transition()
                        .duration(Ttime)
                        .attr("cy", function(d) {
                            return yTimeScale(d.values[d.values.length-1]["GapForm"]);
                        });
                    
                    svg.select(".Rider.axis")  //y.axis
                    .transition()
                    .duration(Ttime)
                    .call(yTAxis)
                    .select(".yaxis_label")
                    .text("Time Gap");
                }

                
                svg.select(".Rider.axis").selectAll(".tick")  //Hide the 0 mark for the rider y axis
                        .filter(function(d) {
                            return d===0;
                        })
                        .attr("visibility","hidden");
            }

            function GCfunction(status) {
                GConly = status;
                if (status && (currentDisplay == 0)) {
                    //code to run if gc is being turned on w/place
                    brush.extent([0,yZoomScale.invert(yScaleConstant(GCPlace))]);
                }
                else if (status && (currentDisplay == 1)) {
                    //code to run if gc is being turned on w/ timgegap
                    brush.extent([0,yZoomScale.invert(yTimeScaleConstant(GCTime))]);
                }
                else if(!status) {
                    //if button gets unchecked go back to full display
                    brush.extent([0,1]);        
                }
                brush(d3.select(".brush").transition().duration(TransitionTime));
                brush.event(d3.select(".brush"));
                
                updateData(TransitionTime);
            }

             //Function to create path string

            function PathString(DataTest) {
                if (DataTest.length==1){
                    return ""
                }
                
                if (currentDisplay == 0) { //Rank scale
                    var Pstring = "M " + xScale(StageToDistance(1)) + " " + yScale(DataTest[0]);
                  //  debugger;
                    for (var i = 2; i <= currentStage; i++) {
                        if (!(isNaN(+DataTest[i-1]))) {
                            Pstring = Pstring + " L " + xScale(StageToDistance(i)) + " " + yScale(DataTest[i-1]);
                        } else {
                            break
                        }
                    }
                    return Pstring
                }
                else if (currentDisplay ==1) { //Timescale
                    var Pstring = "M " + xScale(StageToDistance(1)) + " " + yTimeScale(DataTest[0]);
                  //  debugger;
                    for (var i = 2; i <= currentStage; i++) {
                        if (!(isNaN(+DataTest[i-1]))) {
                            Pstring = Pstring + " L " + xScale(StageToDistance(i)) + " " + yTimeScale(DataTest[i-1]);
                        } else {
                            break
                        }
                    }
                    return Pstring
                }
            }
            //Initilize Chosen plugin
            var config = {
              '.chosen-select'           : {max_selected_options: 10 },
              '.chosen-select-deselect'  : {allow_single_deselect:true},
              '.chosen-select-no-single' : {disable_search_threshold:10},
              '.chosen-select-no-results': {no_results_text:'Oops, nothing found!'},
              '.chosen-select-width'     : {width:"95%"}
            }
            for (var selector in config) {
              $(selector).chosen(config[selector]);
            }