(function () {
  'use strict';

  angular.module('populationioApp')
    .directive('peopleGrid', function (PeopleGridService, PopulationIOService, Celebrities, ProfileService, $timeout) {
      return {
        restrict: 'E',
        scope: {
          rankLocal: "=",
          rankLocalTotal: "=",
          rankGlobal: "=",
          rankGlobalTotal: "="
        },
        link: function ($scope, element) {
          var personWidth = 30,
            personHeight = 50,
            parentWidth = 1200,
            parentHeight = 650,
            person,
            celebTooltip,
            celebTooltipTitle,
            celebTooltipDetails,
            celebTooltipRank,
            grid,
            celebsBar,
            prevCelebsButton,
            nextCelebsButton,
            personNavRect,
            celebsRoll,
            rankScale,
            rankScale2,
            birthdayScale,
            celebTooltipPointerShadow,
            celebTooltipPointer,
            lens,
            youXPosition = _.random(40, 140),
            gridRows = 8,
            gridCols = 32,

            blockSize = 2,
            navWidth = 180,
            navHeight = 400,
            lensWidth = gridCols * blockSize - 1,
            lensHeight = gridRows * (blockSize + 1)

            ;

          var chart = d3.select(element[0])
            .append('svg')
            .attr({width: parentWidth, height: parentHeight})
            .append('g')
            .attr({transform: 'translate(0,0)'});

          var roundedCornersClip = chart.append("defs").append("svg:clipPath")
            .attr("id", "rounded-corners-clip")
            .append("circle")
            .attr("id", "clip-circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 20);

          $scope.$watch('rankLocal', function(rank) {
            if (rank) {
              _updateLocalBar(rank, $scope.rankLocalTotal);
            }
          });

          $scope.$watch('rankGlobal', function(rank) {
            if (rank) {
              _updateGlobalBar(rank, $scope.rankGlobalTotal);
            }
          });

          var _updateLocalBar = function(rank, rankTotal) {
            var bar = chart.select('.bar.local'),
              width = parseInt((rank/rankTotal) * parentWidth, 0),
              ticks = 5;

            bar.select('rect.highlight')
              .transition()
              .duration(1000)
              .attr({
                width: width
              });
            bar.select('text')
              .text(parseInt(100 * rank/rankTotal, 0) + '%')
              .transition()
              .duration(1000)
              .attr({
                x: width
              });

            var xScale = d3.scale.linear()
              .domain([0, rankTotal])
              .range([0, parentWidth]);

            var xAxis = d3.svg.axis()
              .scale(xScale)
              .orient('bottom')
              .ticks(ticks);

            bar.select('.x-axis')
              .call(xAxis)
              .selectAll('.tick')
              .attr({
                'class': function(d, i) {
                  var className = 'tick';
                  if (i === 0) {
                    className += ' first';
                  }
                  if (i === ticks - 1) {
                    className += ' last';
                  }
                  return className;
                }
              });
          };

          var _updateGlobalBar = function(rank, rankTotal) {
            var bar = chart.select('.bar.world'),
              width = (rank/rankTotal) * parentWidth,
              ticks = 5;

            bar.select('rect.highlight')
              .transition()
              .duration(1000)
              .attr({
                width: width
              });
            bar.select('.percent')
              .text(parseInt(100 * rank/rankTotal, 0) + '%')
              .transition()
              .duration(1000)
              .attr({
                x: width
              });

            var xScale = d3.scale.linear()
              .domain([0, rankTotal])
              .range([0, parentWidth]);

            var xAxis = d3.svg.axis()
              .scale(xScale)
              .orient('top')
              .ticks(ticks);

            bar.select('.x-axis')
              .call(xAxis)
              .selectAll('.tick')
              .attr({
                'class': function(d, i) {
                  var className = 'tick';
                  if (i === 0) {
                    className += ' first';
                  }
                  if (i === ticks - 1) {
                    className += ' last';
                  }
                  return className;
                }
              });
          };

          var _buildBarChart = function () {
            var barHeight = 17;

            var barChart = chart.append('g')
              .attr('class', 'bar-chart');

            var worldBar = barChart.append('g')
              .attr('class', 'bar world');

            worldBar.append('rect')
              .attr({
                height: barHeight,
                width: parentWidth
              });
            worldBar.append('rect')
              .attr({
                'class': 'highlight',
                height: barHeight,
                width: 0
              });
            worldBar.append('text')
              .text('0%')
              .attr({
                'class': 'percent',
                x: 0
              });
            worldBar.append('g')
              .attr('class', 'x-axis');

            var localBar = barChart.append('g')
              .attr('class', 'bar local');

            localBar.append('rect')
              .attr({
                height: barHeight,
                width: parentWidth
              });
            localBar.append('rect')
              .attr({
                class: 'highlight',
                height: barHeight,
                width: 0
              });
            localBar.append('text')
              .text('0%')
              .attr({
                'class': 'percent',
                x: 0
              });
            localBar.append('g')
              .attr('class', 'x-axis');
          };

          var _buildNavigator = function () {

            var celebs = Celebrities.all();
            var blockData = [];
            var _worldPopulation = PopulationIOService.getWorldPopulation();


            rankScale = d3.time.scale()
              .domain([new Date('1920-01-01'), new Date()])
              .range([_worldPopulation, 0]);

            rankScale2 = d3.scale.linear()
              .domain([_worldPopulation, 0])
              .range([new Date('1920-01-01'), new Date()])
            ;


//            console.log(rankScale(new Date('1920-01-01')))
//            console.log(parseInt(rankScale(new Date('1983-08-03'))))
            var nav = chart.append('g')
              .attr('class', 'navigator');

            for (var i = 0; i < navHeight / 3 + 1; i++) {
              blockData.push(i * 2)
            }
            var peopleInOneRow = _worldPopulation / blockData.length

            var yScale = d3.scale.linear()
              .domain([_worldPopulation, 0])
              .range([0, navHeight])
            var yScale2 = d3.scale.linear()
              .domain([0, navHeight])
              .range([_worldPopulation, 0])
            birthdayScale = d3.time.scale()
              .domain([new Date('1920-01-01'), new Date()])
              .range([0, navHeight])

            var xScale = d3.scale.linear()
              .domain([peopleInOneRow, 0 ])
              .range([0, navWidth - 2])
            var xScale2 = d3.scale.linear()
              .domain([0, navWidth - 2])
              .range([peopleInOneRow, 0 ])

            nav.append('rect')
              .attr({
                class: 'frame',
                height: navHeight + lensHeight,
                width: navWidth
              });

            var blocksArea = nav
              .append('g')
              .attr({class: 'blocks', transform: 'translate(1,1)'})
            var personsArea = nav
              .append('g')
              .attr({class: 'persons', transform: 'translate(1,1)'})

            blocksArea.selectAll('.block')
              .data(blockData)
              .enter()
              .append('rect')
              .attr({
                'data-range': yScale2,
                class: 'block',
                height: 2,
                width: function (d, i) {
                  if (i == blockData.length - 1) {
                    return xScale(10000000)
                  }
                  else {
                    return navWidth - 2
                  }

                },
                transform: function (d, i) {

                  return 'translate(' + [0, i * 3] + ')'
                }
              });
            personsArea.selectAll('.person')
              .data(celebs)
              .enter()
              .append('rect')
              .attr({
                'data-range': yScale2,
                fill: '#999',
                class: 'person',
                height: 2,
                width: 2,
                x: function () {return _.random(0, 180)},
                y: function (d, i) {return yScale(rankScale(new Date(d.bday)))}
              });
            personNavRect = blocksArea.append('rect')
              .attr({
                'data-range': yScale2,
                'class': function() {
                  return 'person me ' + ProfileService.gender;
                },
                height: 2,
                width: 2,
                x: youXPosition,
                y: yScale(rankScale(new Date(ProfileService.birthday)))
              });

            var startRank, endRank;
            var drag = d3.behavior.drag()
              .on('drag', function () {
                var x = Math.max(0, Math.min(navWidth - lensWidth, d3.event.x - lensWidth / 2));
                var y = Math.max(0, Math.min(navHeight, d3.event.y - lensHeight / 2));

                this.x = x;
                this.y = y;
//                startRank = parseInt(xScale2(x + lensWidth) + yScale2(y + lensHeight))
//                startRank = parseInt(xScale2(x + lensWidth) + yScale2(y + lensHeight)) - parseInt(xScale2(x) + yScale2(y));
//                console.log(x, y)
//                console.log(x + lensWidth, y + lensHeight)
                startRank = parseInt(xScale2(x) + yScale2(y));
                endRank = parseInt(startRank + peopleInOneRow * 2)

                d3.select(this).select('rect').attr({x: x, y: y});
              })
              .on('dragstart', function () {
                _fadeGrid();

              })
              .on('dragend', function () {
                _updateGrid();
              });


            lens = nav.append('g')
              .attr({
                class: 'lens'
              })
              .call(drag);

            lens.append('rect')
              .attr({
                width: lensWidth,
                height: lensHeight,
                rx: 2,
                x: function () {return youXPosition - lensWidth / 2},
                y: function () {return birthdayScale(new Date(ProfileService.birthday)) - lensHeight / 2}

              });
          };

          var _initGrid = function () {
            var startRank = parseInt(rankScale(new Date(ProfileService.birthday)))

            chart.select('.grid').remove();

            grid = chart.append('g')
              .attr({
                transform: 'translate(0, 100)',
                class: 'grid'
              });

            var data = [];

            var xScale = d3.scale.linear()
              .domain([0, gridCols])
              .range([0, personWidth * gridCols]);
            var yScale = d3.scale.linear()
              .domain([0, gridRows])
              .range([0, personHeight * gridRows]);

            var currentY, prevY, x;
            for (var i = 0; i < gridCols * gridRows; i++) {
              prevY = Math.floor((i - 1) / gridCols);
              currentY = Math.floor(i / gridCols);
              if (prevY != currentY) {
                x = 0
              }
              else {
                x++
              }
              data.push({
                name: 'Unknown',
                id: i,
                rank: startRank++,
                y: Math.floor(i / gridCols),
                x: x,
                gender: ['male', 'female'][_.random(0, 1)]
              })
            }
            var personsArea = grid.append('g').attr('class', 'persons-area');
            person = personsArea.selectAll('.person')
              .data(data)
              .enter()
              .append('g')
              .attr({
                'data-rank': function (d, i) {
                  return d.rank
                },
                opacity: 1,
                class: 'person',
                transform: function (d, i) {
                  return 'translate(' + [xScale(d.x), yScale(d.y)] + ')';
                }

              });
            person.on('mouseenter', function (d, i) {
              var personItem = this;
              d3.select(personItem).selectAll('path').transition()
                .style('fill', '#21edff')

              celebTooltip
                .attr({
                  opacity: function () {
                    if (d3.select(personItem).classed('celeb') || d3.select(personItem).classed('me')) {
                      return 1
                    }
                    else {
                      return 0
                    }
                  }
                })
//              console.log(xScale(d.x))

              if (xScale(d.x) < 150) {
                celebTooltip.attr({
                  transform: 'translate(' + [xScale(d.x) - (150 - personWidth / 2) + 120, yScale(d.y) + personHeight + 30] + ')'
                })
                celebTooltipPointerShadow.attr({
                  transform: 'translate(32,-18) rotate(45)'
                })
                celebTooltipPointer.attr({
                  transform: 'translate(30,-18) rotate(45)'
                })
              }
              else {
                celebTooltip.attr({
                  transform: 'translate(' + [xScale(d.x) - (150 - personWidth / 2), yScale(d.y) + personHeight + 30] + ')'
                })
                celebTooltipPointerShadow.attr({
                  transform: 'translate(152,-18) rotate(45)'
                })
                celebTooltipPointer.attr({
                  transform: 'translate(150,-18) rotate(45)'
                })


              }
              celebTooltipTitle.text(function () {
                return d.name
              })
              celebTooltipDetails.text(function () {
//                return d.gender + ', ' + d.country + ', ' + d.birthday
                return d.country + ', ' + d.birthday
              })
              celebTooltipRank.text(function () {
                return d.rank
              })
            });
            person.on('mouseleave', function (d, i) {
              d3.select(this).selectAll('path').transition().style('fill', function (d, i) {
                return ''
              })

              celebTooltip
                .attr({
                  opacity: 0,
                  transform: 'translate(-200,-200)'})
            })
//            person.append('rect').attr({width: personWidth, height: personHeight}).style('fill', 'rgba(0,0,0,0.05)')

            person.append('rect')
              .attr({
                width: personWidth,
                height: personHeight,
                class: 'background-area'

              })
              .style('fill', 'transparent');
            var icon = person.append('g')
              .attr({
                class: 'icon',
                transform: 'translate(7.5,10)'
              });
            var maleIcon = icon.append('g')
              .attr('class', 'male')
              .attr('opacity', function (d, i) {
                return d.gender == 'male' ? 1 : 0;
              });
            var femaleIcon = icon.append('g')
              .attr('class', 'female')
              .attr('opacity', function (d, i) {
                return d.gender == 'female' ? 1 : 0;
              });

            maleIcon.append('path').attr('d', 'M7.5,5.809c-0.869,0-1.576-0.742-1.576-1.654c0-0.912,0.707-1.653,1.576-1.653 c0.87,0,1.577,0.742,1.577,1.653C9.077,5.067,8.369,5.809,7.5,5.809z')
            maleIcon.append('path').attr('d', 'M11.997,16.187c0,0.522-0.405,0.946-0.903,0.946h-0.453V9.59H9.75v16.96c0,0.522-0.405,0.946-0.903,0.946 c-0.493,0-0.895-0.416-0.903-0.931c0-0.005,0-0.01,0-0.015c0-0.004,0-0.009,0-0.012V16.187H7.054v10.364c0,0.006,0,0.01,0,0.015 c-0.007,0.515-0.41,0.931-0.903,0.931c-0.498,0-0.902-0.424-0.902-0.946V9.59H4.358v7.542H3.905c-0.498,0-0.902-0.424-0.902-0.946 V9.119c0-1.301,1.009-2.36,2.25-2.36h4.493c1.241,0,2.251,1.058,2.251,2.36L11.997,16.187L11.997,16.187z')

            femaleIcon.append('path').attr('d', 'M7.025,20.425v6.123c0,0.005,0,0.01,0,0.015c-0.008,0.515-0.437,0.931-0.964,0.931 c-0.531,0-0.963-0.424-0.963-0.946v-6.123c0-0.001,0-0.002,0-0.004h1.927C7.025,20.422,7.025,20.423,7.025,20.425z')
            femaleIcon.append('path').attr('d', 'M9.903,20.425v6.123c0,0.522-0.432,0.946-0.964,0.946c-0.526,0-0.955-0.416-0.963-0.931 c0-0.005,0-0.009,0-0.015c0-0.004,0-0.008,0-0.012v-6.111c0-0.001,0-0.002,0-0.004h1.927C9.903,20.422,9.903,20.423,9.903,20.425z')
            femaleIcon.append('path').attr('d', 'M11.777,16.874l-1.792-7.39L9.059,9.7l2.374,9.787H3.542L5.916,9.7L4.99,9.484l-1.79,7.384l-0.472-0.111 c-0.517-0.121-0.837-0.631-0.714-1.139l1.711-7.048c0,0,0,0,0.001-0.001c0.259-1.065,1.22-1.808,2.336-1.808h2.878 c1.117,0,2.078,0.744,2.337,1.809l0,0l1.711,7.046c0,0,0,0,0,0.001c0.123,0.508-0.197,1.019-0.714,1.139L11.777,16.874z')
            femaleIcon.append('path').attr('d', 'M7.501,5.812c-0.928,0-1.683-0.741-1.683-1.653c0-0.911,0.755-1.653,1.683-1.653 c0.928,0,1.683,0.741,1.683,1.653C9.184,5.071,8.429,5.812,7.501,5.812z')

          };
          var _fadeGrid = function () {
            grid.selectAll('.person')
              .transition()
              .attr('opacity', 0.2);
          };
          var _updateGrid = function (startRank, endRank) {

//            console.log(startRank)
//            console.log(endRank)
//
//            console.log(new Date(rankScale2(startRank)))
//            console.log(new Date(rankScale2(endRank)))
//

            grid.selectAll('.person')
              .transition()
              .attr('opacity', 1);

            _loadActiveCelebrities();
            _loadProfilePerson();

          };

          function _initCelebTooltip() {
            celebTooltip = grid.append('g')
              .attr({
                class: 'celeb-tooltip',
                transform: 'translate(-200,-200)'
              });
            celebTooltip.append('rect')
              .style('fill', 'rgba(0,0,0,0.2)')
              .attr({
                class: 'box-shadow',
                width: 300,
                height: 100,
                rx: 10,
                ry: 10,
                x: 2,
                y: 2
              })
            celebTooltipPointerShadow = celebTooltip.append('rect')
              .style('fill', 'rgba(0,0,0,0.2)')
              .attr({
                class: 'pointer-shadow',
                width: 40,
                height: 40,
                rx: 5,
                ry: 5,
                transform: 'translate(154,-18) rotate(45)'
              })

            celebTooltip.append('rect')
              .style('fill', '#ff6')
              .attr({
                width: 300,
                height: 100,
                rx: 10,
                ry: 10
              })
            celebTooltipPointer = celebTooltip.append('rect')
              .style('fill', '#ff6')
              .attr({
                class: 'pointer',
                width: 40,
                height: 40,
                rx: 5,
                ry: 5,
                transform: 'translate(150,-20) rotate(45)'
              })
            celebTooltip.append('line')
              .style({
                stroke: 'rgba(0,0,0,0.2)',
                'stroke-width': 1
              })
              .attr({
                x1: 60,
                y1: 60,
                x2: 280,
                y2: 60
              })
            celebTooltipTitle = celebTooltip.append('text')
              .attr({
                class: 'celeb-tooltip-title',
                transform: 'translate(60,30)'
              })
              .text('')
            celebTooltipDetails = celebTooltip.append('text')
              .attr({
                class: 'celeb-tooltip-details',
                transform: 'translate(60,50)'
              })
              .text('')
            celebTooltipRank = celebTooltip.append('text')
              .attr({
                class: 'celeb-tooltip-rank',
                transform: 'translate(60,80)'
              })
              .text('')

          }

          function _loadProfilePerson() {

            var profilePerson = d3.select(person[0][142]);

            var startX = parseInt(lens.select('rect').attr('x'));
            var startY = parseInt(lens.select('rect').attr('y'));

            var endX = parseInt(lens.select('rect').attr('x')) + lensWidth;
            var endY = parseInt(lens.select('rect').attr('y')) + lensHeight;

            var personX = parseInt(personNavRect.attr('x'))
            var personY = parseInt(personNavRect.attr('y'))

            profilePerson.select('.icon .male').attr('opacity', function (d, i) {
              return d.gender == 'male' ? 1 : 0;
            });
            profilePerson.select('.icon .female').attr('opacity', function (d, i) {
              return d.gender == 'female' ? 1 : 0;
            })


            if ((personX >= startX && personX <= endX) && (personY >= startY && personY <= endY)) {

              profilePerson.data()[0]['birthday'] = moment(ProfileService.birthday).format('Do MMM, YYYY')
              profilePerson.data()[0]['name'] = 'You'
              profilePerson.data()[0]['country'] = ProfileService.country
              profilePerson.data()[0]['gender'] = ProfileService.gender
              profilePerson.classed('me', true)
              profilePerson.classed(ProfileService.gender, true)

            }
            else {
//              console.log(0)
              profilePerson.classed('me', false)
              profilePerson.classed('female', false)
              profilePerson.classed('male', false)
            }


          }

          function _loadCelebrities(startRank, endRank) {
            var celebs = Celebrities.getRange(ProfileService.birthday, 5);
            person.each(
              function (d, i) {

                var celeb = _.find(celebs, function (item) {
//                  console.log(parseInt(rankScale(new Date(item.bday))), d.rank);
                  return parseInt(rankScale(new Date(item.bday))) == d.rank;
                });
                var _person = d3.select(this);
                if (celeb) {

                  d.gender = celeb.gender;
                  d.name = celeb.name;
                  d.birthday = celeb.birthday;
                  d.country = celeb.country;
                  d.rank = parseInt(rankScale(new Date(celeb.birthday)))
                  _person.classed('celeb', true)
                  _person.selectAll('path').style('fill', '#333')
                  _person.select('.icon .male').attr('opacity', function (d, i) {
                    return d.gender == 'male' ? 1 : 0;
                  });
                  _person.select('.icon .female').attr('opacity', function (d, i) {
                    return d.gender == 'female' ? 1 : 0;
                  })
                }
                else {
                  _person.classed('celeb', false)
                  _person.selectAll('path').style('fill', '')
                }

              })
          }

          function _loadActiveCelebrities() {
            var persons = d3.select('.persons').selectAll('.person');
            var startX = parseInt(lens.select('rect').attr('x'));
            var startY = parseInt(lens.select('rect').attr('y'));

            var endX = parseInt(lens.select('rect').attr('x')) + lensWidth;
            var endY = parseInt(lens.select('rect').attr('y')) + lensHeight;

            var activeCelebs = _.filter(persons[0], function (person) {
              var personX = parseInt(d3.select(person).attr('x'))
              var personY = parseInt(d3.select(person).attr('y'))
              return (personX >= startX && personX <= endX) && (personY >= startY && personY <= endY)
            })

            var emptyCells = new Array(person[0].length - activeCelebs.length)
            for (var i = 0; i < activeCelebs.length; i++) {
              emptyCells.push(i);
            }
            var randomizedGrid = _.shuffle(emptyCells)

            person.each(function (d, i) {

              if (randomizedGrid[i] && i != 142) {
                var a = d3.selectAll(activeCelebs).filter(function (d, n) { return n == randomizedGrid[i] })
                if (!_.isEmpty(a.data())) {
                  d.name = a.data()[0].name;
                  d.country = a.data()[0].country;
                  d.birthday = moment(a.data()[0].bday).format('Do MMM, YYYY');
                  d.gender = '';
                }
                d3.select(this).classed('celeb', true)
              }
              else if (i == 142) {
                d3.select(this).classed('celeb', false)
                d3.select(this).classed('me', true)
                d.name = 'You';
                d.country = ProfileService.country;
                d.birthday = moment(ProfileService.birthday).format('Do MMM, YYYY')

              }
              else {
                d3.select(this).classed('celeb', false)
                d.name = 'Unknown';
                d.country = '';
                d.birthday = 'Unknown'
              }
            });

//            person.each(
//              function (d, i) {
//
//                var celeb = _.find(celebs, function (item) {
////                  console.log(parseInt(rankScale(new Date(item.bday))), d.rank);
//                  return parseInt(rankScale(new Date(item.bday))) == d.rank;
//                });
//                var _person = d3.select(this);
//                if (celeb) {
//
//                  d.gender = celeb.gender;
//                  d.name = celeb.name;
//                  d.birthday = celeb.birthday;
//                  d.country = celeb.country;
//                  d.rank = parseInt(rankScale(new Date(celeb.birthday)))
//                  _person.classed('celeb', true)
//                  _person.selectAll('path').style('fill', '#333')
//                  _person.select('.icon .male').attr('opacity', function (d, i) {
//                    return d.gender == 'male' ? 1 : 0;
//                  });
//                  _person.select('.icon .female').attr('opacity', function (d, i) {
//                    return d.gender == 'female' ? 1 : 0;
//                  })
//                }
//                else {
//                  _person.classed('celeb', false)
//                  _person.selectAll('path').style('fill', '')
//                }
//
//              })


          }

          function _initCelebsBar() {
            celebsBar = chart.append('g')
              .attr({
                class: 'celebrities-bar',
                transform: 'translate(100,550)'
              });
            celebsBar.append('rect')
              .attr(
              {
                fill: 'rgba(0,0,0,0.01)',
                width: parentWidth - 200,
                height: 100,
                transform: 'translate(0,0)'

              }
            )
            celebsBar.append('rect')
              .attr(
              {
                fill: '#ccc',
                width: parentWidth - 200,
                height: 1,
                transform: 'translate(0,0)'

              }
            )
            celebsBar.append('rect')
              .attr(
              {
                fill: '#ccc',
                width: parentWidth - 200,
                height: 1,
                transform: 'translate(0,99)'

              }
            )
            celebsBar.append('rect')
              .attr(
              {
                fill: '#eee',
                width: parentWidth - 200,
                height: 1,
                transform: 'translate(0,50)'

              }
            )
            celebsRoll = celebsBar.append('g').attr('class', 'celebs-roll').attr('transform', 'translate(150,0)')
            prevCelebsButton = celebsBar.append('g').attr('class', 'prev-celebs-button').attr('transform', 'translate(' + [70, 50] + ')')
            nextCelebsButton = celebsBar.append('g').attr('class', 'next-celebs-button').attr('transform', 'translate(' + [parentWidth - 200 - 70, 50] + ')')
            var celebs = [
              {name: 'John Doe', thumbnail: '/celebrities/thumbnails/april/ace-frehley.jpg'},
              {name: 'Patrick Bateman', thumbnail: '/celebrities/thumbnails/july/aj-cook.jpg'},
              {name: 'Jim Beam', thumbnail: '/celebrities/thumbnails/july/barry-bonds.jpg'},
              {name: 'Max Payne', thumbnail: '/celebrities/thumbnails/july/bill-cosby.jpg'},
              {name: 'Jane Doe', thumbnail: '/celebrities/thumbnails/july/amanda-steele.jpg'},
            ]
            celebsRoll.append('rect')
              .attr(
              {
                fill: 'transparent',
                width: parentWidth - 200 - 300,
                height: 100

              })
            var celebWidth = (parentWidth - 200 - 300) / celebs.length;
            var celeb = celebsRoll.selectAll('.celeb')
              .data(celebs)
              .enter()
              .append('g')
              .attr({
                class: 'celeb',
                transform: function (d, i) {
                  return 'translate(' + [i * celebWidth, 0] + ')'
                }
              })
//            celeb.append('rect').attr(
//              {
//                fill: 'green',
//                width: celebWidth-1,
//                height: 100
//
//              }
//            )
            celeb.append('circle').attr(
              {
                fill: 'white',
                r: 20,
                cx: celebWidth / 2,
                cy: 50,
                'stroke-width': 1,
                stroke: '#ccc'


              }
            )
            celeb.append('image').attr(
              {
                width: 40,
                height: 40,
                x: -20,
                y: -20,
                'clip-path': 'url(#rounded-corners-clip)',
                'xlink:href': function (d, i) {
                  return d.thumbnail
                },
                transform: 'translate(' + [celebWidth / 2, 50] + ')'


              }
            )
            celeb.append('text')
              .style(
              {
                fill: '#444',
                'font-size': 12,
                'text-anchor': 'middle'
              }
            ).attr({
                transform: 'translate(' + [celebWidth / 2, 0] + ')',
                dy: 87
              })
              .text(function (d, i) {
                return d.name
              })


            prevCelebsButton.append('circle')
              .attr(
              {
                fill: '#fff',
                'stroke-width': 1,
                stroke: '#ccc',
                r: 20,
                cx: 0,
                cy: 0

//                transform: 'translate(0,0)'

              }
            )
            prevCelebsButton.append('polygon')
              .attr(
              {
                fill: '#444',
                points: '10.002,4.503 1.906,4.503 5.224,1.198 4.519,0.496 -0.002,5 4.519,9.504 5.224,8.802 1.906,5.497 10.002,5.497',
                transform: 'translate(-5,-5)'

              }
            )
            nextCelebsButton.append('circle')
              .attr(
              {
                fill: '#fff',
                'stroke-width': 1,
                stroke: '#ccc',
                r: 20,
                cx: 0,
                cy: 0

//                transform: 'translate(0,0)'

              }
            )
            nextCelebsButton.append('polygon')
              .attr(
              {
                fill: '#444',
                points: '-0.002,4.503 8.094,4.503 4.776,1.198 5.481,0.496 10.002,5 5.481,9.504 4.776,8.802 8.094,5.497 -0.002,5.497',
                transform: 'translate(-5,-5)'

              }
            )

          }

          $scope.$watch(function () {
            return ProfileService.active;
          }, function (active) {
            if (active) {
              _buildNavigator();
              _initCelebsBar();
              _initGrid();
              _loadCelebrities();
              _loadProfilePerson();
              _initCelebTooltip();
              _loadActiveCelebrities();
            }
          });

          _buildBarChart();
        }
      };
    });

}());